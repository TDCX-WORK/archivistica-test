import { CalendarDays } from 'lucide-react'
import type { AlumnoConStats } from '../../../types'
import styles from './ProximosExamenes.module.css'

interface ProximosExamenesProps {
  alumnos: AlumnoConStats[]
}

export default function ProximosExamenes({ alumnos }: ProximosExamenesProps) {
  const hoy = new Date()
  const proximos = alumnos
    .filter(a => a.examDate)
    .map(a => ({
      nombre: a.fullName ?? a.username,
      fecha: a.examDate!,
      dias: Math.ceil((new Date(a.examDate!).getTime() - hoy.getTime()) / 86400000),
    }))
    .sort((a, b) => a.dias - b.dias)

  if (proximos.length === 0) {
    return (
      <div className={styles.examEmpty}>
        <CalendarDays size={22} strokeWidth={1.4} />
        <p>Sin fechas de examen registradas</p>
      </div>
    )
  }

  return (
    <div className={styles.examList}>
      {proximos.map((ex, i) => (
        <div key={i} className={styles.examRow}>
          <div className={styles.examDias} style={{
            color: ex.dias <= 14 ? '#DC2626' : ex.dias <= 30 ? '#D97706' : '#059669',
            background: ex.dias <= 14 ? '#FEF2F2' : ex.dias <= 30 ? '#FFFBEB' : '#ECFDF5',
          }}>
            {ex.dias}d
          </div>
          <div className={styles.examInfo}>
            <span className={styles.examNombre}>{ex.nombre}</span>
            <span className={styles.examFecha}>
              {new Date(ex.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
