import { useState } from 'react'
import {
  Target, Plus, Phone, Mail, Globe, MapPin, Calendar,
  Edit3, Trash2, Map, RefreshCw, Check, X,
  ChevronDown, ChevronRight, MessageSquare, Layers
} from 'lucide-react'
import { usePipeline } from '../../hooks/usePipeline'
import type { Prospect, ProspectEstado, Zona } from '../../hooks/usePipeline'
import styles from './Pipeline.module.css'

// ── Config estados ─────────────────────────────────────────────────────────
const ESTADOS: Record<ProspectEstado, { label: string; color: string; bg: string }> = {
  nueva:      { label: 'Nueva',       color: '#6366F1', bg: 'rgba(99,102,241,0.1)'  },
  llamar:     { label: 'Llamar',      color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  llamada:    { label: 'Llamada',     color: '#0891B2', bg: 'rgba(8,145,178,0.1)'   },
  visitar:    { label: 'Visitar',     color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  visitada:   { label: 'Visitada',    color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
  demo:       { label: 'Demo activa', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  negociando: { label: 'Negociando',  color: '#EC4899', bg: 'rgba(236,72,153,0.1)'  },
  cliente:    { label: 'Cliente ✓',  color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
  descartada: { label: 'Descartada',  color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
}
const ESTADO_ORDER: ProspectEstado[] = [
  'nueva','llamar','llamada','visitar','visitada','demo','negociando','cliente','descartada'
]

const ZONA_COLORS = [
  '#6366F1','#0891B2','#059669','#D97706','#EC4899',
  '#7C3AED','#DC2626','#F59E0B','#10B981','#3B82F6',
]

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'short' })
}
function diasRestantes(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (diff < 0)   return { text: `Hace ${Math.abs(diff)}d`, urgente: true }
  if (diff === 0) return { text: 'Hoy', urgente: true }
  if (diff <= 2)  return { text: diff === 1 ? 'Mañana' : `${diff}d`, urgente: true }
  return { text: `${diff}d`, urgente: false }
}

// ── Modal Zona ─────────────────────────────────────────────────────────────
function ModalZona({ onSave, onClose }: {
  onSave:  (nombre: string, color: string) => Promise<{ error?: string }>
  onClose: () => void
}) {
  const [nombre,  setNombre]  = useState('')
  const [color,   setColor]   = useState(ZONA_COLORS[0]!)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const handleSave = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    const res = await onSave(nombre, color)
    setSaving(false)
    if (res.error) setError(res.error)
    else onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{maxWidth:'380px'}} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <span>Nueva zona</span>
          <button className={styles.modalClose} onClick={onClose}><X size={16}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formField}>
            <label>Nombre de la zona</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Rivas, Sur Madrid, Corredor Henares..." autoFocus/>
          </div>
          <div className={styles.formField} style={{marginTop:'0.75rem'}}>
            <label>Color</label>
            <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', marginTop:'0.25rem'}}>
              {ZONA_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width:'28px', height:'28px', borderRadius:'50%', background: c,
                  border: color === c ? '3px solid var(--ink)' : '2px solid transparent',
                  cursor:'pointer', transition:'transform 0.1s',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                }}/>
              ))}
            </div>
          </div>
          {error && <p style={{fontSize:'0.8rem',color:'#DC2626',marginTop:'0.5rem'}}>{error}</p>}
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw size={13} className={styles.spin}/> : <Check size={13}/>}
            {saving ? 'Guardando…' : 'Crear zona'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Prospect ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nombre:'', ciudad:'', telefono:'', email:'', web:'', maps_url:'',
  estado: 'nueva' as ProspectEstado, fecha_accion:'', notas:'', zona_id: null as string | null,
}

