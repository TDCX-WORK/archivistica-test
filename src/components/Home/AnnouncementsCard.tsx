import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Megaphone, AlertTriangle, Info, BookOpen, Bell, Clock, MessageSquare, Send, X, Check, RefreshCw, CornerUpLeft, Trash2 } from 'lucide-react'
import type { Announcement } from '../../types'
import type { DirectMessage } from '../../hooks/useDirectMessages'
import styles from './AnnouncementsCard.module.css'

interface TipoMeta { label: string; color: string; bg: string; Icon: React.ElementType }

const TIPO_META: Record<string, TipoMeta> = {
  info:         { label: 'Info',         color: '#0891B2', bg: '#EFF6FF', Icon: Info          },
  importante:   { label: 'Importante',   color: '#DC2626', bg: '#FEF2F2', Icon: AlertTriangle  },
  examen:       { label: 'Examen',       color: '#7C3AED', bg: '#F5F3FF', Icon: BookOpen       },
  recordatorio: { label: 'Recordatorio', color: '#D97706', bg: '#FFFBEB', Icon: Bell           },
}

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function diasRestantes(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / 86400000)
}

function ReplyModal({ mensaje, onClose, onReply }: {
  mensaje:  DirectMessage
  onClose:  () => void
  onReply:  (id: string, body: string) => Promise<boolean>
}) {
  const [texto,   setTexto]   = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleReply = async () => {
    if (!texto.trim()) return
    setSending(true)
    const ok = await onReply(mensaje.id, texto)
    setSending(false)
    if (ok) { setSent(true); setTimeout(onClose, 1500) }
  }

  return createPortal(
    <div className={styles.replyOverlay} onClick={onClose}>
      <div className={styles.replyModal} onClick={e => e.stopPropagation()}>
        <div className={styles.replyHead}>
          <span className={styles.replyTitle}>Responder a tu profesor</span>
          <button className={styles.replyClose} onClick={onClose}><X size={14} /></button>
        </div>
        <div className={styles.replyOriginal}>
          <span className={styles.replyOriginalLabel}>Mensaje recibido</span>
          <p className={styles.replyOriginalText}>{mensaje.body}</p>
        </div>
        {sent ? (
          <div className={styles.replySent}>
            <Check size={18} style={{ color: '#059669' }} /><span>Respuesta enviada</span>
          </div>
        ) : (
          <>
            <textarea className={styles.replyTextarea} placeholder="Escribe tu respuesta..." value={texto}
              onChange={e => setTexto(e.target.value)} rows={3} autoFocus />
            <div className={styles.replyFoot}>
              <button className={styles.replyBtnCancelar} onClick={onClose}>Cancelar</button>
              <button className={styles.replyBtnEnviar} onClick={handleReply} disabled={sending || !texto.trim()}>
                {sending ? <RefreshCw size={12} className={styles.spinner} /> : <Send size={12} />}
                Enviar respuesta
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

interface AnnouncementsCardProps {
  announcements?:  Announcement[]
  loading?:        boolean
  messages?:       DirectMessage[]
  unreadMessages?: number
  onMarkRead?:     (id: string) => void
  onReply?:        (id: string, body: string) => Promise<boolean>
  onDeleteMessage?:(id: string) => void
}

export default function AnnouncementsCard({
  announcements = [], loading,
  messages = [], unreadMessages = 0,
  onMarkRead, onReply, onDeleteMessage,
}: AnnouncementsCardProps) {
  const [tab,      setTab]      = useState<'avisos' | 'mensajes'>('avisos')
  const [replyMsg, setReplyMsg] = useState<DirectMessage | null>(null)

  const handleTabMensajes = useCallback(() => setTab('mensajes'), [])

  if (loading) return null

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerTabs}>
          <button className={[styles.headerTab, tab==='avisos'?styles.headerTabActive:''].join(' ')} onClick={() => setTab('avisos')}>
            <Megaphone size={12} /><span>Avisos</span>
            {announcements.length > 0 && <span className={styles.tabBadge}>{announcements.length}</span>}
          </button>
          <button className={[styles.headerTab, tab==='mensajes'?styles.headerTabActive:''].join(' ')} onClick={handleTabMensajes}>
            <MessageSquare size={12} /><span>Mensajes</span>
            {unreadMessages > 0 && <span className={styles.tabBadgeUnread}>{unreadMessages}</span>}
          </button>
        </div>
      </div>

      {tab === 'avisos' && (
        announcements.length === 0
          ? <div className={styles.empty}><Megaphone size={22} strokeWidth={1.5} /><span className={styles.emptyTitle}>Sin avisos activos</span><span className={styles.emptySub}>Tu profesor publicará avisos aquí</span></div>
          : <div className={styles.list}>
              {announcements.map(a => {
                const meta = TIPO_META[a.tipo] ?? TIPO_META['info']!
                const Icon = meta.Icon
                const dias = diasRestantes(a.expires_at)
                return (
                  <div key={a.id} className={styles.item}>
                    <div className={styles.itemIcon} style={{ background:meta.bg, color:meta.color }}><Icon size={13} strokeWidth={2} /></div>
                    <div className={styles.itemBody}>
                      <div className={styles.itemTop}>
                        <span className={styles.itemTipo} style={{ color:meta.color }}>{meta.label}</span>
                        <span className={styles.itemFecha}>{formatFecha(a.created_at)}</span>
                      </div>
                      <p className={styles.itemTitle}>{a.title}</p>
                      {a.body && <p className={styles.itemBody2}>{a.body}</p>}
                      {dias !== null && dias <= 3 && (
                        <span className={styles.itemExpira}><Clock size={10} />{dias <= 0 ? 'Expira hoy' : `Expira en ${dias}d`}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
      )}

      {tab === 'mensajes' && (
        messages.length === 0
          ? <div className={styles.empty}><MessageSquare size={22} strokeWidth={1.5} /><span className={styles.emptyTitle}>Sin mensajes</span><span className={styles.emptySub}>Tu profesor puede enviarte mensajes directos aquí</span></div>
          : <div className={styles.list}>
              {messages.map(m => (
                <div key={m.id} className={[styles.msgItem, !m.read?styles.msgItemUnread:''].join(' ')}>
                  <div className={styles.msgBubble}>
                    <div className={styles.msgBubbleHead}>
                      <span className={styles.msgBubbleLabel}>{m.from_role === 'director' ? 'Tu director' : 'Tu profesor'}</span>
                      <span className={styles.itemFecha}>{formatFecha(m.created_at)}</span>
                      {!m.read && <span className={styles.msgUnreadDot} />}
                      {onDeleteMessage && (
                        <button className={styles.msgBtnEliminar}
                          onClick={e => { e.stopPropagation(); onDeleteMessage(m.id) }}
                          title="Eliminar mensaje">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    <p className={styles.msgBubbleText}>{m.body}</p>
                  </div>
                  {m.reply_body && (
                    <div className={styles.msgReplyBubble}>
                      <div className={styles.msgBubbleHead}>
                        <span className={styles.msgBubbleLabel} style={{ color:'#059669' }}>Tú</span>
                        <span className={styles.itemFecha}>{formatFecha(m.reply_at)}</span>
                      </div>
                      <p className={styles.msgBubbleText}>{m.reply_body}</p>
                    </div>
                  )}
                  {!m.reply_body && onReply && (
                    <button className={styles.msgBtnResponder}
                      onClick={e => { e.stopPropagation(); if (!m.read && onMarkRead) onMarkRead(m.id); setReplyMsg(m) }}>
                      <CornerUpLeft size={11} /> Responder
                    </button>
                  )}
                </div>
              ))}
            </div>
      )}

      {replyMsg && onReply && (
        <ReplyModal mensaje={replyMsg} onClose={() => setReplyMsg(null)} onReply={onReply} />
      )}
    </div>
  )
}
