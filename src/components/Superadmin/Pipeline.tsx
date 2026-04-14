import { useState } from 'react'
import {
  Target, Plus, Phone, Mail, Globe, MapPin, Calendar,
  Edit3, Trash2, ExternalLink, Check, X, ChevronDown,
  MessageSquare, Map, RefreshCw
} from 'lucide-react'
import { usePipeline } from '../../hooks/usePipeline'
import type { Prospect, ProspectEstado } from '../../hooks/usePipeline'
import styles from './Pipeline.module.css'

// ── Config estados ─────────────────────────────────────────────────────────
const ESTADOS: Record<ProspectEstado, { label: string; color: string; bg: string; dot: string }> = {
  nueva:       { label: 'Nueva',        color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  dot: '#6366F1' },
  llamar:      { label: 'Llamar',       color: '#D97706', bg: 'rgba(217,119,6,0.1)',   dot: '#D97706' },
  llamada:     { label: 'Llamada',      color: '#0891B2', bg: 'rgba(8,145,178,0.1)',   dot: '#0891B2' },
  visitar:     { label: 'Visitar',      color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',  dot: '#7C3AED' },
  visitada:    { label: 'Visitada',     color: '#059669', bg: 'rgba(5,150,105,0.1)',   dot: '#059669' },
  demo:        { label: 'Demo activa',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  dot: '#F59E0B' },
  negociando:  { label: 'Negociando',   color: '#EC4899', bg: 'rgba(236,72,153,0.1)',  dot: '#EC4899' },
  cliente:     { label: 'Cliente ✓',   color: '#059669', bg: 'rgba(5,150,105,0.12)',  dot: '#059669' },
  descartada:  { label: 'Descartada',   color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)', dot: '#9CA3AF' },
}

const ESTADO_ORDER: ProspectEstado[] = [
  'nueva','llamar','llamada','visitar','visitada','demo','negociando','cliente','descartada'
]

function fmtFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasRestantes(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (diff < 0)  return { text: `Hace ${Math.abs(diff)}d`, urgente: true }
  if (diff === 0) return { text: 'Hoy', urgente: true }
  if (diff === 1) return { text: 'Mañana', urgente: true }
  return { text: `En ${diff}d`, urgente: false }
}

// ── Form modal ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nombre: '', ciudad: '', telefono: '', email: '',
  web: '', maps_url: '', estado: 'nueva' as ProspectEstado,
  fecha_accion: '', notas: '',
}

