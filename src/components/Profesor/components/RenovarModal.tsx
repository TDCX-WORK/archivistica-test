import { useState } from 'react'
import { RefreshCw, RotateCcw } from 'lucide-react'
import type { AlumnoConStats } from '../../../types'
import styles from './modalStyles.module.css'

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface RenovarModalProps {
  alumno:    AlumnoConStats
  onRenovar: (id: string, meses: number) => Promise<boolean | void>
  onClose:   () => void
}

export default function RenovarModal({ alumno, onRenovar, onClose }: RenovarModalProps) {
  const [meses,   setMeses]   = useState(3)
  const [loading, setLoading] = useState(false)

  const handleRenovar = async () => {
    setLoading(true)
    await onRenovar(alumno.id, meses)
    setLoading(false)
    onClose()
  }

  const base  = alumno.accessUntil && !alumno.accesoExpirado ? new Date(alumno.accessUntil) : new Date()
  const nueva = new Date(base)
  nueva.setMonth(nueva.getMonth() + meses)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Renovar acceso — {alumno.username}</h3>
        <p className={styles.modalSub}>
          {alumno.accesoExpirado
            ? 'El acceso de este alumno ha expirado.'
            : `Acceso actual hasta: ${formatFecha(alumno.accessUntil ?? null)}`}
        </p>
        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Meses a añadir</label>
          <div className={styles.pillarBtns}>
            {[1, 2, 3, 6, 12].map(m => (
              <button
                key={m}
                className={[styles.pillarBtn, meses === m ? styles.pillarBtnActive : ''].join(' ')}
                onClick={() => setMeses(m)}
              >
                {m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}
              </button>
            ))}
          </div>
        </div>
        <p className={styles.modalPreview}>
          Acceso hasta: <strong>{nueva.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleRenovar} disabled={loading}>
            {loading ? <RefreshCw size={14} className={styles.spinner} /> : <RotateCcw size={14} />} Renovar
          </button>
        </div>
      </div>
    </div>
  )
}
