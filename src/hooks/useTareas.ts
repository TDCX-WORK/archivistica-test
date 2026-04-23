import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrentUser } from '../types'

export interface Assignment {
  id:          string
  academy_id:  string
  subject_id:  string | null
  created_by:  string | null
  alumno_id:   string | null
  title:       string
  description: string
  due_date:    string
  created_at:  string
  creator?:    { username: string; role: string } | null
}

export interface Submission {
  id:            string
  assignment_id: string
  academy_id:    string
  alumno_id:     string
  body:          string
  status:        'entregada' | 'corregida'
  feedback:      string | null
  created_at:    string
  updated_at:    string
  alumno?:       { username: string } | null
}

// ── Hook alumno ───────────────────────────────────────────────────
export function useTareasAlumno(currentUser: CurrentUser | null) {
  const [assignments,  setAssignments]  = useState<Assignment[]>([])
  const [submissions,  setSubmissions]  = useState<Submission[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentUser?.academy_id || !currentUser?.id) return
    setLoading(true)
    setError(null)

    const [{ data: aData, error: aErr }, { data: sData }] = await Promise.all([
      supabase
        .from('assignments')
        .select('*, creator:profiles!assignments_created_by_fkey(username, role)')
        .eq('academy_id', currentUser.academy_id)
        .order('due_date', { ascending: true }),
      supabase
        .from('submissions')
        .select('*')
        .eq('alumno_id', currentUser.id),
    ])

    if (aErr) { setError('No se pudieron cargar las tareas'); setLoading(false); return }

    setAssignments((aData ?? []) as Assignment[])
    setSubmissions((sData ?? []) as Submission[])
    setLoading(false)
  }, [currentUser?.academy_id, currentUser?.id])

  useEffect(() => { load() }, [load])

  const getSubmission = useCallback((assignmentId: string) =>
    submissions.find(s => s.assignment_id === assignmentId) ?? null
  , [submissions])

  const entregar = useCallback(async (assignmentId: string, body: string) => {
    if (!currentUser?.id || !currentUser?.academy_id) return { error: 'Sin sesión' }

    const existing = submissions.find(s => s.assignment_id === assignmentId)

    if (existing) {
      // Actualizar entrega existente
      const { data, error: err } = await supabase
        .from('submissions')
        .update({ body: body.trim(), updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (err) return { error: err.message }
      setSubmissions(prev => prev.map(s => s.id === existing.id ? data as Submission : s))
      return { ok: true }
    }

    // Nueva entrega
    const { data, error: err } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        academy_id:    currentUser.academy_id,
        alumno_id:     currentUser.id,
        body:          body.trim(),
      })
      .select()
      .single()

    if (err) return { error: err.message }
    setSubmissions(prev => [data as Submission, ...prev])
    return { ok: true }
  }, [currentUser?.id, currentUser?.academy_id, submissions])

  return { assignments, submissions, loading, error, getSubmission, entregar, reload: load }
}

// ── Hook profesor ─────────────────────────────────────────────────
export function useTareasProfesor(currentUser: CurrentUser | null) {
  const [assignments,  setAssignments]  = useState<Assignment[]>([])
  const [submissions,  setSubmissions]  = useState<Submission[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentUser?.academy_id) return
    setLoading(true)
    setError(null)

    const [{ data: aData, error: aErr }, { data: sData }] = await Promise.all([
      supabase
        .from('assignments')
        .select('*, creator:profiles!assignments_created_by_fkey(username, role)')
        .eq('academy_id', currentUser.academy_id)
        .order('due_date', { ascending: true }),
      supabase
        .from('submissions')
        .select('*, alumno:profiles!submissions_alumno_id_fkey(username)')
        .eq('academy_id', currentUser.academy_id)
        .order('created_at', { ascending: false }),
    ])

    if (aErr) { setError('No se pudieron cargar las tareas'); setLoading(false); return }

    setAssignments((aData ?? []) as Assignment[])
    setSubmissions((sData ?? []) as Submission[])
    setLoading(false)
  }, [currentUser?.academy_id])

  useEffect(() => { load() }, [load])

  const crearAssignment = useCallback(async (params: {
    title:       string
    description: string
    due_date:    string
    alumno_id:   string | null
    subject_id:  string | null
  }) => {
    if (!currentUser?.academy_id || !currentUser?.id) return { error: 'Sin sesión' }

    const { data, error: err } = await supabase
      .from('assignments')
      .insert({
        academy_id:  currentUser.academy_id,
        created_by:  currentUser.id,
        subject_id:  params.subject_id,
        alumno_id:   params.alumno_id,
        title:       params.title.trim(),
        description: params.description.trim(),
        due_date:    params.due_date,
      })
      .select('*, creator:profiles!assignments_created_by_fkey(username, role)')
      .single()

    if (err) return { error: err.message }
    setAssignments(prev => [...prev, data as Assignment].sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    ))
    return { ok: true }
  }, [currentUser?.academy_id, currentUser?.id])

  const borrarAssignment = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
    if (!err) {
      setAssignments(prev => prev.filter(a => a.id !== id))
      setSubmissions(prev => prev.filter(s => s.assignment_id !== id))
    }
    return err ? { error: err.message } : { ok: true }
  }, [])

  const corregir = useCallback(async (submissionId: string, feedback: string) => {
    const { data, error: err } = await supabase
      .from('submissions')
      .update({ status: 'corregida', feedback: feedback.trim(), updated_at: new Date().toISOString() })
      .eq('id', submissionId)
      .select()
      .single()
    if (err) return { error: err.message }
    setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...data as Submission } : s))
    return { ok: true }
  }, [])

  const getSubmissionsForAssignment = useCallback((assignmentId: string) =>
    submissions.filter(s => s.assignment_id === assignmentId)
  , [submissions])

  return {
    assignments, submissions, loading, error,
    crearAssignment, borrarAssignment, corregir,
    getSubmissionsForAssignment, reload: load,
  }
}