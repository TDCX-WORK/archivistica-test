import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle, Euro, FileText, MessageCircle, Target,
  ChevronDown, CheckCircle2, RefreshCw, X, Send,
  Clock, UserCheck, DollarSign, MessagesSquare, GraduationCap,
  Mail, Phone, ArrowRight, Sparkles
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { emit } from '../../../lib/eventBus'
import { useAcciones, type AccionesReplyRecibida, type AccionesHiloStale } from '../../../hooks/useAcciones'
import type { CurrentUser } from '../../../types'
import styles from './AccionesPanel.module.css'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface SubjectStats {
  id:               string
  name:             string
  color:            string
  alumnosEnRiesgo:  { id: string; username: string; diasInactivo: number | null }[]
  alumnosPorExpirar:{ id: string; username: string; diasRestantes: number }[]
  profesores:       { id: string; username: string; sesionesThisWeek: number }[]
}

interface Stats {
  totalAlumnos:    number
  totalEnRiesgo:   number
  totalPorExpirar: number
  bySubject:       SubjectStats[]
  profesorActivity?: {
    lastAvisoByProfesor:  Record<string, { created_at: string; title: string }>
  }
  finanzas?: {
    alumnosSinPrecio:      number
    spMap:                 Record<string, { monthly_price: number | null; exam_date: string | null; full_name: string | null; payment_status: string }>
    pagos: {
      vencidos:     number
      mrrVencido:   number
      mrrPendiente: number
    }
  }
}

interface StudentProfile {
  id:            string
  username:      string
  access_until:  string | null
  extended:      Record<string, any> | null
}

interface ProfileSimple {
  id:           string
  username:     string
  role:         string
  access_until: string | null
}

type AccionActiva =
  | { tipo: 'marcarPago';       alumnoId: string; username: string; monto: number }
  | { tipo: 'asignarPrecio';    alumnoId: string; username: string }
  | { tipo: 'renovarAcceso';    alumnoId: string; username: string; diasRestantes: number }
  | { tipo: 'completarDatos';   alumnoId: string; username: string; faltaEmail: boolean; faltaPhone: boolean }
  | { tipo: 'verReply';         reply: AccionesReplyRecibida }
  | { tipo: 'responderHilo';    hilo: AccionesHiloStale }
  | { tipo: 'recordatorioAlumno'; alumnoId: string; username: string; examDate: string | null; diasInactivo: number | null }
  | { tipo: 'recordatorioProfesor'; profesorId: string; username: string }

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function hashColor(id: string): string {
  const colors = ['#0891B2','#7C3AED','#059669','#DC2626','#D97706','#2563EB','#DB2777','#0D9488']
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  return colors[h]!
}