function ModalProspect({
  prospect, onSave, onClose
}: {
  prospect?: Prospect
  onSave: (data: any) => Promise<{ error?: string }>
  onClose: () => void
}) {
  const [form, setForm]       = useState(prospect ? {
    nombre:       prospect.nombre,
    ciudad:       prospect.ciudad ?? '',
    telefono:     prospect.telefono ?? '',
    email:        prospect.email ?? '',
    web:          prospect.web ?? '',
    maps_url:     prospect.maps_url ?? '',
    estado:       prospect.estado,
    fecha_accion: prospect.fecha_accion ?? '',
    notas:        prospect.notas ?? '',
  } : EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    const payload = {
      ...form,
      fecha_accion: form.fecha_accion || null,
      ciudad:       form.ciudad || null,
      telefono:     form.telefono || null,
      email:        form.email || null,
      web:          form.web || null,
      maps_url:     form.maps_url || null,
      notas:        form.notas || null,
    }
    const res = await onSave(payload)
    setSaving(false)
    if (res.error) setError(res.error)
    else onClose()
  }

  const needsFecha = ['llamar','visitar','demo'].includes(form.estado)
  const fechaLabel = form.estado === 'llamar' ? 'Fecha de llamada' :
                     form.estado === 'visitar' ? 'Fecha de visita' :
                     'Demo hasta'

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <span>{prospect ? 'Editar academia' : 'Nueva academia prospecto'}</span>
          <button className={styles.modalClose} onClick={onClose}><X size={16}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formField} style={{gridColumn:'1/-1'}}>
              <label>Nombre *</label>
              <input value={form.nombre} onChange={e=>set('nombre',e.target.value)}
                placeholder="Academia Ejemplo Madrid" autoFocus/>
            </div>
            <div className={styles.formField}>
              <label>Ciudad</label>
              <input value={form.ciudad} onChange={e=>set('ciudad',e.target.value)} placeholder="Madrid"/>
            </div>
            <div className={styles.formField}>
              <label>Teléfono</label>
              <input value={form.telefono} onChange={e=>set('telefono',e.target.value)} placeholder="612 345 678"/>
            </div>
            <div className={styles.formField}>
              <label>Email</label>
              <input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="info@academia.com" type="email"/>
            </div>
            <div className={styles.formField}>
              <label>Web</label>
              <input value={form.web} onChange={e=>set('web',e.target.value)} placeholder="https://academia.com"/>
            </div>
            <div className={styles.formField} style={{gridColumn:'1/-1'}}>
              <label>URL Google Maps</label>
              <input value={form.maps_url} onChange={e=>set('maps_url',e.target.value)} placeholder="https://maps.google.com/..."/>
            </div>
            <div className={styles.formField}>
              <label>Estado</label>
              <select value={form.estado} onChange={e=>set('estado', e.target.value)}>
                {ESTADO_ORDER.map(e => (
                  <option key={e} value={e}>{ESTADOS[e].label}</option>
                ))}
              </select>
            </div>
            {needsFecha && (
              <div className={styles.formField}>
                <label>{fechaLabel}</label>
                <input value={form.fecha_accion} onChange={e=>set('fecha_accion',e.target.value)} type="date"/>
              </div>
            )}
            <div className={styles.formField} style={{gridColumn:'1/-1'}}>
              <label>Notas</label>
              <textarea value={form.notas} onChange={e=>set('notas',e.target.value)}
                rows={3} placeholder="Habló con el director, interesado en plan Growth..."/>
            </div>
          </div>
          {error && <p className={styles.formError}>{error}</p>}
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnSave} onClick={handleSubmit} disabled={saving}>
            {saving ? <RefreshCw size={13} className={styles.spin}/> : <Check size={13}/>}
            {saving ? 'Guardando…' : prospect ? 'Guardar cambios' : 'Añadir academia'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Prospect card ──────────────────────────────────────────────────────────
function ProspectCard({
  prospect, onEdit, onDelete, onEstado
}: {
  prospect:  Prospect
  onEdit:    () => void
  onDelete:  () => void
  onEstado:  (e: ProspectEstado) => void
}) {
  const [showEstados, setShowEstados] = useState(false)
  const est = ESTADOS[prospect.estado]
  const fechaInfo = prospect.fecha_accion ? diasRestantes(prospect.fecha_accion) : null

  return (
    <div className={styles.card} style={{
      '--card-glow': `${est.color}28`,
      borderColor: `${est.color}30`,
    } as React.CSSProperties}>
      {/* Cabecera */}
      <div className={styles.cardHead}>
        <div className={styles.cardInfo}>
          <span className={styles.cardNombre}>{prospect.nombre}</span>
          {prospect.ciudad && (
            <span className={styles.cardCiudad}><MapPin size={10}/> {prospect.ciudad}</span>
          )}
        </div>
        <div className={styles.cardActions}>
          <button className={styles.cardBtn} onClick={onEdit} title="Editar">
            <Edit3 size={12}/>
          </button>
          <button className={styles.cardBtn} onClick={onDelete} title="Eliminar"
            style={{color:'#DC2626'}}>
            <Trash2 size={12}/>
          </button>
        </div>
      </div>

      {/* Estado badge */}
      <div className={styles.cardEstadoRow}>
        <button
          className={styles.estadoBadge}
          style={{color: est.color, background: est.bg}}
          onClick={() => setShowEstados(v => !v)}>
          <span className={styles.estadoDot} style={{background: est.color}}/>
          {est.label}
          <ChevronDown size={10}/>
        </button>
        {fechaInfo && (
          <span className={styles.fechaChip}
            style={{color: fechaInfo.urgente ? '#DC2626' : '#6B7280',
                    background: fechaInfo.urgente ? '#FEF2F2' : '#F3F4F6'}}>
            <Calendar size={9}/> {fechaInfo.text}
          </span>
        )}
      </div>

      {/* Dropdown estados */}
      {showEstados && (
        <div className={styles.estadosDropdown}>
          {ESTADO_ORDER.filter(e => e !== prospect.estado).map(e => (
            <button key={e} className={styles.estadoOption}
              style={{color: ESTADOS[e].color}}
              onClick={() => { onEstado(e); setShowEstados(false) }}>
              <span className={styles.estadoDot} style={{background: ESTADOS[e].color}}/>
              {ESTADOS[e].label}
            </button>
          ))}
        </div>
      )}

      {/* Contacto */}
      <div className={styles.cardContacto}>
        {prospect.telefono && (
          <a href={`tel:${prospect.telefono}`} className={styles.contactLink}>
            <Phone size={11}/>{prospect.telefono}
          </a>
        )}
        {prospect.email && (
          <a href={`mailto:${prospect.email}`} className={styles.contactLink}>
            <Mail size={11}/>{prospect.email}
          </a>
        )}
        {prospect.web && (
          <a href={prospect.web} target="_blank" rel="noreferrer" className={styles.contactLink}>
            <Globe size={11}/>Web
          </a>
        )}
        {prospect.maps_url && (
          <a href={prospect.maps_url} target="_blank" rel="noreferrer" className={styles.contactLink}
            style={{color:'#0891B2'}}>
            <Map size={11}/>Maps
          </a>
        )}
      </div>

      {/* Fecha acción */}
      {prospect.fecha_accion && (
        <div className={styles.cardFecha}
          style={{color: fechaInfo?.urgente ? '#DC2626' : '#6B7280'}}>
          <Calendar size={11}/>
          {ESTADOS[prospect.estado].label} — {fmtFecha(prospect.fecha_accion)}
        </div>
      )}

      {/* Notas */}
      {prospect.notas && (
        <div className={styles.cardNotas}>
          <MessageSquare size={10}/> {prospect.notas}
        </div>
      )}
    </div>
  )
}

// ── Pipeline principal ─────────────────────────────────────────────────────
export default function Pipeline() {
  const { prospects, loading, crear, actualizar, eliminar } = usePipeline()
  const [modal,        setModal]        = useState(false)
  const [editando,     setEditando]     = useState<Prospect | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<ProspectEstado | 'todas'>('todas')
  const [confirmDel,   setConfirmDel]   = useState<Prospect | null>(null)

  const filtradas = filtroEstado === 'todas'
    ? prospects
    : prospects.filter(p => p.estado === filtroEstado)

  // Contadores por estado
  const counts = prospects.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] ?? 0) + 1
    return acc
  }, {} as Record<ProspectEstado, number>)

  // Urgentes — tienen fecha_accion hoy o pasada
  const urgentes = prospects.filter(p =>
    p.fecha_accion && new Date(p.fecha_accion) <= new Date() &&
    p.estado !== 'cliente' && p.estado !== 'descartada'
  )

  if (loading) return (
    <div className={styles.loading}>
      <RefreshCw size={22} className={styles.spin} style={{color:'#2563EB'}}/>
      <p>Cargando pipeline…</p>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
      <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerTitle}>
            <Target size={20} style={{color:'#2563EB'}}/>
            <h2>Pipeline de prospección</h2>
          </div>
          <p className={styles.headerSub}>
            {prospects.length} academias · {prospects.filter(p=>p.estado==='cliente').length} clientes cerrados
            {urgentes.length > 0 && (
              <span className={styles.urgenteBadge}>
                ⚠ {urgentes.length} acción{urgentes.length!==1?'es':''} pendiente{urgentes.length!==1?'s':''}
              </span>
            )}
          </p>
        </div>
        <button className={styles.btnNew} onClick={() => setModal(true)}>
          <Plus size={14}/> Añadir academia
        </button>
      </div>

      {/* KPIs por estado */}
      <div className={styles.estadosRow}>
        <button
          className={[styles.estadoKpi, filtroEstado==='todas' ? styles.estadoKpiActive : ''].join(' ')}
          onClick={() => setFiltroEstado('todas')}>
          <span className={styles.estadoKpiNum}>{prospects.length}</span>
          <span className={styles.estadoKpiLabel}>Todas</span>
        </button>
        {ESTADO_ORDER.filter(e => e !== 'descartada').map(e => (
          <button key={e}
            className={[styles.estadoKpi, filtroEstado===e ? styles.estadoKpiActive : ''].join(' ')}
            style={{'--ec': ESTADOS[e].color} as React.CSSProperties}
            onClick={() => setFiltroEstado(e)}>
            <span className={styles.estadoKpiNum} style={{color: counts[e] ? ESTADOS[e].color : '#9CA3AF'}}>
              {counts[e] ?? 0}
            </span>
            <span className={styles.estadoKpiLabel}>{ESTADOS[e].label}</span>
          </button>
        ))}
      </div>

      {/* Grid de cards */}
      {filtradas.length === 0 ? (
        <div className={styles.empty}>
          <Target size={36} strokeWidth={1.2} style={{color:'#374151'}}/>
          <p>No hay academias en este estado.</p>
          <button className={styles.btnNew} onClick={() => setModal(true)}>
            <Plus size={13}/> Añadir la primera
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtradas.map(p => (
            <ProspectCard
              key={p.id}
              prospect={p}
              onEdit={() => setEditando(p)}
              onDelete={() => setConfirmDel(p)}
              onEstado={async (e) => actualizar(p.id, { estado: e })}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {modal && (
        <ModalProspect
          onSave={crear}
          onClose={() => setModal(false)}
        />
      )}
      {editando && (
        <ModalProspect
          prospect={editando}
          onSave={d => actualizar(editando.id, d)}
          onClose={() => setEditando(null)}
        />
      )}
      {confirmDel && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDel(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <p>¿Eliminar <strong>{confirmDel.nombre}</strong>?</p>
            <div className={styles.confirmBtns}>
              <button className={styles.btnCancel} onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className={styles.btnDelete} onClick={async () => {
                await eliminar(confirmDel.id)
                setConfirmDel(null)
              }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
