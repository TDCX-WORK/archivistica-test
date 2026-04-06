import { RefreshCw, WifiOff } from 'lucide-react'
import styles from './ErrorState.module.css'

interface ErrorStateProps {
  message?:  string
  onRetry?:  () => void
  compact?:  boolean
}

export default function ErrorState({
  message  = 'Algo ha ido mal. Comprueba tu conexión e inténtalo de nuevo.',
  onRetry,
  compact  = false,
}: ErrorStateProps) {
  return (
    <div className={compact ? styles.compact : styles.page}>
      <WifiOff size={compact ? 22 : 32} strokeWidth={1.4} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          <RefreshCw size={14} />
          Reintentar
        </button>
      )}
    </div>
  )
}
