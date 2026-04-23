import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, MessageCircle, CheckCircle2,
  Send, Loader2, AlertCircle
} from 'lucide-react'
import type { ForoThread, ForoReply } from '../../hooks/useForo'
import type { CurrentUser } from '../../types'
import styles from './ThreadDetail.module.css'

interface Props {
  thread:        ForoThread
  currentUser:   CurrentUser | null
  onBack:        () => void
  onLoadReplies: (threadId: string) => Promise<ForoReply[]>
  onResponder:   (threadId: string, body: string) => Promise<{ ok?: boolean; reply?: ForoReply; error?: string }>
  onMarcarSolucion: (threadId: string, replyId: string) => Promise<void>
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const AVATAR_COLORS = [
  { bg: 'rgba(37,99,235,0.12)',   border: '#2563EB' },  // azul
  { bg: 'rgba(124,58,237,0.12)',  border: '#7C3AED' },  // púrpura
  { bg: 'rgba(5,150,105,0.12)',   border: '#059669' },  // verde
  { bg: 'rgba(217,119,6,0.12)',   border: '#D97706' },  // ámbar
  { bg: 'rgba(220,38,38,0.12)',   border: '#DC2626' },  // rojo
  { bg: 'rgba(8,145,178,0.12)',   border: '#0891B2' },  // cyan
  { bg: 'rgba(236,72,153,0.12)',  border: '#EC4899' },  // rosa
  { bg: 'rgba(16,185,129,0.12)',  border: '#10B981' },  // esmeralda
]

function getAvatarColor(id: string | undefined): { bg: string; border: string } {
  if (!id) return AVATAR_COLORS[0]!
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

function getRoleTag(role: string | undefined): { label: string; cls: string } | null {
  if (role === 'profesor')   return { label: 'Profesor', cls: styles.replyRoleTagProfesor ?? '' }
  if (role === 'director')   return { label: 'Director', cls: styles.replyRoleTag ?? '' }
  if (role === 'superadmin') return { label: 'Admin',    cls: styles.replyRoleTag ?? '' }
  return null
}

export default function ThreadDetail({
  thread, currentUser, onBack,
  onLoadReplies, onResponder, onMarcarSolucion
}: Props) {
  const [replies,       setReplies]       = useState<ForoReply[]>([])
  const [loadingR,      setLoadingR]      = useState(true)
  const [body,          setBody]          = useState('')
  const [sending,       setSending]       = useState(false)
  const [feedback,      setFeedback]      = useState<{ msg: string; ok: boolean } | null>(null)
  const [isSolved,      setIsSolved]      = useState(thread.is_solved)

  const isStaff = ['profesor', 'director', 'superadmin'].includes(currentUser?.role ?? '')

  const load = useCallback(async () => {
    setLoadingR(true)
    const data = await onLoadReplies(thread.id)
    setReplies(data)
    setLoadingR(false)
  }, [thread.id, onLoadReplies])

  useEffect(() => { load() }, [load])

  const mostrarFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleResponder = async () => {
    if (!body.trim()) return mostrarFeedback('Escribe tu respuesta', false)
    setSending(true)
    const result = await onResponder(thread.id, body)
    setSending(false)
    if (result.error) return mostrarFeedback('Error al enviar', false)
    if (result.reply) setReplies(prev => [...prev, result.reply!])
    setBody('')
    mostrarFeedback('Respuesta enviada', true)
  }

  const handleMarcar = async (replyId: string) => {
    await onMarcarSolucion(thread.id, replyId)
    setReplies(prev => prev.map(r => ({ ...r, is_solution: r.id === replyId })))
    setIsSolved(true)
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} />
          Volver
        </button>
        <div className={styles.headerInfo}>
          <h2 className={styles.threadTitle}>{thread.title}</h2>
          <div className={styles.threadMeta}>
            <span>{thread.author?.username ?? 'Anónimo'}</span>
            {thread.author?.role && getRoleTag(thread.author.role) && (
              <>
                <span className={styles.metaDot} />
                <span>{getRoleTag(thread.author.role)!.label}</span>
              </>
            )}
            <span className={styles.metaDot} />
            <span>{fmtFecha(thread.created_at)}</span>
            {isSolved && (
              <>
                <span className={styles.metaDot} />
                <span className={styles.badgeSolved}>
                  <CheckCircle2 size={11} />
                  Solucionado
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cuerpo del hilo */}
      <div className={styles.threadBody}>
        <p className={styles.threadBodyText}>{thread.body}</p>
      </div>

      {/* Respuestas */}
      <div className={styles.repliesHeader}>
        <MessageCircle size={13} />
        {replies.length} {replies.length === 1 ? 'respuesta' : 'respuestas'}
      </div>

      {loadingR ? (
        <div className={styles.loadingReplies}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando respuestas…
        </div>
      ) : (
        <div className={styles.replies}>
          {replies.map(reply => {
            const roleTag = getRoleTag(reply.author?.role ?? '')
            return (
              <div
                key={reply.id}
                className={[
                  styles.replyCard,
                  reply.is_solution ? styles.replyCardSolution : '',
                ].join(' ')}
              >
                {/* Avatar */}
                <div
  className={styles.avatar}
  style={{
    background: getAvatarColor(reply.author?.id).bg,
    borderColor: getAvatarColor(reply.author?.id).border,
  }}
>
                  {(reply.author?.username?.[0] ?? '?').toUpperCase()}
                </div>

                {/* Contenido */}
                <div className={styles.replyContent}>
                  <div className={styles.replyTop}>
                    <div className={styles.replyAuthor}>
                      <span className={styles.replyAuthorName}>
                        {reply.author?.username ?? 'Anónimo'}
                      </span>
                      {roleTag && (
                        <span className={[styles.replyRoleTag, roleTag.cls].join(' ')}>
                          {roleTag.label}
                        </span>
                      )}
                    </div>
                    <span className={styles.replyDate}>{fmtFecha(reply.created_at)}</span>
                  </div>

                  <p className={styles.replyText}>{reply.body}</p>

                  {reply.is_solution && (
                    <div className={styles.solutionBadge}>
                      <CheckCircle2 size={13} />
                      Respuesta marcada como solución
                    </div>
                  )}

                  {/* Botón marcar solución — solo staff y si no está ya marcada */}
                  {isStaff && !reply.is_solution && !isSolved && (
                    <div>
                      <button
                        className={styles.btnSolucion}
                        onClick={() => handleMarcar(reply.id)}
                      >
                        <CheckCircle2 size={11} />
                        Marcar como solución
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulario responder */}
      <div className={styles.replyForm}>
        <p className={styles.replyFormTitle}>Tu respuesta</p>
        <textarea
          className={styles.textarea}
          placeholder="Escribe tu respuesta aquí…"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        {feedback && (
          <div className={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackError].join(' ')}>
            {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {feedback.msg}
          </div>
        )}
        <div className={styles.replyFormBottom}>
          <button
            className={styles.btnResponder}
            onClick={handleResponder}
            disabled={sending}
          >
            {sending
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={14} />
            }
            {sending ? 'Enviando…' : 'Responder'}
          </button>
        </div>
      </div>
    </div>
  )
}
