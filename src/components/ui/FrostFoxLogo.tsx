import negroLine from '../../assets/negroline.webp'
import blancoLine from '../../assets/blancoline.webp'
import styles from './FrostFoxLogo.module.css'

type LogoSize = 'sm' | 'md' | 'lg'

interface SizeConfig {
  img:  number
  name: string
  sub:  string
}

const SIZES: Record<LogoSize, SizeConfig> = {
  sm: { img: 32,  name: '0.85rem', sub: '0.65rem' },
  md: { img: 100, name: '1.1rem',  sub: '0.82rem' },
  lg: { img: 110, name: '1.3rem',  sub: '1rem'    },
}

interface FrostFoxLogoProps {
  size?:      LogoSize
  className?: string
}

export default function FrostFoxLogo({ size = 'md', className = '' }: FrostFoxLogoProps) {
  const s = SIZES[size]
  return (
    <div className={[styles.wrap, className].join(' ')}>
      <img
        src={negroLine} alt="FrostFox"
        className={[styles.img, styles.imgLight].join(' ')}
        style={{ height: s.img, marginRight: '-0.6rem' }}
      />
      <img
        src={blancoLine} alt="FrostFox"
        className={[styles.img, styles.imgDark].join(' ')}
        style={{ height: s.img, marginRight: '-0.6rem' }}
      />
      <div className={styles.divider} />
      <div className={styles.text}>
        <span className={styles.name} style={{ fontSize: s.name }}>FrostFox</span>
        <span className={styles.sub}  style={{ fontSize: s.sub  }}>Academy</span>
      </div>
    </div>
  )
}
