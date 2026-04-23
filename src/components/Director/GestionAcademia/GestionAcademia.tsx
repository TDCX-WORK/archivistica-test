import { useState, useEffect } from 'react'
import { RefreshCw, Users, GraduationCap, BookOpen, Key, Settings, Building2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAcademyProfiles } from '../../../hooks/useStudentProfile'
import type { CurrentUser } from '../../../types'
import { SeccionAlumnos }       from '../sections/SeccionAlumnos'
import { SeccionProfesores }    from '../sections/SeccionProfesores'
import { SeccionAsignaturas }   from '../sections/SeccionAsignaturas'
import { SeccionCodigos }       from '../sections/SeccionCodigos'
import { SeccionConfiguracion } from '../sections/SeccionConfiguracion'
import { ActividadFeed }        from '../sections/ActividadFeed'
import styles from './GestionAcademia.module.css'

interface Subject { id: string; name: string; color: string; slug: string }
interface Academy { id: string; name: string; plan: string; slug: string }

type TabId = 'alumnos' | 'profesores' | 'asignaturas' | 'codigos' | 'config'

export default function GestionAcademia({ currentUser }: { currentUser: CurrentUser | null }) {
  const [tab,      setTab]      = useState<TabId>('alumnos')
  const [academy,  setAcademy]  = useState<Academy | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading,  setLoading]  = useState(true)

  const {
    studentProfiles,
    staffProfiles,
    loading: loadingProfiles,
    updateStudentProfile,
  } = useAcademyProfiles(currentUser?.academy_id)

  useEffect(() => {
    if (!currentUser?.academy_id) return
    const load = async () => {
      const [{ data: ac }, { data: subs }] = await Promise.all([
        supabase.from('academies')
          .select('id, name, plan, slug')
          .eq('id', currentUser.academy_id!)
          .single(),
        supabase.from('subjects')
          .select('id, name, color, slug')
          .eq('academy_id', currentUser.academy_id!)
          .order('name'),
      ])
      setAcademy(ac as Academy | null)
      setSubjects((subs ?? []) as Subject[])
      setLoading(false)
    }
    load()
  }, [currentUser?.academy_id])

  if (loading || loadingProfiles) {
    return (
      <div className={styles.state}>
        <RefreshCw size={20} className={styles.spinner} />
        <p>Cargando gestión…</p>
      </div>
    )
  }

  const TABS: { id: TabId; label: string; icon: any; count?: number }[] = [
    { id: 'alumnos',     label: 'Alumnos',     icon: Users,         count: studentProfiles.length },
    { id: 'profesores',  label: 'Profesores',  icon: GraduationCap, count: staffProfiles.filter(p => p.role === 'profesor').length },
    { id: 'asignaturas', label: 'Asignaturas', icon: BookOpen,      count: subjects.length },
    { id: 'codigos',     label: 'Códigos',     icon: Key },
    { id: 'config',      label: 'Configuración', icon: Settings },
  ]

  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroIcon}><Building2 size={18} /></div>
          <div className={styles.heroIdent}>
            <span className={styles.heroEyebrow}>Gestión de academia</span>
            <h1 className={styles.heroTitle}>{academy?.name ?? currentUser?.academyName ?? '—'}</h1>
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaChip}>{academy?.plan ?? '—'}</span>
              <span className={styles.heroMetaDot} />
              <span className={styles.heroMetaItem}>{studentProfiles.length} alumnos</span>
              <span className={styles.heroMetaDot} />
              <span className={styles.heroMetaItem}>{staffProfiles.filter(p => p.role === 'profesor').length} profesores</span>
              <span className={styles.heroMetaDot} />
              <span className={styles.heroMetaItem}>{subjects.length} asignaturas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Layout: contenido + feed lateral */}
      <div className={styles.layout}>
        <div className={styles.main}>
          {/* Segmented tabs premium */}
          <nav className={styles.tabs} role="tablist">
            {TABS.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                className={[styles.tab, tab === id ? styles.tabActive : ''].join(' ')}
                onClick={() => setTab(id)}
              >
                <Icon size={13} strokeWidth={2.2} />
                <span>{label}</span>
                {count !== undefined && count > 0 && <span className={styles.tabCount}>{count}</span>}
              </button>
            ))}
          </nav>

          {/* Contenido por tab */}
          <div className={styles.content}>
            {tab === 'alumnos' && (
              <SeccionAlumnos
                studentProfiles={studentProfiles}
                subjects={subjects}
                updateStudentProfile={updateStudentProfile}
                academyName={academy?.name ?? currentUser?.academyName}
              />
            )}
            {tab === 'profesores' && (
              <SeccionProfesores
                staffProfiles={staffProfiles}
                subjects={subjects}
              />
            )}
            {tab === 'asignaturas' && (
              <SeccionAsignaturas
                subjects={subjects}
                studentProfiles={studentProfiles}
                staffProfiles={staffProfiles}
              />
            )}
            {tab === 'codigos' && (
              <SeccionCodigos
                academyId={currentUser?.academy_id}
                academyName={academy?.name ?? currentUser?.academyName}
                subjects={subjects}
              />
            )}
            {tab === 'config' && (
              <SeccionConfiguracion currentUser={currentUser} academy={academy} />
            )}
          </div>
        </div>

        <ActividadFeed academyId={currentUser?.academy_id} />
      </div>
    </div>
  )
}