function ModalProspect({ prospect, zonas, onSave, onClose }: {
  prospect?: Prospect
  zonas:     Zona[]
  onSave:    (data: any) => Promise<{ error?: string }>
  onClose:   () => void
}) {
  const [form,   setForm]   = useState(prospect ? {
    nombre:       prospect.nombre,
    ciudad:       prospect.ciudad ?? '',
    telefono:     prospect.telefono ?? '',
    email:        prospect.email ?? '',
    web:          prospect.web ?? '',
    maps_url:     prospect.maps_url ?? '',
    estado:       prospect.estado,
    fecha_accion: prospect.fecha_accion ?? '',
    notas:        prospect.notas ?? '',
    zona_id:      prospect.zona_id,
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    const payload = {
      ...form,
      fecha_accion: form.fecha_accion || null,
      ciudad:   form.ciudad   || null,
      telefono: form.telefono || null,
      email:    form.email    || null,
      web:      form.web      || null,
      maps_url: form.maps_url || null,
      notas:    form.notas    || null,
      zona_id:  form.zona_id  || null,
    }
    const res = await onSave(payload)
    setSaving(false)
    if (res.error) setError(res.error)
    else onClose()
  }

  const needsFecha = ['llamar','visitar','demo'].includes(form.estado)
  const fechaLabel = form.estado==='llamar' ? 'Fecha de llamada' :
                     form.estado==='visitar' ? 'Fecha de visita' : 'Demo hasta'

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
                placeholder="Academia Ejemplo" autoFocus/>
            </div>
            <div className={styles.formField}>
              <label>Ciudad / Barrio</label>
              <input value={form.ciudad} onChange={e=>set('ciudad',e.target.value)} placeholder="Rivas"/>
            </div>
            <div className={styles.formField}>
              <label>Zona</label>
              <select value={form.zona_id ?? ''} onChange={e=>set('zona_id', e.target.value||null)}>
                <option value="">Sin zona</option>
                {zonas.map(z => (
                  <option key={z.id} value={z.id}>{z.nombre}</option>
                ))}
              </select>
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
            <div className={styles.formField}>
              <label>Estado</label>
              <select value={form.estado} onChange={e=>set('estado',e.target.value)}>
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
              <label>URL Google Maps</label>
              <input value={form.maps_url} onChange={e=>set('maps_url',e.target.value)} placeholder="https://maps.google.com/..."/>
            </div>
            <div className={styles.formField} style={{gridColumn:'1/-1'}}>
              <label>Notas</label>
              <textarea value={form.notas} onChange={e=>set('notas',e.target.value)}
                rows={3} placeholder="Observaciones, interés mostrado..."/>
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

// ── ProspectCard ───────────────────────────────────────────────────────────
function ProspectCard({ prospect, onEdit, onDelete, onEstado }: {
  prospect:  Prospect
  onEdit:    () => void
  onDelete:  () => void
  onEstado:  (e: ProspectEstado) => void
}) {
  const [showEstados, setShowEstados] = useState(false)
  const [confirmed,   setConfirmed]   = useState<ProspectEstado|null>(null)
  const est      = ESTADOS[prospect.estado]
  const fechaInfo = prospect.fecha_accion ? diasRestantes(prospect.fecha_accion) : null

  const handleEstado = (e: ProspectEstado) => {
    onEstado(e); setShowEstados(false)
    setConfirmed(e); setTimeout(() => setConfirmed(null), 2000)
  }

  return (
    <div className={styles.card} style={{
      '--card-glow': `${est.color}28`,
      borderColor:   `${est.color}30`,
    } as React.CSSProperties}>
      <div className={styles.cardHead}>
        <div className={styles.cardInfo}>
          <span className={styles.cardNombre}>{prospect.nombre}</span>
          {prospect.ciudad && <span className={styles.cardCiudad}><MapPin size={10}/> {prospect.ciudad}</span>}
        </div>
        <div className={styles.cardActions}>
          <button className={styles.cardBtn} onClick={onEdit}><Edit3 size={12}/></button>
          <button className={styles.cardBtn} onClick={onDelete} style={{color:'#DC2626'}}><Trash2 size={12}/></button>
        </div>
      </div>

      <div className={styles.cardEstadoRow}>
        <button className={styles.estadoBadge}
          style={{color: est.color, background: est.bg}}
          onClick={() => setShowEstados(v => !v)}>
          <span className={styles.estadoDot} style={{background: est.color}}/>
          {confirmed ? `✓ ${ESTADOS[confirmed].label}` : est.label}
          <ChevronDown size={10}/>
        </button>
        {fechaInfo && (
          <span className={styles.fechaChip}
            style={{color: fechaInfo.urgente?'#DC2626':'#6B7280', background: fechaInfo.urgente?'#FEF2F2':'#F3F4F6'}}>
            <Calendar size={9}/> {fechaInfo.text}
          </span>
        )}
      </div>

      {showEstados && (
        <div className={styles.estadosDropdown}>
          {ESTADO_ORDER.filter(e => e!==prospect.estado).map(e => (
            <button key={e} className={styles.estadoOption} style={{color: ESTADOS[e].color}}
              onClick={() => handleEstado(e)}>
              <span className={styles.estadoDot} style={{background: ESTADOS[e].color}}/>{ESTADOS[e].label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.cardContacto}>
        {prospect.telefono && <a href={`tel:${prospect.telefono}`} className={styles.contactLink}><Phone size={11}/>{prospect.telefono}</a>}
        {prospect.email    && <a href={`mailto:${prospect.email}`} className={styles.contactLink}><Mail size={11}/>{prospect.email}</a>}
        {prospect.web      && <a href={prospect.web} target="_blank" rel="noreferrer" className={styles.contactLink}><Globe size={11}/>Web</a>}
        {prospect.maps_url && <a href={prospect.maps_url} target="_blank" rel="noreferrer" className={styles.contactLink} style={{color:'#0891B2'}}><Map size={11}/>Maps</a>}
      </div>

      {prospect.fecha_accion && (
        <div className={styles.cardFecha} style={{color: fechaInfo?.urgente?'#DC2626':'#6B7280'}}>
          <Calendar size={11}/> {ESTADOS[prospect.estado].label} — {fmtFecha(prospect.fecha_accion)}
        </div>
      )}

      {prospect.notas && (
        <div className={styles.cardNotas}><MessageSquare size={10}/> {prospect.notas}</div>
      )}
    </div>
  )
}

// ── Vista por estados (original) ───────────────────────────────────────────
function VistaEstados({ prospects, zonas, onEdit, onDelete, onEstado, onNew }: {
  prospects: Prospect[]; zonas: Zona[]
  onEdit: (p: Prospect) => void; onDelete: (p: Prospect) => void
  onEstado: (id: string, e: ProspectEstado) => void; onNew: () => void
}) {
  const [filtro, setFiltro] = useState<ProspectEstado|'todas'>('todas')
  const counts   = prospects.reduce((acc,p) => { acc[p.estado]=(acc[p.estado]??0)+1; return acc }, {} as Record<ProspectEstado,number>)
  const filtradas = filtro==='todas' ? prospects : prospects.filter(p => p.estado===filtro)

  return (
    <>
      <div className={styles.estadosRow}>
        <button className={[styles.estadoKpi, filtro==='todas'?styles.estadoKpiActive:''].join(' ')}
          onClick={()=>setFiltro('todas')}>
          <span className={styles.estadoKpiNum}>{prospects.length}</span>
          <span className={styles.estadoKpiLabel}>Todas</span>
        </button>
        {ESTADO_ORDER.filter(e=>e!=='descartada').map(e => (
          <button key={e}
            className={[styles.estadoKpi, filtro===e?styles.estadoKpiActive:''].join(' ')}
            style={{'--ec': ESTADOS[e].color} as React.CSSProperties}
            onClick={()=>setFiltro(e)}>
            <span className={styles.estadoKpiNum} style={{color:counts[e]?ESTADOS[e].color:'#9CA3AF'}}>{counts[e]??0}</span>
            <span className={styles.estadoKpiLabel}>{ESTADOS[e].label}</span>
          </button>
        ))}
      </div>
      {filtradas.length===0 ? (
        <div className={styles.empty}>
          <Target size={36} strokeWidth={1.2} style={{color:'var(--ink-subtle)'}}/>
          <p>No hay academias en este estado.</p>
          <button className={styles.btnNew} onClick={onNew}><Plus size={13}/> Añadir la primera</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtradas.map(p => (
            <ProspectCard key={p.id} prospect={p}
              onEdit={()=>onEdit(p)} onDelete={()=>onDelete(p)}
              onEstado={e=>onEstado(p.id,e)}/>
          ))}
        </div>
      )}
    </>
  )
}

// ── Vista por zonas ────────────────────────────────────────────────────────
function VistaZonas({ prospects, zonas, onEdit, onDelete, onEstado, onNew, onNewZona, onDeleteZona, onToggleBarrida }: {
  prospects: Prospect[]; zonas: Zona[]
  onEdit: (p: Prospect) => void; onDelete: (p: Prospect) => void
  onEstado: (id: string, e: ProspectEstado) => void
  onNew: () => void; onNewZona: () => void; onDeleteZona: (id: string) => void
  onToggleBarrida: (id: string, barrida: boolean) => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({})
  const toggle = (id: string) => setCollapsed(p => ({...p, [id]: !p[id]}))

  const sinZona    = prospects.filter(p => !p.zona_id)
  const byZona     = zonas.map(z => ({
    zona:      z,
    prospects: prospects.filter(p => p.zona_id === z.id)
  }))

  const ZonaGroup = ({ zona, items, isNone = false }: {
    zona?: Zona; items: Prospect[]; isNone?: boolean
  }) => {
    const id      = zona?.id ?? 'none'
    const isOpen  = !collapsed[id]
    const color   = zona?.color ?? '#9CA3AF'
    const nombre  = zona?.nombre ?? 'Sin zona'

    const barrida = zona?.barrida ?? false

    return (
      <div className={styles.zonaGroup} style={{
        opacity: barrida ? 0.7 : 1,
        borderColor: barrida ? '#059669' : undefined,
      }}>
        <div className={styles.zonaGroupHead} onClick={() => toggle(id)}>
          <div className={styles.zonaGroupLeft}>
            <div className={styles.zonaDot} style={{background: barrida ? '#059669' : color}}/>
            <span className={styles.zonaNombre} style={{textDecoration: barrida ? 'line-through' : 'none',
              color: barrida ? 'var(--ink-subtle)' : 'var(--ink)'}}>
              {nombre}
            </span>
            <span className={styles.zonaCuenta}>{items.length}</span>
            {barrida && (
              <span style={{fontSize:'0.72rem', fontWeight:700, color:'#059669',
                background:'rgba(5,150,105,0.1)', padding:'1px 7px', borderRadius:'99px'}}>
                ✓ Barrida
              </span>
            )}
          </div>
          <div className={styles.zonaGroupRight}>
            {!isNone && (
              <>
                <button
                  className={styles.barridaToggle}
                  style={{
                    background: barrida ? 'rgba(5,150,105,0.1)' : 'var(--surface-off)',
                    borderColor: barrida ? 'rgba(5,150,105,0.3)' : 'var(--line)',
                    color: barrida ? '#059669' : 'var(--ink-muted)',
                  }}
                  onClick={e => { e.stopPropagation(); onToggleBarrida(id, !barrida) }}
                  title={barrida ? 'Marcar como pendiente' : 'Marcar zona como barrida'}>
                  <Check size={11}/>
                  {barrida ? 'Barrida' : 'Marcar barrida'}
                </button>
                <button className={styles.cardBtn}
                  onClick={e => { e.stopPropagation(); onDeleteZona(id) }}
                  title="Eliminar zona"
                  style={{color:'#DC2626'}}>
                  <Trash2 size={11}/>
                </button>
              </>
            )}
            {isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
          </div>
        </div>

        {isOpen && (
          items.length === 0 ? (
            <p className={styles.zonaEmpty}>Sin academias en esta zona.</p>
          ) : (
            <div className={styles.grid} style={{padding:'0.75rem'}}>
              {items.map(p => (
                <ProspectCard key={p.id} prospect={p}
                  onEdit={()=>onEdit(p)} onDelete={()=>onDelete(p)}
                  onEstado={e=>onEstado(p.id,e)}/>
              ))}
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <div className={styles.zonasWrap}>
      <div className={styles.zonasToolbar}>
        <button className={styles.btnNew} onClick={onNewZona}>
          <Plus size={13}/> Nueva zona
        </button>
        <button className={styles.btnSecundario} onClick={onNew}>
          <Plus size={13}/> Añadir academia
        </button>
      </div>

      {zonas.length === 0 && sinZona.length === 0 ? (
        <div className={styles.empty}>
          <Layers size={36} strokeWidth={1.2} style={{color:'var(--ink-subtle)'}}/>
          <p>Crea una zona para organizar tus academias.</p>
          <button className={styles.btnNew} onClick={onNewZona}><Plus size={13}/> Nueva zona</button>
        </div>
      ) : (
        <>
          {byZona.map(({ zona, prospects: items }) => (
            <ZonaGroup key={zona.id} zona={zona} items={items}/>
          ))}
          {sinZona.length > 0 && <ZonaGroup items={sinZona} isNone/>}
        </>
      )}
    </div>
  )
}

// ── Pipeline principal ─────────────────────────────────────────────────────
export default function Pipeline() {
  const { prospects, zonas, loading, crear, actualizar, eliminar, crearZona, eliminarZona, toggleBarrida } = usePipeline()
  const [vista,      setVista]      = useState<'estados'|'zonas'>('estados')
  const [modal,      setModal]      = useState(false)
  const [editando,   setEditando]   = useState<Prospect|null>(null)
  const [modalZona,  setModalZona]  = useState(false)
  const [confirmDel, setConfirmDel] = useState<Prospect|null>(null)

  const urgentes = prospects.filter(p =>
    p.fecha_accion && new Date(p.fecha_accion) <= new Date() &&
    !['cliente','descartada'].includes(p.estado)
  )

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.loading}>
          <RefreshCw size={22} className={styles.spin} style={{color:'#2563EB'}}/>
          <p>Cargando pipeline…</p>
        </div>
      </div>
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
                {prospects.length} academias · {prospects.filter(p=>p.estado==='cliente').length} clientes
                {urgentes.length > 0 && (
                  <span className={styles.urgenteBadge}>
                    ⚠ {urgentes.length} pendiente{urgentes.length!==1?'s':''}
                  </span>
                )}
              </p>
            </div>
            {vista === 'estados' && (
              <button className={styles.btnNew} onClick={() => setModal(true)}>
                <Plus size={14}/> Añadir academia
              </button>
            )}
          </div>

          {/* Tabs vista */}
          <div className={styles.vistaTabs}>
            <button
              className={[styles.vistaTab, vista==='estados'?styles.vistaTabActive:''].join(' ')}
              onClick={() => setVista('estados')}>
              <Target size={13}/> Por estado
            </button>
            <button
              className={[styles.vistaTab, vista==='zonas'?styles.vistaTabActive:''].join(' ')}
              onClick={() => setVista('zonas')}>
              <Layers size={13}/> Por zona
            </button>
          </div>

          {vista === 'estados' ? (
            <VistaEstados
              prospects={prospects} zonas={zonas}
              onEdit={setEditando} onDelete={setConfirmDel}
              onEstado={(id,e) => actualizar(id, {estado:e})}
              onNew={() => setModal(true)}
            />
          ) : (
            <VistaZonas
              prospects={prospects} zonas={zonas}
              onEdit={setEditando} onDelete={setConfirmDel}
              onEstado={(id,e) => actualizar(id, {estado:e})}
              onNew={() => setModal(true)}
              onNewZona={() => setModalZona(true)}
              onDeleteZona={eliminarZona}
              onToggleBarrida={(id, barrida) => toggleBarrida(id, barrida)}
            />
          )}

          {/* Modales */}
          {modal && (
            <ModalProspect zonas={zonas} onSave={crear} onClose={() => setModal(false)}/>
          )}
          {editando && (
            <ModalProspect prospect={editando} zonas={zonas}
              onSave={d => actualizar(editando.id, d)}
              onClose={() => setEditando(null)}/>
          )}
          {modalZona && (
            <ModalZona onSave={crearZona} onClose={() => setModalZona(false)}/>
          )}
          {confirmDel && (
            <div className={styles.modalOverlay} onClick={() => setConfirmDel(null)}>
              <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
                <p>¿Eliminar <strong>{confirmDel.nombre}</strong>?</p>
                <div className={styles.confirmBtns}>
                  <button className={styles.btnCancel} onClick={() => setConfirmDel(null)}>Cancelar</button>
                  <button className={styles.btnDelete} onClick={async () => {
                    await eliminar(confirmDel.id); setConfirmDel(null)
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
