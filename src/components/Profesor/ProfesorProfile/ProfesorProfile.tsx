import { useState, useEffect } from 'react'
import {
  User, Settings, Sun, Moon, Laptop, GraduationCap,
  CalendarDays, BookOpen, LogOut, Phone, Mail, Edit3,
  Save, Check, RefreshCw, BarChart2, Users, Zap, Key,
  AlertCircle, Shield
} from 'lucide-react'
import { supabase }        from '../../../lib/supabase'
import { useSettings }     from '../../../hooks/useSettings'
import { useStaffProfile } from '../../../hooks/useStudentProfile'
import { usePlanSemanal }  from '../../../hooks/usePlanSemanal'
import { useProfesor }     from '../../../hooks/useProfesor'
import type { CurrentUser } from '../../../types'
import styles from './ProfesorProfile.module.css'

function getWeekDays(): Date[] {
  const today = new Date()
  const diff  = today.getDay() === 0 ? -6 : 1 - today.getDay()
  const mon   = new Date(today)
  mon.setDate(today.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); return d
  })
}
const DIAS  = ['L','M','X','J','V','S','D']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function AvatarBig({ nombre, color = '#6366F1' }: { nombre: string; color?: string }) {
  const iniciales = nombre
    ? nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return <div className={styles.avatarBig} style={{ background: color + '22', color }}>{iniciales}</div>
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className={styles.infoRow}>
      <Icon size={13} className={styles.infoIcon} />
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

interface StaffProfile {
  full_name?:     string | null
  phone?:         string | null
  email_contact?: string | null
  bio?:           string | null
}

interface TabPerfilProps {
  currentUser: CurrentUser | null
  profile:     StaffProfile | null
  saving:      boolean
  onSave:      (fields: Partial<StaffProfile>) => Promise<void>
}

function TabPerfil({ currentUser, profile, saving, onSave }: TabPerfilProps) {
  const isDirector = currentUser?.role === 'director'
  const [editando, setEditando]       = useState(false)
  const [form, setForm]               = useState({ full_name: '', phone: '', email_contact: '', bio: '' })
  const [changingPass, setChangingPass] = useState(false)
  const [passForm, setPassForm]       = useState({ nueva: '', confirmar: '' })
  const [passMsg, setPassMsg]         = useState<{ error: boolean; text: string } | null>(null)
  const [passLoading, setPassLoading] = useState(false)

  useEffect(() => {
    if (profile) setForm({
      full_name:     profile.full_name     ?? '',
      phone:         profile.phone         ?? '',
      email_contact: profile.email_contact ?? '',
      bio:           profile.bio           ?? '',
    })
  }, [profile])

  const handleSave = async () => { await onSave(form); setEditando(false) }

  const handleChangePass = async () => {
    if (!passForm.nueva || passForm.nueva !== passForm.confirmar) { setPassMsg({ error: true, text: 'Las contraseñas no coinciden' }); return }
    if (passForm.nueva.length < 8) { setPassMsg({ error: true, text: 'Mínimo 8 caracteres' }); return }
    setPassLoading(true)
    const { error } = await supabase.auth.updateUser({ password: passForm.nueva })
    setPassLoading(false)
    if (error) {
      setPassMsg({ error: true, text: error.message })
    } else {
      setPassMsg({ error: false, text: '¡Contraseña actualizada!' })
      setTimeout(() => { setChangingPass(false); setPassForm({ nueva: '', confirmar: '' }); setPassMsg(null) }, 2000)
    }
  }

  const nombreDisplay = profile?.full_name ?? currentUser?.username ?? ''
  const colorAvatar   = isDirector ? '#7C3AED' : '#059669'

  return (
    <div className={styles.tabContent}>
      <div className={styles.perfilHeader}>
        <AvatarBig nombre={nombreDisplay} color={colorAvatar} />
        <div className={styles.perfilHeaderInfo}>
          <h2 className={styles.perfilNombre}>{nombreDisplay || currentUser?.username}</h2>
          <div className={styles.perfilBadges}>
            <span className={styles.roleBadge} style={{ background: colorAvatar + '18', color: colorAvatar }}>
              {isDirector ? <Shield size={11} /> : <GraduationCap size={11} />}
              {isDirector ? 'Director/a' : 'Profesor/a'}
            </span>
            {currentUser?.academyName && <span className={styles.academiaBadge}>{currentUser.academyName}</span>}
          </div>
          {profile?.bio && !editando && <p className={styles.perfilBio}>{profile.bio}</p>}
        </div>
        <button className={styles.btnEditar} onClick={() => setEditando(v => !v)}>
          <Edit3 size={13} /> {editando ? 'Cancelar' : 'Editar perfil'}
        </button>
      </div>

      {editando ? (
        <div className={styles.editCard}>
          <div className={styles.editGrid}>
            <div className={styles.editCampo}>
              <label className={styles.editLabel}>Nombre completo</label>
              <input className={styles.editInput} type="text" placeholder="Tu nombre y apellidos" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className={styles.editCampo}>
              <label className={styles.editLabel}>Teléfono</label>
              <input className={styles.editInput} type="tel" placeholder="612 345 678" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className={styles.editCampo} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.editLabel}>Email de contacto</label>
              <input className={styles.editInput} type="email" placeholder="tu@email.com" value={form.email_contact} onChange={e => setForm(p => ({ ...p, email_contact: e.target.value }))} />
            </div>
            <div className={styles.editCampo} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.editLabel}>Bio / presentación</label>
              <textarea className={styles.editTextarea} rows={3} placeholder="Cuéntale algo a tus alumnos sobre ti..." value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
            </div>
          </div>
          <button className={styles.btnGuardar} onClick={handleSave} disabled={saving}>
            {saving ? <><RefreshCw size={13} className={styles.spinner} /> Guardando…</> : <><Save size={13} /> Guardar cambios</>}
          </button>
        </div>
      ) : (
        <div className={styles.infoCard}>
          <InfoRow icon={User}     label="Usuario"     value={currentUser?.username} />
          <InfoRow icon={User}     label="Nombre"      value={profile?.full_name} />
          <InfoRow icon={Phone}    label="Teléfono"    value={profile?.phone} />
          <InfoRow icon={Mail}     label="Email"       value={profile?.email_contact} />
          {currentUser?.subjectName && <InfoRow icon={BookOpen} label="Asignatura" value={currentUser.subjectName} />}
        </div>
      )}

      <div className={styles.passCard}>
        <div className={styles.passCardHead}>
          <div className={styles.passCardTitle}><Key size={14} /> Seguridad</div>
          <button className={styles.btnCambiarPass} onClick={() => { setChangingPass(v => !v); setPassMsg(null) }}>
            {changingPass ? 'Cancelar' : 'Cambiar contraseña'}
          </button>
        </div>
        {changingPass && (
          <div className={styles.passForm}>
            <div className={styles.editCampo}>
              <label className={styles.editLabel}>Nueva contraseña</label>
              <input className={styles.editInput} type="password" placeholder="Mínimo 8 caracteres" value={passForm.nueva} onChange={e => setPassForm(p => ({ ...p, nueva: e.target.value }))} />
            </div>
            <div className={styles.editCampo}>
              <label className={styles.editLabel}>Confirmar contraseña</label>
              <input className={styles.editInput} type="password" placeholder="Repite la contraseña" value={passForm.confirmar} onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))} />
            </div>
            {passMsg && (
              <div className={[styles.passMsg, passMsg.error ? styles.passMsgError : styles.passMsgOk].join(' ')}>
                {passMsg.error ? <AlertCircle size={13} /> : <Check size={13} />}
                {passMsg.text}
              </div>
            )}
            <button className={styles.btnGuardar} onClick={handleChangePass} disabled={passLoading}>
              {passLoading ? <><RefreshCw size={13} className={styles.spinner} /> Actualizando…</> : <><Key size={13} /> Actualizar contraseña</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TabPlan({ currentUser, statsClase }: { currentUser: CurrentUser | null; statsClase: ReturnType<typeof useProfesor>['statsClase'] }) {
  const { planSemanal: plan, bloquesSemanal: bloques } = usePlanSemanal(currentUser?.academy_id, currentUser?.subject_id)
  const weekDays = getWeekDays()
  const todayStr = new Date().toDateString()

  return (
    <div className={styles.tabContent}>
      {statsClase && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}><Users    size={16} className={styles.statIcon} style={{ color: '#0891B2' }} /><span className={styles.statVal}>{statsClase.totalAlumnos ?? 0}</span><span className={styles.statLabel}>Alumnos</span></div>
          <div className={styles.statCard}><Zap      size={16} className={styles.statIcon} style={{ color: '#059669' }} /><span className={styles.statVal}>{statsClase.alumnosActivos}</span><span className={styles.statLabel}>Activos 7d</span></div>
          <div className={styles.statCard}><BarChart2 size={16} className={styles.statIcon} style={{ color: '#7C3AED' }} /><span className={styles.statVal}>{statsClase.notaMediaClase !== null ? `${statsClase.notaMediaClase}%` : '—'}</span><span className={styles.statLabel}>Nota media</span></div>
          <div className={styles.statCard}><CalendarDays size={16} className={styles.statIcon} style={{ color: '#D97706' }} /><span className={styles.statVal}>{(statsClase as any).sesiones30d ?? 0}</span></div>
        </div>
      )}

      <div className={styles.weekCard}>
        <h3 className={styles.cardTitle}>Semana actual</h3>
        <div className={styles.weekRow}>
          {weekDays.map((d, i) => (
            <div key={i} className={[styles.dayCol, d.toDateString() === todayStr ? styles.dayToday : ''].join(' ')}>
              <span className={styles.dayName}>{DIAS[i]}</span>
              <span className={styles.dayNum}>{d.getDate()}</span>
              <span className={styles.dayMonth}>{MESES[d.getMonth()]}</span>
            </div>
          ))}
        </div>
      </div>

      {plan && bloques.length > 0 ? (
        <div className={styles.planCard}>
          <h3 className={styles.cardTitle}>Plan asignado esta semana</h3>
          {plan.notes && <p className={styles.planNota}>📝 {plan.notes}</p>}
          <div className={styles.planBloques}>
            {bloques.map(b => (
              <div key={b.id} className={styles.planBloque}>
                <div className={styles.planDot} style={{ background: b.color }} />
                <div className={styles.planInfo}>
                  <span className={styles.planLabel}>{b.label}</span>
                  <span className={styles.planDesc}>{b.todosLosTemas ? 'Bloque completo' : b.temasEspecificos.map(t => t.title).join(' · ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyPlan}>
          <CalendarDays size={32} strokeWidth={1.2} />
          <p>No hay plan asignado esta semana.</p>
          <span>Ve al Panel del Profesor → Plan semanal para crearlo.</span>
        </div>
      )}
    </div>
  )
}

function TabAjustes({ onLogout }: { onLogout: () => void }) {
  const { settings, updateSetting } = useSettings()
  const TEMAS = [
    { value: 'claro'  as const, label: 'Claro',  icon: Sun    },
    { value: 'oscuro' as const, label: 'Oscuro', icon: Moon   },
    { value: 'calido' as const, label: 'Cálido', icon: Laptop },
  ]
  return (
    <div className={styles.tabContent}>
      <div className={styles.settingCard}>
        <h3 className={styles.settingTitle}>Tema de la interfaz</h3>
        <div className={styles.themeRow}>
          {TEMAS.map(({ value, label, icon: Icon }) => (
            <button key={value} className={[styles.themeBtn, settings.tema === value ? styles.themeBtnActive : ''].join(' ')} onClick={() => updateSetting('tema', value)}>
              <Icon size={16} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <button className={styles.btnLogout} onClick={onLogout}><LogOut size={15} /> Cerrar sesión</button>
    </div>
  )
}

export default function ProfesorProfile({ currentUser, onLogout }: { currentUser: CurrentUser | null; onLogout: () => void }) {
  const [tab, setTab]                     = useState('perfil')
  const { profile, saving, save }         = useStaffProfile(currentUser?.id)
  const { statsClase }                    = useProfesor(currentUser)
  const handleSave = async (fields: Partial<StaffProfile>) => { await save(fields) }

  const TABS = [
    { id: 'perfil',  label: 'Perfil',     icon: User         },
    { id: 'plan',    label: 'Esta semana', icon: CalendarDays },
    { id: 'ajustes', label: 'Ajustes',    icon: Settings     },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.tabs}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={[styles.tab, tab === id ? styles.tabActive : ''].join(' ')} onClick={() => setTab(id)}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>
      {tab === 'perfil'  && <TabPerfil  currentUser={currentUser} profile={profile} saving={saving} onSave={handleSave} />}
      {tab === 'plan'    && <TabPlan    currentUser={currentUser} statsClase={statsClase} />}
      {tab === 'ajustes' && <TabAjustes onLogout={onLogout} />}
    </div>
  )
}
