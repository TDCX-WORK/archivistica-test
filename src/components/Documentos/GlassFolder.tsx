import type { LucideIcon } from 'lucide-react'
import styles from './GlassFolder.module.css'

export type FolderColor =
  | 'purple' | 'dark' | 'blue' | 'red' | 'amber'
  | 'redPastel' | 'greenPastel' | 'bluePastel'

interface GlassFolderProps {
  label:    string
  sublabel: string
  count:    number
  color:    FolderColor
  onClick?: () => void
  isOpen?:  boolean
  icon?:    LucideIcon   // si se pasa, reemplaza las líneas del papel central por el icono
}

const colorClass: Record<FolderColor, string> = {
  purple:      styles.folderPurple      ?? '',
  dark:        styles.folderDark        ?? '',
  blue:        styles.folderBlue        ?? '',
  red:         styles.folderRed         ?? '',
  amber:       styles.folderAmber       ?? '',
  redPastel:   styles.folderRedPastel   ?? '',
  greenPastel: styles.folderGreenPastel ?? '',
  bluePastel:  styles.folderBluePastel  ?? '',
}

export default function GlassFolder({
  label,
  sublabel,
  count,
  color,
  onClick,
  isOpen = false,
  icon: Icon,
}: GlassFolderProps) {
  // Modo outline (Acciones): solo contornos + icono encima. Sin papeles ni glass.
  if (Icon) {
    return (
      <div
        className={[styles.folderOutline, colorClass[color]].join(' ')}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
        aria-label={`Carpeta ${label}`}
        data-open={isOpen ? 'true' : 'false'}
      >
        {/* SVG con la silueta de carpeta (pestaña + cuerpo) */}
        <svg className={styles.outlineSvg} viewBox="0 0 140 140" fill="none" aria-hidden="true">
          <path
            d="M14 34 Q14 22 26 22 L58 22 Q64 22 68 28 L72 34 L114 34 Q126 34 126 46 L126 114 Q126 126 114 126 L26 126 Q14 126 14 114 Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>

        {/* Icono centrado encima del cuerpo */}
        <div className={styles.outlineIconWrap}>
          <Icon size={34} strokeWidth={1.8} className={styles.outlineIcon} />
        </div>

        {/* Label + contador debajo */}
        <div className={styles.outlineText}>
          <span className={styles.outlineLabel}>{label}</span>
          <span className={styles.outlineSublabel}>{count} · {sublabel}</span>
        </div>
      </div>
    )
  }

  // Modo original (Documentos): cuerpo sólido + papeles + glass
  return (
    <div
      className={[styles.folder, colorClass[color]].join(' ')}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      aria-label={`Carpeta ${label}`}
    >
      {/* Capa 1 — cuerpo sólido */}
      <div className={styles.body} />

      {/* Capa 2 — documentos que asoman */}
      <div className={styles.docs}>
        {[0, 1, 2].map(i => (
          <div key={i} className={styles.doc}>
            {[0, 1, 2, 3].map(j => (
              <div
                key={j}
                className={styles.docLine}
                style={{ width: j === 0 ? '50%' : j === 1 ? '85%' : j === 2 ? '70%' : '78%' }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Capa 3 — tapa glass */}
      <div className={styles.glassFront}>
        <span className={styles.folderLabel}>{label}</span>
        <span className={styles.folderSublabel}>{count} · {sublabel}</span>
      </div>
    </div>
  )
}
