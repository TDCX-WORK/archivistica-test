import styles from './Badge.module.css'

export default function Badge({ children, color = 'sage' }) {
  return <span className={[styles.badge, styles[color]].join(' ')}>{children}</span>
}
