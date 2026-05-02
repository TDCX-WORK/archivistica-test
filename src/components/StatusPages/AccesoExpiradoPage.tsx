import { ShieldOff, LogOut } from 'lucide-react'
import styles from './AccesoExpiradoPage.module.css'

interface Props {
  username: string
  onLogout: () => void
}

export default function AccesoExpiradoPage({ username, onLogout }: Props) {
  return (
    <div className={styles.page}>
      <ShieldOff size={48} strokeWidth={1.2} className={styles.icon} />
      <h1 className={styles.title}>Tu acceso ha expirado</h1>
      <p className={styles.text}>
        Hola <strong>{username}</strong>, tu período de acceso ha finalizado. Contacta con tu academia para renovarlo.
      </p>
      <button className={styles.btn} onClick={onLogout}>
        <LogOut size={15} /> Cerrar sesión
      </button>
    </div>
  )
}
