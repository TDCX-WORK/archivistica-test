import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error:    Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <AlertTriangle size={40} strokeWidth={1.4} className={styles.icon} />
            <h2 className={styles.title}>Algo ha ido mal</h2>
            <p className={styles.message}>
              Ha ocurrido un error inesperado. Puedes intentar recargar la página.
            </p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={this.handleReload}>
                <RefreshCw size={15} />
                Recargar página
              </button>
              <button className={styles.secondaryBtn} onClick={this.handleRetry}>
                Reintentar sin recargar
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
