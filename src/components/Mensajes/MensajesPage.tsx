import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Send, Loader2,
  CheckCircle2, Clock, X, AlertCircle, MessageCircle,
  Search, ArrowLeft, RefreshCw, Users
} from 'lucide-react'
import { useProfesorMessages, useAlumnoMessages } from '../../hooks/useDirectMessages'
import type { DirectMessage } from '../../hooks/useDirectMessages'
import { supabase }    from '../../lib/supabase'
import type { CurrentUser } from '../../types'
import styles from './MensajesPage.module.css'

interface Props {
  currentUser: CurrentUser | null
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function fmtFecha(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60)    return 'ahora'
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'ayer'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function fmtFechaCompleta(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Hoy'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

const AVATAR_COLORS = [
  { bg: 'rgba(37,99,235,0.10)',  text: '#2563EB' },
  { bg: 'rgba(124,58,237,0.10)', text: '#7C3AED' },
  { bg: 'rgba(5,150,105,0.10)',  text: '#059669' },
  { bg: 'rgba(217,119,6,0.10)',  text: '#D97706' },
  { bg: 'rgba(220,38,38,0.10)',  text: '#DC2626' },
  { bg: 'rgba(8,145,178,0.10)',  text: '#0891B2' },
  { bg: 'rgba(236,72,153,0.10)', text: '#EC4899' },
  { bg: 'rgba(16,185,129,0.10)', text: '#10B981' },
]
function avatarColor(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

/* ── Tipos internos ──────────────────────────────────────────────────── */

interface ContactInfo {
  id:       string
  name:     string
  role:     string
  lastMsg:  string
  lastDate: string
  unread:   number
  hasReply: boolean
}

/* ══════════════════════════════════════════════════════════════════════
   STAFF VIEW — Profesor & Director
   ══════════════════════════════════════════════════════════════════════ */

function StaffMensajes({ currentUser }: Props) {
  const { allMessages, loading, sendMessage, deleteSentMessage, markReadByContact, reload } = useProfesorMessages(
    currentUser?.id,
    currentUser?.academy_id,
    currentUser?.subject_id
  )

  // Cargar alumnos disponibles
  const [contactos, setContactos] = useState<{ id: string; name: string; role: string }[]>([])
  const [loadingContactos, setLoadingContactos] = useState(true)

  useEffect(() => {
    if (!currentUser?.academy_id) return
    const load = async () => {
      let q = supabase
        .from('profiles')
        .select('id, username, role, subject_id')
        .eq('academy_id', currentUser.academy_id!)
        .eq('role', 'alumno')

      if (currentUser.role === 'profesor' && currentUser.subject_id) {
        q = q.eq('subject_id', currentUser.subject_id)
      }

      const { data: profiles } = await q
      const typedProfiles = (profiles ?? []) as { id: string; username: string; role: string }[]

      const ids = typedProfiles.map(p => p.id)
      let spMap: Record<string, string> = {}
      if (ids.length > 0) {
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('id, full_name')
          .in('id', ids)
        for (const s of (sp ?? []) as { id: string; full_name: string | null }[]) {
          if (s.full_name) spMap[s.id] = s.full_name
        }
      }

      setContactos(typedProfiles.map(p => ({
        id:   p.id,
        name: spMap[p.id] ?? p.username,
        role: p.role,
      })))
      setLoadingContactos(false)
    }
    load()
  }, [currentUser?.academy_id, currentUser?.subject_id, currentUser?.role])

  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [body,        setBody]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)
  const [showMobile,  setShowMobile]  = useState<'list' | 'chat'>('list')
  const [feedback,    setFeedback]    = useState<{ msg: string; ok: boolean } | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const contacts: ContactInfo[] = useMemo(() => {
    const map = new Map<string, ContactInfo>()

    for (const c of contactos) {
      map.set(c.id, {
        id: c.id, name: c.name, role: c.role,
        lastMsg: '', lastDate: '', unread: 0, hasReply: false,
      })
    }

    // Process all messages (sent + received)
    for (const msg of allMessages) {
      // Determine which contact this message belongs to
      const contactId = msg.from_id === currentUser?.id ? msg.to_id : msg.from_id
      const existing = map.get(contactId)
      if (existing) {
        if (!existing.lastDate || msg.created_at > existing.lastDate) {
          existing.lastMsg  = msg.body.slice(0, 50)
          existing.lastDate = msg.created_at
        }
        // Unread: messages FROM the contact that I haven't read
        if (msg.from_id !== currentUser?.id && !msg.read) existing.unread++
      } else {
        map.set(contactId, {
          id: contactId, name: contactId.slice(0, 8), role: 'alumno',
          lastMsg: msg.body.slice(0, 50), lastDate: msg.created_at,
          unread: (msg.from_id !== currentUser?.id && !msg.read) ? 1 : 0,
          hasReply: false,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread
      if (a.lastDate && b.lastDate) return b.lastDate.localeCompare(a.lastDate)
      if (a.lastDate) return -1
      if (b.lastDate) return 1
      return a.name.localeCompare(b.name)
    })
  }, [contactos, allMessages, currentUser?.id])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter(c => c.name.toLowerCase().includes(q))
  }, [contacts, searchQuery])

  const conversation = useMemo((): DirectMessage[] => {
    if (!selectedId) return []
    return allMessages
      .filter((m: DirectMessage) => m.to_id === selectedId || m.from_id === selectedId)
      .sort((a: DirectMessage, b: DirectMessage) => a.created_at.localeCompare(b.created_at))
  }, [allMessages, selectedId])

  const selectedContact = contacts.find(c => c.id === selectedId) ?? null

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.length, selectedId])

