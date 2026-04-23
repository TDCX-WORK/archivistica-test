import { useMemo } from 'react'
import { BookOpen, Info, Users, GraduationCap } from 'lucide-react'
import type { AlumnoConExtended, StaffConExtended } from '../../../types'
import styles from '../GestionAcademia/GestionAcademia.module.css'

interface Subject { id: string; name: string; color: string; slug: string }

export function SeccionAsignaturas({
  subjects,
  studentProfiles,
  staffProfiles,
}: {
  subjects:        Subject[]
  studentProfiles: AlumnoConExtended[]
  staffProfiles:   StaffConExtended[]
}) {
  const stats = useMemo(() => {
    // Para cada asignatura, contar alumnos y profesores asignados
    const result = subjects.map(s => {
      const alumnos    = studentProfiles.filter(p => p.subject_id === s.id).length
      const profesores = staffProfiles.filter(p => p.role === 'profesor' && p.subject_id === s.id).length
      return { ...s, alumnos, profesores }
    })
    // Alumnos sin asignatura (para mostrar como "huérfanos")
    const sinAsignatura = studentProfiles.filter(p => !p.subject_id).length
    return { subjects: result, sinAsignatura }
  }, [subjects, studentProfiles, staffProfiles])

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

      <div className={styles.subjectsGrid}>
        {stats.subjects.map(s => (
          <div key={s.id} className={styles.subjectCard} style={{ ['--sc' as string]: s.color }}>
            <div className={styles.subjectBar} />
            <div className={styles.subjectBody}>
              <div className={styles.subjectHead}>
                <span className={styles.subjectName}>{s.name}</span>
                <code className={styles.subjectSlug}>{s.slug}</code>
              </div>

              <div className={styles.subjectKpis}>
                <div className={styles.subjectKpi}>
                  <div className={styles.subjectKpiHead}>
                    <Users size={11} strokeWidth={2.2} />
                    <span className={styles.subjectKpiLabel}>Alumnos</span>
                  </div>
                  <span className={styles.subjectKpiVal}>{s.alumnos}</span>
                </div>
                <div className={styles.subjectKpi}>
                  <div className={styles.subjectKpiHead}>
                    <GraduationCap size={11} strokeWidth={2.2} />
                    <span className={styles.subjectKpiLabel}>Profesores</span>
                  </div>
                  <span className={styles.subjectKpiVal}>{s.profesores}</span>
                </div>
              </div>

              <div className={styles.subjectColorRow}>
                <span className={styles.subjectColorDot} style={{ background: s.color }} />
                <span className={styles.subjectColorHex}>{s.color}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.sinAsignatura > 0 && (
        <div className={styles.orphanNote}>
          <span className={styles.orphanDot} />
          <span>
            <strong>{stats.sinAsignatura}</strong> alumno{stats.sinAsignatura !== 1 ? 's' : ''} sin asignatura asignada.
            Puedes asignar una desde Códigos o editando el alumno.
          </span>
        </div>
      )}
    </div>
  )
}
