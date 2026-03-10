import { useState, useEffect, useRef } from 'react'

const SUPABASE_URL  = 'https://zazqejluzyqihqhzbrga.supabase.co/functions/v1/archivistica-explain'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphenFlamx1enlxaWhxaHpicmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzMxMDksImV4cCI6MjA4ODUwOTEwOX0.fqUx_UY66ufAk4097fp1nBjCecljoBb1WM4WsZhNqsw'

async function fetchExplanation(question, options, answer, wrongIndex) {
  const response = await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify({ question, options, answer, wrongIndex })
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`API ${response.status}: ${body.slice(0, 120)}`)
  }

  const data = await response.json()
  const text = data.explanation || ''
  if (!text) throw new Error('respuesta vacía')
  return text
}

export function useAiExplanation({ wasWrong, staticExpl, question, options, answer, selectedIndex }) {
  const [aiText,  setAiText]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    if (!wasWrong)       return
    if (staticExpl)      return
    if (fetched.current) return
    if (selectedIndex === undefined || selectedIndex === null) return

    fetched.current = true
    setLoading(true)
    setError(false)

    fetchExplanation(question, options, answer, selectedIndex)
      .then(txt  => { setAiText(txt); setLoading(false) })
      .catch(err => { console.error('[useAiExplanation]', err); setError(true); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasWrong])

  return {
    explText: staticExpl || aiText,
    isAi:    !staticExpl && !!aiText,
    loading,
    error,
  }
}

export default useAiExplanation