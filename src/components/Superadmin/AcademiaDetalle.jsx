import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, Users, GraduationCap, Building2, BookOpen,
  BarChart2, Zap, Shield, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp, Calendar, Clock, TrendingUp,
  Mail, Trash2, Lock, Eye, EyeOff, PauseCircle, PlayCircle,
  Edit3, Check, X, MoreHorizontal
} from 'lucide-react'
import styles from './AcademiaDetalle.module.css'

const EDGE_USUARIO = 'https://zazqejluzyqihqhzbrga.supabase.co/functions/v1/gestionar-usuario'

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function scoreColor(s) {
  if (!s && s !== 0) return '#6B7280'
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#B45309'
  return '#DC2626'
}

function KpiCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={styles.kpi} style={{ '--c': color }}>
      <div className={styles.kpiGlow} />
      <Icon size={16} strokeWidth={1.8} className={styles.kpiIcon} />
      <div className={styles.kpiVal}>{value ?? '—'}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

// ── Helper: llamar Edge Function gestionar-usuario ───────────────────────────
async function llamarGestionarUsuario(action, userId, params = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Sin sesión activa' }

    const res = await fetch(EDGE_USUARIO, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, user_id: userId, ...params }),
    })

    let data = {}
    try { data = await res.json() } catch (_) { /* respuesta vacía */ }

    if (!res.ok) {
      // Dar mensajes útiles según el status
      if (res.status === 404) return { error: 'Edge Function no encontrada. Verifica que "gestionar-usuario" está desplegada en Supabase.' }
      if (res.status === 401) return { error: 'Sin autorización. Intenta cerrar sesión y volver a entrar.' }
      if (res.status === 403) return { error: 'No tienes permisos para esta acción.' }
      return { error: data.error || `Error ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { error: `Error de red: ${e.message}` }
  }
}

// ── Modal genérico pequeño ────────────────────────────────────────────────────
function MiniModal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem',
        width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 0 }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Botón de acción con hover ─────────────────────────────────────────────────
function ActionBtn({ onClick, disabled, color = 'default', icon: Icon, children }) {
  const [hovered, setHovered] = useState(false)

  const base = {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.42rem 0.85rem', borderRadius: '7px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.78rem', fontWeight: 600,
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
  }

  const themes = {
    default: {
      border: `1px solid ${hovered ? 'var(--ink)' : 'var(--border)'}`,
      background: hovered ? 'var(--ink)' : 'transparent',
      color: hovered ? 'var(--surface)' : 'var(--ink)',
    },
    warning: {
      border: `1px solid ${hovered ? '#B45309' : '#D97706'}`,
      background: hovered ? '#FEF3C7' : 'transparent',
      color: hovered ? '#92400E' : '#D97706',
    },
    success: {
      border: `1px solid ${hovered ? '#065F46' : '#059669'}`,
      background: hovered ? '#D1FAE5' : 'transparent',
      color: hovered ? '#065F46' : '#059669',
    },
    danger: {
      border: `1px solid ${hovered ? '#991B1B' : '#FECACA'}`,
      background: hovered ? '#FEE2E2' : 'transparent',
      color: hovered ? '#991B1B' : '#DC2626',
    },
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...themes[color] }}
    >
      {Icon && <Icon size={12} />}
      {children}
    </button>
  )
}

// ── UsuarioRow con acciones ───────────────────────────────────────────────────
function UsuarioRow({ user, sesiones, emails, expanded, onToggle, onReload }) {
  const isAlumno = user.role === 'alumno'

  const userSessions = isAlumno ? sesiones.filter(s => s.user_id === user.id) : []
  const notaMedia = userSessions.length
    ? Math.round(userSessions.reduce((a, s) => a + s.score, 0) / userSessions.length)
    : null
  const ultima = userSessions[0]?.played_at
  const diasInactivo = ultima
    ? Math.floor((new Date() - new Date(ultima)) / 86400000)
    : null
  const accessUntil = user.access_until ? new Date(user.access_until) : null
  const expirado = isAlumno && accessUntil && accessUntil < new Date()
  const expiraEn = accessUntil ? Math.ceil((accessUntil - new Date()) / 86400000) : null

  const email = emails?.[user.id] || null

  // Estado de modales y acciones
  const [modal,       setModal]       = useState(null) // 'password' | 'email' | 'confirmar_eliminar'
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2,setNewPassword2]= useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [newEmail,    setNewEmail]    = useState(email || '')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError,   setActionError]   = useState('')
  const [banned,      setBanned]      = useState(user.banned ?? false)

  const closeModal = () => { setModal(null); setActionError(''); setNewPassword(''); setNewPassword2(''); }

  const handleAccion = async (action, params = {}) => {
    setActionError('')
    setActionLoading(true)
    const res = await llamarGestionarUsuario(action, user.id, params)
    setActionLoading(false)
    if (res.error) { setActionError(res.error); return false }
    return true
  }

  const handleEliminar = async () => {
    const ok = await handleAccion('eliminar')
    if (ok) { closeModal(); onReload() }
  }

  const handleToggleBan = async () => {
    const action = banned ? 'reactivar' : 'desactivar'
    const ok = await handleAccion(action)
    if (ok) setBanned(v => !v)
  }

  const handleCambiarPassword = async () => {
    if (newPassword.length < 6) { setActionError('Mínimo 6 caracteres'); return }
    if (newPassword !== newPassword2) { setActionError('Las contraseñas no coinciden'); return }
    const ok = await handleAccion('cambiar_password', { password: newPassword })
    if (ok) closeModal()
  }

  const handleEditarEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { setActionError('Email no válido'); return }
    const ok = await handleAccion('editar_email', { email: newEmail.trim() })
    if (ok) { closeModal(); onReload() }
  }

  return (
    <>
      {/* Modales */}
      {modal === 'confirmar_eliminar' && (
        <MiniModal title="¿Eliminar usuario?" onClose={closeModal}>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', margin: '0 0 1rem' }}>
            Se borrará <strong>{user.username}</strong> de forma permanente. Esta acción no se puede deshacer.
          </p>
          {actionError && (
            <div style={{ display:'flex', gap:'0.4rem', padding:'0.6rem 0.75rem', borderRadius:'6px', marginBottom:'0.75rem', background:'#FEE2E2', color:'#991B1B', fontSize:'0.82rem' }}>
              <AlertTriangle size={13} style={{ flexShrink:0, marginTop:'1px' }} />{actionError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={closeModal} style={{ padding:'0.5rem 1rem', borderRadius:'8px', border:'1px solid var(--border)', background:'none', cursor:'pointer', fontSize:'0.85rem', color:'var(--ink)' }}>
              Cancelar
            </button>
            <button onClick={handleEliminar} disabled={actionLoading} style={{ padding:'0.5rem 1rem', borderRadius:'8px', border:'none', background:'#DC2626', color:'#fff', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.4rem' }}>
              {actionLoading ? <RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
              Eliminar
            </button>
          </div>
        </MiniModal>
      )}

      {modal === 'password' && (
        <MiniModal title={`Cambiar contraseña — ${user.username}`} onClose={closeModal}>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <div>
              <label style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--ink)', display:'block', marginBottom:'0.35rem' }}>Nueva contraseña</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setActionError('') }}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                  style={{ width:'100%', padding:'0.6rem 2.2rem 0.6rem 0.75rem', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--surface-off)', color:'var(--ink)', fontSize:'0.875rem', boxSizing:'border-box' }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position:'absolute', right:'0.5rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--ink-muted)', padding:0 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--ink)', display:'block', marginBottom:'0.35rem' }}>Repite la contraseña</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPassword2}
                onChange={e => { setNewPassword2(e.target.value); setActionError('') }}
                placeholder="Repite la contraseña"
                style={{ width:'100%', padding:'0.6rem 0.75rem', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--surface-off)', color:'var(--ink)', fontSize:'0.875rem', boxSizing:'border-box' }}
              />
            </div>
            {newPassword && newPassword2 && (
              <div style={{ fontSize:'0.8rem', fontWeight:500, color: newPassword === newPassword2 ? '#059669' : '#DC2626', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                {newPassword === newPassword2 ? <><Check size={12} /> Coinciden</> : <><X size={12} /> No coinciden</>}
              </div>
            )}
            {actionError && (
              <div style={{ display:'flex', gap:'0.4rem', padding:'0.6rem', borderRadius:'6px', background:'#FEE2E2', color:'#991B1B', fontSize:'0.82rem' }}>
                <AlertTriangle size={13} style={{ flexShrink:0 }} />{actionError}
              </div>
            )}
            <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end', marginTop:'0.25rem' }}>
              <button onClick={closeModal} style={{ padding:'0.5rem 1rem', borderRadius:'8px', border:'1px solid var(--border)', background:'none', cursor:'pointer', fontSize:'0.85rem', color:'var(--ink)' }}>
                Cancelar
              </button>
              <button onClick={handleCambiarPassword} disabled={actionLoading} style={{ padding:'0.5rem 1rem', borderRadius:'8px', border:'none', background:'var(--ink)', color:'var(--surface)', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.4rem' }}>
                {actionLoading ? <RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> : <Check size={13} />}
                Guardar
              </button>
            </div>
          </div>
        </MiniModal>
      )}

      {modal === 'email' && (
        <MiniModal title={`Editar email — ${user.username}`} onClose={closeModal}>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <div>
              <label style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--ink)', display:'block', marginBottom:'0.35rem' }}>Email real</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setActionError('') }}
                placeholder="nuevo@email.com"
                autoFocus
                style={{ width:'100%', padding:'0.6rem 0.75rem', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--surface-off)', color:'var(--ink)', fontSize:'0.875rem', boxSizing:'border-box' }}
              />
            </div>
            {actionError && (
              <div style={{ display:'flex', gap:'0.4rem', padding:'0.6rem', borderRadius:'6px', background:'#FEE2E2', color:'#991B1B', fontSize:'0.82rem' }}>
                <AlertTriangle size={13} style={{ flexShrink:0 }} />{actionError}
              </div>
            )}
            <div style={{ display:'flex', gap:'0.5rem', justifyContent:'flex-end' }}>
              <button onClick={closeModal} style={{ padding:'0.5rem 1rem', borderRadius:'8px', border:'1px solid var(--border)', background:'none', cursor:'pointer', fontSize:'0.85rem', color:'var(--ink)' }}>
                Cancelar
              </button>
              <button onClick={handleEditarEmail} disabled={actionLoading} style={{ padding:'0.5rem 1rem', borderRadius:'8px', border:'none', background:'var(--ink)', color:'var(--surface)', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.4rem' }}>
                {actionLoading ? <RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }} /> : <Check size={13} />}
                Guardar
              </button>
            </div>
          </div>
        </MiniModal>
      )}

      {/* Card del usuario */}
      <div className={[styles.userCard,
        expirado ? styles.userExpirado : '',
        isAlumno && diasInactivo > 5 ? styles.userRiesgo : '',
        banned ? styles.userExpirado : '',
      ].filter(Boolean).join(' ')}>
        <button className={styles.userHeader} onClick={onToggle}>
          <div className={styles.userLeft}>
            <div className={styles.userAvatar} style={{ opacity: banned ? 0.5 : 1 }}>
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <span className={styles.userName}>{user.username}</span>
              <div className={styles.userBadges}>
                {banned && <span className={styles.badgeRed}>Desactivado</span>}
                {isAlumno && !banned && expirado && <span className={styles.badgeRed}>Acceso expirado</span>}
                {isAlumno && !banned && !expirado && diasInactivo !== null && diasInactivo > 5 && (
                  <span className={styles.badgeAmber}>⚠ Inactivo {diasInactivo}d</span>
                )}
                {isAlumno && !banned && !expirado && diasInactivo === 0 && <span className={styles.badgeGreen}>Activo hoy</span>}
                {isAlumno && !banned && !expirado && expiraEn !== null && expiraEn <= 14 && expiraEn > 0 && (
                  <span className={styles.badgeAmber}>Expira en {expiraEn}d</span>
                )}
                {!isAlumno && email && (
                  <span style={{ fontSize:'0.75rem', color:'var(--ink-muted)', fontWeight:400 }}>{email}</span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.userRight}>
            {isAlumno && notaMedia !== null && (
              <span className={styles.userNota} style={{ color: scoreColor(notaMedia) }}>{notaMedia}%</span>
            )}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </button>

        {expanded && (
          <div className={styles.userDetail}>
            <div className={styles.userStats}>
              {isAlumno && <>
                <div className={styles.userStat}><Zap size={12} /><span>{userSessions.length} sesiones</span></div>
                <div className={styles.userStat}><BarChart2 size={12} /><span>Nota media: {notaMedia !== null ? `${notaMedia}%` : '—'}</span></div>
                <div className={styles.userStat}><Clock size={12} /><span>{diasInactivo === null ? 'Sin actividad' : diasInactivo === 0 ? 'Activo hoy' : `Hace ${diasInactivo} días`}</span></div>
                <div className={styles.userStat}><Shield size={12} /><span>Acceso hasta: {formatFecha(user.access_until)}</span></div>
                <div className={styles.userStat}><Calendar size={12} /><span>Registro: {formatFecha(user.created_at)}</span></div>
                {email && (
                  <div className={styles.userStat}>
                    <Mail size={12} />
                    <a href={`mailto:${email}`} style={{ color:'var(--ink-muted)', textDecoration:'none' }} onClick={e => e.stopPropagation()}>{email}</a>
                  </div>
                )}
              </>}
              {!isAlumno && <>
                <div className={styles.userStat}><Shield size={12} /><span style={{ textTransform:'capitalize' }}>Rol: {user.role}</span></div>
                <div className={styles.userStat}><Calendar size={12} /><span>Alta: {formatFecha(user.created_at)}</span></div>
                {email
                  ? <div className={styles.userStat}><Mail size={12} /><a href={`mailto:${email}`} style={{ color:'var(--ink-muted)', textDecoration:'none' }} onClick={e => e.stopPropagation()}>{email}</a></div>
                  : <div className={styles.userStat} style={{ opacity:0.5 }}><Mail size={12} /><span>Sin email configurado</span></div>
                }
              </>}
            </div>

            {isAlumno && userSessions.length > 0 && (
              <div className={styles.miniChart}>
                {userSessions.slice(0, 6).reverse().map((s, i) => (
                  <div key={i} className={styles.miniBar}>
                    <div className={styles.miniBarFill} style={{ height:`${s.score}%`, background:scoreColor(s.score) }} />
                    <span className={styles.miniBarLabel}>{s.score}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Botones de acción ── */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginTop:'0.85rem', paddingTop:'0.85rem', borderTop:'1px solid var(--border-subtle)' }}>
              <ActionBtn color="default" icon={Mail}
                onClick={() => { setNewEmail(email || ''); setModal('email') }}>
                Editar email
              </ActionBtn>
              <ActionBtn color="default" icon={Lock}
                onClick={() => { setNewPassword(''); setNewPassword2(''); setModal('password') }}>
                Cambiar contraseña
              </ActionBtn>
              <ActionBtn
                color={banned ? 'success' : 'warning'}
                icon={banned ? PlayCircle : PauseCircle}
                onClick={handleToggleBan}
                disabled={actionLoading}>
                {banned ? 'Reactivar' : 'Desactivar'}
              </ActionBtn>
              <ActionBtn color="danger" icon={Trash2}
                onClick={() => setModal('confirmar_eliminar')}>
                Eliminar
              </ActionBtn>
            </div>

            {/* Error de acción inline */}
            {actionError && !modal && (
              <div style={{ display:'flex', gap:'0.4rem', padding:'0.6rem', borderRadius:'6px', marginTop:'0.5rem', background:'#FEE2E2', color:'#991B1B', fontSize:'0.82rem' }}>
                <AlertTriangle size={13} style={{ flexShrink:0 }} />{actionError}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function SubjectSection({ subject, profiles, sesiones, emails, onReload }) {
  const [open, setOpen] = useState(true)
  const [expandedUser, setExpandedUser] = useState(null)

  const profes   = profiles.filter(p => p.subject_id === subject.id && p.role === 'profesor')
  const alumnos  = profiles.filter(p => p.subject_id === subject.id && p.role === 'alumno')
  const subSess  = sesiones.filter(s => s.subject_id === subject.id)

  const notaMedia = subSess.length
    ? Math.round(subSess.reduce((a, s) => a + s.score, 0) / subSess.length)
    : null

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const activos = new Set(subSess.filter(s => s.played_at >= sevenDaysAgo).map(s => s.user_id)).size

  return (
    <div className={styles.subjectSection}>
      <button className={styles.subjectHeader} onClick={() => setOpen(v => !v)}
        style={{ '--sc': subject.color }}>
        <div className={styles.subjectBar} />
        <div className={styles.subjectInfo}>
          <span className={styles.subjectName}>{subject.name}</span>
          <div className={styles.subjectMeta}>
            <span><GraduationCap size={11} /> {profes.length} prof.</span>
            <span><Users size={11} /> {alumnos.length} alumnos</span>
            <span><Zap size={11} /> {activos} activos</span>
            {notaMedia !== null && (
              <span style={{ color: scoreColor(notaMedia) }}>
                <BarChart2 size={11} /> {notaMedia}%
              </span>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className={styles.subjectBody}>
          {/* Profesores */}
          {profes.length > 0 && (
            <div className={styles.roleGroup}>
              <div className={styles.roleGroupTitle}>
                <GraduationCap size={13} /> Profesores
              </div>
              {profes.map(p => (
                <UsuarioRow key={p.id} user={p} sesiones={sesiones} emails={emails}
                  expanded={expandedUser === p.id} onReload={onReload}
                  onToggle={() => setExpandedUser(v => v === p.id ? null : p.id)} />
              ))}
            </div>
          )}

          {/* Alumnos */}
          {alumnos.length > 0 && (
            <div className={styles.roleGroup}>
              <div className={styles.roleGroupTitle}>
                <Users size={13} /> Alumnos ({alumnos.length})
              </div>
              {alumnos.map(a => (
                <UsuarioRow key={a.id} user={a} sesiones={sesiones} emails={emails}
                  expanded={expandedUser === a.id} onReload={onReload}
                  onToggle={() => setExpandedUser(v => v === a.id ? null : a.id)} />
              ))}
            </div>
          )}

          {profes.length === 0 && alumnos.length === 0 && (
            <p className={styles.empty}>Sin usuarios en esta asignatura todavía</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function AcademiaDetalle({ academia, onBack }) {
  const [profiles,  setProfiles]  = useState([])
  const [sesiones,  setSesiones]  = useState([])
  const [emails,    setEmails]    = useState({})
  const [loading,   setLoading]   = useState(true)
  const [expandedDir, setExpandedDir] = useState(null)

  const load = async () => {
    if (!academia?.id) return
    setLoading(true)
    const [{ data: profs }, { data: sess }, { data: emailData }] = await Promise.all([
      supabase.from('profiles')
        .select('id, username, role, subject_id, created_at, access_until')
        .eq('academy_id', academia.id),
      supabase.from('sessions')
        .select('id, user_id, subject_id, score, played_at')
        .eq('academy_id', academia.id)
        .order('played_at', { ascending: false }),
      supabase.rpc('get_academy_user_emails', { p_academy_id: academia.id }),
    ])
    setProfiles(profs || [])
    setSesiones(sess || [])
    const emailMap = {}
    for (const row of (emailData || [])) emailMap[row.user_id] = row.email
    setEmails(emailMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [academia?.id])

  const directores = profiles.filter(p => p.role === 'director')
  const totalAlumnos = profiles.filter(p => p.role === 'alumno').length
  const totalProfes  = profiles.filter(p => p.role === 'profesor').length

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const activos = new Set(sesiones.filter(s => s.played_at >= sevenDaysAgo).map(s => s.user_id)).size
  const notaGlobal = sesiones.length
    ? Math.round(sesiones.reduce((a, s) => a + s.score, 0) / sesiones.length)
    : null

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.btnBack} onClick={onBack}>
          <ArrowLeft size={16} /> Academias
        </button>
        <div className={styles.acadTitle}>
          <div className={styles.acadIcon}><Building2 size={18} /></div>
          <div>
            <h1 className={styles.pageTitle}>{academia.name}</h1>
            <span className={styles.acadSlug}>{academia.slug} · Plan {academia.plan || 'base'}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.state}><RefreshCw size={22} className={styles.spinner} /><p>Cargando…</p></div>
      ) : (
        <>
          {/* KPIs */}
          <div className={styles.kpisRow}>
            <KpiCard icon={Users}         label="Alumnos"      value={totalAlumnos}  color="#0891B2" />
            <KpiCard icon={GraduationCap} label="Profesores"   value={totalProfes}   color="#7C3AED" />
            <KpiCard icon={Building2}     label="Directores"   value={directores.length} color="#059669" />
            <KpiCard icon={Zap}           label="Activos 7d"   value={activos}       color="#D97706" />
            <KpiCard icon={BarChart2}     label="Nota global"
              value={notaGlobal !== null ? `${notaGlobal}%` : '—'}
              color={scoreColor(notaGlobal)} />
            <KpiCard icon={TrendingUp}    label="Sesiones totales" value={sesiones.length} color="#0F766E" />
          </div>

          {/* Dirección */}
          {directores.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Building2 size={14} /> Dirección
              </h2>
              <div className={styles.userList}>
                {directores.map(d => (
                  <UsuarioRow key={d.id} user={d} sesiones={sesiones} emails={emails}
                    expanded={expandedDir === d.id} onReload={load}
                    onToggle={() => setExpandedDir(v => v === d.id ? null : d.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Por asignatura */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <BookOpen size={14} /> Asignaturas
            </h2>
            {academia.subjects?.length === 0 ? (
              <p className={styles.empty}>Sin asignaturas configuradas</p>
            ) : (
              <div className={styles.subjectList}>
                {academia.subjects?.map(sub => (
                  <SubjectSection
                    key={sub.id} subject={sub}
                    profiles={profiles} sesiones={sesiones}
                    emails={emails} onReload={load}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
