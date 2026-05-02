import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { insertNotification, insertNotifications } from '../lib/notifications'
import type { CurrentUser } from '../types'

/* ── Tipos ────────────────────────────────────────────────────── */

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
  status:        'entregada' | 'corregida' | 'revision'
  feedback:      string | null
  grade:         number | null
  corrected_by:  string | null
  corrected_at:  string | null
  created_at:    string
  updated_at:    string
  alumno?:       { username: string } | null
  corrector?:    { username: string } | null
}

export interface InlineComment {
  id:            string
  submission_id: string
  author_id:     string
  range_start:   number
  range_end:     number
  selected_text: string
  comment:       string
  comment_type:  'correction' | 'suggestion' | 'positive'
  created_at:    string
  author?:       { username: string } | null
}

export interface SimpleAlumno {
  id:       string
  username: string
}

export type GradeBadge = 'suspenso' | 'aprobado' | 'notable' | 'sobresaliente'

export function getGradeBadge(grade: number | null): GradeBadge | null {
  if (grade == null) return null
  if (grade < 5)  return 'suspenso'
  if (grade < 7)  return 'aprobado'
  if (grade < 9)  return 'notable'
  return 'sobresaliente'
}

export function getGradeBadgeLabel(badge: GradeBadge): string {
  const map: Record<GradeBadge, string> = {
    suspenso: 'Suspenso', aprobado: 'Aprobado',
    notable: 'Notable', sobresaliente: 'Sobresaliente',
  }
  return map[badge]
}

/* ── Hook alumno ─────────────────────────────────────────────── */

