import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  current:    number
  total:      number
  secsLeft:   number | null
  totalSecs:  number | null
}

export default function ProgressBar({ current, total, secsLeft, totalSecs }: ProgressBarProps) {
  const pctProgress = total > 0 ? (current / total) * 100 : 0
  const pctTime     = totalSecs && totalSecs > 0 && secsLeft !== null ? (secsLeft / totalSecs) * 100 : 0
  const urgent      = secsLeft !== null && secsLeft < 120
  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pctProgress}%` }} />
      </div>
      <div className={[styles.bar, styles.barTime].join(' ')}>
        <div className={[styles.fill, styles.fillTime, urgent ? styles.fillUrgent : ''].join(' ')}
          style={{ width: `${pctTime}%` }} />
      </div>
    </div>
  )
}
