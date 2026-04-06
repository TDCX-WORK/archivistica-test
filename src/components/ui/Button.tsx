import styles from './Button.module.css'

interface ButtonProps {
  children:   React.ReactNode
  variant?:   'primary' | 'secondary' | 'ghost' | 'danger'
  size?:      'sm' | 'md' | 'lg'
  onClick?:   () => void
  disabled?:  boolean
  fullWidth?: boolean
  type?:      'button' | 'submit' | 'reset'
}

export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  onClick,
  disabled,
  fullWidth,
  type      = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.full : '',
      ].join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
