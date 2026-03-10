import styles from './ProgressBar.module.css'
export default function ProgressBar({ current, total, secsLeft, totalSecs }) {
  const pctProgress = total > 0 ? (current / total) * 100 : 0
  const pctTime = totalSecs > 0 ? (secsLeft / totalSecs) * 100 : 0
  const urgent = secsLeft < 120
  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pctProgress}%` }} />
      </div>
      <div className={[styles.bar, styles.barTime].join(' ')}>
        <div className={[styles.fill, styles.fillTime, urgent ? styles.fillUrgent : ''].join(' ')} style={{ width: `${pctTime}%` }} />
      </div>
    </div>
  )
}
