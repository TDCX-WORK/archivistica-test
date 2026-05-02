import logoAzul from '../../assets/azul.webp'
import styles from './SplashLoader.module.css'

interface Props {
  /** Mostrar versión compacta (sin texto, solo logo + barra) para usar dentro de páginas */
  compact?: boolean
}

export default function SplashLoader({ compact = false }: Props) {
  return (
    <div className={compact ? styles.compact : styles.full}>
      <div className={styles.content}>
        <img src={logoAzul} alt="FrostFox" className={styles.logo} />
        {!compact && (
          <div className={styles.text}>
            <span className={styles.name}>FrostFox</span>
            <span className={styles.sub}>Academy</span>
          </div>
        )}
        <div className={styles.bar}>
          <div className={styles.barFill} />
        </div>
      </div>
    </div>
  )
}
