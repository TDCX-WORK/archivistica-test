import { useState, useCallback, useEffect } from 'react'
import { useSuperadmin } from '../../hooks/useSuperadmin'
import {
  Building2, Users, Zap, BarChart2, Plus, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, Check, X,
  GraduationCap, BookOpen, Euro, TrendingUp, Settings,
  PauseCircle, PlayCircle, Edit3, Phone, Mail, MapPin, FileText
} from 'lucide-react'
import AcademiaDetalle from './AcademiaDetalle'
import styles from './SuperadminPanel.module.css'

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const PLANES = ['base', 'medio', 'academia']
const PAYMENT_METHODS = ['transferencia', 'tarjeta', 'domiciliacion']
const PAYMENT_STATUS  = [
  { id: 'active',  label: 'Al día',   color: '#059669' },
  { id: 'pending', label: 'Pendiente', color: '#B45309' },
  { id: 'overdue', label: 'Moroso',   color: '#DC2626' },
]
const COLORS = ['#0F766E','#7C3AED','#DC2626','#D97706','#0891B2','#059669','#DB2777','#2563EB']

function statusLabel(s) { return PAYMENT_STATUS.find(p => p.id === s) || PAYMENT_STATUS[0] }

// ── Banner de error/éxito global ──────────────────────────────────────────────
function ActionBanner({ msg, type, onClose }) {
  if (!msg) return null
  const bg    = type === 'error' ? '#FEE2E2' : '#D1FAE5'
  const color = type === 'error' ? '#991B1B' : '#065F46'
  const border= type === 'error' ? '#FECACA' : '#A7F3D0'
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:'0.6rem',
      padding:'0.75rem 1rem', borderRadius:'8px', marginBottom:'1rem',
      background: bg, border: `1px solid ${border}`, color,
      fontSize:'0.875rem', fontWeight: 500,
    }}>
      {type === 'error'
        ? <AlertTriangle size={16} style={{ flexShrink:0, marginTop:'1px' }} />
        : <Check size={16} style={{ flexShrink:0, marginTop:'1px' }} />
      }
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color, padding:0, lineHeight:1 }}>
        <X size={14} />
      </button>
    </div>
  )
}

// ── Modal genérico ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={[styles.modal, wide ? styles.modalWide : ''].join(' ')}
        onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Campo de formulario ───────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

