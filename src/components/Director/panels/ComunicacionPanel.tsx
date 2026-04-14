import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  Users, Zap, AlertTriangle, Shield, BarChart2, BookOpen,
  RefreshCw, TrendingUp, TrendingDown, GraduationCap,
  Clock, FileText, CheckCircle, X, Check, Key, Euro,
  UserPlus, Star, BookMarked, Rocket, ArrowUpDown, ArrowRight,
  MessageSquare, Send, Trash2, CornerDownLeft, Megaphone, RotateCcw,
  Phone, MapPin, Mail, Target, Calendar, Edit3,
  Save, ChevronLeft, ChevronUp
} from 'lucide-react'
import type { CurrentUser } from '../../../types'
import type { DirectMessage } from '../../../hooks/useDirectMessages'
import styles from './ComunicacionPanel.module.css'

// ── Types ──────────────────────────────────────────────────────────────────
interface SubjectStats {
  id:               string
  slug:             string
  name:             string
  color:            string
  totalAlumnos:     number
  alumnosActivos:   number
  notaMedia:        number | null
  sesiones30d:      number
  enRiesgo:         number
  porExpirar:       number
  alumnosConNota:   { id: string; username: string; nota: number | null; sesiones: number }[]
  alumnosEnRiesgo:  { id: string; username: string; diasInactivo: number | null }[]
  alumnosPorExpirar:{ id: string; username: string; diasRestantes: number }[]
  profesores:       { id: string; username: string; alumnos: number; notaMedia: number | null; sesionesThisWeek: number }[]
}

interface Stats {
  totalAlumnos:    number
  totalActivos:    number
  totalProfesores: number
  totalEnRiesgo:   number
  totalPorExpirar: number
  notaGlobal:      number | null
  sesiones30d:     number
  bySubject:       SubjectStats[]
  semanas:         { label: string; sesiones: number; alumnosActivos: number; notaMedia: number | null }[]
  profesorActivity?: {
    lastAvisoByProfesor:  Record<string, { created_at: string; title: string }>
    totalAvisosByProfesor:Record<string, number>
  }
  finanzas?: {
    mrrAcademia:           number
    mrrActivos:            number
    alumnosSinPrecio:      number
    totalAlumnosConPrecio: number
    spMap:                 Record<string, { monthly_price: number | null; exam_date: string | null; full_name: string | null; city: string | null; payment_status: string }>
    pagos: {
      pagados:     number
      pendientes:  number
      vencidos:    number
      mrrCobrado:  number
      mrrPendiente:number
      mrrVencido:  number
    }
  }
}

interface ProfileSimple {
  id:           string
  username:     string
  role:         string
  access_until: string | null
  created_at:   string
}

interface StudentProfile {
  id:            string
  username:      string
  role:          string
  access_until:  string | null
  created_at:    string | null
  subject_name?: string | null
  extended:      Record<string, any> | null
}

interface AlumnoEnriquecido {
  id:            string
  username:      string
  nota:          number | null
  sesiones:      number
  subjectName:   string
  subjectColor:  string
  enRiesgo:      boolean
  diasInactivo:  number | null
  diasRestantes: number | null
  extended:      Record<string, any> | null
  access_until:  string | null
  created_at:    string | null
}

interface AlumnoDetalleForm {
  full_name:     string
  phone:         string
  email_contact: string
  city:          string
  exam_date:     string
  monthly_price: string
  access_until:  string
}