  useEffect(() => {
    if (selectedId && showMobile === 'chat') {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [selectedId, showMobile])

  const handleSelectContact = (id: string) => {
    setSelectedId(id)
    setShowMobile('chat')
    setBody('')
    markReadByContact(id)
  }

  // Also mark read when new messages arrive while chat is open
  useEffect(() => {
    if (selectedId) markReadByContact(selectedId)
  }, [selectedId, allMessages])

  const handleBack = () => {
    setShowMobile('list')
    setSelectedId(null)
  }

  const handleSend = async () => {
    if (!selectedId || !body.trim()) return
    setSending(true)
    const ok = await sendMessage(selectedId, body)
    setSending(false)
    if (!ok) {
      setFeedback({ msg: 'Error al enviar', ok: false })
      setTimeout(() => setFeedback(null), 2500)
      return
    }
    setBody('')
    try {
      const senderName = currentUser?.displayName ?? currentUser?.username ?? 'Tu profesor'
      await supabase.from('notifications').insert({
        user_id: selectedId,
        type:    'mensaje_directo',
        title:   `Mensaje de ${senderName}`,
        body:    body.trim().slice(0, 100),
        link:    '/mensajes',
      })
    } catch (_) {}
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await reload()
    setRefreshing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groupedConversation = useMemo(() => {
    const groups: { date: string; messages: typeof conversation }[] = []
    let currentDate = ''
    for (const msg of conversation) {
      const d = new Date(msg.created_at).toDateString()
      if (d !== currentDate) {
        currentDate = d
        groups.push({ date: msg.created_at, messages: [msg] })
      } else {
        groups[groups.length - 1]!.messages.push(msg)
      }
    }
    return groups
  }, [conversation])

  if (loading || loadingContactos) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingFull}>
          <Loader2 size={20} className={styles.spin} />
          <span>Cargando mensajes…</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── CONTACT LIST ─────────────────────────────────────── */}
        <div className={[
          styles.sidebar,
          showMobile === 'chat' ? styles.sidebarHidden : '',
        ].join(' ')}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Mensajes</h1>
            <button
              className={styles.btnRefresh}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Actualizar mensajes"
            >
              <RefreshCw size={15} className={refreshing ? styles.spin : ''} />
            </button>
          </div>

          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar alumno…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className={styles.contactList}>
            {filtered.length === 0 ? (
              <div className={styles.contactEmpty}>
                <Users size={20} />
                <span>{searchQuery ? 'Sin resultados' : 'No hay alumnos'}</span>
              </div>
            ) : (
              filtered.map(c => {
                const color = avatarColor(c.id)
                const isActive = c.id === selectedId
                return (
                  <button
                    key={c.id}
                    className={[styles.contactItem, isActive ? styles.contactActive : ''].join(' ')}
                    onClick={() => handleSelectContact(c.id)}
                  >
                    <div className={styles.contactAvatar} style={{ background: color.bg, color: color.text }}>
                      {c.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactNameRow}>
                        <span className={styles.contactName}>{c.name}</span>
                        {c.lastDate && (
                          <span className={styles.contactTime}>{fmtFecha(c.lastDate)}</span>
                        )}
                      </div>
                      {c.lastMsg ? (
                        <span className={styles.contactPreview}>
                          {c.hasReply ? '↩ ' : ''}
                          {c.lastMsg}{c.lastMsg.length >= 50 ? '…' : ''}
                        </span>
                      ) : (
                        <span className={styles.contactPreviewEmpty}>Sin mensajes</span>
                      )}
                    </div>
                    {c.unread > 0 && (
                      <span className={styles.contactBadge}>{c.unread}</span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── CHAT AREA ────────────────────────────────────────── */}
        <div className={[
          styles.chatArea,
          showMobile === 'list' ? styles.chatHidden : '',
        ].join(' ')}>
          {!selectedId ? (
            <div className={styles.chatEmpty}>
              <div className={styles.chatEmptyIcon}>
                <MessageCircle size={36} strokeWidth={1.2} />
              </div>
              <p className={styles.chatEmptyTitle}>Selecciona una conversación</p>
              <p className={styles.chatEmptySub}>
                Elige un alumno de la lista para ver o enviar mensajes
              </p>
            </div>
          ) : (
            <>
              <div className={styles.chatHeader}>
                <button className={styles.chatBackBtn} onClick={handleBack}>
                  <ArrowLeft size={18} />
                </button>
                <div
                  className={styles.chatHeaderAvatar}
                  style={{
                    background: avatarColor(selectedId).bg,
                    color: avatarColor(selectedId).text,
                  }}
                >
                  {(selectedContact?.name ?? '?')[0]!.toUpperCase()}
                </div>
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatHeaderName}>{selectedContact?.name ?? 'Alumno'}</span>
                  <span className={styles.chatHeaderRole}>Alumno</span>
                </div>
                <div className={styles.chatHeaderActions}>
                  <button
                    className={styles.btnRefreshSmall}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Actualizar"
                  >
                    <RefreshCw size={14} className={refreshing ? styles.spin : ''} />
                  </button>
                </div>
              </div>

              <div className={styles.chatMessages}>
                {conversation.length === 0 ? (
                  <div className={styles.chatNoMessages}>
                    <MessageCircle size={24} strokeWidth={1.2} />
                    <p>Aún no hay mensajes con {selectedContact?.name}</p>
                    <p className={styles.chatNoMessagesSub}>Escribe el primer mensaje</p>
                  </div>
                ) : (
                  groupedConversation.map((group, gi) => (
                    <div key={gi}>
                      <div className={styles.dateSeparator}>
                        <span>{fmtFechaCompleta(group.date)}</span>
                      </div>
                      {group.messages.map((msg: DirectMessage) => {
                        const isMine = msg.from_id === currentUser?.id
                        return (
                          <div key={msg.id} className={styles.msgGroup}>
                            <div className={isMine ? styles.bubbleSent : styles.bubbleReceived}>
                              <p className={styles.bubbleText}>{msg.body}</p>
                              {isMine ? (
                                <div className={styles.bubbleMeta}>
                                  <span>{fmtHora(msg.created_at)}</span>
                                  {msg.read
                                    ? <CheckCircle2 size={11} className={styles.metaRead} />
                                    : <Clock size={11} className={styles.metaUnread} />
                                  }
                                </div>
                              ) : (
                                <span className={styles.bubbleTime}>{fmtHora(msg.created_at)}</span>
                              )}
                            </div>
                            {/* Legacy: old reply_body from before bidirectional */}
                            {isMine && msg.reply_body && (
                              <div className={styles.bubbleReceived}>
                                <p className={styles.bubbleText}>{msg.reply_body}</p>
                                <span className={styles.bubbleTime}>
                                  {msg.reply_at ? fmtHora(msg.reply_at) : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className={styles.composer}>
                {feedback && (
                  <div className={[styles.composerFeedback, feedback.ok ? styles.feedbackOk : styles.feedbackErr].join(' ')}>
                    {feedback.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {feedback.msg}
                  </div>
                )}
                <div className={styles.composerRow}>
                  <textarea
                    ref={textareaRef}
                    className={styles.composerInput}
                    placeholder="Escribe un mensaje…"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <button
                    className={styles.composerSend}
                    onClick={handleSend}
                    disabled={sending || !body.trim()}
                  >
                    {sending
                      ? <Loader2 size={16} className={styles.spin} />
                      : <Send size={16} />
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


/* ══════════════════════════════════════════════════════════════════════
   ALUMNO VIEW — puede enviar y recibir
   ══════════════════════════════════════════════════════════════════════ */

function AlumnoMensajes({ currentUser }: Props) {
  const { messages, unread, loading, markRead, replyToMessage, deleteMessage, sendMessage, reload } = useAlumnoMessages(currentUser?.id)

  // Cargar profesores de su asignatura + directores de su academia
  const [contactos, setContactos] = useState<{ id: string; name: string; role: string }[]>([])
  const [loadingContactos, setLoadingContactos] = useState(true)

  useEffect(() => {
    if (!currentUser?.academy_id) return
    const load = async () => {
      // Profesores de mi asignatura + directores de mi academia
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, role, subject_id')
        .eq('academy_id', currentUser.academy_id!)
        .in('role', ['profesor', 'director'])

      const typedProfiles = (profiles ?? []).filter((p: any) => {
        if (p.role === 'director') return true
        if (p.role === 'profesor' && currentUser.subject_id) return p.subject_id === currentUser.subject_id
        return true
      }) as { id: string; username: string; role: string }[]

      // Enriquecer con full_name
      const ids = typedProfiles.map(p => p.id)
      let nameMap: Record<string, string> = {}
      if (ids.length > 0) {
        const { data: sp } = await supabase
          .from('staff_profiles')
          .select('id, full_name')
          .in('id', ids)
        for (const s of (sp ?? []) as { id: string; full_name: string | null }[]) {
          if (s.full_name) nameMap[s.id] = s.full_name
        }
      }

      setContactos(typedProfiles.map(p => ({
        id:   p.id,
        name: nameMap[p.id] ?? p.username,
        role: p.role,
      })))
      setLoadingContactos(false)
    }
    load()
  }, [currentUser?.academy_id, currentUser?.subject_id])

  // También cargar mensajes enviados por el alumno (from_id = yo)
  const [sentMessages, setSentMessages] = useState<DirectMessage[]>([])
  useEffect(() => {
    if (!currentUser?.id) return
    const loadSent = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('from_id', currentUser.id!)
        .eq('deleted_by_sender', false)
        .order('created_at', { ascending: false })
      setSentMessages((data ?? []) as DirectMessage[])
    }
    loadSent()
  }, [currentUser?.id, messages]) // reload sent when messages change (after send)

  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [body,         setBody]         = useState('')
  const [sending,      setSending]      = useState(false)
  const [refreshing,   setRefreshing]   = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [showMobile,   setShowMobile]   = useState<'list' | 'chat'>('list')
  const [feedback,     setFeedback]     = useState<{ msg: string; ok: boolean } | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // All messages with a contact (received from them + sent to them)
  const allMessages = useMemo(() => {
    const received = messages // to_id = me
    const sent = sentMessages // from_id = me
    return [...received, ...sent]
  }, [messages, sentMessages])

  // Build contact list: profesores/directores + any sender from received messages
  const contacts: ContactInfo[] = useMemo(() => {
    const map = new Map<string, ContactInfo>()

    // Seed with available contactos
    for (const c of contactos) {
      map.set(c.id, {
        id: c.id, name: c.name, role: c.role,
        lastMsg: '', lastDate: '', unread: 0, hasReply: false,
      })
    }

    // Add data from received messages
    for (const msg of messages) {
      const existing = map.get(msg.from_id)
      if (existing) {
        if (!existing.lastDate || msg.created_at > existing.lastDate) {
          existing.lastMsg  = msg.body.slice(0, 50)
          existing.lastDate = msg.created_at
        }
        if (!msg.read) existing.unread++
      }
    }

    // Add data from sent messages
    for (const msg of sentMessages) {
      const existing = map.get(msg.to_id)
      if (existing) {
        if (!existing.lastDate || msg.created_at > existing.lastDate) {
          existing.lastMsg  = msg.body.slice(0, 50)
          existing.lastDate = msg.created_at
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread
      if (a.lastDate && b.lastDate) return b.lastDate.localeCompare(a.lastDate)
      if (a.lastDate) return -1
      if (b.lastDate) return 1
      return a.name.localeCompare(b.name)
    })
  }, [contactos, messages, sentMessages])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter(c => c.name.toLowerCase().includes(q))
  }, [contacts, searchQuery])

  // Conversation with selected contact — both received + sent, sorted chronologically
  const conversation = useMemo(() => {
    if (!selectedId) return []
    const received = messages.filter(m => m.from_id === selectedId)
    const sent = sentMessages.filter(m => m.to_id === selectedId)
    return [...received, ...sent].sort((a, b) => a.created_at.localeCompare(b.created_at))
  }, [messages, sentMessages, selectedId])

  const selectedContact = contacts.find(c => c.id === selectedId) ?? null

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.length, selectedId])

  // Mark received messages as read when opening conversation
  useEffect(() => {
    if (!selectedId) return
    const unreadMsgs = messages.filter(m => m.from_id === selectedId && !m.read)
    for (const m of unreadMsgs) {
      markRead(m.id)
    }
  }, [selectedId, messages])

  const handleSelectContact = (id: string) => {
    setSelectedId(id)
    setShowMobile('chat')
    setBody('')
  }

  const handleBack = () => {
    setShowMobile('list')
    setSelectedId(null)
  }

  const handleSend = async () => {
    if (!selectedId || !body.trim() || !currentUser?.academy_id) return
    setSending(true)
    const ok = await sendMessage(selectedId, body, currentUser.academy_id, currentUser.subject_id)
    setSending(false)
    if (!ok) {
      setFeedback({ msg: 'Error al enviar', ok: false })
      setTimeout(() => setFeedback(null), 2500)
      return
    }
    // Reload sent messages
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('from_id', currentUser.id!)
      .eq('deleted_by_sender', false)
      .order('created_at', { ascending: false })
    setSentMessages((data ?? []) as DirectMessage[])
    setBody('')
    // Notify the recipient
    try {
      const senderName = currentUser.displayName ?? currentUser.username ?? 'Un alumno'
      await supabase.from('notifications').insert({
        user_id: selectedId,
        type:    'mensaje_alumno',
        title:   `Mensaje de ${senderName}`,
        body:    body.trim().slice(0, 100),
        link:    '/mensajes',
      })
    } catch (_) {}
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await reload()
    // Also reload sent
    if (currentUser?.id) {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('from_id', currentUser.id)
        .eq('deleted_by_sender', false)
        .order('created_at', { ascending: false })
      setSentMessages((data ?? []) as DirectMessage[])
    }
    setRefreshing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groupedConversation = useMemo(() => {
    const groups: { date: string; messages: typeof conversation }[] = []
    let currentDate = ''
    for (const msg of conversation) {
      const d = new Date(msg.created_at).toDateString()
      if (d !== currentDate) {
        currentDate = d
        groups.push({ date: msg.created_at, messages: [msg] })
      } else {
        groups[groups.length - 1]!.messages.push(msg)
      }
    }
    return groups
  }, [conversation])

  if (loading || loadingContactos) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingFull}>
          <Loader2 size={20} className={styles.spin} />
          <span>Cargando mensajes…</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── CONTACT LIST ─────────────────────────────────── */}
        <div className={[
          styles.sidebar,
          showMobile === 'chat' ? styles.sidebarHidden : '',
        ].join(' ')}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Mensajes</h1>
            <button
              className={styles.btnRefresh}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Actualizar mensajes"
            >
              <RefreshCw size={15} className={refreshing ? styles.spin : ''} />
            </button>
          </div>

          {contacts.length > 1 && (
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Buscar…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className={styles.searchClear} onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          <div className={styles.contactList}>
            {filtered.length === 0 ? (
              <div className={styles.contactEmpty}>
                <MessageCircle size={20} />
                <span>No hay profesores disponibles</span>
              </div>
            ) : (
              filtered.map(c => {
                const color = avatarColor(c.id)
                const isActive = c.id === selectedId
                const roleLabel = c.role === 'director' ? 'Director' : 'Profesor'
                return (
                  <button
                    key={c.id}
                    className={[styles.contactItem, isActive ? styles.contactActive : ''].join(' ')}
                    onClick={() => handleSelectContact(c.id)}
                  >
                    <div className={styles.contactAvatar} style={{ background: color.bg, color: color.text }}>
                      {c.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactNameRow}>
                        <span className={styles.contactName}>{c.name}</span>
                        {c.lastDate && (
                          <span className={styles.contactTime}>{fmtFecha(c.lastDate)}</span>
                        )}
                      </div>
                      <div className={styles.contactSecondRow}>
                        <span className={styles.contactRoleTag}>{roleLabel}</span>
                        <span className={styles.contactPreview}>
                          {c.lastMsg ? (c.lastMsg + (c.lastMsg.length >= 50 ? '…' : '')) : 'Sin mensajes'}
                        </span>
                      </div>
                    </div>
                    {c.unread > 0 && (
                      <span className={styles.contactBadge}>{c.unread}</span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── CHAT AREA ────────────────────────────────────── */}
        <div className={[
          styles.chatArea,
          showMobile === 'list' ? styles.chatHidden : '',
        ].join(' ')}>
          {!selectedId ? (
            <div className={styles.chatEmpty}>
              <div className={styles.chatEmptyIcon}>
                <MessageCircle size={36} strokeWidth={1.2} />
              </div>
              <p className={styles.chatEmptyTitle}>
                {contacts.length === 0
                  ? 'Sin profesores disponibles'
                  : 'Selecciona una conversación'
                }
              </p>
              <p className={styles.chatEmptySub}>
                {contacts.length === 0
                  ? 'No hay profesores o directores asignados a tu asignatura'
                  : 'Elige un profesor o director de la lista para enviar o ver mensajes'
                }
              </p>
            </div>
          ) : (
            <>
              <div className={styles.chatHeader}>
                <button className={styles.chatBackBtn} onClick={handleBack}>
                  <ArrowLeft size={18} />
                </button>
                <div
                  className={styles.chatHeaderAvatar}
                  style={{
                    background: avatarColor(selectedId).bg,
                    color: avatarColor(selectedId).text,
                  }}
                >
                  {(selectedContact?.name ?? '?')[0]!.toUpperCase()}
                </div>
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatHeaderName}>{selectedContact?.name ?? 'Profesor'}</span>
                  <span className={styles.chatHeaderRole}>
                    {selectedContact?.role === 'director' ? 'Director' : 'Profesor'}
                  </span>
                </div>
                <div className={styles.chatHeaderActions}>
                  <button
                    className={styles.btnRefreshSmall}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Actualizar"
                  >
                    <RefreshCw size={14} className={refreshing ? styles.spin : ''} />
                  </button>
                </div>
              </div>

              <div className={styles.chatMessages}>
                {conversation.length === 0 ? (
                  <div className={styles.chatNoMessages}>
                    <MessageCircle size={24} strokeWidth={1.2} />
                    <p>Aún no hay mensajes con {selectedContact?.name}</p>
                    <p className={styles.chatNoMessagesSub}>Escribe el primer mensaje</p>
                  </div>
                ) : (
                  groupedConversation.map((group, gi) => (
                    <div key={gi}>
                      <div className={styles.dateSeparator}>
                        <span>{fmtFechaCompleta(group.date)}</span>
                      </div>
                      {group.messages.map((msg: DirectMessage) => {
                        const isMine = msg.from_id === currentUser?.id
                        return (
                          <div key={msg.id} className={styles.msgGroup}>
                            <div className={isMine ? styles.bubbleSent : styles.bubbleReceived}>
                              <p className={styles.bubbleText}>{msg.body}</p>
                              <div className={isMine ? styles.bubbleMeta : undefined}>
                                <span className={isMine ? undefined : styles.bubbleTime}>{fmtHora(msg.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Composer — always visible */}
              <div className={styles.composer}>
                {feedback && (
                  <div className={[styles.composerFeedback, feedback.ok ? styles.feedbackOk : styles.feedbackErr].join(' ')}>
                    {feedback.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {feedback.msg}
                  </div>
                )}
                <div className={styles.composerRow}>
                  <textarea
                    ref={textareaRef}
                    className={styles.composerInput}
                    placeholder="Escribe un mensaje…"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <button
                    className={styles.composerSend}
                    onClick={handleSend}
                    disabled={sending || !body.trim()}
                  >
                    {sending
                      ? <Loader2 size={16} className={styles.spin} />
                      : <Send size={16} />
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


/* ══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — Routes to the correct view
   ══════════════════════════════════════════════════════════════════════ */

export default function MensajesPage({ currentUser }: Props) {
  if (!currentUser) return null
  const role = currentUser.role
  if (role === 'profesor' || role === 'director') {
    return <StaffMensajes currentUser={currentUser} />
  }
  if (role === 'alumno') {
    return <AlumnoMensajes currentUser={currentUser} />
  }
  return null
}
