import { useState } from 'react'
import { User, Settings, Sun, Moon, Laptop, GraduationCap, CalendarDays, BookOpen, LogOut } from 'lucide-react'
import { useSettings } from '../../../hooks/useSettings'
import { usePlanSemanal } from '../../../hooks/usePlanSemanal'
import styles from './ProfesorProfile.module.css'

function getWeekDays() {
  const today = new Date()
  const day   = today.getDay()
  const diff  = day === 0 ? -6 : 1 - day
  const mon   = new Date(today)
  mon.setDate(today.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function ProfesorProfile({ currentUser, onLogout }) {
  const { settings, updateSetting } = useSettings()
  const { plan, bloques } = usePlanSemanal(currentUser?.academy_id)
  const [tab, setTab] = useState('perfil')

  const weekDays  = getWeekDays()
  const today     = new Date()
  const todayStr  = today.toDateString()

  const TEMAS_OPTIONS = [
    { value: 'claro',  label: 'Claro',   icon: Sun    },
    { value: 'oscuro', label: 'Oscuro',  icon: Moon   },
    { value: 'calido', label: 'Cálido',  icon: Laptop },
  ]

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarBig}>
          {currentUser?.displayName?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className={styles.username}>{currentUser?.username}</h1>
          <span className={styles.roleBadge}><GraduationCap size={12} /> Profesor</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'perfil',    label: 'Perfil',    icon: User },
          { id: 'plan',      label: 'Esta semana', icon: CalendarDays },
          { id: 'ajustes',   label: 'Ajustes',   icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id}
            className={[styles.tab, tab === id ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab(id)}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Perfil */}
      {tab === 'perfil' && (
        <div className={styles.tabContent}>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Usuario</span>
              <span className={styles.infoValue}>{currentUser?.username}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Rol</span>
              <span className={styles.infoValue}>Profesor</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Academia ID</span>
              <span className={styles.infoValueMono}>{currentUser?.academy_id?.slice(0, 16)}…</span>
            </div>
          </div>

          <button className={styles.btnLogout} onClick={onLogout}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      )}

      {/* Tab: Esta semana */}
      {tab === 'plan' && (
        <div className={styles.tabContent}>
          {/* Calendario semana actual */}
          <div className={styles.weekCard}>
            <h3 className={styles.cardTitle}>Semana actual</h3>
            <div className={styles.weekRow}>
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === todayStr
                return (
                  <div key={i} className={[styles.dayCol, isToday ? styles.dayToday : ''].join(' ')}>
                    <span className={styles.dayName}>{DIAS[i]}</span>
                    <span className={styles.dayNum}>{d.getDate()}</span>
                    <span className={styles.dayMonth}>{MESES[d.getMonth()]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Plan de la semana */}
          {plan && bloques.length > 0 ? (
            <div className={styles.planCard}>
              <h3 className={styles.cardTitle}>Plan asignado esta semana</h3>
              {plan.notes && (
                <p className={styles.planNota}>📝 {plan.notes}</p>
              )}
              <div className={styles.planBloques}>
                {bloques.map(b => (
                  <div key={b.id} className={styles.planBloque}>
                    <div className={styles.planDot} style={{ background: b.color }} />
                    <div className={styles.planInfo}>
                      <span className={styles.planLabel}>{b.label}</span>
                      {b.todosLosTemas
                        ? <span className={styles.planDesc}>Bloque completo</span>
                        : <span className={styles.planDesc}>{b.temasEspecificos.map(t => t.title).join(' · ')}</span>
                      }
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
      )}

      {/* Tab: Ajustes */}
      {tab === 'ajustes' && (
        <div className={styles.tabContent}>
          <div className={styles.settingCard}>
            <h3 className={styles.settingTitle}>Tema de la interfaz</h3>
            <div className={styles.themeRow}>
              {TEMAS_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value}
                  className={[styles.themeBtn, settings.tema === value ? styles.themeBtnActive : ''].join(' ')}
                  onClick={() => updateSetting('tema', value)}>
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