function fmtEuro(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function relativeFecha(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'hoy'
  if (d === 1) return 'ayer'
  if (d < 7)   return `hace ${d}d`
  if (d < 30)  return `hace ${Math.floor(d/7)}sem`
  return fmtFecha(iso)
}

function initial(s: string): string {
  return (s[0] ?? '?').toUpperCase()
}

// Lectura defensiva de monthly_price — soporta number, string "0.00", null, undefined, NaN.
// Devuelve 0 cuando no hay precio utilizable.
function priceOf(raw: unknown): number {
  if (raw === null || raw === undefined) return 0
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
  return isNaN(n) ? 0 : n
}

// ═══════════════════════════════════════════════════════════════════════════
// PANEL PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function AccionesPanel({ stats, currentUser, studentProfiles, allProfiles, updateStudentProfile, reloadProfiles }: {
  stats:                Stats
  currentUser:          CurrentUser | null
  studentProfiles:      StudentProfile[]
  allProfiles:          ProfileSimple[]
  onAlumnoClick:        (a: any) => void
  updateStudentProfile: (userId: string, fields: Record<string, any>) => Promise<boolean>
  reloadProfiles:       () => Promise<void> | void
}) {
  const { data: acciones, loading, reload, marcarReplyVista, descartarHilo } = useAcciones(currentUser)

  const [abiertas,   setAbiertas]   = useState<Set<string>>(new Set(['dinero','accesos','datos','comunicacion','riesgo']))
  const [accion,     setAccion]     = useState<AccionActiva | null>(null)
  // Resueltos locales para que los items desaparezcan al instante aunque el
  // refresh del parent tarde un poco. Claves: "<tipo>-<id>"
  const [resueltos,  setResueltos]  = useState<Set<string>>(new Set())

  const spMap = stats.finanzas?.spMap ?? {}

  const marcarResuelto = (key: string) =>
    setResueltos(prev => { const n = new Set(prev); n.add(key); return n })

  // ── Cómputo de acciones ──────────────────────────────────────────────
  const { dinero, accesos, datos, comunicacion, riesgo, totales } = useMemo(() => {
    // DINERO — pagos vencidos + sin precio
    const alumnosVencidos = studentProfiles
      .filter(p => spMap[p.id]?.payment_status === 'overdue')
      .filter(p => !resueltos.has(`vencido-${p.id}`))
    const alumnosSinPrecio = studentProfiles
      .filter(p => {
        const raw = spMap[p.id]?.monthly_price ?? p.extended?.monthly_price
        return priceOf(raw) <= 0
      })
      .filter(p => !resueltos.has(`sinPrecio-${p.id}`))

    // ACCESOS — expiran ≤14d
    const accesosExpirar = stats.bySubject.flatMap(sub =>
      sub.alumnosPorExpirar.map(a => ({ ...a, subjectName: sub.name, subjectColor: sub.color }))
    ).filter(a => !resueltos.has(`expirar-${a.id}`))
     .sort((a,b) => a.diasRestantes - b.diasRestantes)

    // DATOS INCOMPLETOS — falta email o teléfono
    const datosFaltan = studentProfiles.filter(p => {
      const email = p.extended?.email_contact
      const phone = p.extended?.phone
      return !email || !phone
    }).filter(p => !resueltos.has(`datos-${p.id}`))
      .map(p => ({
        id: p.id,
        username: p.username,
        faltaEmail: !p.extended?.email_contact,
        faltaPhone: !p.extended?.phone,
      }))

    // COMUNICACIÓN — replies + hilos
    const replies = acciones.replies
    const hilos   = acciones.hilosSinStaff

    // RIESGO ACADÉMICO — alumnos inactivos con examen ≤60d + profesores sin actividad 7d
    const now = Date.now()
    const alumnosRiesgoExamen = stats.bySubject.flatMap(sub =>
      sub.alumnosEnRiesgo.map(a => {
        const sp = studentProfiles.find(p => p.id === a.id)
        const examDate = sp?.extended?.exam_date ?? null
        const diasExamen = examDate ? Math.ceil((new Date(examDate).getTime() - now) / 86400000) : null
        return {
          ...a,
          subjectName: sub.name,
          subjectColor: sub.color,
          examDate,
          diasExamen,
        }
      })
    ).filter(a => a.diasExamen !== null && a.diasExamen > 0 && a.diasExamen <= 60)
     .filter(a => !resueltos.has(`riesgoAlumno-${a.id}`))
     .sort((a,b) => (a.diasExamen ?? 999) - (b.diasExamen ?? 999))

    // Profesores inactivos
    const semanaMs = 7 * 86400000
    const profesores = allProfiles.filter(p => p.role === 'profesor')
    const lastAviso = stats.profesorActivity?.lastAvisoByProfesor ?? {}
    const profesInactivos = profesores.filter(p => {
      const ultimo = lastAviso[p.id]?.created_at
      if (!ultimo) return true
      return (now - new Date(ultimo).getTime()) > semanaMs
    }).filter(p => !resueltos.has(`riesgoProf-${p.id}`))

    const dineroCount   = alumnosVencidos.length + alumnosSinPrecio.length
    const accesosCount  = accesosExpirar.length
    const datosCount    = datosFaltan.length
    const comunicCount  = replies.length + hilos.length
    const riesgoCount   = alumnosRiesgoExamen.length + profesInactivos.length

    return {
      dinero:       { vencidos: alumnosVencidos, sinPrecio: alumnosSinPrecio, count: dineroCount },
      accesos:      { expirar: accesosExpirar, count: accesosCount },
      datos:        { faltan: datosFaltan, count: datosCount },
      comunicacion: { replies, hilos, count: comunicCount },
      riesgo:       { alumnos: alumnosRiesgoExamen, profesores: profesInactivos, count: riesgoCount },
      totales:      {
        acciones:       dineroCount + accesosCount + datosCount + comunicCount + riesgoCount,
        alumnosAfectados: new Set([
          ...alumnosVencidos.map(a => a.id),
          ...alumnosSinPrecio.map(a => a.id),
          ...accesosExpirar.map(a => a.id),
          ...datosFaltan.map(a => a.id),
          ...alumnosRiesgoExamen.map(a => a.id),
        ]).size,
        dineroEnJuego:  (stats.finanzas?.pagos.mrrVencido ?? 0),
      }
    }
  }, [stats, studentProfiles, allProfiles, acciones, spMap, resueltos])

  const toggle = (id: string) => {
    setAbiertas(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.wrap} style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-muted)' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '0.75rem', fontSize: 'var(--fs-5)' }}>Cargando acciones pendientes…</p>
      </div>
    )
  }

  // ── Inbox Zero ───────────────────────────────────────────────────────
  if (totales.acciones === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.zero}>
          <div className={styles.zeroBadge}>
            <Sparkles size={28} strokeWidth={2} />
          </div>
          <h2 className={styles.zeroTitle}>No hay nada que decidir ahora mismo</h2>
          <p className={styles.zeroSub}>
            Sin pagos vencidos, sin accesos por caducar, sin mensajes pendientes ni profesores inactivos.
            Tu academia corre sola — aprovecha para tomarte un café.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <button className={styles.refreshBtn} onClick={reload}>
              <RefreshCw size={12} /> Volver a comprobar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Panel con acciones ───────────────────────────────────────────────
  return (
    <div className={styles.wrap}>
      {/* Hero resumen */}
      <div className={styles.hero}>
        <div className={styles.heroRow}>
          <div className={styles.heroLeft}>
            <span className={styles.heroEyebrow}><AlertTriangle size={11} /> Bandeja del director</span>
            <div className={styles.heroNumber}>
              <span className={styles.heroCount}>{totales.acciones}</span>
              <span className={styles.heroCountLabel}>{totales.acciones === 1 ? 'decisión pendiente' : 'decisiones pendientes'}</span>
            </div>
          </div>
          <div className={styles.heroStats}>
            {totales.dineroEnJuego > 0 && (
              <div className={styles.heroStat}>
                <span className={styles.heroStatLabel}>Dinero en juego</span>
                <span className={`${styles.heroStatValue} ${styles.dangerText}`}>{fmtEuro(totales.dineroEnJuego)}</span>
              </div>
            )}
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Alumnos afectados</span>
              <span className={styles.heroStatValue}>{totales.alumnosAfectados}</span>
            </div>
            {accesos.count > 0 && (
              <div className={styles.heroStat}>
                <span className={styles.heroStatLabel}>Expiran &lt;14d</span>
                <span className={`${styles.heroStatValue} ${styles.amberText}`}>{accesos.count}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN: DINERO ═══ */}
      {dinero.count > 0 && (
        <Dossier id="dinero" title="Dinero" sub="Pagos e ingresos" icon={Euro} color="var(--danger)"
          count={dinero.count} open={abiertas.has('dinero')} onToggle={() => toggle('dinero')}>
          {dinero.vencidos.map(a => {
            const precio = spMap[a.id]?.monthly_price ?? a.extended?.monthly_price ?? 0
            return (
              <div key={`v-${a.id}`} className={styles.item}>
                <div className={styles.itemAvatar} style={{ ['--avatar-color' as string]: hashColor(a.id) }}>{initial(a.username)}</div>
                <div className={styles.itemBody}>
                  <span className={styles.itemTitle}>{a.username}</span>
                  <span className={styles.itemSub}>Pago vencido este mes</span>
                </div>
                <span className={`${styles.itemBadge} ${styles.badgeDanger}`}>{fmtEuro(precio)}</span>
                <button className={`${styles.itemCta} ${styles.ctaDanger}`} onClick={() => setAccion({ tipo: 'marcarPago', alumnoId: a.id, username: a.username, monto: precio })}>
                  <DollarSign size={12} /><span className={styles.ctaLabel}>Resolver</span>
                </button>
              </div>
            )
          })}
          {dinero.sinPrecio.map(a => (
            <div key={`sp-${a.id}`} className={styles.item}>
              <div className={styles.itemAvatar} style={{ ['--avatar-color' as string]: hashColor(a.id) }}>{initial(a.username)}</div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>{a.username}</span>
                <span className={styles.itemSub}>Sin precio mensual asignado</span>
              </div>
              <span className={`${styles.itemBadge} ${styles.badgeAmber}`}>Sin precio</span>
              <button className={styles.itemCta} onClick={() => setAccion({ tipo: 'asignarPrecio', alumnoId: a.id, username: a.username })}>
                <Euro size={12} /><span className={styles.ctaLabel}>Asignar</span>
              </button>
            </div>
          ))}
        </Dossier>
      )}

      {/* ═══ SECCIÓN: ACCESOS ═══ */}
      {accesos.count > 0 && (
        <Dossier id="accesos" title="Accesos" sub="Renovaciones próximas" icon={Clock} color="var(--amber)"
          count={accesos.count} open={abiertas.has('accesos')} onToggle={() => toggle('accesos')}>
          {accesos.expirar.map(a => (
            <div key={a.id} className={styles.item}>
              <div className={styles.itemAvatar} style={{ ['--avatar-color' as string]: hashColor(a.id) }}>{initial(a.username)}</div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>{a.username}</span>
                <span className={styles.itemSub} style={{ color: a.subjectColor }}>{a.subjectName}</span>
              </div>
              <span className={`${styles.itemBadge} ${styles.badgeAmber}`}>Expira en {a.diasRestantes}d</span>
              <button className={styles.itemCta} onClick={() => setAccion({ tipo: 'renovarAcceso', alumnoId: a.id, username: a.username, diasRestantes: a.diasRestantes })}>
                <RefreshCw size={12} /><span className={styles.ctaLabel}>Renovar</span>
              </button>
            </div>
          ))}
        </Dossier>
      )}

      {/* ═══ SECCIÓN: DATOS INCOMPLETOS ═══ */}
      {datos.count > 0 && (
        <Dossier id="datos" title="Datos incompletos" sub="Alumnos sin vía de contacto" icon={FileText} color="#0891B2"
          count={datos.count} open={abiertas.has('datos')} onToggle={() => toggle('datos')}>
          {datos.faltan.map(a => (
            <div key={a.id} className={styles.item}>
              <div className={styles.itemAvatar} style={{ ['--avatar-color' as string]: hashColor(a.id) }}>{initial(a.username)}</div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>{a.username}</span>
                <span className={styles.itemSub}>
                  Falta {a.faltaEmail && a.faltaPhone ? 'email y teléfono' : a.faltaEmail ? 'email' : 'teléfono'}
                </span>
              </div>
              <span className={`${styles.itemBadge} ${styles.badgeInk}`}>
                {a.faltaEmail && <Mail size={10} style={{ display: 'inline', marginRight: 3 }} />}
                {a.faltaPhone && <Phone size={10} style={{ display: 'inline' }} />}
              </span>
              <button className={styles.itemCta} onClick={() => setAccion({ tipo: 'completarDatos', alumnoId: a.id, username: a.username, faltaEmail: a.faltaEmail, faltaPhone: a.faltaPhone })}>
                <UserCheck size={12} /><span className={styles.ctaLabel}>Completar</span>
              </button>
            </div>
          ))}
        </Dossier>
      )}

      {/* ═══ SECCIÓN: COMUNICACIÓN ═══ */}
      {comunicacion.count > 0 && (
        <Dossier id="comunicacion" title="Comunicación" sub="Respuestas y hilos del foro" icon={MessagesSquare} color="#7C3AED"
          count={comunicacion.count} open={abiertas.has('comunicacion')} onToggle={() => toggle('comunicacion')}>
          {comunicacion.replies.map(r => (
            <div key={`r-${r.id}`} className={styles.item}>
              <div className={styles.itemAvatar} style={{ ['--avatar-color' as string]: hashColor(r.to_id) }}>{initial(r.to_username)}</div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>{r.to_username} respondió</span>
                <span className={styles.itemSub}>“{r.reply_body.slice(0, 60)}{r.reply_body.length > 60 ? '…' : ''}”</span>
              </div>
              <span className={`${styles.itemBadge} ${styles.badgeAccent}`}>{relativeFecha(r.reply_at)}</span>
              <button className={styles.itemCta} onClick={() => setAccion({ tipo: 'verReply', reply: r })}>
                <MessageCircle size={12} /><span className={styles.ctaLabel}>Ver</span>
              </button>
            </div>
          ))}
          {comunicacion.hilos.map(h => (
            <div key={`h-${h.id}`} className={styles.item}>
              <div className={styles.itemIconBadge} style={{ ['--dossier-color' as string]: '#7C3AED' }}><MessageCircle size={15} /></div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>Foro: “{h.title}”</span>
                <span className={styles.itemSub}>de {h.author_name} · {h.diasSinRespuesta}d sin respuesta</span>
              </div>
              <span className={`${styles.itemBadge} ${styles.badgeAmber}`}>Sin staff</span>
              <button className={styles.itemCta} onClick={() => setAccion({ tipo: 'responderHilo', hilo: h })}>
                <ArrowRight size={12} /><span className={styles.ctaLabel}>Abrir</span>
              </button>
            </div>
          ))}
        </Dossier>
      )}

      {/* ═══ SECCIÓN: RIESGO ACADÉMICO ═══ */}
      {riesgo.count > 0 && (
        <Dossier id="riesgo" title="Riesgo académico" sub="Alumnos con examen cerca y profesores inactivos" icon={Target} color="#DC2626"
          count={riesgo.count} open={abiertas.has('riesgo')} onToggle={() => toggle('riesgo')}>
          {riesgo.alumnos.map(a => (
            <div key={`ra-${a.id}`} className={styles.item}>
              <div className={styles.itemAvatar} style={{ ['--avatar-color' as string]: hashColor(a.id) }}>{initial(a.username)}</div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>{a.username}</span>
                <span className={styles.itemSub}>
                  {a.diasInactivo}d inactivo · examen en <strong>{a.diasExamen}d</strong>
                </span>
              </div>
              <span className={`${styles.itemBadge} ${styles.badgeDanger}`}>Urgente</span>
              <button className={styles.itemCta} onClick={() => setAccion({ tipo: 'recordatorioAlumno', alumnoId: a.id, username: a.username, examDate: a.examDate, diasInactivo: a.diasInactivo })}>
                <Send size={12} /><span className={styles.ctaLabel}>Avisar</span>
              </button>
            </div>
          ))}
          {riesgo.profesores.map(p => (
            <div key={`pp-${p.id}`} className={styles.item}>
              <div className={styles.itemIconBadge} style={{ ['--dossier-color' as string]: '#DC2626' }}><GraduationCap size={15} /></div>
              <div className={styles.itemBody}>
                <span className={styles.itemTitle}>{p.username}</span>
                <span className={styles.itemSub}>Sin avisos en más de 7 días</span>
              </div>
              <span className={`${styles.itemBadge} ${styles.badgeAmber}`}>Inactivo</span>
              <button className={styles.itemCta} onClick={() => setAccion({ tipo: 'recordatorioProfesor', profesorId: p.id, username: p.username })}>
                <Send size={12} /><span className={styles.ctaLabel}>Contactar</span>
              </button>
            </div>
          ))}
        </Dossier>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <span>Actualizado {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        <button className={styles.refreshBtn} onClick={reload}>
          <RefreshCw size={11} /> Refrescar
        </button>
      </div>

      {/* Modales */}
      {accion && createPortal(
        <AccionModal
          accion={accion}
          currentUser={currentUser}
          onClose={() => setAccion(null)}
          onResolved={(key) => { if (key) marcarResuelto(key); setAccion(null) }}
          onMarcarReplyVista={marcarReplyVista}
          onDescartarHilo={descartarHilo}
          updateStudentProfile={updateStudentProfile}
          reloadProfiles={reloadProfiles}
        />,
        document.body
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DOSSIER (sección colapsable)
// ═══════════════════════════════════════════════════════════════════════════

function Dossier({ id, title, sub, icon: Icon, color, count, open, onToggle, children }: {
  id: string; title: string; sub: string; icon: React.ElementType; color: string
  count: number; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className={styles.dossier} style={{ ['--dossier-color' as string]: color }}>
      <button className={styles.dossierHead} onClick={onToggle} aria-expanded={open} aria-controls={`dossier-${id}`}>
        <div className={styles.dossierHeadIcon}><Icon size={16} strokeWidth={2} /></div>
        <div className={styles.dossierHeadText}>
          <span className={styles.dossierTitle}>{title}</span>
          <span className={styles.dossierSub}>{sub}</span>
        </div>
        <span className={styles.dossierCount}>{count}</span>
        <ChevronDown size={16} className={styles.dossierChevron} />
      </button>
      {open && (
        <div id={`dossier-${id}`} className={styles.dossierBody}>
          {children}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════════════════

function AccionModal({ accion, currentUser, onClose, onResolved, onMarcarReplyVista, onDescartarHilo, updateStudentProfile, reloadProfiles }: {
  accion:               AccionActiva
  currentUser:          CurrentUser | null
  onClose:              () => void
  onResolved:           (resolvedKey: string | null) => void
  onMarcarReplyVista:   (id: string) => void
  onDescartarHilo:      (id: string) => void
  updateStudentProfile: (userId: string, fields: Record<string, any>) => Promise<boolean>
  reloadProfiles:       () => Promise<void> | void
}) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // Estado específico de cada modal
  const [precio,     setPrecio]     = useState('')
  const [meses,      setMeses]      = useState<number>(3)
  const [notas,      setNotas]      = useState('')
  const [emailIn,    setEmailIn]    = useState('')
  const [phoneIn,    setPhoneIn]    = useState('')
  const [replyText,  setReplyText]  = useState('')
  const [mensaje,    setMensaje]    = useState('')

  // Prerellenar plantilla para recordatorios (una sola vez al abrir el modal)
  useEffect(() => {
    if (accion.tipo === 'recordatorioAlumno') {
      setMensaje(`Hola ${accion.username}, he visto que llevas ${accion.diasInactivo ?? 'unos'} días sin estudiar${accion.examDate ? ` y tu examen es el ${new Date(accion.examDate).toLocaleDateString('es-ES')}` : ''}. ¿Todo bien? Si necesitas ayuda o ajustar tu plan, dímelo.`)
    } else if (accion.tipo === 'recordatorioProfesor') {
      setMensaje(`Hola ${accion.username}, hace más de una semana que no publicas avisos en la academia. ¿Hay algo que necesites para poder hacerlo?`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Lógica de cada submit ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!currentUser?.academy_id) return
    setSaving(true); setError(null)

    try {
      switch (accion.tipo) {
        case 'marcarPago': {
          const now      = new Date()
          const month    = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

          // UPSERT en academy_payments sobre la constraint única (academy_id, alumno_id, month)
          const { error: payErr } = await supabase.from('academy_payments').upsert({
            academy_id: currentUser.academy_id,
            alumno_id:  accion.alumnoId,
            amount:     accion.monto,
            month,
            status:     'paid',
            paid_at:    new Date().toISOString(),
            notes:      notas || null,
          }, { onConflict: 'academy_id,alumno_id,month' })
          if (payErr) { setError(`Error registrando pago: ${payErr.message}`); setSaving(false); return }

          // Sincronizar payment_status en student_profiles vía upsert del parent
          const ok = await updateStudentProfile(accion.alumnoId, { payment_status: 'paid' })
          if (!ok) { setError('Pago registrado, pero no se actualizó el estado del alumno'); setSaving(false); return }

          // Avisar a Finanzas, Facturación y resto de paneles
          emit('director-data-changed')
          onResolved(`vencido-${accion.alumnoId}`)
          break
        }

        case 'asignarPrecio': {
          const n = parseFloat(precio.replace(',', '.'))
          if (isNaN(n) || n <= 0) { setError('Precio inválido'); setSaving(false); return }

          const ok = await updateStudentProfile(accion.alumnoId, { monthly_price: n })
          if (!ok) { setError('No se pudo guardar el precio. Revisa permisos o vuelve a intentarlo.'); setSaving(false); return }

          emit('director-data-changed')
          onResolved(`sinPrecio-${accion.alumnoId}`)
          break
        }

        case 'renovarAcceso': {
          // Leer el access_until actual de profiles, sumar meses, escribir
          const { data: current, error: readErr } = await supabase
            .from('profiles').select('access_until').eq('id', accion.alumnoId).maybeSingle()
          if (readErr) { setError(`No se pudo leer el acceso actual: ${readErr.message}`); setSaving(false); return }

          const base = (current as {access_until:string|null} | null)?.access_until
            ? new Date(Math.max(new Date((current as {access_until:string}).access_until).getTime(), Date.now()))
            : new Date()
          base.setMonth(base.getMonth() + meses)

          const { error: updErr } = await supabase.from('profiles')
            .update({ access_until: base.toISOString() })
            .eq('id', accion.alumnoId)
          if (updErr) { setError(`No se pudo renovar: ${updErr.message}`); setSaving(false); return }

          // Recargar perfiles para que la tabla "Vencimientos" y el resto del panel vean la nueva fecha
          await reloadProfiles()
          emit('director-data-changed')
          onResolved(`expirar-${accion.alumnoId}`)
          break
        }

        case 'completarDatos': {
          const patch: Record<string, any> = {}
          if (accion.faltaEmail && emailIn.trim()) patch.email_contact = emailIn.trim()
          if (accion.faltaPhone && phoneIn.trim()) patch.phone         = phoneIn.trim()
          if (Object.keys(patch).length === 0) { setError('Rellena al menos un campo'); setSaving(false); return }

          const ok = await updateStudentProfile(accion.alumnoId, patch)
          if (!ok) { setError('No se pudieron guardar los datos. Revisa permisos o inténtalo de nuevo.'); setSaving(false); return }

          onResolved(`datos-${accion.alumnoId}`)
          break
        }

        case 'verReply': {
          if (replyText.trim()) {
            // Enviar un NUEVO mensaje del director (no sobreescribir reply_body del alumno)
            const { error: insErr } = await supabase.from('direct_messages').insert({
              from_id:    currentUser.id,
              to_id:      accion.reply.to_id,
              academy_id: currentUser.academy_id,
              subject_id: accion.reply.subject_id,
              body:       replyText.trim(),
            })
            if (insErr) { setError(`No se pudo enviar: ${insErr.message}`); setSaving(false); return }
          }
          onMarcarReplyVista(accion.reply.id)
          onResolved(null) // ya lo quita el hook de acciones
          break
        }

        case 'responderHilo': {
          if (!replyText.trim()) { setError('Escribe una respuesta'); setSaving(false); return }
          const { error: insErr } = await supabase.from('forum_replies').insert({
            thread_id:   accion.hilo.id,
            academy_id:  currentUser.academy_id,
            author_id:   currentUser.id,
            body:        replyText.trim(),
            is_solution: false,
          })
          if (insErr) { setError(`No se pudo publicar: ${insErr.message}`); setSaving(false); return }
          onDescartarHilo(accion.hilo.id)
          onResolved(null)
          break
        }

        case 'recordatorioAlumno':
        case 'recordatorioProfesor': {
          if (!mensaje.trim()) { setError('Escribe un mensaje'); setSaving(false); return }
          const destinatario = accion.tipo === 'recordatorioAlumno' ? accion.alumnoId : accion.profesorId
          const { error: insErr } = await supabase.from('direct_messages').insert({
            from_id:    currentUser.id,
            to_id:      destinatario,
            academy_id: currentUser.academy_id,
            subject_id: currentUser.subject_id ?? null,
            body:       mensaje.trim(),
          })
          if (insErr) { setError(`No se pudo enviar: ${insErr.message}`); setSaving(false); return }

          const key = accion.tipo === 'recordatorioAlumno'
            ? `riesgoAlumno-${accion.alumnoId}`
            : `riesgoProf-${accion.profesorId}`
          onResolved(key)
          break
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Handler secundario solo para el modal de asignarPrecio:
  // deja el precio a null para que el alumno vuelva a aparecer en "Sin precio".
  const handleQuitarPrecio = async () => {
    if (accion.tipo !== 'asignarPrecio' || !currentUser?.academy_id) return
    setSaving(true); setError(null)
    try {
      const ok = await updateStudentProfile(accion.alumnoId, { monthly_price: null })
      if (!ok) { setError('No se pudo quitar el precio. Revisa permisos o vuelve a intentarlo.'); setSaving(false); return }
      emit('director-data-changed')
      // No marcamos como resuelto — queremos que vuelva a aparecer en Sin precio
      onResolved(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al quitar precio')
    } finally {
      setSaving(false)
    }
  }

  // ── Meta del modal ───────────────────────────────────────────────────
  const meta = (() => {
    switch (accion.tipo) {
      case 'marcarPago':           return { title: 'Registrar pago',        sub: accion.username, icon: DollarSign,     color: 'var(--accent)' }
      case 'asignarPrecio':        return { title: 'Asignar precio mensual',sub: accion.username, icon: Euro,           color: 'var(--ink)'    }
      case 'renovarAcceso':        return { title: 'Renovar acceso',        sub: accion.username, icon: RefreshCw,      color: 'var(--amber)'  }
      case 'completarDatos':       return { title: 'Completar datos',       sub: accion.username, icon: UserCheck,      color: '#0891B2'       }
      case 'verReply':             return { title: `Respuesta de ${accion.reply.to_username}`, sub: 'Revisar conversación', icon: MessageCircle, color: 'var(--accent)' }
      case 'responderHilo':        return { title: 'Responder al hilo',     sub: accion.hilo.title, icon: MessageCircle, color: '#7C3AED'       }
      case 'recordatorioAlumno':   return { title: 'Enviar mensaje al alumno', sub: accion.username, icon: Send,        color: 'var(--danger)' }
      case 'recordatorioProfesor': return { title: 'Contactar al profesor',  sub: accion.username, icon: Send,           color: 'var(--amber)'  }
    }
  })()

  const Icon = meta.icon

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ ['--modal-color' as string]: meta.color }}>
        <div className={styles.modalHead}>
          <div className={styles.modalIcon}><Icon size={18} strokeWidth={2} /></div>
          <div className={styles.modalTitles}>
            <div className={styles.modalTitle}>{meta.title}</div>
            <div className={styles.modalSub}>{meta.sub}</div>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
        </div>

        <div className={styles.modalBody}>
          {/* ── Cuerpos específicos ── */}
          {accion.tipo === 'marcarPago' && (
            <>
              <div className={styles.modalContext}>
                Vas a marcar el pago de <strong>{accion.username}</strong> del mes en curso como <strong>pagado</strong> por <strong>{fmtEuro(accion.monto)}</strong>.
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Nota interna (opcional)</label>
                <input className={styles.modalInput} type="text" placeholder="Ej: Transferencia 15/04" value={notas} onChange={e => setNotas(e.target.value)} />
              </div>
            </>
          )}

          {accion.tipo === 'asignarPrecio' && (
            <>
              <div className={styles.modalContext}>
                <strong>{accion.username}</strong> no tiene un precio mensual asignado, por lo que no aparece en los cobros ni en el MRR.
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Precio mensual (€)</label>
                <input className={styles.modalInput} type="number" min="0" step="0.01" placeholder="Ej: 89" value={precio} onChange={e => setPrecio(e.target.value)} autoFocus />
              </div>
            </>
          )}

          {accion.tipo === 'renovarAcceso' && (
            <>
              <div className={styles.modalContext}>
                El acceso de <strong>{accion.username}</strong> expira en <strong>{accion.diasRestantes} días</strong>. Elige cuántos meses quieres renovar.
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Meses de renovación</label>
                <div className={styles.optionGrid}>
                  {[1, 3, 6, 12].map(m => (
                    <button key={m} type="button"
                      className={`${styles.option} ${meses === m ? styles.optionActive : ''}`}
                      onClick={() => setMeses(m)}>
                      +{m} {m === 1 ? 'mes' : 'meses'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {accion.tipo === 'completarDatos' && (
            <>
              <div className={styles.modalContext}>
                Completa los datos de contacto de <strong>{accion.username}</strong>. Sin estos datos no podrás escribirle directamente si hay un problema.
              </div>
              {accion.faltaEmail && (
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Email de contacto</label>
                  <input className={styles.modalInput} type="email" placeholder="alumno@ejemplo.com" value={emailIn} onChange={e => setEmailIn(e.target.value)} autoFocus />
                </div>
              )}
              {accion.faltaPhone && (
                <div className={styles.modalField}>
                  <label className={styles.modalLabel}>Teléfono</label>
                  <input className={styles.modalInput} type="tel" placeholder="+34 ..." value={phoneIn} onChange={e => setPhoneIn(e.target.value)} />
                </div>
              )}
            </>
          )}

          {accion.tipo === 'verReply' && (
            <>
              <div className={`${styles.bubble} ${styles.bubbleMe}`}>
                <span className={styles.bubbleLabel}>Tú escribiste</span>
                {accion.reply.body}
              </div>
              <div className={`${styles.bubble} ${styles.bubbleOther}`}>
                <span className={styles.bubbleLabel}>{accion.reply.to_username} respondió · {fmtFecha(accion.reply.reply_at)}</span>
                {accion.reply.reply_body}
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Responder (opcional)</label>
                <textarea className={styles.modalTextarea} placeholder="Escribe una respuesta..." value={replyText} onChange={e => setReplyText(e.target.value)} />
              </div>
            </>
          )}

          {accion.tipo === 'responderHilo' && (
            <>
              <div className={`${styles.bubble} ${styles.bubbleOther}`}>
                <span className={styles.bubbleLabel}>{accion.hilo.author_name} preguntó · {fmtFecha(accion.hilo.created_at)}</span>
                <strong style={{ display: 'block', marginBottom: '0.3rem' }}>{accion.hilo.title}</strong>
                {accion.hilo.body}
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Tu respuesta</label>
                <textarea className={styles.modalTextarea} placeholder="Escribe una respuesta útil..." value={replyText} onChange={e => setReplyText(e.target.value)} autoFocus />
              </div>
            </>
          )}

          {(accion.tipo === 'recordatorioAlumno' || accion.tipo === 'recordatorioProfesor') && (
            <>
              <div className={styles.modalContext}>
                {accion.tipo === 'recordatorioAlumno'
                  ? <>Envía un mensaje directo a <strong>{accion.username}</strong>. Hemos prerellenado una plantilla; edítala a tu gusto.</>
                  : <>Envía un mensaje directo a <strong>{accion.username}</strong> para recordarle que mantenga la actividad con sus alumnos.</>}
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Mensaje</label>
                <textarea className={styles.modalTextarea} value={mensaje} onChange={e => setMensaje(e.target.value)} />
              </div>
            </>
          )}

          {error && (
            <div className={styles.modalContext} style={{ color: 'var(--danger)', background: 'var(--danger-lt)', borderColor: 'var(--danger-dim)' }}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.modalFoot}>
          <button className={styles.btnSecondary} onClick={onClose} disabled={saving}>Cancelar</button>
          {accion.tipo === 'asignarPrecio' && (
            <button className={styles.btnDanger} onClick={handleQuitarPrecio} disabled={saving} style={{ marginRight: 'auto' }}>
              <X size={13} /> Quitar precio
            </button>
          )}
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando…' : (
              accion.tipo === 'verReply' && !replyText.trim() ? <><CheckCircle2 size={13}/> Marcar como vista</> :
              accion.tipo === 'marcarPago' ? <><CheckCircle2 size={13}/> Marcar pagado</> :
              accion.tipo === 'responderHilo' ? <><Send size={13}/> Publicar respuesta</> :
              (accion.tipo === 'recordatorioAlumno' || accion.tipo === 'recordatorioProfesor') ? <><Send size={13}/> Enviar</> :
              <>Guardar</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
