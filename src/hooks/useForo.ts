import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CurrentUser } from '../types'

export interface ForoAuthor {
  id:       string
  username: string
  role:     string
}

export interface ForoReply {
  id:          string
  thread_id:   string
  body:        string
  is_solution: boolean
  created_at:  string
  author:      ForoAuthor | null
}

export interface ForoThread {
  id:           string
  academy_id:   string
  subject_id:   string | null
  block_id:     string | null
  title:        string
  body:         string
  is_solved:    boolean
  created_at:   string
  author:       ForoAuthor | null
  reply_count:  number
}

export interface ForoBlock {
  id:    string
  label: string
}

export interface ForoSubject {
  id:   string
  name: string
}

export function useForo(currentUser: CurrentUser | null) {
  const [threads,     setThreads]     = useState<ForoThread[]>([])
  const [subjects,    setSubjects]    = useState<ForoSubject[]>([])
  const [blocks,      setBlocks]      = useState<ForoBlock[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // Carga hilos con autor y conteo de respuestas
  const loadThreads = useCallback(async () => {
    if (!currentUser?.academy_id) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('forum_threads')
      .select(`
        id, academy_id, subject_id, block_id,
        title, body, is_solved, created_at,
        author:profiles!author_id(id, username, role),
        forum_replies(count)
      `)
      .eq('academy_id', currentUser.academy_id)
      .order('created_at', { ascending: false })

    if (err) { setError('No se pudieron cargar los hilos'); setLoading(false); return }

    const mapped = (data ?? []).map((d: any) => ({
      id:          d.id,
      academy_id:  d.academy_id,
      subject_id:  d.subject_id,
      block_id:    d.block_id,
      title:       d.title,
      body:        d.body,
      is_solved:   d.is_solved,
      created_at:  d.created_at,
      author:      d.author ?? null,
      reply_count: d.forum_replies?.[0]?.count ?? 0,
    })) as ForoThread[]

    setThreads(mapped)
    setLoading(false)
  }, [currentUser?.academy_id])

  // Carga asignaturas y bloques para los tabs/filtros
  const loadMeta = useCallback(async () => {
    if (!currentUser?.academy_id) return

    const [{ data: subs }, { data: blks }] = await Promise.all([
      supabase
        .from('subjects')
        .select('id, name')
        .eq('academy_id', currentUser.academy_id),
      supabase
        .from('content_blocks')
        .select('id, label')
        .eq('academy_id', currentUser.academy_id)
        .order('position', { ascending: true }),
    ])

    setSubjects((subs ?? []) as ForoSubject[])
    setBlocks((blks ?? []) as ForoBlock[])
  }, [currentUser?.academy_id])

  useEffect(() => {
    loadThreads()
    loadMeta()
  }, [loadThreads, loadMeta])

  // Crear hilo
  const crearThread = useCallback(async (params: {
    title:      string
    body:       string
    subject_id: string | null
    block_id:   string | null
  }) => {
    if (!currentUser?.academy_id || !currentUser?.id) return { error: 'Sin sesión' }

    const { data, error: err } = await supabase
      .from('forum_threads')
      .insert({
        academy_id: currentUser.academy_id,
        author_id:  currentUser.id,
        title:      params.title.trim(),
        body:       params.body.trim(),
        subject_id: params.subject_id,
        block_id:   params.block_id,
      })
      .select(`
        id, academy_id, subject_id, block_id,
        title, body, is_solved, created_at,
        author:profiles!author_id(id, username, role),
        forum_replies(count)
      `)
      .single()

    if (err) return { error: err.message }

    const thread: ForoThread = {
      id:          data.id,
      academy_id:  data.academy_id,
      subject_id:  data.subject_id,
      block_id:    data.block_id,
      title:       data.title,
      body:        data.body,
      is_solved:   data.is_solved,
      created_at:  data.created_at,
      author:      (data as any).author ?? null,
      reply_count: 0,
    }

    setThreads(prev => [thread, ...prev])
    return { ok: true }
  }, [currentUser?.academy_id, currentUser?.id])

  // Cargar respuestas de un hilo
  const loadReplies = useCallback(async (threadId: string): Promise<ForoReply[]> => {
    const { data, error: err } = await supabase
      .from('forum_replies')
      .select(`
        id, thread_id, body, is_solution, created_at,
        author:profiles!author_id(id, username, role)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (err) return []

    return (data ?? []).map((d: any) => ({
      id:          d.id,
      thread_id:   d.thread_id,
      body:        d.body,
      is_solution: d.is_solution,
      created_at:  d.created_at,
      author:      d.author ?? null,
    })) as ForoReply[]
  }, [])

  // Responder a un hilo
  const responder = useCallback(async (threadId: string, body: string) => {
    if (!currentUser?.academy_id || !currentUser?.id) return { error: 'Sin sesión' }

    const { data, error: err } = await supabase
      .from('forum_replies')
      .insert({
        thread_id:  threadId,
        academy_id: currentUser.academy_id,
        author_id:  currentUser.id,
        body:       body.trim(),
      })
      .select(`
        id, thread_id, body, is_solution, created_at,
        author:profiles!author_id(id, username, role)
      `)
      .single()

    if (err) return { error: err.message }

    // Actualizar conteo en la lista
    setThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, reply_count: t.reply_count + 1 } : t
    ))

    const reply: ForoReply = {
      id:          data.id,
      thread_id:   data.thread_id,
      body:        data.body,
      is_solution: data.is_solution,
      created_at:  data.created_at,
      author:      (data as any).author ?? null,
    }

    return { ok: true, reply }
  }, [currentUser?.academy_id, currentUser?.id])

  // Marcar respuesta como solución (solo staff)
  const marcarSolucion = useCallback(async (threadId: string, replyId: string) => {
    // Quitar solución anterior si la hay
    const { error: e1 } = await supabase
      .from('forum_replies')
      .update({ is_solution: false })
      .eq('thread_id', threadId)

    if (e1) return { error: 'Error quitando la solución anterior' }

    // Marcar nueva solución
    const { error: e2 } = await supabase
      .from('forum_replies')
      .update({ is_solution: true })
      .eq('id', replyId)

    if (e2) return { error: 'Error marcando la nueva solución' }

    // Marcar hilo como solucionado
    const { error: e3 } = await supabase
      .from('forum_threads')
      .update({ is_solved: true })
      .eq('id', threadId)

    if (e3) return { error: 'Error marcando el hilo como solucionado' }

    setThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, is_solved: true } : t
    ))

    return { ok: true }
  }, [])

  // Borrar hilo (solo el autor)
  const borrarThread = useCallback(async (threadId: string) => {
    const { error: err } = await supabase
      .from('forum_threads')
      .delete()
      .eq('id', threadId)

    if (!err) setThreads(prev => prev.filter(t => t.id !== threadId))
    return err ? { error: err.message } : { ok: true }
  }, [])

  return {
    threads, subjects, blocks,
    loading, error,
    crearThread, loadReplies, responder,
    marcarSolucion, borrarThread,
    reload: loadThreads,
  }
}