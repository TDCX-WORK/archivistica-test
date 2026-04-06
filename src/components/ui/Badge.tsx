import styles from './Badge.module.css'

interface BadgeProps {
  children:  React.ReactNode
  color?:    string
}

export default function Badge({ children, color = 'sage' }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[color]].join(' ')}>
      {children}
    </span>
  )
}
