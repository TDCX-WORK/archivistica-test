import { useState } from 'react'
import { RefreshCw, Key, Copy, Check } from 'lucide-react'
import styles from './modalStyles.module.css'
import s from './GenerarCodigoModal.module.css'

interface GenerarCodigoModalProps {
  onGenerar: (dias: number, meses: number) => Promise<string | null>
  onClose:   () => void
}

export default function GenerarCodigoModal({ onGenerar, onClose }: GenerarCodigoModalProps) {
  const [diasCodigo,   setDiasCodigo]   = useState(30)
  const [accessMonths, setAccessMonths] = useState(3)
  const [loading,      setLoading]      = useState(false)
  const [codigoCreado, setCodigoCreado] = useState<string | null>(null)
  const [copied,       setCopied]       = useState(false)

  const handleGenerar = async () => {
    setLoading(true)
    const code = await onGenerar(diasCodigo, accessMonths)
    if (code) setCodigoCreado(code)
    setLoading(false)
  }

  const handleCopy = () => {
    if (!codigoCreado) return
    navigator.clipboard.writeText(codigoCreado)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (codigoCreado) return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Código generado ✓</h3>
        <div className={s.codigoGenerado}>
          <span className={s.codigoTexto}>{codigoCreado}</span>
          <button className={s.copyBtn} onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <p className={styles.modalPreview}>
          Registro: <strong>{diasCodigo} días</strong> · Acceso: <strong>{accessMonths === 12 ? '1 año' : `${accessMonths} meses`}</strong>
        </p>
        <button className={styles.btnPrimary} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Nuevo código de invitación</h3>
        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Tiempo para registrarse</label>
          <div className={styles.pillarBtns}>
            {[7, 15, 30].map(d => (
              <button key={d}
                className={[styles.pillarBtn, diasCodigo === d ? styles.pillarBtnActive : ''].join(' ')}
                onClick={() => setDiasCodigo(d)}>
                {d} días
              </button>
            ))}
          </div>
        </div>
        <div className={styles.modalField}>
          <label className={styles.modalLabel}>Duración del acceso</label>
          <div className={styles.pillarBtns}>
            {[1, 2, 3, 6, 12].map(m => (
              <button key={m}
                className={[styles.pillarBtn, accessMonths === m ? styles.pillarBtnActive : ''].join(' ')}
                onClick={() => setAccessMonths(m)}>
                {m === 12 ? '1 año' : `${m} mes${m > 1 ? 'es' : ''}`}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleGenerar} disabled={loading}>
            {loading ? <RefreshCw size={14} className={s.spinner} /> : <Key size={14} />} Generar código
          </button>
        </div>
      </div>
    </div>
  )
}
