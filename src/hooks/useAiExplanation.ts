interface UseAiExplanationProps {
  wasWrong:   boolean
  staticExpl: string | null | undefined
}

interface UseAiExplanationReturn {
  explText: string
  isAi:     boolean
  loading:  boolean
  error:    boolean
}

export function useAiExplanation({ staticExpl }: UseAiExplanationProps): UseAiExplanationReturn {
  return {
    explText: staticExpl || '',
    isAi:     false,
    loading:  false,
    error:    false,
  }
}