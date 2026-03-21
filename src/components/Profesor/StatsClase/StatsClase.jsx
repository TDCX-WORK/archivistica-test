import { useState } from 'react'
import { Users, BarChart2, TrendingUp, AlertTriangle, BookOpen, Zap, RefreshCw } from 'lucide-react'
import { useProfesor } from '../../../hooks/useProfesor'
import styles from './StatsClase.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────
// ID único por instancia para evitar conflictos de gradiente en múltiples donuts
let _donutId = 0

function DonutChart({ pct, color, size = 96, stroke = 10, label, sublabel }) {
  const id    = `donut-${++_donutId}`
  const cx    = size / 2
  const cy    = size / 2
  const r     = (size - stroke) / 2
  const circ  = 2 * Math.PI * r
  const ratio = Math.max(0, Math.min(pct / 100, 1))
  const fill  = ratio * circ

  // Para el glow: definimos un filtro blur suave
  const filterId  = `glow-${id}`
  const gradId    = `grad-${id}`

  return (
    <div className={styles.donutWrap}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          {/* Gradiente lineal para el arco: del color opaco al color 20% opaco (cola difuminada) */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={color} stopOpacity="0.15" />
            <stop offset="40%"  stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          {/* Filtro glow: blur suave que da halo al arco */}
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track de fondo */}
        <circle cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--line-light)"
          strokeWidth={stroke}
        />

        {/* Arco con glow (capa difuminada detrás) */}
        {ratio > 0 && (
          <circle cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke + 3}
            strokeDasharray={`${fill} ${circ - fill}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
            opacity="0.25"
            filter={`url(#${filterId})`}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
        )}

        {/* Arco principal con gradiente en el stroke */}
        {ratio > 0 && (
          <circle cx={cx} cy={cy} r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={`${fill} ${circ - fill}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
        )}

        {/* Punto brillante en la punta del arco */}
        {ratio > 0.02 && (() => {
          const angle = -Math.PI / 2 + ratio * 2 * Math.PI
          const px = cx + r * Math.cos(angle)
          const py = cy + r * Math.sin(angle)
          return (
            <circle cx={px} cy={py} r={stroke / 2 - 0.5}
              fill={color}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          )
        })()}

        {/* Texto central */}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fontSize={size * 0.185} fontWeight="800" fill="var(--ink)">
          {pct}%
        </text>
      </svg>
      <span className={styles.donutLabel}>{label}</span>
      {sublabel && <span className={styles.donutSublabel}>{sublabel}</span>}
    </div>
  )
}

function Barra({ label, value, max, color, showPct }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className={styles.barraRow}>
      <span className={styles.barraLabel}>{label}</span>
      <div className={styles.barraTrack}>
        <div className={styles.barraFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.barraVal}>{showPct ? `${value}%` : value}</span>
    </div>
  )
}

function SeccionCard({ title, children }) {
  return (
    <div className={styles.seccion}>
      <h3 className={styles.seccionTitle}>{title}</h3>
      {children}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function StatsClase({ currentUser }) {
  const { alumnos, statsClase, loading, error } = useProfesor(currentUser)

  if (loading) return (
    <div className={styles.loadingState}>
      <RefreshCw size={22} className={styles.spinner} />
      <p>Cargando estadísticas…</p>
    </div>
  )

  if (error) return (
    <div className={styles.errorState}>
      <AlertTriangle size={22} />
      <p>{error}</p>
    </div>
  )

  if (!alumnos.length) return (
    <div className={styles.emptyState}>
      <BarChart2 size={40} strokeWidth={1.2} />
      <p>Aún no hay alumnos en la clase.</p>
    </div>
  )

  const total       = alumnos.length
  const conNota     = alumnos.filter(a => a.notaMedia !== null)
  const activosPct  = Math.round((statsClase.alumnosActivos / total) * 100)
  const riesgoPct   = Math.round((statsClase.enRiesgo / total) * 100)
  const accesoPct   = Math.round(((total - statsClase.accesoExpirado) / total) * 100)

  // Distribución de notas
  const rangos = [
    { label: '0 – 40%',  color: '#DC2626', alumnos: conNota.filter(a => a.notaMedia <  40) },
    { label: '40 – 60%', color: '#B45309', alumnos: conNota.filter(a => a.notaMedia >= 40 && a.notaMedia < 60) },
    { label: '60 – 80%', color: '#0891B2', alumnos: conNota.filter(a => a.notaMedia >= 60 && a.notaMedia < 80) },
    { label: '80 – 100%',color: '#059669', alumnos: conNota.filter(a => a.notaMedia >= 80) },
  ]

  // Rankings
  const maxSesiones = Math.max(...alumnos.map(a => a.sesiones), 1)
  const maxTemas    = Math.max(...alumnos.map(a => a.temasLeidos), 1)
  const maxFallos   = Math.max(...alumnos.map(a => a.fallos), 1)
  const maxNota     = 100

  const porSesiones = [...alumnos].sort((a, b) => b.sesiones - a.sesiones)
  const porTemas    = [...alumnos].sort((a, b) => b.temasLeidos - a.temasLeidos)
  const porFallos   = [...alumnos].sort((a, b) => b.fallos - a.fallos)
  const porNota     = [...alumnos].sort((a, b) => (b.notaMedia ?? -1) - (a.notaMedia ?? -1))

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Estadísticas de la clase</h1>
        <p className={styles.pageSubtitle}>{total} alumno{total !== 1 ? 's' : ''} · Datos en tiempo real</p>
      </div>

      {/* ── Donuts resumen ── */}
      <SeccionCard title="Resumen general">
        <div className={styles.donutsGrid}>
          <DonutChart pct={activosPct}  color="#059669" label="Activos"     sublabel="última semana" />
          <DonutChart pct={statsClase.notaMediaClase ?? 0} color="#7C3AED" label="Nota media" sublabel="de la clase" />
          <DonutChart pct={riesgoPct}   color="#DC2626" label="En riesgo"   sublabel="inactivos +3d" />
          <DonutChart pct={accesoPct}   color="#0891B2" label="Con acceso"  sublabel="activo" />
        </div>
      </SeccionCard>

      {/* ── KPIs numéricos ── */}
      <div className={styles.kpisRow}>
        {[
          { icon: Users,         label: 'Total alumnos',       value: total,                         color: 'var(--primary)' },
          { icon: Zap,           label: 'Activos esta semana', value: statsClase.alumnosActivos,     color: '#059669' },
          { icon: AlertTriangle, label: 'En riesgo',           value: statsClase.enRiesgo,           color: '#DC2626' },
          { icon: BookOpen,      label: 'Media temas leídos',  value: statsClase.mediaTemasLeidos,   color: '#0891B2' },
          { icon: BarChart2,     label: 'Nota media clase',    value: `${statsClase.notaMediaClase ?? 0}%`, color: '#7C3AED' },
          { icon: TrendingUp,    label: 'Acceso expirado',     value: statsClase.accesoExpirado,     color: '#6B7280' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={styles.kpiCard} style={{ '--kpi-color': color }}>
            <Icon size={16} strokeWidth={1.8} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{value}</span>
            <span className={styles.kpiLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Distribución de notas ── */}
      {conNota.length > 0 && (
        <SeccionCard title="Distribución de notas">
          <div className={styles.rangosGrid}>
            {rangos.map(r => (
              <div key={r.label} className={styles.rangoCard} style={{ '--rango-color': r.color }}>
                <div className={styles.rangoNum} style={{ color: r.color }}>{r.alumnos.length}</div>
                <div className={styles.rangoLabel}>{r.label}</div>
                <div className={styles.rangoSub}>
                  {conNota.length > 0 ? Math.round((r.alumnos.length / conNota.length) * 100) : 0}% del total
                </div>
                <div className={styles.rangoBarTrack}>
                  <div className={styles.rangoBarFill} style={{
                    width: `${conNota.length > 0 ? (r.alumnos.length / conNota.length) * 100 : 0}%`,
                    background: r.color,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </SeccionCard>
      )}

      {/* ── Rankings ── */}
      <div className={styles.rankingsGrid}>
        <SeccionCard title="Nota media por alumno">
          <div className={styles.barrasList}>
            {porNota.map(a => (
              <Barra key={a.id} label={a.username}
                value={a.notaMedia ?? 0} max={maxNota} color="#7C3AED" showPct />
            ))}
          </div>
        </SeccionCard>

        <SeccionCard title="Sesiones completadas">
          <div className={styles.barrasList}>
            {porSesiones.map(a => (
              <Barra key={a.id} label={a.username}
                value={a.sesiones} max={maxSesiones} color="#059669" />
            ))}
          </div>
        </SeccionCard>

        <SeccionCard title="Temas leídos">
          <div className={styles.barrasList}>
            {porTemas.map(a => (
              <Barra key={a.id} label={a.username}
                value={a.temasLeidos} max={maxTemas} color="#0891B2" />
            ))}
          </div>
        </SeccionCard>

        <SeccionCard title="Preguntas falladas acumuladas">
          <div className={styles.barrasList}>
            {porFallos.map(a => (
              <Barra key={a.id} label={a.username}
                value={a.fallos} max={maxFallos} color="#DC2626" />
            ))}
          </div>
        </SeccionCard>
      </div>

      {/* ── Tabla resumen ── */}
      <SeccionCard title="Tabla resumen de alumnos">
        <div className={styles.tableWrap}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Nota media</th>
                <th>Sesiones</th>
                <th>Temas leídos</th>
                <th>Fallos</th>
                <th>Racha</th>
                <th>Último acceso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {porNota.map(a => (
                <tr key={a.id} className={a.enRiesgo ? styles.rowRiesgo : a.accesoExpirado ? styles.rowExpirado : ''}>
                  <td className={styles.tdNombre}>{a.username}</td>
                  <td className={styles.tdCentro}>
                    <span className={styles.notaBadge} style={{
                      background: a.notaMedia === null ? 'var(--surface-dim)' :
                        a.notaMedia >= 80 ? '#ECFDF5' : a.notaMedia >= 60 ? '#EFF6FF' :
                        a.notaMedia >= 40 ? '#FFF8E7' : '#FEF2F2',
                      color: a.notaMedia === null ? 'var(--ink-muted)' :
                        a.notaMedia >= 80 ? '#065F46' : a.notaMedia >= 60 ? '#1E40AF' :
                        a.notaMedia >= 40 ? '#92400E' : '#991B1B',
                    }}>
                      {a.notaMedia !== null ? `${a.notaMedia}%` : '—'}
                    </span>
                  </td>
                  <td className={styles.tdCentro}>{a.sesiones}</td>
                  <td className={styles.tdCentro}>{a.temasLeidos}</td>
                  <td className={styles.tdCentro}>{a.fallos}</td>
                  <td className={styles.tdCentro}>{a.racha}d</td>
                  <td className={styles.tdCentro}>
                    {a.diasInactivo === null ? 'Nunca' :
                     a.diasInactivo === 0 ? 'Hoy' :
                     a.diasInactivo === 1 ? 'Ayer' :
                     `Hace ${a.diasInactivo}d`}
                  </td>
                  <td className={styles.tdCentro}>
                    <span className={[
                      styles.estadoBadge,
                      a.accesoExpirado ? styles.estadoExpirado :
                      a.enRiesgo ? styles.estadoRiesgo : styles.estadoOk
                    ].join(' ')}>
                      {a.accesoExpirado ? 'Expirado' : a.enRiesgo ? 'En riesgo' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SeccionCard>
    </div>
  )
}