export function useTareasAlumno(currentUser: CurrentUser | null) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentUser?.academy_id || !currentUser?.id) return
    setLoading(true); setError(null)

    const [{ data: aData, error: aErr }, { data: sData }] = await Promise.all([
      supabase.from('assignments')
        .select('*, creator:profiles!assignments_created_by_fkey(username, role)')
        .eq('academy_id', currentUser.academy_id)
        .order('due_date', { ascending: true }),
      supabase.from('submissions')
        .select('*, corrector:profiles!submissions_corrected_by_fkey(username)')
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

  const loadComments = useCallback(async (submissionId: string): Promise<InlineComment[]> => {
    const { data } = await supabase.from('submission_comments')
      .select('*, author:profiles!submission_comments_author_id_fkey(username)')
      .eq('submission_id', submissionId)
      .order('range_start', { ascending: true })
    return (data ?? []) as InlineComment[]
  }, [])

  const entregar = useCallback(async (assignmentId: string, body: string) => {
    if (!currentUser?.id || !currentUser?.academy_id) return { error: 'Sin sesión' }
    const existing = submissions.find(s => s.assignment_id === assignmentId)

    if (existing) {
      const newStatus = existing.status === 'revision' ? 'entregada' : existing.status
      const { data, error: err } = await supabase.from('submissions')
        .update({ body: body.trim(), status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*, corrector:profiles!submissions_corrected_by_fkey(username)')
        .single()
      if (err) return { error: err.message }
      setSubmissions(prev => prev.map(s => s.id === existing.id ? data as Submission : s))
      if (existing.status === 'revision') {
        try {
          const tarea = assignments.find(a => a.id === assignmentId)
          if (tarea?.created_by) {
            await insertNotification({
              user_id: tarea.created_by, type: 'reentrega_tarea',
              title: `${currentUser.displayName ?? currentUser.username} ha re-entregado una tarea`,
              body: tarea.title, link: '/tareas-profesor',
            })
          }
        } catch {}
      }
      return { ok: true }
    }

    const { data, error: err } = await supabase.from('submissions')
      .insert({ assignment_id: assignmentId, academy_id: currentUser.academy_id, alumno_id: currentUser.id, body: body.trim() })
      .select('*, corrector:profiles!submissions_corrected_by_fkey(username)')
      .single()
    if (err) return { error: err.message }
    setSubmissions(prev => [data as Submission, ...prev])
    try {
      const tarea = assignments.find(a => a.id === assignmentId)
      if (tarea?.created_by) {
        await insertNotification({
          user_id: tarea.created_by, type: 'entrega_tarea',
          title: `${currentUser.displayName ?? currentUser.username} ha entregado una tarea`,
          body: tarea.title, link: '/tareas-profesor',
        })
      }
    } catch {}
    return { ok: true }
  }, [currentUser, submissions, assignments])

  return { assignments, submissions, loading, error, getSubmission, entregar, loadComments, reload: load }
}

/* ── Hook profesor / director ────────────────────────────────── */

export function useTareasProfesor(currentUser: CurrentUser | null) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [alumnos, setAlumnos]         = useState<SimpleAlumno[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentUser?.academy_id) return
    setLoading(true); setError(null)

    // Build alumnos query — profesor filters by subject, director/superadmin sees all
    let alumnosQuery = supabase.from('profiles')
      .select('id, username')
      .eq('academy_id', currentUser.academy_id)
      .eq('role', 'alumno')
      .order('username')
    if (currentUser.role === 'profesor' && currentUser.subject_id) {
      alumnosQuery = alumnosQuery.eq('subject_id', currentUser.subject_id)
    }

    const [{ data: aData, error: aErr }, { data: sData }, { data: alumnosData }] = await Promise.all([
      supabase.from('assignments')
        .select('*, creator:profiles!assignments_created_by_fkey(username, role)')
        .eq('academy_id', currentUser.academy_id)
        .order('due_date', { ascending: true }),
      supabase.from('submissions')
        .select('*, alumno:profiles!submissions_alumno_id_fkey(username), corrector:profiles!submissions_corrected_by_fkey(username)')
        .eq('academy_id', currentUser.academy_id)
        .order('created_at', { ascending: false }),
      alumnosQuery,
    ])

    if (aErr) { setError('No se pudieron cargar las tareas'); setLoading(false); return }
    setAssignments((aData ?? []) as Assignment[])
    setSubmissions((sData ?? []) as Submission[])
    setAlumnos((alumnosData ?? []) as SimpleAlumno[])
    setLoading(false)
  }, [currentUser?.academy_id, currentUser?.role, currentUser?.subject_id])

  useEffect(() => { load() }, [load])

  const crearAssignment = useCallback(async (params: {
    title: string; description: string; due_date: string;
    alumno_id: string | null; subject_id: string | null
  }) => {
    if (!currentUser?.academy_id || !currentUser?.id) return { error: 'Sin sesión' }
    const { data, error: err } = await supabase.from('assignments')
      .insert({
        academy_id: currentUser.academy_id, created_by: currentUser.id,
        subject_id: params.subject_id, alumno_id: params.alumno_id,
        title: params.title.trim(), description: params.description.trim(), due_date: params.due_date,
      })
      .select('*, creator:profiles!assignments_created_by_fkey(username, role)')
      .single()
    if (err) return { error: err.message }
    setAssignments(prev => [...prev, data as Assignment].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()))
    try {
      const senderName = currentUser.displayName ?? currentUser.username ?? 'Tu profesor'
      if (params.alumno_id) {
        await insertNotification({
          user_id: params.alumno_id, type: 'nueva_tarea',
          title: `${senderName} te ha asignado una tarea`,
          body: params.title.trim(), link: '/tareas',
        })
      } else {
        const ids = alumnos.map(a => a.id)
        if (ids.length > 0) {
          await insertNotifications(ids.map(id => ({
            user_id: id, type: 'nueva_tarea',
            title: `${senderName} ha publicado una nueva tarea`,
            body: params.title.trim(), link: '/tareas',
          })))
        }
      }
    } catch {}
    return { ok: true }
  }, [currentUser, alumnos])

  const borrarAssignment = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('assignments').delete().eq('id', id)
    if (!err) {
      setAssignments(prev => prev.filter(a => a.id !== id))
      setSubmissions(prev => prev.filter(s => s.assignment_id !== id))
    }
    return err ? { error: err.message } : { ok: true }
  }, [])

  const loadComments = useCallback(async (submissionId: string): Promise<InlineComment[]> => {
    const { data } = await supabase.from('submission_comments')
      .select('*, author:profiles!submission_comments_author_id_fkey(username)')
      .eq('submission_id', submissionId)
      .order('range_start', { ascending: true })
    return (data ?? []) as InlineComment[]
  }, [])

  const addComment = useCallback(async (params: {
    submission_id: string; range_start: number; range_end: number;
    selected_text: string; comment: string;
    comment_type: 'correction' | 'suggestion' | 'positive'
  }): Promise<{ data?: InlineComment; error?: string }> => {
    if (!currentUser?.id) return { error: 'Sin sesión' }
    const { data, error: err } = await supabase.from('submission_comments')
      .insert({ ...params, author_id: currentUser.id })
      .select('*, author:profiles!submission_comments_author_id_fkey(username)')
      .single()
    if (err) return { error: err.message }
    return { data: data as InlineComment }
  }, [currentUser?.id])

  const deleteComment = useCallback(async (commentId: string) => {
    const { error: err } = await supabase.from('submission_comments').delete().eq('id', commentId)
    return err ? { error: err.message } : { ok: true }
  }, [])

  const corregir = useCallback(async (
    submissionId: string,
    params: { feedback: string; grade: number | null; action: 'approve' | 'request_revision' }
  ) => {
    if (!currentUser?.id) return { error: 'Sin sesión' }
    const newStatus = params.action === 'approve' ? 'corregida' : 'revision'
    const { data, error: err } = await supabase.from('submissions')
      .update({
        status: newStatus, feedback: params.feedback.trim() || null,
        grade: params.grade, corrected_by: currentUser.id,
        corrected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select('*, alumno:profiles!submissions_alumno_id_fkey(username), corrector:profiles!submissions_corrected_by_fkey(username)')
      .single()
    if (err) return { error: err.message }
    setSubmissions(prev => prev.map(s => s.id === submissionId ? data as Submission : s))
    try {
      const sub = submissions.find(s => s.id === submissionId)
      if (sub?.alumno_id) {
        const tarea = assignments.find(a => a.id === sub.assignment_id)
        await insertNotification({
          user_id: sub.alumno_id,
          type: params.action === 'approve' ? 'tarea_corregida' : 'tarea_revision',
          title: params.action === 'approve' ? 'Tu tarea ha sido corregida' : 'Tu profesor te pide que revises tu tarea',
          body: tarea?.title ?? 'Revisa la corrección', link: '/tareas',
        })
      }
    } catch {}
    return { ok: true }
  }, [currentUser?.id, submissions, assignments])

  const getSubmissionsForAssignment = useCallback((assignmentId: string) =>
    submissions.filter(s => s.assignment_id === assignmentId)
  , [submissions])

  return {
    assignments, submissions, alumnos, loading, error,
    crearAssignment, borrarAssignment, corregir,
    getSubmissionsForAssignment, loadComments, addComment, deleteComment,
    reload: load,
  }
}