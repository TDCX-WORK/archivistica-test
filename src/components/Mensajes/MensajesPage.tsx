import { useState } from 'react'
import {
  Send, Plus, Trash2, Loader2, User,
  CheckCircle2, Clock, X, AlertCircle, MessageCircle
} from 'lucide-react'
import { useProfesorMessages } from '../../hooks/useDirectMessages'
import { useProfesor }          from '../../hooks/useProfesor'
import type { CurrentUser }     from '../../types'
import styles from './MensajesPage.module.css'

interface Props {
  currentUser: CurrentUser | null
}

function fmtFecha(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60)    return 'ahora'
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

const AVATAR_COLORS = [
  { bg: 'rgba(37,99,235,0.12)',  border: '#2563EB' },
  { bg: 'rgba(124,58,237,0.12)', border: '#7C3AED' },
  { bg: 'rgba(5,150,105,0.12)',  border: '#059669' },
  { bg: 'rgba(217,119,6,0.12)',  border: '#D97706' },
  { bg: 'rgba(220,38,38,0.12)',  border: '#DC2626' },
  { bg: 'rgba(8,145,178,0.12)',  border: '#0891B2' },
  { bg: 'rgba(236,72,153,0.12)', border: '#EC4899' },
  { bg: 'rgba(16,185,129,0.12)', border: '#10B981' },
]
function avatarColor(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

export default function MensajesPage({ currentUser }: Props) {
  const { sent, loading, sendMessage, deleteSentMessage } = useProfesorMessages(
    currentUser?.id,
    currentUser?.academy_id,
    currentUser?.subject_id
  )
  const { alumnos } = useProfesor(currentUser)

  const [showModal,  setShowModal]  = useState(false)
  const [toId,       setToId]       = useState('')
  const [body,       setBody]       = useState('')
  const [sending,    setSending]    = useState(false)
  const [feedback,   setFeedback]   = useState<{ msg: string; ok: boolean } | null>(null)

  const mostrarFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleEnviar = async () => {
    if (!toId)        return mostrarFeedback('Selecciona un destinatario', false)
    if (!body.trim()) return mostrarFeedback('Escribe el mensaje', false)
    setSending(true)
    const ok = await sendMessage(toId, body)
    setSending(false)
    if (!ok) return mostrarFeedback('Error al enviar el mensaje', false)
    setToId('')
    setBody('')
    setShowModal(false)
    mostrarFeedback('Mensaje enviado', true)
  }

  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setShowModal(false)
  }

  // Mapear to_id → nombre del alumno
  const alumnoNombre = (id: string) => {
    const a = alumnos.find(a => a.id === id)
    return a?.fullName ?? a?.username ?? id.slice(0, 8)
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Mensajes</h1>
          <p className={styles.subtitle}>Mensajes directos enviados a tus alumnos</p>
        </div>
        <button className={styles.btnNuevo} onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Nuevo mensaje
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className={styles.loading}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando mensajes…
        </div>
      ) : sent.length === 0 ? (
        <div className={styles.empty}>
          <MessageCircle size={32} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Ningún mensaje enviado</p>
          <p className={styles.emptySub}>Los mensajes que envíes a tus alumnos aparecerán aquí</p>
        </div>
      ) : (
        <div className={styles.list}>
          {sent.map(msg => {
            const nombre = alumnoNombre(msg.to_id)
            const color  = avatarColor(msg.to_id)
            return (
              <div key={msg.id} className={styles.msgCard}>
                <div className={styles.msgTop}>
                  <div className={styles.msgRecipient}>
                    <div
                      className={styles.msgAvatar}
                      style={{ background: color.bg, borderColor: color.border }}
                    >
                      {nombre[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className={styles.msgName}>{nombre}</span>
                  </div>
                  <div className={styles.msgMeta}>
                    <span>{fmtFecha(msg.created_at)}</span>
                    <span className={styles.metaDot} />
                    <span
                      className={[
                        styles.badgeRead,
                        msg.read ? styles.badgeReadYes : styles.badgeReadNo,
                      ].join(' ')}
                    >
                      {msg.read
                        ? <><CheckCircle2 size={10} /> Leído</>
                        : <><Clock size={10} /> Sin leer</>
                      }
                    </span>
                  </div>
                </div>

                <p className={styles.msgBody}>{msg.body}</p>

                {msg.reply_body && (
                  <div className={styles.replyBubble}>
                    <span className={styles.replyLabel}>Respuesta del alumno</span>
                    <p className={styles.replyText}>{msg.reply_body}</p>
                  </div>
                )}

                <div className={styles.msgActions}>
                  <button
                    className={styles.btnDelete}
                    onClick={() => deleteSentMessage(msg.id)}
                    title="Eliminar mensaje"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nuevo mensaje */}
      {showModal && (
        <div className={styles.overlay} onClick={handleOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nuevo mensaje</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div>
              <label className={styles.label}>Destinatario</label>
              <div className={styles.selectWrap}>
                <User size={13} className={styles.selectIcon} />
                <select
                  className={styles.select}
                  value={toId}
                  onChange={e => setToId(e.target.value)}
                >
                  <option value="">Selecciona un alumno…</option>
                  {alumnos.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.fullName ?? a.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={styles.label}>Mensaje</label>
              <textarea
                className={styles.textarea}
                placeholder="Escribe tu mensaje…"
                value={body}
                onChange={e => setBody(e.target.value)}
                autoFocus
              />
            </div>

            {feedback && (
              <div className={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackError].join(' ')}>
                {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {feedback.msg}
              </div>
            )}

            <div className={styles.modalFooter}>
              <button className={styles.btnCancelar} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className={styles.btnEnviar} onClick={handleEnviar} disabled={sending}>
                {sending
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={14} />
                }
                {sending ? 'Enviando…' : 'Enviar mensaje'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
