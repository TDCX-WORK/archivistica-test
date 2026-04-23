import { useState, useMemo } from 'react'
import {
  Search, X, ArrowUpDown, ArrowRight, ChevronDown,
  LayoutGrid, List, AlertTriangle, Clock, CheckCircle2, Users,
  Mail, Phone, MapPin, Calendar, Euro, ExternalLink
} from 'lucide-react'
import { scoreColor, MASCOTAS } from '../DirectorTypes'
import styles from './AlumnosTable.module.css'

// ── Types ──────────────────────────────────────────────────────────────────
interface SubjectStats {
  id:               string
  slug:             string
  name:             string
  color:            string
  totalAlumnos:     number
  alumnosActivos:   number
  notaMedia:        number | null
  sesiones30d:      number
  enRiesgo:         number
  porExpirar:       number
  alumnosConNota:   { id: string; username: string; nota: number | null; sesiones: number }[]
  alumnosEnRiesgo:  { id: string; username: string; diasInactivo: number | null }[]
  alumnosPorExpirar:{ id: string; username: string; diasRestantes: number }[]
  profesores:       { id: string; username: string; alumnos: number; notaMedia: number | null; sesionesThisWeek: number }[]
}

interface Stats {
  totalAlumnos:    number
  totalActivos:    number
  totalProfesores: number
  totalEnRiesgo:   number
  totalPorExpirar: number
  notaGlobal:      number | null
  sesiones30d:     number
  bySubject:       SubjectStats[]
  semanas:         { label: string; sesiones: number; alumnosActivos: number; notaMedia: number | null }[]
  profesorActivity?: {
    lastAvisoByProfesor:  Record<string, { created_at: string; title: string }>
    totalAvisosByProfesor:Record<string, number>
  }
  finanzas?: {
    mrrAcademia:           number
    mrrActivos:            number
    alumnosSinPrecio:      number
    totalAlumnosConPrecio: number
    spMap:                 Record<string, { monthly_price: number | null; exam_date: string | null; full_name: string | null; city: string | null; payment_status: string }>
    pagos: {
      pagados:     number
      pendientes:  number
      vencidos:    number
      mrrCobrado:  number
      mrrPendiente:number
      mrrVencido:  number
    }
  }
}

interface StudentProfile {
  id:            string
  username:      string
  role:          string
  access_until:  string | null
  created_at:    string | null
  subject_name?: string | null
  extended:      Record<string, any> | null
}

