import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Question } from '../types'
import config from '../data/config.json'

interface ModeConfig {
  id:          string
  label:       string
  questions:   number
  timeMinutes: number
  description: string
  color:       string
  practical?:  boolean
}

interface AnswerRecord {
  selected:  number
  correct:   number
  isCorrect: boolean
}

interface TestResults {
  total:      number
  answered:   number
  correct:    number
  incorrect:  number
  skipped:    number
  score:      number
  percentage: number
  answers:    Record<number, AnswerRecord>
  questions:  Question[]
}

const modes = config.modes as Record<string, ModeConfig>

async function fetchQuestionsForMode(
  modeId:    string,
  academyId: string,
  subjectId: string | null | undefined
): Promise<Question[]> {
  const mode = modes[modeId]
  if (!mode || !academyId) return []

  let query = supabase
    .from('questions')
    .select('id, question, options, answer, explanation, difficulty, category, block_id, topic_id, subject_id, academy_id')
    .eq('academy_id', academyId)

  if (subjectId) {
    query = query.eq('subject_id', subjectId)
  }

  if (mode.practical) {
    query = query.or('difficulty.eq.practical,category.eq.gestion,category.eq.descripcion')
  }

  const { data, error } = await query

  if (error || !data) return []

  const typed = data as (Omit<Question, 'options' | 'answer'> & { options: unknown; answer: number })[]

  const shuffled = [...typed].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, mode.questions).map(q => ({
    ...q,
    options: q.options as string[],
    answer:  q.answer as 0 | 1 | 2 | 3,
  }))
}

export function useTest(
  modeId:    string,
  academyId: string | null | undefined,
  subjectId: string | null | undefined
) {
  const mode = modes[modeId] ?? null

  const [questions,       setQuestions]       = useState<Question[]>([])
  const [loadingQ,        setLoadingQ]        = useState(true)
  const [currentIndex,    setCurrentIndex]    = useState(0)
  const [answers,         setAnswers]         = useState<Record<number, AnswerRecord>>({})
  const [selectedOption,  setSelectedOption]  = useState<number | null>(null)
  const [isRevealed,      setIsRevealed]      = useState(false)
  const [phase,           setPhase]           = useState<'intro' | 'running' | 'finished'>('intro')
  const [timeLeft,        setTimeLeft]        = useState(mode ? mode.timeMinutes * 60 : 0)

  useEffect(() => {
    if (!academyId) return
    setLoadingQ(true)
    fetchQuestionsForMode(modeId, academyId, subjectId).then(qs => {
      setQuestions(qs)
      setLoadingQ(false)
    })
  }, [modeId, academyId, subjectId])

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

  const startTest    = useCallback(() => setPhase('running'), [])
  const finishEarly  = useCallback(() => setPhase('finished'), [])

  const selectOption = useCallback((idx: number) => {
    if (isRevealed) return
    setSelectedOption(idx)
  }, [isRevealed])

  const confirmAnswer = useCallback(() => {
    if (selectedOption === null || isRevealed) return
    const currentQ = questions[currentIndex]
    if (!currentQ) return
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: {
        selected:  selectedOption,
        correct:   currentQ.answer,
        isCorrect: selectedOption === currentQ.answer,
      },
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

  const restart = useCallback(() => {
    setCurrentIndex(0)
    setAnswers({})
    setSelectedOption(null)
    setIsRevealed(false)
    setPhase('intro')
    setTimeLeft(mode ? mode.timeMinutes * 60 : 0)
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

  const results: TestResults | null = phase === 'finished' ? {
    total:      questions.length,
    answered:   totalAnswered,
    correct:    totalCorrect,
    incorrect:  totalAnswered - totalCorrect,
    skipped:    questions.length - totalAnswered,
    score:      totalAnswered > 0 ? Math.round((totalCorrect / questions.length) * 10 * 10) / 10 : 0,
    percentage: totalAnswered > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0,
    answers,
    questions,
  } : null

  return {
    mode, questions, currentIndex, loadingQ,
    currentQuestion: questions[currentIndex] ?? null,
    selectedOption, isRevealed, phase, timeLeft,
    answers, totalAnswered,
    startTest, selectOption, confirmAnswer,
    nextQuestion, prevQuestion, finishEarly, restart, results,
  }
}