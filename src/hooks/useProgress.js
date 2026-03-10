import { useState, useCallback } from 'react'

function getKey(userId) { return `arch_progress_${userId}` }

function loadData(userId) {
  try { return JSON.parse(localStorage.getItem(getKey(userId)) || 'null') } catch { return null }
}

function saveData(userId, data) {
  try { localStorage.setItem(getKey(userId), JSON.stringify(data)) } catch {}
}

function calcStreak(sessions) {
  if (!sessions.length) return 0
  const days = [...new Set(sessions.map(s => s.date))].sort().reverse()
  if (!days.length) return 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]), curr = new Date(days[i])
    const diff = (prev - curr) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

export function useProgress(userId) {
  const [data, setData] = useState(() => {
    if (!userId) return null
    const saved = loadData(userId)
    return saved || { sessions: [] }
  })

  const recordSession = useCallback((modeId, correct, total, durationSecs) => {
    if (!userId) return
    setData(prev => {
      const updated = {
        ...(prev || { sessions: [] }),
        sessions: [
          ...((prev || {}).sessions || []),
          {
            date: new Date().toISOString().slice(0, 10),
            modeId, correct, total,
            score: total > 0 ? Math.round((correct / total) * 100) : 0,
            durationSecs,
            ts: Date.now()
          }
        ]
      }
      saveData(userId, updated)
      return updated
    })
  }, [userId])

  const sessions = data?.sessions || []
  const totalSessions  = sessions.length
  const totalAnswered  = sessions.reduce((s, x) => s + x.total, 0)
  const totalCorrect   = sessions.reduce((s, x) => s + x.correct, 0)
  const avgScore       = totalSessions > 0 ? Math.round(sessions.reduce((s, x) => s + x.score, 0) / totalSessions) : 0
  const streakDays     = calcStreak(sessions)
  const studiedDays    = new Set(sessions.map(s => s.date))

  const last30 = (() => {
    const map = {}
    sessions.forEach(s => {
      if (!map[s.date]) map[s.date] = { date: s.date, score: 0, questions: 0, count: 0 }
      map[s.date].score     += s.score
      map[s.date].questions += s.total
      map[s.date].count     += 1
    })
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map(d => ({ ...d, score: Math.round(d.score / d.count) }))
  })()

  return {
    sessions, totalSessions, totalAnswered, totalCorrect,
    avgScore, streakDays, studiedDays, last30,
    recordSession
  }
}

export default useProgress
