import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, GraduationCap, Building2, BookOpen,
  BarChart2, Zap, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp, Calendar, Clock, TrendingUp,
  Mail, Trash2, Lock, Eye, EyeOff, PauseCircle, PlayCircle,
  Edit3, Check, X, Shield, Phone, MapPin, Target, Euro, User
} from 'lucide-react'
import styles from './AcademiaDetalle.module.css'

const EDGE_USUARIO = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gestionar-usuario`

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function scoreColor(s: number | null | undefined): string {
  if (s == null) return '#6B7280'
  if (s >= 80) return '#22C55E'
  if (s >= 60) return '#0EA5E9'
  if (s >= 40) return '#F59E0B'
  return '#EF4444'
}

// ── Count-up ───────────────────────────────────────────────────────────────
function useCountUp(target: number | null, duration = 900) {
  const [val, setVal] = useState<number>(0)
  useEffect(() => {
    if (target == null || isNaN(Number(target))) return
    const n = Number(target)
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * n))
      if (p < 1) requestAnimationFrame(step); else setVal(target)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

// ── KPI card ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, sub, dark, delay = 0 }: {
  icon: React.ElementType; label: string; value: number | string | null | undefined; color: string; sub?: string; dark?: boolean; delay?: number
}) {
  const n    = useCountUp(typeof value === 'number' ? value : 0, 800)
  const disp = typeof value === 'number' ? n : (value ?? '—')
  return (
    <motion.div className={[styles.kpi, dark ? styles.kpiDark : ''].join(' ')} style={{ ['--c' as string]: color }}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: 'spring', damping: 22 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}>
      {dark && <div className={styles.kpiOrb} />}
      <div className={styles.kpiGlow} />
      <div className={styles.kpiTop}>
        <div className={styles.kpiIconWrap} style={{ background: color + '18', border: `1px solid ${color}30` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className={styles.kpiVal} style={{ color: 'var(--ink)' }}>{disp}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </motion.div>
  )
}

// ── Modal base ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className={styles.modal} initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button onClick={onClose} className={styles.modalClose}><X size={15} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

// ── Edge function ──────────────────────────────────────────────────────────
async function callGestionarUsuario(action: string, userId: string, params: Record<string, any> = {}): Promise<{ ok?: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Sin sesión activa' }
    const res = await fetch(EDGE_USUARIO, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ action, user_id: userId, ...params }),
    })
    let data: any = {}
    try { data = await res.json() } catch (_) {}
    if (!res.ok) return { error: data.error || `Error ${res.status}` }
    return { ok: true }
  } catch (e: any) {
    return { error: `Error de red: ${e.message}` }
  }
}

// ── UsuarioRow ─────────────────────────────────────────────────────────────
interface Profile {
  id:           string
  username:     string
  role:         string
  subject_id:   string | null
  created_at:   string | null
  access_until: string | null
  banned?:      boolean
}
interface Sesion { id: string; user_id: string; subject_id: string | null; score: number; played_at: string }

function UsuarioRow({ user, sesiones, emails, extended, expanded, onToggle, onReload }: {
  user:      Profile
  sesiones:  Sesion[]
  emails:    Record<string, string>
  extended:  Record<string, any> | null
  expanded:  boolean
  onToggle:  () => void
  onReload:  () => void
}) {
  const isAlumno     = user.role === 'alumno'
  const userSessions = isAlumno ? sesiones.filter(s => s.user_id === user.id) : []
  const notaMedia    = userSessions.length ? Math.round(userSessions.reduce((a, s) => a + s.score, 0) / userSessions.length) : null
  const ultima       = userSessions[0]?.played_at
  const diasInactivo = ultima ? Math.floor((new Date().getTime() - new Date(ultima).getTime()) / 86400000) : null
  const accessUntil  = user.access_until ? new Date(user.access_until) : null
  const expirado     = isAlumno && !!accessUntil && accessUntil < new Date()
  const expiraEn     = accessUntil ? Math.ceil((accessUntil.getTime() - new Date().getTime()) / 86400000) : null
  const email        = emails[user.id] ?? null

  const [modal,        setModal]        = useState<string | null>(null)
  const [newPassword,  setNewPassword]  = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [showPw,       setShowPw]       = useState(false)
  const [newEmail,     setNewEmail]     = useState(email ?? '')
  const [loading,      setLoading]      = useState(false)
  const [actionErr,    setActionErr]    = useState('')
  const [banned,       setBanned]       = useState(user.banned ?? false)

  const closeModal = () => { setModal(null); setActionErr(''); setNewPassword(''); setNewPassword2('') }

  const run = async (action: string, params: Record<string, any> = {}) => {
    setActionErr(''); setLoading(true)
    const res = await callGestionarUsuario(action, user.id, params)
    setLoading(false)
    if (res.error) { setActionErr(res.error); return false }
    return true
  }

  const handleEliminar  = async () => { const ok = await run('eliminar');    if (ok) { closeModal(); onReload() } }
  const handleToggleBan = async () => { const ok = await run(banned ? 'reactivar' : 'desactivar'); if (ok) setBanned(v => !v) }
  const handlePassword  = async () => {
    if (newPassword.length < 6)       { setActionErr('Mínimo 6 caracteres'); return }
    if (newPassword !== newPassword2) { setActionErr('Las contraseñas no coinciden'); return }
    const ok = await run('cambiar_password', { password: newPassword }); if (ok) closeModal()
  }
  const handleEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { setActionErr('Email no válido'); return }
    const ok = await run('editar_email', { email: newEmail.trim() }); if (ok) { closeModal(); onReload() }
  }

  return (
    <>
      <AnimatePresence>
        {modal === 'confirmar_eliminar' && (
          <Modal key="del" title="¿Eliminar usuario?" onClose={closeModal}>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>Se borrará <strong>{user.username}</strong> de forma permanente.</p>
              {actionErr && <div className={styles.modalErr}><AlertTriangle size={13} />{actionErr}</div>}
              <div className={styles.modalActions}>
                <button className={styles.modalBtnCancel} onClick={closeModal}>Cancelar</button>
                <button className={styles.modalBtnDanger} onClick={handleEliminar} disabled={loading}>
                  {loading ? <RefreshCw size={13} className={styles.spinnerInline} /> : <Trash2 size={13} />} Eliminar
                </button>
              </div>
            </div>
          </Modal>
        )}
        {modal === 'password' && (
          <Modal key="pw" title={`Cambiar contraseña — ${user.username}`} onClose={closeModal}>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Nueva contraseña</label>
                <div className={styles.pwWrap}>
                  <input type={showPw ? 'text' : 'password'} value={newPassword} onChange={e => { setNewPassword(e.target.value); setActionErr('') }} placeholder="Mínimo 6 caracteres" autoFocus className={styles.modalInput} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className={styles.pwEye}>{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Repite la contraseña</label>
                <input type={showPw ? 'text' : 'password'} value={newPassword2} onChange={e => { setNewPassword2(e.target.value); setActionErr('') }} placeholder="Repite la contraseña" className={styles.modalInput} />
              </div>
              {newPassword && newPassword2 && (
                <div className={styles.pwMatch} style={{ color: newPassword === newPassword2 ? '#22C55E' : '#EF4444' }}>
                  {newPassword === newPassword2 ? <><Check size={12} /> Coinciden</> : <><X size={12} /> No coinciden</>}
                </div>
              )}
              {actionErr && <div className={styles.modalErr}><AlertTriangle size={13} />{actionErr}</div>}
              <div className={styles.modalActions}>
                <button className={styles.modalBtnCancel} onClick={closeModal}>Cancelar</button>
                <button className={styles.modalBtnPrimary} onClick={handlePassword} disabled={loading}>
                  {loading ? <RefreshCw size={13} className={styles.spinnerInline} /> : <Check size={13} />} Guardar
                </button>
              </div>
            </div>
          </Modal>
        )}
        {modal === 'email' && (
          <Modal key="em" title={`Editar email — ${user.username}`} onClose={closeModal}>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Email real</label>
                <input type="email" value={newEmail} onChange={e => { setNewEmail(e.target.value); setActionErr('') }} placeholder="nuevo@email.com" autoFocus className={styles.modalInput} />
              </div>
              {actionErr && <div className={styles.modalErr}><AlertTriangle size={13} />{actionErr}</div>}
              <div className={styles.modalActions}>
                <button className={styles.modalBtnCancel} onClick={closeModal}>Cancelar</button>
                <button className={styles.modalBtnPrimary} onClick={handleEmail} disabled={loading}>
                  {loading ? <RefreshCw size={13} className={styles.spinnerInline} /> : <Check size={13} />} Guardar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <motion.div layout className={[
        styles.userCard2,
        expanded ? styles.userCard2Open : '',
        expirado ? styles.userCard2Expired : '',
        banned   ? styles.userCard2Banned  : '',
        isAlumno && (diasInactivo ?? 0) > 5 && !expirado ? styles.userCard2Risk : '',
      ].join(' ')}>
        <button className={styles.userCard2Header} onClick={onToggle}>
          <div className={styles.userCard2Left}>
            <div className={styles.userCard2Avatar} style={{ opacity: banned ? 0.5 : 1 }}>{user.username[0]!.toUpperCase()}</div>
            <div>
              <div className={styles.userCard2Name}>{user.username}</div>
              <div className={styles.userCard2Badges}>
                {banned && <span className={styles.chip} style={{ color:'#EF4444', background:'rgba(239,68,68,0.1)' }}>Desactivado</span>}
                {isAlumno && !banned && expirado && <span className={styles.chip} style={{ color:'#EF4444', background:'rgba(239,68,68,0.1)' }}>Acceso expirado</span>}
                {isAlumno && !banned && !expirado && (diasInactivo ?? 0) > 5 && <span className={styles.chip} style={{ color:'#F59E0B', background:'rgba(245,158,11,0.1)' }}>⚠ Inactivo {diasInactivo}d</span>}
                {isAlumno && !banned && !expirado && diasInactivo === 0 && <span className={styles.chip} style={{ color:'#22C55E', background:'rgba(34,197,94,0.1)' }}>Activo hoy</span>}
                {isAlumno && !banned && !expirado && expiraEn !== null && expiraEn <= 14 && expiraEn > 0 && <span className={styles.chip} style={{ color:'#F59E0B', background:'rgba(245,158,11,0.1)' }}>Expira en {expiraEn}d</span>}
                {!isAlumno && email && <span className={styles.userCard2Email}>{email}</span>}
              </div>
            </div>
          </div>
          <div className={styles.userCard2Right}>
            {isAlumno && notaMedia !== null && <span className={styles.userCard2Score} style={{ color: scoreColor(notaMedia) }}>{notaMedia}%</span>}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div key="detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: 'hidden' }}>
              <div className={styles.userCard2Body}>
                <div className={styles.userCard2Stats}>
                  {isAlumno && <>
                    <div className={styles.userCard2Stat}><Zap size={12} /><span>{userSessions.length} sesiones</span></div>
                    <div className={styles.userCard2Stat}><BarChart2 size={12} /><span>Nota: {notaMedia !== null ? `${notaMedia}%` : '—'}</span></div>
                    <div className={styles.userCard2Stat}><Clock size={12} /><span>{diasInactivo === null ? 'Sin actividad' : diasInactivo === 0 ? 'Activo hoy' : `Hace ${diasInactivo}d`}</span></div>
                    <div className={styles.userCard2Stat}><Shield size={12} /><span>Hasta: {formatFecha(user.access_until)}</span></div>
                    <div className={styles.userCard2Stat}><Calendar size={12} /><span>Alta: {formatFecha(user.created_at)}</span></div>
                    {email && <div className={styles.userCard2Stat}><Mail size={12} /><a href={`mailto:${email}`} style={{ color:'var(--ink-muted)', textDecoration:'none' }} onClick={e => e.stopPropagation()}>{email}</a></div>}
                  </>}

                  {isAlumno && extended && (
                    <div className={styles.extendedBlock}>
                      <div className={styles.extendedTitle}>Perfil extendido</div>
                      {extended.full_name     && <div className={styles.userCard2Stat}><User    size={12} /><span>{String(extended.full_name)}</span></div>}
                      {extended.phone         && <div className={styles.userCard2Stat}><Phone   size={12} /><span>{String(extended.phone)}</span></div>}
                      {extended.email_contact && <div className={styles.userCard2Stat}><Mail    size={12} /><span>{String(extended.email_contact)}</span>{email && extended.email_contact !== email && <span className={styles.emailDiff} title="Diferente al email del sistema">≠ sistema</span>}</div>}
                      {extended.city          && <div className={styles.userCard2Stat}><MapPin  size={12} /><span>{String(extended.city)}</span></div>}
                      {extended.exam_date     && <div className={styles.userCard2Stat}><Target  size={12} /><span>Examen: {new Date(String(extended.exam_date) + 'T12:00:00').toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}</span></div>}
                      {extended.monthly_price && <div className={styles.userCard2Stat}><Euro    size={12} /><span style={{ fontWeight:700, color:'#059669' }}>{String(extended.monthly_price)} €/mes</span></div>}
                      {extended.mascota       && <div className={styles.userCard2Stat}><span>Mascota: {String(extended.mascota)}</span></div>}
                    </div>
                  )}

                  {!isAlumno && extended && (extended.full_name || extended.phone || extended.email_contact) && (
                    <div className={styles.extendedBlock}>
                      <div className={styles.extendedTitle}>Perfil extendido</div>
                      {extended.full_name     && <div className={styles.userCard2Stat}><User     size={12} /><span>{String(extended.full_name)}</span></div>}
                      {extended.phone         && <div className={styles.userCard2Stat}><Phone    size={12} /><span>{String(extended.phone)}</span></div>}
                      {extended.email_contact && <div className={styles.userCard2Stat}><Mail     size={12} /><span>{String(extended.email_contact)}</span>{email && extended.email_contact !== email && <span className={styles.emailDiff} title="Diferente al email del sistema">≠ sistema</span>}</div>}
                      {extended.bio           && <div className={styles.userCard2Stat} style={{ alignItems:'flex-start' }}><BookOpen size={12} style={{ marginTop:2 }} /><span style={{ fontStyle:'italic' }}>{String(extended.bio)}</span></div>}
                    </div>
                  )}

                  {!isAlumno && <>
                    <div className={styles.userCard2Stat}><Shield   size={12} /><span style={{ textTransform:'capitalize' }}>Rol: {user.role}</span></div>
                    <div className={styles.userCard2Stat}><Calendar size={12} /><span>Alta: {formatFecha(user.created_at)}</span></div>
                    {email
                      ? <div className={styles.userCard2Stat}><Mail size={12} /><a href={`mailto:${email}`} style={{ color:'var(--ink-muted)', textDecoration:'none' }} onClick={e => e.stopPropagation()}>{email}</a></div>
                      : <div className={styles.userCard2Stat} style={{ opacity:0.5 }}><Mail size={12} /><span>Sin email</span></div>
                    }
                  </>}
                </div>

                {isAlumno && userSessions.length > 0 && (
                  <div className={styles.miniChart}>
                    {userSessions.slice(0, 7).reverse().map((s, i) => (
                      <div key={i} className={styles.miniBar}>
                        <div className={styles.miniBarFill} style={{ height: `${s.score}%`, background: scoreColor(s.score) }} />
                        <span className={styles.miniBarLabel}>{s.score}%</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.userCard2Actions}>
                  <button className={styles.userCard2Btn} onClick={() => { setNewEmail(email ?? ''); setModal('email') }}><Mail size={12} /> Editar email</button>
                  <button className={styles.userCard2Btn} onClick={() => { setNewPassword(''); setNewPassword2(''); setModal('password') }}><Lock size={12} /> Cambiar contraseña</button>
                  <button className={[styles.userCard2Btn, banned ? styles.userCard2BtnActivar : styles.userCard2BtnWarn].join(' ')} onClick={handleToggleBan} disabled={loading}>
                    {loading ? <RefreshCw size={12} className={styles.spinnerInline} /> : banned ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                    {banned ? 'Reactivar' : 'Desactivar'}
                  </button>
                  <button className={[styles.userCard2Btn, styles.userCard2BtnDanger].join(' ')} onClick={() => setModal('confirmar_eliminar')}><Trash2 size={12} /> Eliminar</button>
                </div>

                {actionErr && !modal && <div className={styles.userCard2Err}><AlertTriangle size={13} />{actionErr}</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

// ── SubjectSection ─────────────────────────────────────────────────────────
interface Subject { id: string; name: string; color: string }

function SubjectSection({ subject, profiles, sesiones, emails, extendedProfiles, onReload }: {
  subject:          Subject
  profiles:         Profile[]
  sesiones:         Sesion[]
  emails:           Record<string, string>
  extendedProfiles: Record<string, any>
  onReload:         () => void
}) {
  const [open,         setOpen]         = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const profes   = profiles.filter(p => p.subject_id === subject.id && p.role === 'profesor')
  const alumnos  = profiles.filter(p => p.subject_id === subject.id && p.role === 'alumno')
  const subSess  = sesiones.filter(s => s.subject_id === subject.id)
  const notaMedia = subSess.length ? Math.round(subSess.reduce((a, s) => a + s.score, 0) / subSess.length) : null
  const sevenAgo  = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const activos   = new Set(subSess.filter(s => s.played_at >= sevenAgo).map(s => s.user_id)).size

  return (
    <div className={styles.subjectSection2} style={{ ['--sc' as string]: subject.color }}>
      <button className={styles.subjectHeader2} onClick={() => setOpen(v => !v)}>
        <div className={styles.subjectBar2} />
        <div className={styles.subjectInfo2}>
          <span className={styles.subjectName2}>{subject.name}</span>
          <div className={styles.subjectMeta2}>
            <span><GraduationCap size={11} /> {profes.length} prof.</span>
            <span><Users size={11} /> {alumnos.length} alumnos</span>
            <span><Zap size={11} style={{ color: '#D7FE03' }} /> {activos} activos</span>
            {notaMedia !== null && <span style={{ color: scoreColor(notaMedia) }}><BarChart2 size={11} /> {notaMedia}%</span>}
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} /></motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: 'hidden' }}>
            <div className={styles.subjectBody2}>
              {profes.length > 0 && (
                <div className={styles.roleGroup2}>
                  <div className={styles.roleGroupTitle2}><GraduationCap size={12} /> Profesores</div>
                  {profes.map(p => <UsuarioRow key={p.id} user={p} sesiones={sesiones} emails={emails} extended={extendedProfiles[p.id] ?? null} expanded={expandedUser === p.id} onReload={onReload} onToggle={() => setExpandedUser(v => v === p.id ? null : p.id)} />)}
                </div>
              )}
              {alumnos.length > 0 && (
                <div className={styles.roleGroup2}>
                  <div className={styles.roleGroupTitle2}><Users size={12} /> Alumnos ({alumnos.length})</div>
                  {alumnos.map(a => <UsuarioRow key={a.id} user={a} sesiones={sesiones} emails={emails} extended={extendedProfiles[a.id] ?? null} expanded={expandedUser === a.id} onReload={onReload} onToggle={() => setExpandedUser(v => v === a.id ? null : a.id)} />)}
                </div>
              )}
              {profes.length === 0 && alumnos.length === 0 && <p className={styles.empty2}>Sin usuarios en esta asignatura todavía</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export default function AcademiaDetalle({ academia, onBack }: { academia: any; onBack: () => void }) {
  const [profiles,         setProfiles]         = useState<Profile[]>([])
  const [sesiones,         setSesiones]         = useState<Sesion[]>([])
  const [emails,           setEmails]           = useState<Record<string, string>>({})
  const [extendedProfiles, setExtendedProfiles] = useState<Record<string, any>>({})
  const [loading,          setLoading]          = useState(true)
  const [expandedDir,      setExpandedDir]      = useState<string | null>(null)

  const load = async () => {
    if (!academia?.id) return
    setLoading(true)
    const [{ data: profs }, { data: sess }, { data: emailData }] = await Promise.all([
      supabase.from('profiles').select('id, username, role, subject_id, created_at, access_until').eq('academy_id', academia.id),
      supabase.from('sessions').select('id, user_id, subject_id, score, played_at').eq('academy_id', academia.id).order('played_at', { ascending: false }),
      supabase.rpc('get_academy_user_emails', { p_academy_id: academia.id }),
    ])
    setProfiles((profs ?? []) as Profile[])
    setSesiones((sess  ?? []) as Sesion[])
    const emailMap: Record<string, string> = {}
    for (const row of (emailData ?? []) as any[]) emailMap[row.user_id] = row.email
    setEmails(emailMap)

    const profsArr = (profs ?? []) as Profile[]
    if (profsArr.length) {
      const alumnoIds = profsArr.filter(p => p.role === 'alumno').map(p => p.id)
      const staffIds  = profsArr.filter(p => ['profesor','director'].includes(p.role)).map(p => p.id)
      const [{ data: sps }, { data: sfps }] = await Promise.all([
        alumnoIds.length ? supabase.from('student_profiles').select('*').in('id', alumnoIds) : Promise.resolve({ data: [] }),
        staffIds.length  ? supabase.from('staff_profiles').select('*').in('id', staffIds)    : Promise.resolve({ data: [] }),
      ])
      const extMap: Record<string, any> = {}
      for (const sp of (sps  ?? []) as any[]) extMap[sp.id] = sp
      for (const sf of (sfps ?? []) as any[]) extMap[sf.id] = sf
      setExtendedProfiles(extMap)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [academia?.id])

  const directores   = profiles.filter(p => p.role === 'director')
  const totalAlumnos = profiles.filter(p => p.role === 'alumno').length
  const totalProfes  = profiles.filter(p => p.role === 'profesor').length
  const sevenAgo     = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const activos      = new Set(sesiones.filter(s => s.played_at >= sevenAgo).map(s => s.user_id)).size
  const notaGlobal   = sesiones.length ? Math.round(sesiones.reduce((a, s) => a + s.score, 0) / sesiones.length) : null
  const plan         = academia.plan ?? 'starter'
  const planColor    = ({ base: '#6366F1', medio: '#F59E0B', academia: '#10B981' } as Record<string,string>)[plan] ?? '#6B7280'

  return (
    <div className={styles.page2}>
      <motion.div className={styles.heroHeader} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className={styles.heroHeaderOrb1} />
        <div className={styles.heroHeaderOrb2} />
        <button className={styles.btnBack2} onClick={onBack}><ArrowLeft size={14} /> Academias</button>
        <div className={styles.heroHeaderContent}>
          <div className={styles.heroAcadIcon}><Building2 size={22} strokeWidth={1.6} /></div>
          <div>
            <h1 className={styles.heroAcadName}>{academia.name}</h1>
            <div className={styles.heroAcadMeta}>
              <code className={styles.heroAcadSlug}>{academia.slug}</code>
              <span className={styles.heroAcadPlan} style={{ color: planColor, background: planColor + '20' }}>Plan {plan}</span>
              {academia.suspended && <span className={styles.heroAcadSuspended}>SUSPENDIDA</span>}
            </div>
          </div>
        </div>
      </motion.div>

      <div className={styles.inner2}>
        {loading ? (
          <div className={styles.loadState2}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={22} /></motion.div>
            <p>Cargando datos…</p>
          </div>
        ) : (
          <>
            <div className={styles.kpisGrid}>
              <KpiCard icon={Users}         label="Alumnos"          value={totalAlumnos}    color="#0EA5E9" delay={0.05} />
              <KpiCard icon={GraduationCap} label="Profesores"       value={totalProfes}     color="#7C3AED" delay={0.1}  />
              <KpiCard icon={Building2}     label="Directores"       value={directores.length} color="#10B981" delay={0.15} />
              <KpiCard icon={Zap}           label="Activos 7d"       value={activos}         color="#2563EB" delay={0.2} />
              <KpiCard icon={BarChart2}     label="Nota global"      value={notaGlobal !== null ? `${notaGlobal}%` : '—'} color={scoreColor(notaGlobal)} delay={0.25} />
              <KpiCard icon={TrendingUp}    label="Sesiones totales" value={sesiones.length} color="#F59E0B" delay={0.3} />
            </div>

            <motion.div className={styles.bentoRow} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              {/* Card 1 — Plan activo */}
              <div className={styles.bentoCard}>
                <div className={styles.bentoCardLabel}>Plan activo</div>
                <div className={styles.bentoPlanName}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</div>
                {academia.price_monthly > 0 && (
                  <div className={styles.bentoPlanPrice}>
                    <span className={styles.bentoPlanPriceCur}>€</span>
                    <span className={styles.bentoPlanPriceNum}>{academia.price_monthly}</span>
                    <span className={styles.bentoPlanPricePer}>/mes</span>
                  </div>
                )}
                <div className={styles.bentoPayStatus} style={{ color: academia.payment_status === 'active' ? '#059669' : academia.payment_status === 'overdue' ? '#DC2626' : '#D97706' }}>
                  <span className={styles.bentoPayDot} style={{ background: academia.payment_status === 'active' ? '#059669' : academia.payment_status === 'overdue' ? '#DC2626' : '#D97706' }} />
                  {academia.payment_status === 'active' ? 'Al día' : academia.payment_status === 'overdue' ? 'Moroso' : 'Pendiente'}
                </div>
                {academia.contract_renews && <div className={styles.bentoRenew}>Renueva: {new Date(academia.contract_renews).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}</div>}
              </div>

              {/* Card 2 — Contacto */}
              <div className={styles.bentoCard}>
                <div className={styles.bentoCardLabel}>Contacto</div>
                {academia.contact_email
                  ? <a href={`mailto:${academia.contact_email}`} className={styles.bentoCardLink}>{academia.contact_email}</a>
                  : <div className={styles.bentoCardEmpty}>Sin email</div>}
                {academia.contact_phone
                  ? <div className={styles.bentoCardBig}>{academia.contact_phone}</div>
                  : <div className={styles.bentoCardEmpty}>Sin teléfono</div>}
                {academia.city
                  ? <div className={styles.bentoCardSub}>{academia.city}{academia.province ? `, ${academia.province}` : ''}</div>
                  : <div className={styles.bentoCardEmpty}>Sin ciudad</div>}
              </div>

              {/* Card 3 — Facturación */}
              <div className={styles.bentoCard}>
                <div className={styles.bentoCardLabel}>Facturación</div>
                {academia.billing_name
                  ? <div className={styles.bentoCardBig}>{academia.billing_name}</div>
                  : <div className={styles.bentoCardEmpty}>Sin razón social</div>}
                {academia.billing_nif     && <div className={styles.bentoCardSub}>{academia.billing_nif}</div>}
                {academia.billing_address && <div className={styles.bentoCardSub}>{academia.billing_address}</div>}
                {academia.payment_method  && <div className={styles.bentoCardChip}>{academia.payment_method}</div>}
              </div>

              {/* Card 4 — Actividad */}
              <div className={styles.bentoCard}>
                <div className={styles.bentoCardLabel}>Actividad</div>
                <div className={styles.bentoStatRow}>
                  <div className={styles.bentoStatItem}><span className={styles.bentoStatNum}>{totalAlumnos}</span><span className={styles.bentoStatLabel}>alumnos</span></div>
                  <div className={styles.bentoStatItem}><span className={styles.bentoStatNum} style={{ color: '#2563EB' }}>{activos}</span><span className={styles.bentoStatLabel}>activos</span></div>
                  <div className={styles.bentoStatItem}><span className={styles.bentoStatNum}>{sesiones.length}</span><span className={styles.bentoStatLabel}>sesiones</span></div>
                </div>
                {notaGlobal !== null && <div className={styles.bentoNota} style={{ color: scoreColor(notaGlobal) }}>{notaGlobal}% nota media global</div>}
                {academia.notes && <div className={styles.bentoNotes}>{academia.notes}</div>}
              </div>
            </motion.div>

            {directores.length > 0 && (
              <motion.div className={styles.section2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className={styles.sectionHeader2}><Building2 size={14} /><h2 className={styles.sectionTitle2}>Dirección</h2></div>
                <div className={styles.userList2}>
                  {directores.map(d => <UsuarioRow key={d.id} user={d} sesiones={sesiones} emails={emails} extended={extendedProfiles[d.id] ?? null} expanded={expandedDir === d.id} onReload={load} onToggle={() => setExpandedDir(v => v === d.id ? null : d.id)} />)}
                </div>
              </motion.div>
            )}

            <motion.div className={styles.section2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <div className={styles.sectionHeader2}><BookOpen size={14} /><h2 className={styles.sectionTitle2}>Asignaturas</h2></div>
              {!academia.subjects?.length ? (
                <p className={styles.empty2}>Sin asignaturas configuradas</p>
              ) : (
                <div className={styles.subjectList2}>
                  {academia.subjects.map((sub: Subject) => (
                    <SubjectSection key={sub.id} subject={sub} profiles={profiles} sesiones={sesiones} emails={emails} extendedProfiles={extendedProfiles} onReload={load} />
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
