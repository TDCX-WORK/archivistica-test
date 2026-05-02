import styles from './AcademiaSuspendidaPage.module.css'

interface Props {
  username: string
  onLogout: () => void
}

export default function AcademiaSuspendidaPage({ username, onLogout }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.emoji}>🔒</div>
      <h1 className={styles.title}>Academia suspendida</h1>
      <p className={styles.text}>
        Hola <strong>{username}</strong>, el acceso a tu academia está temporalmente suspendido.
      </p>
      <p className={styles.textSmall}>
        Contacta con tu academia para más información.
      </p>
      <button className={styles.btn} onClick={onLogout}>
        Cerrar sesión
      </button>
    </div>
  )
}