// ── Modal crear/editar academia ───────────────────────────────────────────────
function ModalAcademia({ academia, onGuardar, onClose }) {
  const isEdit = !!academia
  const [form, setForm] = useState({
    name:            academia?.name || '',
    slug:            academia?.slug || '',
    plan:            academia?.plan || 'base',
    contact_email:   academia?.contact_email || '',
    contact_phone:   academia?.contact_phone || '',
    city:            academia?.city || '',
    province:        academia?.province || '',
    billing_name:    academia?.billing_name || '',
    billing_nif:     academia?.billing_nif || '',
    billing_address: academia?.billing_address || '',
    price_monthly:   academia?.price_monthly || '',
    payment_method:  academia?.payment_method || 'transferencia',
    payment_status:  academia?.payment_status || 'active',
    contract_start:  academia?.contract_start || '',
    contract_renews: academia?.contract_renews || '',
    notes:           academia?.notes || '',
  })
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)
  const [tab,    setTab]    = useState('basico')

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'name' && !isEdit) setForm(f => ({ ...f, name: v, slug: slugify(v) }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    if (!isEdit && !form.slug.trim()) { setError('El slug es obligatorio'); return }
    setSaving(true)
    const res = await onGuardar(form)
    if (res.error) { setError(res.error); setSaving(false) }
    else onClose()
  }

  const tabs = [
    { id: 'basico',     label: 'Básico' },
    { id: 'contacto',   label: 'Contacto' },
    { id: 'facturacion', label: 'Facturación' },
    { id: 'notas',      label: 'Notas' },
  ]

  return (
    <Modal title={isEdit ? `Editar — ${academia.name}` : 'Nueva academia'} onClose={onClose} wide>
      <div className={styles.modalTabs}>
        {tabs.map(t => (
          <button key={t.id} className={[styles.modalTab, tab === t.id ? styles.modalTabActive : ''].join(' ')}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className={styles.modalBody}>
        {tab === 'basico' && (
          <>
            <Field label="Nombre de la academia">
              <input className={styles.input} value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej: Academia Opositas Madrid" autoFocus />
            </Field>
            {!isEdit && (
              <Field label="Slug (URL)" hint="Solo letras, números y guiones">
                <input className={styles.input} value={form.slug}
                  onChange={e => set('slug', e.target.value)}
                  placeholder="academia-opositas-madrid" />
              </Field>
            )}
            <Field label="Plan">
              <div className={styles.optBtns}>
                {PLANES.map(p => (
                  <button key={p} className={[styles.optBtn, form.plan === p ? styles.optBtnActive : ''].join(' ')}
                    onClick={() => set('plan', p)}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
                ))}
              </div>
            </Field>
          </>
        )}

        {tab === 'contacto' && (
          <>
            <Field label="Email de contacto">
              <input className={styles.input} type="email" value={form.contact_email}
                onChange={e => set('contact_email', e.target.value)}
                placeholder="academia@ejemplo.com" />
            </Field>
            <Field label="Teléfono">
              <input className={styles.input} value={form.contact_phone}
                onChange={e => set('contact_phone', e.target.value)}
                placeholder="+34 600 000 000" />
            </Field>
            <div className={styles.fieldRow}>
              <Field label="Ciudad">
                <input className={styles.input} value={form.city}
                  onChange={e => set('city', e.target.value)} placeholder="Madrid" />
              </Field>
              <Field label="Provincia">
                <input className={styles.input} value={form.province}
                  onChange={e => set('province', e.target.value)} placeholder="Madrid" />
              </Field>
            </div>
          </>
        )}

        {tab === 'facturacion' && (
          <>
            <Field label="Razón social">
              <input className={styles.input} value={form.billing_name}
                onChange={e => set('billing_name', e.target.value)}
                placeholder="Academia Opositas S.L." />
            </Field>
            <div className={styles.fieldRow}>
              <Field label="NIF/CIF">
                <input className={styles.input} value={form.billing_nif}
                  onChange={e => set('billing_nif', e.target.value)} placeholder="B12345678" />
              </Field>
              <Field label="Precio mensual (€)">
                <input className={styles.input} type="number" value={form.price_monthly}
                  onChange={e => set('price_monthly', e.target.value)} placeholder="49" />
              </Field>
            </div>
            <Field label="Dirección fiscal">
              <input className={styles.input} value={form.billing_address}
                onChange={e => set('billing_address', e.target.value)}
                placeholder="Calle Mayor 1, 28001 Madrid" />
            </Field>
            <Field label="Forma de pago">
              <div className={styles.optBtns}>
                {PAYMENT_METHODS.map(m => (
                  <button key={m} className={[styles.optBtn, form.payment_method === m ? styles.optBtnActive : ''].join(' ')}
                    onClick={() => set('payment_method', m)}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Estado de pago">
              <div className={styles.optBtns}>
                {PAYMENT_STATUS.map(s => (
                  <button key={s.id}
                    className={[styles.optBtn, form.payment_status === s.id ? styles.optBtnActive : ''].join(' ')}
                    style={ form.payment_status === s.id ? { background: s.color, borderColor: s.color } : {} }
                    onClick={() => set('payment_status', s.id)}>{s.label}</button>
                ))}
              </div>
            </Field>
            <div className={styles.fieldRow}>
              <Field label="Inicio contrato">
                <input className={styles.input} type="date" value={form.contract_start}
                  onChange={e => set('contract_start', e.target.value)} />
              </Field>
              <Field label="Próxima renovación">
                <input className={styles.input} type="date" value={form.contract_renews}
                  onChange={e => set('contract_renews', e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {tab === 'notas' && (
          <Field label="Notas internas">
            <textarea className={styles.textarea} value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Notas privadas sobre esta academia…" rows={6} />
          </Field>
        )}

        {error && <div className={styles.errorMsg}><AlertTriangle size={13} />{error}</div>}
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
            {saving ? <RefreshCw size={13} className={styles.spinner} /> : <Check size={13} />}
            {isEdit ? 'Guardar cambios' : 'Crear academia'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal crear asignatura ────────────────────────────────────────────────────
function ModalAsignatura({ academia, onCrear, onClose }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [color, setColor] = useState('#0F766E')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) { setError('Nombre y slug obligatorios'); return }
    setSaving(true)
    const res = await onCrear({ academyId: academia.id, name, slug, color })
    if (res.error) { setError(res.error); setSaving(false) }
    else onClose()
  }

  return (
    <Modal title={`Nueva asignatura — ${academia.name}`} onClose={onClose}>
      <div className={styles.modalBody}>
        <Field label="Nombre de la asignatura">
          <input className={styles.input} value={name}
            onChange={e => { setName(e.target.value); setSlug(slugify(e.target.value)) }}
            placeholder="Ej: Policía Nacional Escala Básica" autoFocus />
        </Field>
        <Field label="Slug">
          <input className={styles.input} value={slug}
            onChange={e => setSlug(e.target.value)} placeholder="policia-nacional" />
        </Field>
        <Field label="Color">
          <div className={styles.colorPicker}>
            {COLORS.map(c => (
              <button key={c} className={[styles.colorBtn, color === c ? styles.colorBtnActive : ''].join(' ')}
                style={{ '--col': c }} onClick={() => setColor(c)}>
                {color === c && <Check size={11} />}
              </button>
            ))}
          </div>
        </Field>
        {error && <div className={styles.errorMsg}><AlertTriangle size={13} />{error}</div>}
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
            {saving ? <RefreshCw size={13} className={styles.spinner} /> : <Plus size={13} />}
            Crear asignatura
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal crear usuario ───────────────────────────────────────────────────────
function ModalUsuario({ academia, onCrear, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email,    setEmail]    = useState('')
  const [role,     setRole]     = useState('profesor')
  const [subjectId, setSubjectId] = useState('')
  const [error,    setError]    = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleSubmit = async () => {
    if (!username.trim() || password.length < 4) {
      setError('Usuario requerido y contraseña mínimo 4 caracteres'); return
    }
    if (role !== 'director' && !subjectId) { setError('Selecciona una asignatura'); return }
    if (!email.trim()) {
      setError('El email real es obligatorio para profesores y directores — lo necesitarán para recuperar su contraseña'); return
    }
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!emailValido) { setError('El email no tiene un formato válido'); return }
    setSaving(true)
    const res = await onCrear({
      username, password, role,
      academyId:     academia.id,
      academySlug:   academia.slug,
      subjectId:     role === 'director' ? null : subjectId,
      emailOverride: email.trim() || null,
    })
    if (res.error) { setError(res.error); setSaving(false) }
    else onClose()
  }

  const suffix = role === 'alumno' ? 'alumno' : role === 'profesor' ? 'prof' : 'dir'
  const emailPreview = email.trim() || `${username || 'usuario'}@${academia.slug}.${suffix}`

  return (
    <Modal title={`Nuevo usuario — ${academia.name}`} onClose={onClose}>
      <div className={styles.modalBody}>
        <Field label="Nombre de usuario">
          <input className={styles.input} value={username}
            onChange={e => setUsername(e.target.value)} placeholder="Ej: profe_garcia" autoFocus />
        </Field>
        <Field label="Contraseña temporal">
          <input className={styles.input} type="password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="Mínimo 4 caracteres" />
        </Field>
        <Field label="Email real (obligatorio para profesores y directores)"
          hint={`Email de acceso y recuperación de contraseña: ${emailPreview}`}>
          <input className={styles.input} type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="juan@ejemplo.com" />
        </Field>
        <Field label="Rol">
          <div className={styles.optBtns}>
            {[
              { id: 'profesor', label: 'Profesor' },
              { id: 'director', label: 'Director' },
            ].map(r => (
              <button key={r.id}
                className={[styles.optBtn, role === r.id ? styles.optBtnActive : ''].join(' ')}
                onClick={() => setRole(r.id)}>{r.label}</button>
            ))}
          </div>
        </Field>
        {role !== 'director' && academia.subjects?.length > 0 && (
          <Field label="Asignatura">
            <select className={styles.select} value={subjectId}
              onChange={e => setSubjectId(e.target.value)}>
              <option value="">Selecciona asignatura…</option>
              {academia.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}
        {error && <div className={styles.errorMsg}><AlertTriangle size={13} />{error}</div>}
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
            {saving ? <RefreshCw size={13} className={styles.spinner} /> : <Plus size={13} />}
            Crear usuario
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Card academia ─────────────────────────────────────────────────────────────
function AcademiaCard({ ac, onVerDetalle, onEditar, onNuevaAsignatura, onNuevoUsuario, onToggleSuspender, onEliminar }) {
  const [open,        setOpen]        = useState(false)
  const [suspending,  setSuspending]  = useState(false)
  const [actionError, setActionError] = useState('')
  const st = statusLabel(ac.payment_status)

  const handleSuspender = async () => {
    setActionError('')
    setSuspending(true)
    const res = await onToggleSuspender(ac.id, !ac.suspended)
    setSuspending(false)
    if (res?.error) {
      setActionError(`Error al ${ac.suspended ? 'reactivar' : 'suspender'}: ${res.error}`)
    }
  }

  return (
    <div className={[styles.acadCard, ac.suspended ? styles.acadSuspended : ''].join(' ')}>
      <button className={styles.acadHeader} onClick={() => setOpen(v => !v)}>
        <div className={styles.acadLeft}>
          <div className={styles.acadIcon} style={{ opacity: ac.suspended ? 0.5 : 1 }}>
            <Building2 size={16} />
          </div>
          <div>
            <div className={styles.acadName}>
              {ac.name}
              {ac.suspended && <span className={styles.suspendedBadge}>Suspendida</span>}
            </div>
            <div className={styles.acadMeta}>
              {ac.city && <span><MapPin size={10} /> {ac.city}</span>}
              <span>{ac.slug}</span>
            </div>
          </div>
        </div>
        <div className={styles.acadRight}>
          {ac.price_monthly > 0 && (
            <span className={styles.acadPrice}>€{parseFloat(ac.price_monthly).toFixed(0)}/mes</span>
          )}
          <span className={styles.payStatus} style={{ color: st.color, borderColor: st.color }}>
            {st.label}
          </span>
          <span className={styles.planBadge}>{ac.plan}</span>
          <div className={styles.acadMini}>
            <span><Users size={11} /> {ac.totalAlumnos}</span>
            <span><Zap size={11} /> {ac.alumnosActivos}</span>
          </div>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className={styles.acadBody}>

          {/* Error de acción (suspender/reactivar) */}
          {actionError && (
            <div style={{
              display:'flex', alignItems:'center', gap:'0.5rem',
              padding:'0.6rem 0.75rem', borderRadius:'6px', marginBottom:'0.75rem',
              background:'#FEE2E2', border:'1px solid #FECACA',
              color:'#991B1B', fontSize:'0.8rem', fontWeight:500,
            }}>
              <AlertTriangle size={13} style={{ flexShrink:0 }} />
              <span>{actionError}</span>
              <button onClick={() => setActionError('')}
                style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#991B1B', padding:0 }}>
                <X size={12} />
              </button>
            </div>
          )}

          {/* Info de contacto */}
          {(ac.contact_email || ac.contact_phone) && (
            <div className={styles.acadContact}>
              {ac.contact_email && (
                <a href={`mailto:${ac.contact_email}`} className={styles.acadContactItem}>
                  <Mail size={12} /> {ac.contact_email}
                </a>
              )}
              {ac.contact_phone && (
                <span className={styles.acadContactItem}>
                  <Phone size={12} /> {ac.contact_phone}
                </span>
              )}
            </div>
          )}

          {/* Facturación */}
          {(ac.billing_name || ac.billing_nif) && (
            <div className={styles.acadBilling}>
              <FileText size={12} />
              <span>{ac.billing_name}{ac.billing_nif ? ` · ${ac.billing_nif}` : ''}</span>
              {ac.contract_renews && (
                <span className={styles.renewDate}>Renueva: {new Date(ac.contract_renews).toLocaleDateString('es-ES')}</span>
              )}
            </div>
          )}

          {/* Notas */}
          {ac.notes && (
            <div className={styles.acadNotes}>{ac.notes}</div>
          )}

          {/* Asignaturas */}
          <div className={styles.acadSection}>
            <div className={styles.acadSectionHeader}>
              <span className={styles.acadSectionTitle}>Asignaturas</span>
              <button className={styles.btnSmall} onClick={() => onNuevaAsignatura(ac)}>
                <Plus size={12} /> Nueva
              </button>
            </div>
            {ac.subjects?.length === 0 ? (
              <p className={styles.emptySmall}>Sin asignaturas</p>
            ) : (
              <div className={styles.subjectList}>
                {ac.subjects.map(s => (
                  <div key={s.id} className={styles.subjectRow}>
                    <div className={styles.subjectDot} style={{ background: s.color }} />
                    <span className={styles.subjectName}>{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className={styles.acadActions}>
            <button className={styles.btnAction} onClick={() => onVerDetalle(ac)}>
              <BarChart2 size={13} /> Ver detalle
            </button>
            <button className={styles.btnAction} onClick={() => onNuevoUsuario(ac)}>
              <Plus size={13} /> Añadir usuario
            </button>
            <button className={styles.btnAction} onClick={() => onEditar(ac)}>
              <Edit3 size={13} /> Editar
            </button>
            <button
              className={[styles.btnAction, ac.suspended ? styles.btnActivar : styles.btnSuspender].join(' ')}
              onClick={handleSuspender}
              disabled={suspending}
            >
              {suspending
                ? <><RefreshCw size={13} className={styles.spinner} /> Procesando…</>
                : ac.suspended
                  ? <><PlayCircle size={13} /> Reactivar</>
                  : <><PauseCircle size={13} /> Suspender</>
              }
            </button>
            <button className={[styles.btnAction, styles.btnDangerOutline].join(' ')}
              onClick={() => onEliminar(ac)}>
              🗑 Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── KPI global ────────────────────────────────────────────────────────────────
function GStat({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={styles.gStat} style={{ '--c': color }}>
      <div className={styles.gStatGlow} />
      <Icon size={17} strokeWidth={1.8} className={styles.gStatIcon} />
      <div className={styles.gStatVal}>{value ?? '—'}</div>
      <div className={styles.gStatLabel}>{label}</div>
      {sub && <div className={styles.gStatSub}>{sub}</div>}
    </div>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────
export default function SuperadminPanel({ currentUser, modoPapelera = false }) {
  const {
    academias, stats, loading, error, saving,
    crearAcademia, actualizarAcademia,
    toggleSuspender, eliminarAcademia, restaurarAcademia,
    crearAsignatura, crearUsuario, recargar,
  } = useSuperadmin(currentUser)

  const [detalle,         setDetalle]         = useState(null)
  const [modalAcademia,   setModalAcademia]   = useState(false)
  const [editarAcademia,  setEditarAcademia]  = useState(null)
  const [modalAsignatura, setModalAsignatura] = useState(null)
  const [modalUsuario,    setModalUsuario]    = useState(null)
  const [filtro,          setFiltro]          = useState('todas')
  const [verPapelera,     setVerPapelera]     = useState(modoPapelera)
  const [confirmDelete,   setConfirmDelete]   = useState(null)

  // Sincronizar cuando React reutiliza el componente entre /admin y /papelera
  useEffect(() => { setVerPapelera(modoPapelera) }, [modoPapelera])
  const [deleteError,     setDeleteError]     = useState('')  // ← NUEVO
  const [deleteLoading,   setDeleteLoading]   = useState(false) // ← NUEVO
  const [bannerMsg,       setBannerMsg]       = useState('')  // ← NUEVO
  const [bannerType,      setBannerType]      = useState('error') // ← NUEVO

  const showBanner = (msg, type = 'error') => {
    setBannerMsg(msg)
    setBannerType(type)
    // Auto-cerrar tras 6 segundos si es éxito
    if (type === 'success') setTimeout(() => setBannerMsg(''), 6000)
  }

  const handleCrearAcademia   = useCallback(async (data) => { const r = await crearAcademia(data);   return r }, [crearAcademia])
  const handleEditarAcademia  = useCallback(async (data) => { const r = await actualizarAcademia(editarAcademia.id, data); return r }, [actualizarAcademia, editarAcademia])
  const handleCrearAsignatura = useCallback(async (data) => { const r = await crearAsignatura(data); return r }, [crearAsignatura])
  const handleCrearUsuario    = useCallback(async (data) => { const r = await crearUsuario(data);    return r }, [crearUsuario])

  // ── Suspender con resultado capturado ──────────────────────────────────────
  const handleToggleSuspender = useCallback(async (id, suspendido) => {
    const res = await toggleSuspender(id, suspendido)
    if (res?.ok) {
      showBanner(
        `Academia ${suspendido ? 'suspendida' : 'reactivada'} correctamente. Usuarios afectados: ${res.affected ?? '?'}`,
        'success'
      )
    }
    return res // ← devuelve para que AcademiaCard también lo maneje
  }, [toggleSuspender])

  // ── Eliminar con gestión de error visible ──────────────────────────────────
  const handleEliminar = async () => {
    if (!confirmDelete) return
    setDeleteError('')
    setDeleteLoading(true)
    const res = await eliminarAcademia(confirmDelete.id)
    setDeleteLoading(false)
    if (res?.error) {
      setDeleteError(`Error: ${res.error}`)
    } else {
      setConfirmDelete(null)
      setDeleteError('')
      showBanner(`"${confirmDelete.name}" movida a la papelera correctamente.`, 'success')
    }
  }

  if (loading) return <div className={styles.state}><RefreshCw size={22} className={styles.spinner} /><p>Cargando…</p></div>
  if (error)   return <div className={styles.state}><AlertTriangle size={22} /><p>{error}</p></div>

  if (detalle) return (
    <AcademiaDetalle academia={detalle} onBack={() => setDetalle(null)} />
  )

  const papelera       = academias.filter(ac => !!ac.deleted_at)
  const acadsActivas   = academias.filter(ac => !ac.deleted_at)
  const acadsFiltradas = acadsActivas.filter(ac => {
    if (filtro === 'activas')     return !ac.suspended
    if (filtro === 'suspendidas') return ac.suspended
    if (filtro === 'morosas')     return ac.payment_status === 'overdue'
    return true
  })

  return (
    <div className={styles.page}>
      {/* Modales */}
      {modalAcademia  && <ModalAcademia onGuardar={handleCrearAcademia}  onClose={() => setModalAcademia(false)} />}
      {editarAcademia && <ModalAcademia academia={editarAcademia} onGuardar={handleEditarAcademia} onClose={() => setEditarAcademia(null)} />}
      {modalAsignatura && <ModalAsignatura academia={modalAsignatura} onCrear={handleCrearAsignatura} onClose={() => setModalAsignatura(null)} />}
      {modalUsuario   && <ModalUsuario   academia={modalUsuario}   onCrear={handleCrearUsuario}    onClose={() => setModalUsuario(null)} />}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Superadmin</h1>
          <p className={styles.pageSubtitle}>Vista global de la plataforma</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnRefresh} onClick={recargar} disabled={loading}>
            <RefreshCw size={14} className={loading ? styles.spinner : ''} />
          </button>
          {!verPapelera && (
            <button className={styles.btnPrimary} onClick={() => setModalAcademia(true)}>
              <Plus size={14} /> Nueva academia
            </button>
          )}
        </div>
      </div>

      {/* Banner global de error/éxito ← NUEVO */}
      <ActionBanner
        msg={bannerMsg}
        type={bannerType}
        onClose={() => setBannerMsg('')}
      />

      {/* KPIs globales */}
      {stats && (
        <div className={styles.globalStats}>
          <GStat icon={Euro}        label="MRR"              value={`€${stats.mrr.toFixed(0)}`}    color="#059669"
            sub={`${stats.acadActivas} academias activas`} />
          <GStat icon={Building2}   label="Academias"        value={stats.totalAcademias}           color="#7C3AED" />
          <GStat icon={Users}       label="Alumnos totales"  value={stats.totalAlumnos}             color="#0891B2" />
          <GStat icon={Zap}         label="Activos 7d"       value={stats.alumnosActivos}           color="#D97706" />
          <GStat icon={BarChart2}   label="Sesiones 30d"     value={stats.sesiones30d}              color="#0F766E" />
          {stats.morosos > 0 && (
            <GStat icon={AlertTriangle} label="Morosos"      value={stats.morosos}                  color="#DC2626" />
          )}
          {stats.pendientePago > 0 && (
            <GStat icon={AlertTriangle} label="Pago pendiente" value={stats.pendientePago}          color="#B45309" />
          )}
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filtros}>
        {[
          { id: 'todas',       label: `Todas (${acadsActivas.length})` },
          { id: 'activas',     label: `Activas (${acadsActivas.filter(a => !a.suspended).length})` },
          { id: 'suspendidas', label: `Suspendidas (${acadsActivas.filter(a => a.suspended).length})` },
          { id: 'morosas',     label: `Morosas (${acadsActivas.filter(a => a.payment_status === 'overdue').length})` },
        ].map(f => (
          <button key={f.id}
            className={[styles.filtro, filtro === f.id ? styles.filtroActive : ''].join(' ')}
            onClick={() => setFiltro(f.id)}>{f.label}</button>
        ))}
      </div>

      {/* Modal confirmación eliminar */}
      {confirmDelete && (
        <div className={styles.overlay} onClick={() => { if (!deleteLoading) { setConfirmDelete(null); setDeleteError('') } }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>¿Eliminar academia?</h3>
              <button className={styles.modalClose} onClick={() => { setConfirmDelete(null); setDeleteError('') }} disabled={deleteLoading}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize:'0.9rem', color:'var(--ink)', margin:'0 0 1rem' }}>
                <strong>{confirmDelete.name}</strong> pasará a la papelera y todos sus usuarios
                perderán acceso inmediatamente. Podrás restaurarla cuando quieras.
              </p>

              {/* Error visible en el modal ← NUEVO */}
              {deleteError && (
                <div style={{
                  display:'flex', alignItems:'flex-start', gap:'0.5rem',
                  padding:'0.65rem 0.75rem', borderRadius:'6px', marginBottom:'1rem',
                  background:'#FEE2E2', border:'1px solid #FECACA',
                  color:'#991B1B', fontSize:'0.82rem', fontWeight:500,
                }}>
                  <AlertTriangle size={14} style={{ flexShrink:0, marginTop:'1px' }} />
                  <div>
                    <div style={{ fontWeight:700, marginBottom:'0.2rem' }}>No se pudo eliminar</div>
                    <div>{deleteError}</div>
                    <div style={{ marginTop:'0.4rem', fontSize:'0.78rem', opacity:0.85 }}>
                      Revisa los logs de la Edge Function en Supabase Dashboard → Functions → gestionar-academia
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.modalActions}>
                <button className={styles.btnCancel} onClick={() => { setConfirmDelete(null); setDeleteError('') }} disabled={deleteLoading}>
                  Cancelar
                </button>
                <button className={styles.btnDanger} onClick={handleEliminar} disabled={deleteLoading}>
                  {deleteLoading
                    ? <><RefreshCw size={13} className={styles.spinner} /> Procesando…</>
                    : '🗑 Eliminar y mover a papelera'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista papelera */}
      {verPapelera ? (
        <div>
          <h2 className={styles.sectionTitle} style={{ marginBottom:'1rem' }}>
            🗑 Papelera ({papelera.length})
          </h2>
          {papelera.length === 0 ? (
            <div className={styles.emptyAcads}>
              <p style={{ color:'var(--ink-muted)', fontSize:'0.9rem' }}>La papelera está vacía</p>
            </div>
          ) : (
            <div className={styles.acadList}>
              {papelera.map(ac => (
                <div key={ac.id} className={styles.papeleraCard}>
                  <div className={styles.papeleraInfo}>
                    <div className={styles.papeleraName}>{ac.name}</div>
                    <div className={styles.papeleraMeta}>
                      {ac.slug} · Eliminada el {new Date(ac.deleted_at).toLocaleDateString('es-ES')}
                      {ac.contact_email && ` · ${ac.contact_email}`}
                    </div>
                    <div className={styles.papeleraStats}>
                      Plan {ac.plan}
                      {ac.price_monthly > 0 && ` · €${ac.price_monthly}/mes`}
                      {ac.city && ` · ${ac.city}`}
                    </div>
                  </div>
                  <button className={styles.btnRestaurar}
                    onClick={() => restaurarAcademia(ac.id)}>
                    ↩ Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (

      /* Lista academias */
      <>
      {acadsFiltradas.length === 0 ? (
        <div className={styles.emptyAcads}>
          <Building2 size={36} strokeWidth={1.2} />
          <p>No hay academias en este filtro</p>
          {filtro === 'todas' && (
            <button className={styles.btnPrimary} onClick={() => setModalAcademia(true)}>
              <Plus size={14} /> Crear la primera
            </button>
          )}
        </div>
      ) : (
        <div className={styles.acadList}>
          {acadsFiltradas.map(ac => (
            <AcademiaCard
              key={ac.id} ac={ac}
              onVerDetalle={setDetalle}
              onEditar={setEditarAcademia}
              onNuevaAsignatura={setModalAsignatura}
              onNuevoUsuario={setModalUsuario}
              onToggleSuspender={handleToggleSuspender}
              onEliminar={setConfirmDelete}
            />
          ))}
        </div>
      )}
      </>
      )}
    </div>
  )
}
