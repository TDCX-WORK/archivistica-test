import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import config from '../data/config.json'

async function fetchQuestionsForMode(modeId, academyId, subjectId) {
  const mode = config.modes[modeId]
  if (!mode || !academyId) return []

  let query = supabase
    .from('questions')
    .select('id, question, options, answer, explanation, difficulty, category, block_id')
    .eq('academy_id', academyId)

  if (subjectId) {
    query = query.eq('subject_id', subjectId)
  }

  // Los supuestos prácticos filtran por dificultad o categoría
  if (mode.practical) {
    query = query.or('difficulty.eq.practical,category.eq.gestion,category.eq.descripcion')
  }

  const { data, error } = await query

  if (error || !data) return []

  // Mezclar y recortar al número de preguntas del modo
  const shuffled = [...data].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, mode.questions)
}

export function useTest(modeId, academyId, subjectId) {
  const mode = config.modes[modeId]

  const [questions, setQuestions]       = useState([])
  const [loadingQ,  setLoadingQ]        = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]           = useState({})
  const [selectedOption, setSelectedOption] = useState(null)
  const [isRevealed, setIsRevealed]     = useState(false)
  const [phase, setPhase]               = useState('intro')
  const [timeLeft, setTimeLeft]         = useState(mode ? mode.timeMinutes * 60 : 0)

  // Cargar preguntas al montar
  useEffect(() => {
    if (!academyId) return
    setLoadingQ(true)
    fetchQuestionsForMode(modeId, academyId, subjectId).then(qs => {
      setQuestions(qs)
      setLoadingQ(false)
    })
  }, [modeId, academyId, subjectId])

  // Temporizador
  useEffect(() => {
    if (phase !== 'running') return
    if (timeLeft <= 0) { setPhase('finished'); return }
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setPhase('finished'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, timeLeft])

  const startTest = useCallback(() => setPhase('running'), [])

  const selectOption = useCallback((idx) => {
    if (isRevealed) return
    setSelectedOption(idx)
  }, [isRevealed])

  const confirmAnswer = useCallback(() => {
    if (selectedOption === null || isRevealed) return
    const currentQ = questions[currentIndex]
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: {
        selected:  selectedOption,
        correct:   currentQ.answer,
        isCorrect: selectedOption === currentQ.answer,
      }
    }))
    setIsRevealed(true)
  }, [selectedOption, isRevealed, questions, currentIndex])

  const nextQuestion = useCallback(() => {
    if (currentIndex >= questions.length - 1) { setPhase('finished'); return }
    setCurrentIndex(i => i + 1)
    setSelectedOption(null)
    setIsRevealed(false)
  }, [currentIndex, questions.length])

  const prevQuestion = useCallback(() => {
    if (currentIndex <= 0) return
    setCurrentIndex(i => i - 1)
    setSelectedOption(null)
    setIsRevealed(false)
  }, [currentIndex])

  const finishEarly = useCallback(() => setPhase('finished'), [])

  const restart = useCallback(() => {
    setCurrentIndex(0)
    setAnswers({})
    setSelectedOption(null)
    setIsRevealed(false)
    setPhase('intro')
    setTimeLeft(mode ? mode.timeMinutes * 60 : 0)
    // Recargar preguntas mezcladas de nuevo
    if (academyId) {
      setLoadingQ(true)
      fetchQuestionsForMode(modeId, academyId, subjectId).then(qs => {
        setQuestions(qs)
        setLoadingQ(false)
      })
    }
  }, [mode, modeId, academyId, subjectId])

  const totalAnswered = Object.keys(answers).length
  const totalCorrect  = Object.values(answers).filter(a => a.isCorrect).length

  const results = phase === 'finished' ? {
    total:     questions.length,
    answered:  totalAnswered,
    correct:   totalCorrect,
    incorrect: totalAnswered - totalCorrect,
    skipped:   questions.length - totalAnswered,
    score:     totalAnswered > 0 ? Math.round((totalCorrect / questions.length) * 10 * 10) / 10 : 0,
    percentage:totalAnswered > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0,
    answers,
    questions,
  } : null

  return {
    mode, questions, currentIndex, loadingQ,
    currentQuestion: questions[currentIndex],
    selectedOption, isRevealed, phase, timeLeft,
    answers, totalAnswered,
    startTest, selectOption, confirmAnswer,
    nextQuestion, prevQuestion, finishEarly, restart, results,
  }
}
