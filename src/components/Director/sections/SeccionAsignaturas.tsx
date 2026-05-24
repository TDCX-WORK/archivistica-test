import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Info, Users, GraduationCap, Target, Zap, AlertTriangle, ChevronDown, ArrowRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { scoreColor } from '../../../lib/helpers'
import { MASCOTAS }   from '../DirectorTypes'
import type { AlumnoConExtended, StaffConExtended } from '../../../types'
import styles from '../GestionAcademia/GestionAcademia.module.css'
import asigStyles from './SeccionAsignaturas.module.css'

interface Subject { id: string; name: string; color: string; slug: string }

interface SubjectStats {
  id:             string
  name:           string
  color:          string
  totalAlumnos:   number
  alumnosActivos: number  // activos últimos 7d
  notaMedia:      number | null
  sesiones30d:    number
  enRiesgo:       number  // inactivos +3d
  profesores:     { id: string; username: string; fullName: string | null }[]
  alumnos:        {
    id:          string
    username:    string
    fullName:    string | null
    mascota:     string | null
    nota:        number | null
    sesiones:    number
    enRiesgo:    boolean
    diasInactivo:number | null
  }[]
}

export function SeccionAsignaturas({
  subjects,
  studentProfiles,
  staffProfiles,
  academyId,
}: {
  subjects:        Subject[]
  studentProfiles: AlumnoConExtended[]
  staffProfiles:   StaffConExtended[]
  academyId:       string | null | undefined
}) {
  const [sessions,    setSessions]    = useState<{ user_id: string; score: number; played_at: string; subject_id: string | null }[]>([])
  const [loadingSess, setLoadingSess] = useState(true)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)

  // Query única de sesiones de los últimos 60d
  useEffect(() => {
    if (!academyId) { setLoadingSess(false); return }
    const sixtyAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)
    supabase
      .from('sessions')
      .select('user_id, score, played_at, subject_id')
      .eq('academy_id', academyId)
      .gte('played_at', sixtyAgo)
      .then(({ data }) => {
        setSessions((data ?? []) as typeof sessions)
        setLoadingSess(false)
      })
  }, [academyId])

  // Map de student_profiles por id para acceso rápido a mascota y full_name
  const spMap = useMemo(() => {
    const m: Record<string, AlumnoConExtended> = {}
    for (const a of studentProfiles) m[a.id] = a
    return m
  }, [studentProfiles])

  const subjectStats = useMemo<SubjectStats[]>(() => {
    const now      = new Date()
    const sevenAgo = new Date(now.getTime() - 7  * 86400000).toISOString().slice(0, 10)
    const thirtyAgo= new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)

    // Pre-agrupar sesiones por subject_id y user_id
    const sessBySubject: Record<string, typeof sessions> = {}
    for (const s of sessions) {
      const key = s.subject_id ?? '__none__'
      if (!sessBySubject[key]) sessBySubject[key] = []
      sessBySubject[key]!.push(s)
    }

    return subjects.map(sub => {
      const subAlumnos  = studentProfiles.filter(p => p.subject_id === sub.id)
      const subProfes   = staffProfiles.filter(p => p.role === 'profesor' && p.subject_id === sub.id)
      const subSessions = sessBySubject[sub.id] ?? []

      const ses7d  = subSessions.filter(s => s.played_at >= sevenAgo)
      const ses30d = subSessions.filter(s => s.played_at >= thirtyAgo)

      const alumnosActivos = new Set(ses7d.map(s => s.user_id)).size

      // Última actividad por alumno
      const ultimaAct: Record<string, string> = {}
      for (const s of subSessions) {
        if (!ultimaAct[s.user_id] || s.played_at > ultimaAct[s.user_id]!)
          ultimaAct[s.user_id] = s.played_at
      }

      // Sesiones 30d por alumno
      const ses30dByUser: Record<string, typeof ses30d> = {}
      for (const s of ses30d) {
        if (!ses30dByUser[s.user_id]) ses30dByUser[s.user_id] = []
        ses30dByUser[s.user_id]!.push(s)
      }

      // Nota media (por alumno, luego media de medias)
      const notasPorAlumno = subAlumnos
        .map(a => {
          const sesSub = ses30dByUser[a.id] ?? []
          return sesSub.length ? sesSub.reduce((acc, s) => acc + s.score, 0) / sesSub.length : null
        })
        .filter((n): n is number => n !== null)
      const notaMedia = notasPorAlumno.length
        ? Math.round(notasPorAlumno.reduce((a, b) => a + b, 0) / notasPorAlumno.length)
        : null

      // Alumnos enriquecidos
      const alumnos = subAlumnos.map(a => {
        const sesSub     = ses30dByUser[a.id] ?? []
        const nota       = sesSub.length ? Math.round(sesSub.reduce((acc, s) => acc + s.score, 0) / sesSub.length) : null
        const ultima     = ultimaAct[a.id]
        const diasInact  = ultima
          ? Math.floor((now.getTime() - new Date(ultima).getTime()) / 86400000)
          : null
        const diasDesdeAlta = Math.floor((now.getTime() - new Date(a.created_at ?? now).getTime()) / 86400000)
        const enRiesgo   = ultima ? diasInact! > 3 : diasDesdeAlta >= 3
        return {
          id:          a.id,
          username:    a.username,
          fullName:    String(a.extended?.full_name ?? '') || null,
          mascota:     String(a.extended?.mascota   ?? '') || null,
          nota,
          sesiones:    sesSub.length,
          enRiesgo,
          diasInactivo:diasInact,
        }
      }).sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1))

      const enRiesgo = alumnos.filter(a => a.enRiesgo).length

      return {
        id:             sub.id,
        name:           sub.name,
        color:          sub.color,
        totalAlumnos:   subAlumnos.length,
        alumnosActivos,
        notaMedia,
        sesiones30d:    ses30d.length,
        enRiesgo,
        profesores:     subProfes.map(p => ({
          id:       p.id,
          username: p.username,
          fullName: String(p.extended?.full_name ?? '') || null,
        })),
        alumnos,
      }
    })
  }, [subjects, studentProfiles, staffProfiles, sessions])

  const sinAsignatura = useMemo(
    () => studentProfiles.filter(p => !p.subject_id).length,
    [studentProfiles]
  )

  if (!subjects.length) {
    return (
      <div className={styles.seccion}>
        <div className={styles.seccionHead}>
          <div className={styles.seccionHeadLeft}>
            <h2 className={styles.seccionTitle}>Asignaturas</h2>
            <span className={styles.seccionCount}>0</span>
          </div>
        </div>
        <div className={styles.emptyBlock}>
          <BookOpen size={28} strokeWidth={1.3} />
          <p>Esta academia aún no tiene asignaturas configuradas</p>
          <span className={styles.emptyHint}>Contacta con FrostFox Academy para añadir asignaturas a tu plan</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <div className={styles.seccionHeadLeft}>
          <h2 className={styles.seccionTitle}>Asignaturas</h2>
          <span className={styles.seccionCount}>{subjects.length}</span>
        </div>
      </div>

      <div className={styles.readonlyBanner}>
        <Info size={13} />
        <span>Las asignaturas las gestiona el administrador de FrostFox Academy. Si necesitas añadir, renombrar o eliminar una, escríbenos.</span>
      </div>

      <div className={asigStyles.asigGrid}>
        {subjectStats.map(s => {
          const isOpen   = expandedId === s.id
          const notaCol  = scoreColor(s.notaMedia)
          const pctAct   = s.totalAlumnos > 0 ? Math.round(s.alumnosActivos / s.totalAlumnos * 100) : 0

          return (
            <div key={s.id} className={[asigStyles.asigCard, isOpen ? asigStyles.asigCardOpen : ''].join(' ')}>

              {/* Cabecera */}
              <div className={asigStyles.asigCardHead}>
                <span className={asigStyles.asigDot} style={{ background: s.color }} />
                <span className={asigStyles.asigNombre}>{s.name}</span>
                {s.enRiesgo > 0 && (
                  <span className={asigStyles.asigRiesgoBadge}>
                    <AlertTriangle size={10} strokeWidth={2.5} />
                    {s.enRiesgo}
                  </span>
                )}
              </div>

              {/* KPIs */}
              <div className={asigStyles.asigKpis}>
                <div className={asigStyles.kpi}>
                  <span className={asigStyles.kpiVal}>{s.totalAlumnos}</span>
                  <span className={asigStyles.kpiLabel}><Users size={10} /> Alumnos</span>
                </div>
                <div className={asigStyles.kpiDivider} />
                <div className={asigStyles.kpi}>
                  <span className={asigStyles.kpiVal} style={{ color: '#0891B2' }}>{s.alumnosActivos}</span>
                  <span className={asigStyles.kpiLabel}><Zap size={10} /> Activos · {pctAct}%</span>
                </div>
                <div className={asigStyles.kpiDivider} />
                <div className={asigStyles.kpi}>
                  <span className={asigStyles.kpiVal} style={{ color: notaCol }}>
                    {s.notaMedia !== null ? `${s.notaMedia}%` : '—'}
                  </span>
                  <span className={asigStyles.kpiLabel}><Target size={10} /> Nota 30d</span>
                </div>
                <div className={asigStyles.kpiDivider} />
                <div className={asigStyles.kpi}>
                  <span className={asigStyles.kpiVal}>{s.sesiones30d}</span>
                  <span className={asigStyles.kpiLabel}>Sesiones</span>
                </div>
              </div>

              {/* Profesores */}
              {s.profesores.length > 0 && (
                <div className={asigStyles.asigProfes}>
                  <GraduationCap size={11} strokeWidth={2} className={asigStyles.asigProfesIcon} />
                  {s.profesores.map(p => (
                    <span key={p.id} className={asigStyles.asigProfeChip}>
                      {p.fullName ?? `@${p.username}`}
                    </span>
                  ))}
                </div>
              )}

              {/* Toggle alumnos */}
              <button
                className={asigStyles.asigToggle}
                onClick={() => setExpandedId(prev => prev === s.id ? null : s.id)}
                type="button"
              >
                <span>{isOpen ? 'Ocultar alumnos' : `Ver ${s.totalAlumnos} alumno${s.totalAlumnos !== 1 ? 's' : ''}`}</span>
                <span className={[asigStyles.asigToggleChev, isOpen ? asigStyles.asigToggleChevOpen : ''].join(' ')}>
                  <ChevronDown size={13} strokeWidth={2.5} />
                </span>
              </button>

              {/* Lista expandible */}
              {isOpen && (
                <div className={asigStyles.asigAlumnos}>
                  {s.alumnos.length === 0 ? (
                    <p className={asigStyles.asigEmpty}>Sin alumnos en esta asignatura</p>
                  ) : s.alumnos.map(a => {
                    const mascota = MASCOTAS[a.mascota ?? '']
                    const nombre  = a.fullName ?? a.username
                    const color   = scoreColor(a.nota)
                    return (
                      <div key={a.id} className={asigStyles.alumnoRow}>
                        <div className={asigStyles.alumnoAvatar}>
                          {mascota
                            ? <img src={mascota.img} alt={mascota.nombre} className={asigStyles.alumnoAvatarImg} />
                            : nombre[0]!.toUpperCase()
                          }
                        </div>
                        <div className={asigStyles.alumnoInfo}>
                          <span className={asigStyles.alumnoNombre}>{nombre}</span>
                          {a.fullName && <span className={asigStyles.alumnoUser}>@{a.username}</span>}
                        </div>
                        <span className={asigStyles.alumnoNota} style={{ color }}>
                          {a.nota !== null ? `${a.nota}%` : '—'}
                        </span>
                        <span className={asigStyles.alumnoSesiones}>{a.sesiones} ses.</span>
                        <span className={[asigStyles.alumnoEstado, a.enRiesgo ? asigStyles.alumnoEstadoRiesgo : asigStyles.alumnoEstadoOk].join(' ')}>
                          {a.enRiesgo
                            ? `${a.diasInactivo ?? '?'}d inactivo`
                            : 'Activo'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sinAsignatura > 0 && (
        <div className={styles.orphanNote}>
          <span className={styles.orphanDot} />
          <span>
            <strong>{sinAsignatura}</strong> alumno{sinAsignatura !== 1 ? 's' : ''} sin asignatura asignada.
            Puedes asignar una desde Códigos o editando el alumno.
          </span>
        </div>
      )}
    </div>
  )
}