// ── ComunicacionPanel ────────────────────────────────────────────────────────
function ComunicacionPanel({ currentUser, profiles, mensajes, onDelete }: {
  currentUser: CurrentUser | null
  profiles:    ProfileSimple[]
  mensajes:    DirectMessage[]
  onDelete:    (id: string) => void
}) {
  const [modo,        setModo]        = useState<'individual' | 'masivo'>('individual')
  const [alumnoId,    setAlumnoId]    = useState('')
  const [texto,       setTexto]       = useState('')
  const [enviando,    setEnviando]    = useState(false)
  const [enviado,     setEnviado]     = useState(false)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)

  const alumnos = profiles.filter(p => p.role === 'alumno')

  const handleEnviar = async () => {
    if (!texto.trim()) return
    if (modo === 'individual' && !alumnoId) return
    setEnviando(true)
    try {
      const targets = modo === 'masivo' ? alumnos.map(a => a.id) : [alumnoId]
      for (const toId of targets) {
        await supabase.from('direct_messages').insert({
          from_id:    currentUser?.id,
          to_id:      toId,
          academy_id: currentUser?.academy_id,
          subject_id: currentUser?.subject_id ?? null,
          body:       texto.trim(),
        })
        // Notificación al alumno
        await supabase.from('notifications').insert({
          user_id: toId,
          type:    'mensaje_director',
          title:   'Mensaje de tu director',
          body:    texto.trim().slice(0, 100),
          link:    '/',
        })
      }
      setEnviado(true)
      setTexto('')
      if (modo === 'individual') setAlumnoId('')
      setTimeout(() => setEnviado(false), 2000)
    } finally {
      setEnviando(false)
    }
  }

  // Mensajes enviados — más recientes primero
  const enviados = [...mensajes].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })

  return (
    <div className={styles.comunicacionWrap}>

      {/* Formulario de envío */}
      <div className={styles.comunicacionForm}>
        {/* Toggle individual / masivo */}
        <div className={styles.comunicacionModoTabs}>
          <button
            className={[styles.comunicacionModoTab, modo==='individual' ? styles.comunicacionModoTabActive : ''].join(' ')}
            onClick={() => setModo('individual')}>
            <MessageSquare size={13}/> Mensaje individual
          </button>
          <button
            className={[styles.comunicacionModoTab, modo==='masivo' ? styles.comunicacionModoTabActive : ''].join(' ')}
            onClick={() => setModo('masivo')}>
            <Users size={13}/> Mensaje a toda la academia
          </button>
        </div>

        {/* Selector de alumno */}
        {modo === 'individual' && (
          <div className={styles.comunicacionField}>
            <label className={styles.comunicacionLabel}>Destinatario</label>
            <select
              className={styles.comunicacionSelect}
              value={alumnoId}
              onChange={e => setAlumnoId(e.target.value)}>
              <option value="">Selecciona un alumno...</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.username}</option>
              ))}
            </select>
          </div>
        )}

        {modo === 'masivo' && (
          <div className={styles.comunicacionMasivoInfo}>
            <Users size={13} style={{color:'#0891B2', flexShrink:0}}/>
            <span>El mensaje llegará a <strong>{alumnos.length} alumnos</strong> de la academia</span>
          </div>
        )}

        {/* Textarea */}
        <div className={styles.comunicacionField}>
          <label className={styles.comunicacionLabel}>Mensaje</label>
          <textarea
            className={styles.comunicacionTextarea}
            placeholder={modo === 'masivo'
              ? 'Escribe un aviso para todos tus alumnos...'
              : 'Escribe tu mensaje...'}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={4}
          />
        </div>

        <div className={styles.comunicacionFormFoot}>
          <span className={styles.comunicacionHint}>
            El alumno lo verá en su tablón → Mensajes
          </span>
          <button
            className={styles.comunicacionBtnEnviar}
            onClick={handleEnviar}
            disabled={enviando || !texto.trim() || (modo==='individual' && !alumnoId)}>
            {enviado
              ? <><Check size={14}/> Enviado</>
              : enviando
                ? <><RefreshCw size={14} className={styles.spinner}/> Enviando...</>
                : <><Send size={14}/> {modo === 'masivo' ? `Enviar a ${alumnos.length} alumnos` : 'Enviar'}</>
            }
          </button>
        </div>
      </div>

      {/* Historial de mensajes enviados */}
      {enviados.length > 0 && (
        <div className={styles.comunicacionHistorial}>
          <div className={styles.comunicacionHistorialTitle}>
            <CornerDownLeft size={13}/> Mensajes enviados ({enviados.length})
          </div>
          <div className={styles.comunicacionMensajesList}>
            {enviados.map(m => {
              const dest    = profiles.find(p => p.id === m.to_id)
              const expanded = expandedId === m.id
              return (
                <div key={m.id} className={styles.comunicacionMensajeCard}>
                  <button
                    className={styles.comunicacionMensajeHeader}
                    onClick={() => setExpandedId(expanded ? null : m.id)}>
                    <div className={styles.comunicacionMensajeAvatar}>
                      {(dest?.username ?? '?')[0]!.toUpperCase()}
                    </div>
                    <div className={styles.comunicacionMensajeInfo}>
                      <span className={styles.comunicacionMensajeDest}>{dest?.username ?? 'Alumno'}</span>
                      <span className={styles.comunicacionMensajePreview}>
                        {expanded ? '▲ Ocultar' : m.body.slice(0, 60) + (m.body.length > 60 ? '…' : '')}
                      </span>
                    </div>
                    <div className={styles.comunicacionMensajeMeta}>
                      <span className={styles.comunicacionMensajeFecha}>{fmtFecha(m.created_at)}</span>
                      {m.reply_body && (
                        <span className={styles.comunicacionMensajeReplied}>✓ Respondido</span>
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className={styles.comunicacionMensajeBody}>
                      <div className={styles.inboxMsgBubbleProfe}>
                        <span className={styles.inboxMsgLabel}>Tú enviaste</span>
                        <p className={styles.inboxMsgText}>{m.body}</p>
                      </div>
                      {m.reply_body && (
                        <div className={styles.inboxMsgBubbleAlumno}>
                          <div className={styles.inboxMsgAlumnoHead}>
                            <span className={styles.inboxMsgLabel} style={{color:'#059669'}}>{dest?.username ?? 'Alumno'} respondió</span>
                            <span className={styles.inboxMsgFecha}>{m.reply_at ? fmtFecha(m.reply_at) : ''}</span>
                          </div>
                          <p className={styles.inboxMsgText}>{m.reply_body}</p>
                        </div>
                      )}
                      <button className={styles.inboxMsgBtnEliminar} onClick={() => onDelete(m.id)}>
                        <Trash2 size={11}/> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


export { ComunicacionPanel }
