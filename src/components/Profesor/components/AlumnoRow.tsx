import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Zap, BookOpen, TrendingUp,
  AlertTriangle, Clock, Calendar, ShieldOff,
  RefreshCw, XCircle, RotateCcw, ExternalLink, MessageSquare
} from 'lucide-react'
import type { AlumnoConStats } from '../../../types'
import styles from './AlumnoRow.module.css'

function formatDias(n: number | null): string {
  if (n === null) return 'Nunca'
  if (n === 0)    return 'Hoy'
  if (n === 1)    return 'Ayer'
  return `Hace ${n} días`
}

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface AlumnoRowProps {
  alumno:    AlumnoConStats
  expanded:  boolean
  onToggle:  () => void
  onRenovar: (a: AlumnoConStats) => void
  onRevocar: (id: string) => Promise<boolean | void>
  onDetalle: (a: AlumnoConStats) => void
  onMensaje: (a: AlumnoConStats) => void
}

export default function AlumnoRow({ alumno, expanded, onToggle, onRenovar, onRevocar, onDetalle, onMensaje }: AlumnoRowProps) {
  const [revocando, setRevocando] = useState(false)
  const handleRevocar = async () => {
    if (!window.confirm(`¿Revocar acceso de ${alumno.username}? Dejará de poder entrar inmediatamente.`)) return
    setRevocando(true); await onRevocar(alumno.id); setRevocando(false)
  }

  const notaColor = alumno.notaMedia == null ? '#9CA3AF'
    : alumno.notaMedia >= 70 ? '#059669'
    : alumno.notaMedia >= 50 ? '#D97706'
    : '#DC2626'

  const avatarBg = alumno.accesoExpirado ? '#F3F4F6'
    : alumno.notaMedia == null ? '#F3F4F6'
    : alumno.notaMedia >= 70 ? '#ECFDF5'
    : alumno.notaMedia >= 50 ? '#FFFBEB'
    : '#FEF2F2'

  const avatarColor = alumno.accesoExpirado ? '#9CA3AF'
    : alumno.notaMedia == null ? '#6B7280'
    : notaColor

  const estadoLabel = alumno.accesoExpirado ? 'Expirado'
    : alumno.enRiesgo ? 'En riesgo'
    : alumno.diasInactivo === 0 ? 'Activo hoy'
    : alumno.proximoAExpirar ? `Expira en ${alumno.diasParaExpirar}d`
    : alumno.diasInactivo != null ? formatDias(alumno.diasInactivo)
    : 'Sin datos'

  const estadoCls = alumno.accesoExpirado ? styles.chipDanger
    : alumno.enRiesgo ? styles.chipWarning
    : alumno.diasInactivo === 0 ? styles.chipSuccess
    : alumno.proximoAExpirar ? styles.chipWarning
    : styles.chipMuted

  return (
    <div className={[styles.alumnoCard, expanded ? styles.alumnoCardOpen : ''].join(' ')}
      style={{ ['--ac' as string]: avatarColor }}>
      <button className={styles.alumnoHeader} onClick={onToggle}>
        <div className={styles.alumnoLeft}>
          <div className={styles.alumnoAvatar} style={{ background: avatarBg, color: avatarColor }}>
            {alumno.accesoExpirado ? <ShieldOff size={15} /> : alumno.username[0]!.toUpperCase()}
          </div>
          <div className={styles.alumnoInfo}>
            <div className={styles.alumnoNameRow}>
              <span className={styles.alumnoName}>{alumno.fullName || alumno.username}</span>
              <span className={[styles.alumnoChip, estadoCls].join(' ')}>{estadoLabel}</span>
            </div>
            <span className={styles.alumnoUsername}>@{alumno.username}{alumno.accessUntil ? ` · Hasta ${formatFecha(alumno.accessUntil)}` : ''}</span>
          </div>
        </div>
        <div className={styles.alumnoRight}>
          <span className={styles.alumnoNota} style={{ color: notaColor }}>{alumno.notaMedia !== null ? `${alumno.notaMedia}%` : '—'}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {expanded && (
        <div className={styles.alumnoDetail}>
          <div className={styles.detailKpis}>
            <div className={styles.detailKpi}>
              <span className={styles.detailKpiVal}>{alumno.sesiones}</span>
              <span className={styles.detailKpiLabel}>Sesiones</span>
            </div>
            <div className={styles.detailKpi}>
              <span className={styles.detailKpiVal}>{alumno.temasLeidos}</span>
              <span className={styles.detailKpiLabel}>Temas</span>
            </div>
            <div className={styles.detailKpi}>
              <span className={styles.detailKpiVal}>{alumno.racha}d</span>
              <span className={styles.detailKpiLabel}>Racha</span>
            </div>
            <div className={styles.detailKpi}>
              <span className={styles.detailKpiVal}>{alumno.fallos}</span>
              <span className={styles.detailKpiLabel}>Fallos</span>
            </div>
            <div className={styles.detailKpi}>
              <span className={styles.detailKpiVal}>{alumno.pendientesHoy}</span>
              <span className={styles.detailKpiLabel}>Pendientes</span>
            </div>
          </div>
          <div className={styles.detailActions}>
            <button className={styles.btnAction} onClick={() => onDetalle(alumno)}><ExternalLink size={12} /> Ver detalle</button>
            <button className={styles.btnAction} onClick={() => onMensaje(alumno)}><MessageSquare size={12} /> Mensaje</button>
            <button className={styles.btnAction} onClick={() => onRenovar(alumno)}><RotateCcw size={12} /> Renovar</button>
            <button className={[styles.btnAction, styles.btnDanger].join(' ')} onClick={handleRevocar} disabled={revocando}>
              {revocando ? <RefreshCw size={12} className={styles.spinner} /> : <XCircle size={12} />} Revocar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
