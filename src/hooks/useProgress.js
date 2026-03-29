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
  const [sessions,     setSessions]     = useState([])
  const [wrongAnswers, setWrongAnswers] = useState([])
  const [loadingData,  setLoadingData]  = useState(false)

  // Cargar datos al iniciar sesion
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

  // Guardar sesion al terminar un test
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
    if (!data) return

    // Actualizar estado
    setSessions(prev => [data, ...prev])

    // ── Notificaciones post-sesion ────────────────────────────────────────
    try {
      // 1. Mejor nota historica
      const mejorNota = sessions.length > 0 ? Math.max(...sessions.map(s => s.score)) : 0

      if (score > mejorNota && score >= 70 && sessions.length >= 3) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type:    'mejor_nota',
          title:   `Nueva mejor nota: ${score}/100`,
          body:    `Has superado tu record anterior de ${mejorNota}/100. Sigue asi!`,
          link:    '/estadisticas',
        })

        // Notificar al profesor
        if (academyId && subjectId) {
          const { data: prof } = await supabase
            .from('profiles').select('id')
            .eq('academy_id', academyId)
            .eq('subject_id', subjectId)
            .eq('role', 'profesor')
            .maybeSingle()

          if (prof) {
            await supabase.from('notifications').insert({
              user_id: prof.id,
              type:    'alumno_supera',
              title:   'Un alumno ha superado su mejor nota',
              body:    `Ha obtenido ${score}/100, su nuevo record personal.`,
              link:    '/profesor',
            })
          }
        }
      }

      // 2. Racha destacada
      const diasConHoy = [...new Set([...sessions.map(s => s.played_at), data.played_at])]
      const racha      = calcStreak(diasConHoy.map(d => ({ played_at: d })))
      const hitosRacha = [3, 7, 14, 30]

      if (hitosRacha.includes(racha)) {
        const { data: yaEnviada } = await supabase
          .from('notifications').select('id')
          .eq('user_id', userId)
          .eq('type', 'racha')
          .like('title', `%${racha} d%`)
          .gte('created_at', new Date(Date.now() - 2 * 86400000).toISOString())
          .maybeSingle()

        if (!yaEnviada) {
          const emojis  = { 3: '🔥', 7: '⚡', 14: '🏆', 30: '👑' }
          const cuerpos = {
            3:  'Llevas 3 dias seguidos estudiando. Buen comienzo.',
            7:  'Una semana completa de estudio. Eres constante.',
            14: 'Dos semanas seguidas. Esto ya es un habito.',
            30: 'Un mes entero de racha. Nivel leyenda.',
          }
          await supabase.from('notifications').insert({
            user_id: userId,
            type:    'racha',
            title:   `${emojis[racha]} ${racha} dias de racha`,
            body:    cuerpos[racha],
            link:    '/estadisticas',
          })
        }
      }
    } catch (_) {
      // Las notificaciones no bloquean el guardado de la sesion
    }
  }, [userId, academyId, subjectId, sessions])

  // Registrar una pregunta fallada (con spaced repetition)
  const recordWrongAnswer = useCallback(async (questionId, block) => {
    if (!userId) return

    const today    = new Date().toISOString().slice(0, 10)
    const existing = wrongAnswers.find(w => w.question_id === questionId)

    if (existing) {
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

  // Registrar que acerto una pregunta de repaso (spaced repetition)
  const recordCorrectReview = useCallback(async (questionId) => {
    if (!userId) return
    const existing = wrongAnswers.find(w => w.question_id === questionId)
    if (!existing) return

    const newStreak = existing.correct_streak + 1
    const today     = new Date().toISOString().slice(0, 10)

    let daysUntilNext = 3
    if (newStreak === 2)      daysUntilNext = 7
    else if (newStreak === 3) daysUntilNext = 30
    else if (newStreak >= 4) {
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

  // Estadisticas derivadas
  const totalSessions = sessions.length
  const totalAnswered = sessions.reduce((s, x) => s + x.total, 0)
  const totalCorrect  = sessions.reduce((s, x) => s + x.correct, 0)
  const avgScore      = totalSessions > 0
    ? Math.round(sessions.reduce((s, x) => s + x.score, 0) / totalSessions) : 0
  const streakDays    = calcStreak(sessions)
  const studiedDays   = new Set(sessions.map(s => s.played_at))

  // Ultimas 30 sesiones agrupadas por dia para graficas
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
