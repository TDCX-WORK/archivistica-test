import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function calcStreak(sessions) {
  if (!sessions.length) return 0
  const days = [...new Set(sessions.map(s => s.played_at))].sort().reverse()
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]), curr = new Date(days[i])
    if ((prev - curr) / 86400000 === 1) streak++
    else break
  }
  return streak
}

export function useProgress(userId, academyId, subjectId) {
  const [sessions, setSessions]           = useState([])
  const [wrongAnswers, setWrongAnswers]   = useState([])
  const [loadingData, setLoadingData]     = useState(false)

  // Cargar datos al iniciar sesión
  useEffect(() => {
    if (!userId) { setSessions([]); setWrongAnswers([]); return }
    setLoadingData(true)
    Promise.all([
      supabase.from('sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('wrong_answers').select('*').eq('user_id', userId),
    ]).then(([{ data: sess }, { data: wrong }]) => {
      setSessions(sess || [])
      setWrongAnswers(wrong || [])
      setLoadingData(false)
    })
  }, [userId])

  // Guardar sesión al terminar un test
  const recordSession = useCallback(async (modeId, correct, total, durationSecs) => {
    if (!userId) return
    const score = total > 0 ? Math.round((correct / total) * 100) : 0
    const newSession = {
      user_id:       userId,
      academy_id:    academyId,
      subject_id:    subjectId,
      mode_id:       modeId,
      correct,
      total,
      score,
      duration_secs: durationSecs,
      played_at:     new Date().toISOString().slice(0, 10),
    }
    const { data } = await supabase.from('sessions').insert(newSession).select().maybeSingle()
    if (data) setSessions(prev => [data, ...prev])
  }, [userId])

  // Registrar una pregunta fallada (con spaced repetition)
  const recordWrongAnswer = useCallback(async (questionId, block) => {
    if (!userId) return

    const today    = new Date().toISOString().slice(0, 10)
    const existing = wrongAnswers.find(w => w.question_id === questionId)

    if (existing) {
      // Ya la falló antes — reiniciar racha y mantener repaso al día siguiente
      const updated = {
        fail_count:     existing.fail_count + 1,
        correct_streak: 0,
        next_review:    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        last_seen:      today,
      }
      const { data } = await supabase
        .from('wrong_answers').update(updated).eq('id', existing.id).select().maybeSingle()
      if (data) setWrongAnswers(prev => prev.map(w => w.id === data.id ? data : w))
    } else {
      // Primera vez que falla esta pregunta
      const newWrong = {
        user_id:        userId,
        academy_id:     academyId,
        subject_id:     subjectId,
        question_id:    questionId,
        block,
        fail_count:     1,
        correct_streak: 0,
        next_review:    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        last_seen:      today,
      }
      const { data } = await supabase.from('wrong_answers').insert(newWrong).select().maybeSingle()
      if (data) setWrongAnswers(prev => [...prev, data])
    }
  }, [userId, wrongAnswers])

  // Registrar que acertó una pregunta que tenía en repaso (spaced repetition)
  const recordCorrectReview = useCallback(async (questionId) => {
    if (!userId) return
    const existing = wrongAnswers.find(w => w.question_id === questionId)
    if (!existing) return

    const newStreak = existing.correct_streak + 1
    const today     = new Date().toISOString().slice(0, 10)

    // Intervalos: 1 acierto → 3 días, 2 → 7 días, 3+ → 30 días, 4+ → eliminar
    let daysUntilNext = 3
    if (newStreak === 2)      daysUntilNext = 7
    else if (newStreak === 3) daysUntilNext = 30
    else if (newStreak >= 4) {
      // Domina la pregunta — la eliminamos del repaso
      await supabase.from('wrong_answers').delete().eq('id', existing.id)
      setWrongAnswers(prev => prev.filter(w => w.id !== existing.id))
      return
    }

    const updated = {
      correct_streak: newStreak,
      next_review:    new Date(Date.now() + daysUntilNext * 86400000).toISOString().slice(0, 10),
      last_seen:      today,
    }
    const { data } = await supabase
      .from('wrong_answers').update(updated).eq('id', existing.id).select().maybeSingle()
    if (data) setWrongAnswers(prev => prev.map(w => w.id === data.id ? data : w))
  }, [userId, wrongAnswers])

  // Preguntas pendientes de repaso hoy
  const today = new Date().toISOString().slice(0, 10)
  const dueForReview = wrongAnswers.filter(w => w.next_review <= today)

  // Estadísticas derivadas
  const totalSessions = sessions.length
  const totalAnswered = sessions.reduce((s, x) => s + x.total, 0)
  const totalCorrect  = sessions.reduce((s, x) => s + x.correct, 0)
  const avgScore      = totalSessions > 0
    ? Math.round(sessions.reduce((s, x) => s + x.score, 0) / totalSessions) : 0
  const streakDays    = calcStreak(sessions)
  const studiedDays   = new Set(sessions.map(s => s.played_at))

  // Rendimiento por bloque temático
  const blockStats = sessions.reduce((acc, session) => acc, {}) // se calcula en Stats

  // Últimas 30 sesiones agrupadas por día para gráficas
  const last30 = (() => {
    const map = {}
    sessions.forEach(s => {
      if (!map[s.played_at]) map[s.played_at] = { date: s.played_at, score: 0, questions: 0, count: 0 }
      map[s.played_at].score     += s.score
      map[s.played_at].questions += s.total
      map[s.played_at].count     += 1
    })
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map(d => ({ ...d, score: Math.round(d.score / d.count) }))
  })()

  return {
    sessions, totalSessions, totalAnswered, totalCorrect,
    avgScore, streakDays, studiedDays, last30,
    wrongAnswers, dueForReview, loadingData,
    recordSession, recordWrongAnswer, recordCorrectReview,
  }
}

export default useProgress
