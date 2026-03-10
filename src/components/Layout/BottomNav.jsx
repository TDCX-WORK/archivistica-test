import { Home, BarChart2 } from 'lucide-react'
import styles from './BottomNav.module.css'

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className={styles.nav}>
      <button
        className={[styles.btn, activeTab === 'inicio' ? styles.active : ''].join(' ')}
        onClick={() => onTabChange('inicio')}
      >
        <Home size={20} strokeWidth={1.8} />
        <span>Inicio</span>
      </button>
      <button
        className={[styles.btn, activeTab === 'estadisticas' ? styles.active : ''].join(' ')}
        onClick={() => onTabChange('estadisticas')}
      >
        <BarChart2 size={20} strokeWidth={1.8} />
        <span>Estadísticas</span>
      </button>
    </nav>
  )
}
