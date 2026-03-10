// Versión simplificada: muestra siempre la explicación estática del JSON
// Sin llamadas a IA ni a Supabase

export function useAiExplanation({ wasWrong, staticExpl }) {
  return {
    explText: staticExpl || '',
    isAi:    false,
    loading: false,
    error:   false,
  }
}
