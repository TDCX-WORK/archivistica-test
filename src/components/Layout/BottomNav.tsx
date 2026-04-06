import { Home, BarChart2, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import styles from './BottomNav.module.css'

interface Tab {
  id:    string
  icon:  LucideIcon
  label: string
}

const TABS: Tab[] = [
  { id: 'inicio',       icon: Home,      label: 'Inicio'  },
  { id: 'estudio',      icon: BookOpen,  label: 'Estudio' },
  { id: 'estadisticas', icon: BarChart2, label: 'Stats'   },
]

interface BottomNavProps {
  activeTab:    string
  onTabChange:  (id: string) => void
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={[styles.btn, activeTab === id ? styles.active : ''].join(' ')}
            onClick={() => onTabChange(id)}
          >
            <div className={styles.iconWrap}>
              <Icon size={22} strokeWidth={activeTab === id ? 2.2 : 1.7} />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