interface AlumnoEnriquecido {
  id:            string
  username:      string
  nota:          number | null
  sesiones:      number
  subjectName:   string
  subjectColor:  string
  enRiesgo:      boolean
  diasInactivo:  number | null
  diasRestantes: number | null
  extended:      Record<string, any> | null
  access_until:  string | null
  created_at:    string | null
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

type SortKey = 'nota' | 'sesiones' | 'nombre'
type Vista   = 'lista' | 'tarjetas'
type Filtro  = 'todos' | 'riesgo' | 'expirando' | 'activos' | `sub:${string}`

// ── AlumnosTable ───────────────────────────────────────────────────────────
function AlumnosTable({ stats, academyProfiles, onAlumnoClick }: {
  stats:           Stats
  academyProfiles: { studentProfiles: StudentProfile[]; staffProfiles: StudentProfile[] }
  onAlumnoClick:   (a: AlumnoEnriquecido) => void
}) {
  const [sortBy,    setSortBy]    = useState<SortKey>('nota')
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('desc')
  const [filtro,    setFiltro]    = useState<Filtro>('todos')
  const [busqueda,  setBusqueda]  = useState('')
  const [vista,     setVista]     = useState<Vista>('lista')
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [showSub,   setShowSub]   = useState(false)

  /* ── Construir lista enriquecida ── */
  const todos = useMemo<AlumnoEnriquecido[]>(() => {
    const spMap: Record<string, StudentProfile> = {}
    for (const sp of academyProfiles.studentProfiles) spMap[sp.id] = sp
    return stats.bySubject.flatMap(sub =>
      sub.alumnosConNota.map(a => ({
        ...a,
        subjectName:   sub.name,
        subjectColor:  sub.color ?? '#6B7280',
        enRiesgo:      sub.alumnosEnRiesgo.some(r => r.id === a.id),
        diasInactivo:  sub.alumnosEnRiesgo.find(r => r.id === a.id)?.diasInactivo ?? null,
        diasRestantes: sub.alumnosPorExpirar.find(r => r.id === a.id)?.diasRestantes ?? null,
        extended:      spMap[a.id]?.extended ?? null,
        access_until:  spMap[a.id]?.access_until ?? null,
        created_at:    spMap[a.id]?.created_at ?? null,
      }))
    )
  }, [stats, academyProfiles])

  /* ── Contadores globales (para chips) ── */
  const counts = useMemo(() => ({
    todos:     todos.length,
    riesgo:    todos.filter(a => a.enRiesgo).length,
    expirando: todos.filter(a => a.diasRestantes !== null && a.diasRestantes <= 14).length,
    activos:   todos.filter(a => !a.enRiesgo && a.sesiones > 0).length,
  }), [todos])

  /* ── Filtro + búsqueda + sort ── */
  const filtrados = useMemo(() => {
    let arr = todos
    if (filtro === 'riesgo')         arr = arr.filter(a => a.enRiesgo)
    else if (filtro === 'expirando') arr = arr.filter(a => a.diasRestantes !== null && a.diasRestantes <= 14)
    else if (filtro === 'activos')   arr = arr.filter(a => !a.enRiesgo && a.sesiones > 0)
    else if (typeof filtro === 'string' && filtro.startsWith('sub:')) {
      const subId = filtro.slice(4)
      const sub = stats.bySubject.find(s => s.id === subId)
      if (sub) arr = arr.filter(a => a.subjectName === sub.name)
    }

    const q = busqueda.trim().toLowerCase()
    if (q) {
      arr = arr.filter(a => {
        const nombre = String(a.extended?.full_name ?? '').toLowerCase()
        return a.username.toLowerCase().includes(q)
          || nombre.includes(q)
          || a.subjectName.toLowerCase().includes(q)
      })
    }

    return [...arr].sort((a, b) => {
      if (sortBy === 'nombre') {
        const an = String(a.extended?.full_name ?? a.username).toLowerCase()
        const bn = String(b.extended?.full_name ?? b.username).toLowerCase()
        return sortDir === 'desc' ? bn.localeCompare(an) : an.localeCompare(bn)
      }
      const va = (a as any)[sortBy] ?? -1
      const vb = (b as any)[sortBy] ?? -1
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [todos, filtro, busqueda, sortBy, sortDir, stats.bySubject])

  const handleSort = (col: SortKey) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const hayAsignaturasMultiples = stats.bySubject.length >= 2
  const subSeleccionada = typeof filtro === 'string' && filtro.startsWith('sub:')
    ? stats.bySubject.find(s => s.id === filtro.slice(4))
    : null

  return (
    <div className={styles.alumnosSection}>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nombre, usuario o asignatura…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className={styles.searchClear} onClick={() => setBusqueda('')} aria-label="Limpiar">
              <X size={12} />
            </button>
          )}
        </div>

        <div className={styles.vistaToggle} role="tablist" aria-label="Vista">
          <button
            className={[styles.vistaBtn, vista === 'lista' ? styles.vistaBtnActive : ''].join(' ')}
            onClick={() => setVista('lista')}
            aria-label="Vista en lista"
          >
            <List size={14} /> Lista
          </button>
          <button
            className={[styles.vistaBtn, vista === 'tarjetas' ? styles.vistaBtnActive : ''].join(' ')}
            onClick={() => setVista('tarjetas')}
            aria-label="Vista en tarjetas"
          >
            <LayoutGrid size={14} /> Tarjetas
          </button>
        </div>
      </div>

      {/* ── Chips de filtro ─────────────────────────────────── */}
      <div className={styles.chipsRow}>
        <button
          className={[styles.chip, filtro === 'todos' ? styles.chipActive : ''].join(' ')}
          onClick={() => setFiltro('todos')}
        >
          <Users size={12} />
          Todos
          <span className={styles.chipCount}>{counts.todos}</span>
        </button>
        <button
          className={[styles.chip, styles.chipDanger, filtro === 'riesgo' ? styles.chipDangerActive : ''].join(' ')}
          onClick={() => setFiltro('riesgo')}
          disabled={counts.riesgo === 0}
        >
          <AlertTriangle size={12} />
          En riesgo
          <span className={styles.chipCount}>{counts.riesgo}</span>
        </button>
        <button
          className={[styles.chip, styles.chipAmber, filtro === 'expirando' ? styles.chipAmberActive : ''].join(' ')}
          onClick={() => setFiltro('expirando')}
          disabled={counts.expirando === 0}
        >
          <Clock size={12} />
          Expirando
          <span className={styles.chipCount}>{counts.expirando}</span>
        </button>
        <button
          className={[styles.chip, styles.chipOk, filtro === 'activos' ? styles.chipOkActive : ''].join(' ')}
          onClick={() => setFiltro('activos')}
        >
          <CheckCircle2 size={12} />
          Activos
          <span className={styles.chipCount}>{counts.activos}</span>
        </button>

        {hayAsignaturasMultiples && (
          <div className={styles.subDropdownWrap}>
            <button
              className={[styles.chip, subSeleccionada ? styles.chipSubActive : ''].join(' ')}
              onClick={() => setShowSub(v => !v)}
              style={subSeleccionada ? { ['--sc' as string]: subSeleccionada.color } : undefined}
            >
              {subSeleccionada && <span className={styles.chipDot} style={{ background: subSeleccionada.color }} />}
              {subSeleccionada ? subSeleccionada.name : 'Por asignatura'}
              <ChevronDown size={10} />
            </button>
            {showSub && (
              <div className={styles.subDropdown}>
                {stats.bySubject.map(s => (
                  <button key={s.id}
                    className={styles.subDropdownItem}
                    onClick={() => { setFiltro(`sub:${s.id}`); setShowSub(false) }}>
                    <span className={styles.chipDot} style={{ background: s.color }} />
                    {s.name}
                    <span className={styles.subDropdownCount}>{s.totalAlumnos}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.sortGroup}>
          <span className={styles.sortLabel}>Ordenar</span>
          {(['nota', 'sesiones', 'nombre'] as SortKey[]).map(k => (
            <button key={k}
              className={[styles.sortChip, sortBy === k ? styles.sortChipActive : ''].join(' ')}
              onClick={() => handleSort(k)}>
              {k === 'nota' ? 'Nota' : k === 'sesiones' ? 'Sesiones' : 'Nombre'}
              {sortBy === k && <ArrowUpDown size={10} style={{ transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido ───────────────────────────────────────── */}
      {filtrados.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={32} strokeWidth={1.3} />
          <p>{busqueda ? 'No se encontraron alumnos con ese término' : 'No hay alumnos en este filtro'}</p>
          {(busqueda || filtro !== 'todos') && (
            <button className={styles.emptyReset} onClick={() => { setBusqueda(''); setFiltro('todos') }}>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : vista === 'lista' ? (
        <div className={styles.listaWrap}>
          {filtrados.map(a => (
            <AlumnoCardLista
              key={a.id}
              alumno={a}
              expanded={expanded === a.id}
              onToggle={() => setExpanded(prev => prev === a.id ? null : a.id)}
              onAbrirFicha={() => onAlumnoClick(a)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.gridWrap}>
          {filtrados.map(a => (
            <AlumnoCardGrid
              key={a.id}
              alumno={a}
              onAbrirFicha={() => onAlumnoClick(a)}
            />
          ))}
        </div>
      )}

      {filtrados.length > 0 && (
        <div className={styles.footerCount}>
          Mostrando <strong>{filtrados.length}</strong> de {counts.todos} alumnos
        </div>
      )}
    </div>
  )
}

/* ── Card de lista (expandible) ───────────────────────────────────────── */
function AlumnoCardLista({ alumno: a, expanded, onToggle, onAbrirFicha }: {
  alumno: AlumnoEnriquecido
  expanded: boolean
  onToggle: () => void
  onAbrirFicha: () => void
}) {
  const mascota = MASCOTAS[String(a.extended?.mascota ?? '')]
  const nombre  = String(a.extended?.full_name ?? '') || a.username
  const color   = scoreColor(a.nota)
  const notaPct = a.nota !== null ? Math.max(0, Math.min(100, a.nota)) : 0

  const isExpirando = a.diasRestantes !== null && a.diasRestantes <= 14 && a.diasRestantes >= 0
  const isExpirado  = a.diasRestantes !== null && a.diasRestantes < 0

  return (
    <div className={[styles.cardLista, expanded ? styles.cardListaOpen : ''].join(' ')}>
      <button className={styles.cardListaRow} onClick={onToggle}>
        <div className={styles.subjectBar} style={{ background: a.subjectColor }} />

        <div className={styles.avatar} style={{ background: color + '1E', color }}>
          {mascota ? <span className={styles.avatarEmoji}>{mascota.emoji}</span> : nombre[0]!.toUpperCase()}
        </div>

        <div className={styles.info}>
          <div className={styles.infoTop}>
            <span className={styles.nombre}>{nombre}</span>
            {a.extended?.full_name && <span className={styles.usernameSoft}>@{a.username}</span>}
          </div>
          <div className={styles.infoBottom}>
            <span className={styles.subjectChip}>
              <span className={styles.chipDot} style={{ background: a.subjectColor }} />
              {a.subjectName}
            </span>
            {a.enRiesgo && (
              <span className={styles.estadoRiesgo}>
                <AlertTriangle size={10} />
                {a.diasInactivo ?? '?'}d inactivo
              </span>
            )}
            {!a.enRiesgo && isExpirando && (
              <span className={styles.estadoAmber}>
                <Clock size={10} />
                Expira en {a.diasRestantes}d
              </span>
            )}
            {isExpirado && (
              <span className={styles.estadoRiesgo}>
                <Clock size={10} />
                Expirado
              </span>
            )}
            {!a.enRiesgo && !isExpirando && !isExpirado && a.sesiones > 0 && (
              <span className={styles.estadoOk}>
                <CheckCircle2 size={10} />
                Activo
              </span>
            )}
          </div>
        </div>

        <div className={styles.notaBlock}>
          <div className={styles.notaVal} style={{ color }}>
            {a.nota !== null ? `${a.nota}%` : '—'}
          </div>
          <div className={styles.notaBarWrap}>
            <div className={styles.notaBar} style={{ width: `${notaPct}%`, background: color }} />
          </div>
        </div>

        <div className={styles.sesionesBlock}>
          <span className={styles.sesionesVal}>{a.sesiones}</span>
          <span className={styles.sesionesLabel}>sesiones</span>
        </div>

        <ChevronDown size={16} className={[styles.chevron, expanded ? styles.chevronOpen : ''].join(' ')} />
      </button>

      {expanded && (
        <div className={styles.expanded}>
          <div className={styles.metaGrid}>
            <MetaItem icon={Mail}     label="Email"         value={String(a.extended?.email_contact ?? '—')} />
            <MetaItem icon={Phone}    label="Teléfono"      value={String(a.extended?.phone ?? '—')} />
            <MetaItem icon={MapPin}   label="Ciudad"        value={String(a.extended?.city ?? '—')} />
            <MetaItem icon={Calendar} label="Fecha examen"  value={fmtFecha(a.extended?.exam_date)} />
            <MetaItem icon={Euro}     label="Cuota"         value={a.extended?.monthly_price ? `${a.extended.monthly_price} €/mes` : '—'} />
            <MetaItem icon={Calendar} label="Acceso hasta"  value={fmtFecha(a.access_until)} />
          </div>
          <button className={styles.fichaBtn} onClick={onAbrirFicha}>
            <ExternalLink size={12} />
            Ver ficha completa
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Card de grid (vista tarjetas) ────────────────────────────────────── */
function AlumnoCardGrid({ alumno: a, onAbrirFicha }: {
  alumno: AlumnoEnriquecido
  onAbrirFicha: () => void
}) {
  const mascota = MASCOTAS[String(a.extended?.mascota ?? '')]
  const nombre  = String(a.extended?.full_name ?? '') || a.username
  const color   = scoreColor(a.nota)
  const notaPct = a.nota !== null ? Math.max(0, Math.min(100, a.nota)) : 0

  const isExpirando = a.diasRestantes !== null && a.diasRestantes <= 14 && a.diasRestantes >= 0
  const isExpirado  = a.diasRestantes !== null && a.diasRestantes < 0

  return (
    <button className={styles.cardGrid} onClick={onAbrirFicha}>
      <div className={styles.cardGridTop} style={{ background: `linear-gradient(135deg, ${a.subjectColor}20, ${a.subjectColor}06)` }}>
        <span className={styles.subjectChipGrid}>
          <span className={styles.chipDot} style={{ background: a.subjectColor }} />
          {a.subjectName}
        </span>
        <div className={styles.avatarGrid} style={{ background: color + '1E', color, borderColor: color + '55' }}>
          {mascota ? <span className={styles.avatarEmoji}>{mascota.emoji}</span> : nombre[0]!.toUpperCase()}
        </div>
      </div>

      <div className={styles.cardGridBody}>
        <div className={styles.cardGridName}>{nombre}</div>
        {a.extended?.full_name && <div className={styles.cardGridUsername}>@{a.username}</div>}

        <div className={styles.cardGridNotaRow}>
          <span className={styles.cardGridNota} style={{ color }}>
            {a.nota !== null ? `${a.nota}%` : '—'}
          </span>
          <div className={styles.notaBarWrap}>
            <div className={styles.notaBar} style={{ width: `${notaPct}%`, background: color }} />
          </div>
        </div>

        <div className={styles.cardGridStats}>
          <div className={styles.cardGridStat}>
            <span className={styles.cardGridStatVal}>{a.sesiones}</span>
            <span className={styles.cardGridStatLabel}>sesiones</span>
          </div>
          <div className={styles.cardGridStatDivider} />
          <div className={styles.cardGridStat}>
            {a.enRiesgo ? (
              <>
                <span className={styles.cardGridStatVal} style={{ color: '#DC2626' }}>{a.diasInactivo ?? '?'}d</span>
                <span className={styles.cardGridStatLabel}>inactivo</span>
              </>
            ) : isExpirando ? (
              <>
                <span className={styles.cardGridStatVal} style={{ color: '#D97706' }}>{a.diasRestantes}d</span>
                <span className={styles.cardGridStatLabel}>para expirar</span>
              </>
            ) : isExpirado ? (
              <>
                <span className={styles.cardGridStatVal} style={{ color: '#DC2626' }}>—</span>
                <span className={styles.cardGridStatLabel}>expirado</span>
              </>
            ) : (
              <>
                <span className={styles.cardGridStatVal} style={{ color: '#059669' }}>OK</span>
                <span className={styles.cardGridStatLabel}>activo</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.cardGridFoot}>
        Ver ficha
        <ArrowRight size={12} />
      </div>
    </button>
  )
}

/* ── MetaItem helper ──────────────────────────────────────────────────── */
function MetaItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className={styles.metaItem}>
      <Icon size={12} className={styles.metaIcon} />
      <div className={styles.metaText}>
        <span className={styles.metaLabel}>{label}</span>
        <span className={styles.metaValue}>{value}</span>
      </div>
    </div>
  )
}

export { AlumnosTable }
