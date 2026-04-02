import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAcademyProfiles } from '../../../hooks/useStudentProfile'
import {
  Users, GraduationCap, Key, Settings, RefreshCw, AlertTriangle,
  Plus, X, Check, Copy, Trash2, Edit3, Save, ChevronDown, ChevronUp,
  Calendar, Shield, Phone, Mail, MapPin, BookOpen, RotateCcw,
  Building2, Euro, Clock, Search, CheckCircle
} from 'lucide-react'
import styles from './GestionAcademia.module.css'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = iso => iso
  ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

function scoreColor(s) {
  if (s === null || s === undefined) return '#6B7280'
  if (s >= 80) return '#059669'
  if (s >= 60) return '#0891B2'
  if (s >= 40) return '#B45309'
  return '#DC2626'
}

/* ─── Modal de edición de alumno ──────────────────────────────────────────── */
function EditAlumnoModal({ alumno, onSave, onClose }) {
  const ext = alumno.extended || {}
  const [form, setForm] = useState({
    full_name:     ext.full_name     || '',
    phone:         ext.phone         || '',
    email_contact: ext.email_contact || '',
    city:          ext.city          || '',
    exam_date:     ext.exam_date     || '',
    monthly_price: ext.monthly_price || '',
    access_until:  alumno.access_until?.slice(0, 10) || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(alumno.id, form)
    setSaving(false)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalAvatar}>{(ext.full_name || alumno.username)[0].toUpperCase()}</div>
          <div>
            <h3 className={styles.modalTitle}>{ext.full_name || alumno.username}</h3>
            <span className={styles.modalSub}>@{alumno.username}</span>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            {[
              { key: 'full_name',     label: 'Nombre completo',    type: 'text',   placeholder: 'Nombre y apellidos' },
              { key: 'phone',         label: 'Teléfono',            type: 'tel',    placeholder: '612 345 678' },
              { key: 'email_contact', label: 'Email de contacto',   type: 'email',  placeholder: 'email@ejemplo.com' },
              { key: 'city',          label: 'Ciudad',              type: 'text',   placeholder: 'Madrid' },
              { key: 'exam_date',     label: 'Fecha del examen',    type: 'date',   placeholder: '' },
              { key: 'monthly_price', label: 'Precio mensual (€)',  type: 'number', placeholder: '89' },
              { key: 'access_until',  label: 'Acceso hasta',        type: 'date',   placeholder: '' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className={styles.formField}>
                <label className={styles.formLabel}>{label}</label>
                <input className={styles.formInput} type={type} placeholder={placeholder}
                  value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button className={styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button className={styles.btnGuardar} onClick={handleSave} disabled={saving}>
            <Save size={13} /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Sección: Alumnos ────────────────────────────────────────────────────── */
function SeccionAlumnos({ studentProfiles, subjects, updateStudentProfile, renovarAcceso }) {
  const [busqueda,   setBusqueda]   = useState('')
  const [editAlumno, setEditAlumno] = useState(null)

  const filtrados = studentProfiles.filter(a => {
    const q = busqueda.toLowerCase()
    return !q
      || a.username.toLowerCase().includes(q)
      || (a.extended?.full_name || '').toLowerCase().includes(q)
      || (a.extended?.city || '').toLowerCase().includes(q)
  })

  const subMap = {}
  for (const s of subjects) subMap[s.id] = s

  const handleSave = async (userId, form) => {
    // Actualizar student_profiles
    await supabase.from('student_profiles').upsert({
      id:            userId,
      full_name:     form.full_name     || null,
      phone:         form.phone         || null,
      email_contact: form.email_contact || null,
      city:          form.city          || null,
      exam_date:     form.exam_date     || null,
      monthly_price: form.monthly_price ? parseFloat(form.monthly_price) : null,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'id' })

    // Actualizar access_until en profiles si cambió
    if (form.access_until) {
      await supabase.from('profiles')
        .update({ access_until: new Date(form.access_until + 'T23:59:59').toISOString() })
        .eq('id', userId)
    }

    updateStudentProfile(userId, {
      full_name:     form.full_name     || null,
      phone:         form.phone         || null,
      email_contact: form.email_contact || null,
      city:          form.city          || null,
      exam_date:     form.exam_date     || null,
      monthly_price: form.monthly_price ? parseFloat(form.monthly_price) : null,
    })
  }

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <h2 className={styles.seccionTitle}><Users size={16} /> Alumnos ({studentProfiles.length})</h2>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Buscar alumno…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className={styles.tabla}>
        <div className={styles.tablaHead}>
          <span>Alumno</span>
          <span>Asignatura</span>
          <span>Contacto</span>
          <span>Acceso hasta</span>
          <span>Precio/mes</span>
          <span></span>
        </div>

        {filtrados.length === 0
          ? <p className={styles.empty}>No se encontraron alumnos</p>
          : filtrados.map(a => {
            const ext  = a.extended || {}
            const sub  = subMap[a.subject_id]
            const exp  = a.access_until ? new Date(a.access_until) : null
            const expirado = exp && exp < new Date()
            const pronto   = exp && !expirado && (exp - new Date()) < 14 * 86400000

            return (
              <div key={a.id} className={styles.tablaRow}>
                <div className={styles.alumnoCell}>
                  <div className={styles.miniAvatar}>{(ext.full_name || a.username)[0].toUpperCase()}</div>
                  <div>
                    <div className={styles.nombrePrincipal}>{ext.full_name || a.username}</div>
                    {ext.full_name && <div className={styles.usernameSecundario}>@{a.username}</div>}
                  </div>
                </div>

                <div className={styles.subCell}>
                  {sub ? (
                    <><div className={styles.subDot} style={{ background: sub.color }} /><span>{sub.name}</span></>
                  ) : <span className={styles.muted}>—</span>}
                </div>

                <div className={styles.contactCell}>
                  {ext.phone && <span><Phone size={11} /> {ext.phone}</span>}
                  {ext.email_contact && <span><Mail size={11} /> {ext.email_contact}</span>}
                  {!ext.phone && !ext.email_contact && <span className={styles.muted}>Sin datos</span>}
                </div>

                <div>
                  <span className={[
                    styles.accesoChip,
                    expirado ? styles.accesoExpirado : pronto ? styles.accesoPronto : styles.accesoOk
                  ].join(' ')}>
                    {a.access_until ? fmt(a.access_until) : 'Sin límite'}
                  </span>
                </div>

                <div className={styles.precioCell}>
                  {ext.monthly_price
                    ? <span className={styles.precio}>{ext.monthly_price} €</span>
                    : <span className={styles.muted}>—</span>}
                </div>

                <button className={styles.editBtn} onClick={() => setEditAlumno(a)}>
                  <Edit3 size={13} />
                </button>
              </div>
            )
          })
        }
      </div>

      {editAlumno && (
        <EditAlumnoModal
          alumno={editAlumno}
          onSave={handleSave}
          onClose={() => setEditAlumno(null)}
        />
      )}
    </div>
  )
}

/* ─── Sección: Profesores ─────────────────────────────────────────────────── */
function SeccionProfesores({ staffProfiles, subjects }) {
  const profesores = staffProfiles.filter(p => p.role === 'profesor')
  const subMap = {}
  for (const s of subjects) subMap[s.id] = s

  if (!profesores.length) return (
    <div className={styles.seccion}>
      <h2 className={styles.seccionTitle}><GraduationCap size={16} /> Profesores</h2>
      <div className={styles.emptyState}>
        <GraduationCap size={32} strokeWidth={1.2} />
        <p>No hay profesores registrados.</p>
        <span>El superadmin puede crear cuentas de profesor desde el panel de administración.</span>
      </div>
    </div>
  )

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <h2 className={styles.seccionTitle}><GraduationCap size={16} /> Profesores ({profesores.length})</h2>
      </div>

      <div className={styles.profesoresGrid}>
        {profesores.map(p => {
          const ext = p.extended || {}
          const sub = subMap[p.subject_id]
          return (
            <div key={p.id} className={styles.profCard}>
              <div className={styles.profAvatar}>{(ext.full_name || p.username)[0].toUpperCase()}</div>
              <div className={styles.profInfo}>
                <span className={styles.profNombre}>{ext.full_name || p.username}</span>
                <span className={styles.profUsername}>@{p.username}</span>
                {sub && (
                  <div className={styles.profSub}>
                    <div className={styles.subDot} style={{ background: sub.color }} />
                    <span>{sub.name}</span>
                  </div>
                )}
              </div>
              <div className={styles.profContacto}>
                {ext.phone && <div className={styles.profContactoRow}><Phone size={12} />{ext.phone}</div>}
                {ext.email_contact && <div className={styles.profContactoRow}><Mail size={12} />{ext.email_contact}</div>}
                {!ext.phone && !ext.email_contact && (
                  <span className={styles.muted}>Perfil sin completar</span>
                )}
              </div>
              <div className={styles.profAltaWrap}>
                <span className={styles.muted}>Alta: {fmt(p.created_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Sección: Códigos de invitación ──────────────────────────────────────── */
function SeccionCodigos({ academyId, subjects }) {
  const [codigos,   setCodigos]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [creando,   setCreando]   = useState(false)
  const [form,      setForm]      = useState({ subject_id: '', duracion: '365' })
  const [copied,    setCopied]    = useState(null)
  const [generando, setGenerando] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('invite_codes')
      .select('id, code, subject_id, duration_days, used_by, expires_at, created_at')
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })
    setCodigos(data || [])
    setLoading(false)
  }, [academyId])

  useEffect(() => { load() }, [load])

  const generarCodigo = async () => {
    if (!form.subject_id) return
    setGenerando(true)
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const expires = new Date()
    expires.setDate(expires.getDate() + 30) // códigos expiran en 30 días si no se usan

    const { error } = await supabase.from('invite_codes').insert({
      academy_id:    academyId,
      subject_id:    form.subject_id,
      code,
      duration_days: parseInt(form.duracion),
      expires_at:    expires.toISOString(),
    })

    if (!error) {
      await load()
      setCreando(false)
      setForm({ subject_id: '', duracion: '365' })
    }
    setGenerando(false)
  }

  const copiar = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const subMap = {}
  for (const s of subjects) subMap[s.id] = s

  const activos   = codigos.filter(c => !c.used_by && new Date(c.expires_at) > new Date())
  const usados    = codigos.filter(c => !!c.used_by)
  const caducados = codigos.filter(c => !c.used_by && new Date(c.expires_at) <= new Date())

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <h2 className={styles.seccionTitle}><Key size={16} /> Códigos de invitación</h2>
        <button className={styles.btnNuevo} onClick={() => setCreando(v => !v)}>
          <Plus size={14} /> Nuevo código
        </button>
      </div>

      {/* Formulario de creación */}
      {creando && (
        <div className={styles.crearCodigo}>
          <div className={styles.crearForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Asignatura</label>
              <select className={styles.formSelect}
                value={form.subject_id}
                onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}>
                <option value="">Selecciona asignatura…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Duración del acceso</label>
              <select className={styles.formSelect}
                value={form.duracion}
                onChange={e => setForm(p => ({ ...p, duracion: e.target.value }))}>
                <option value="30">30 días</option>
                <option value="90">3 meses</option>
                <option value="180">6 meses</option>
                <option value="365">1 año</option>
                <option value="730">2 años</option>
              </select>
            </div>
            <div className={styles.crearBtns}>
              <button className={styles.btnCancelar} onClick={() => setCreando(false)}>Cancelar</button>
              <button className={styles.btnGuardar} onClick={generarCodigo}
                disabled={!form.subject_id || generando}>
                <Key size={13} /> {generando ? 'Generando…' : 'Generar código'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats rápidas */}
      <div className={styles.codigoStats}>
        <div className={styles.codigoStat}>
          <span className={styles.codigoStatNum} style={{ color: '#059669' }}>{activos.length}</span>
          <span className={styles.codigoStatLabel}>Activos</span>
        </div>
        <div className={styles.codigoStat}>
          <span className={styles.codigoStatNum} style={{ color: '#0891B2' }}>{usados.length}</span>
          <span className={styles.codigoStatLabel}>Usados</span>
        </div>
        <div className={styles.codigoStat}>
          <span className={styles.codigoStatNum} style={{ color: '#6B7280' }}>{caducados.length}</span>
          <span className={styles.codigoStatLabel}>Caducados</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingMini}><RefreshCw size={16} className={styles.spinner} /></div>
      ) : (
        <div className={styles.codigosList}>
          {codigos.length === 0 ? (
            <p className={styles.empty}>No hay códigos generados todavía</p>
          ) : codigos.map(c => {
            const sub      = subMap[c.subject_id]
            const isUsado  = !!c.used_by
            const isExpired = !isUsado && new Date(c.expires_at) <= new Date()
            const estado   = isUsado ? 'usado' : isExpired ? 'caducado' : 'activo'

            return (
              <div key={c.id} className={[styles.codigoItem, styles[`codigo_${estado}`]].join(' ')}>
                <div className={styles.codigoMain}>
                  <span className={styles.codigoCodigo}>{c.code}</span>
                  {!isUsado && !isExpired && (
                    <button className={styles.codigoCopy} onClick={() => copiar(c.code)}>
                      {copied === c.code ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
                <div className={styles.codigoInfo}>
                  {sub && <span style={{ color: sub.color, fontWeight: 700, fontSize: '0.72rem' }}>{sub.name}</span>}
                  <span className={styles.muted}>{c.duration_days}d de acceso</span>
                  <span className={[styles.estadoChip,
                    isUsado ? styles.estadoUsado : isExpired ? styles.estadoCaducado : styles.estadoActivo
                  ].join(' ')}>
                    {isUsado ? '✓ Usado' : isExpired ? 'Caducado' : 'Activo'}
                  </span>
                </div>
                <div className={styles.codigoFecha}>
                  <span className={styles.muted}>
                    {isUsado ? `Usado el ${fmt(c.created_at)}` : `Expira el ${fmt(c.expires_at)}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Sección: Configuración ──────────────────────────────────────────────── */
function SeccionConfiguracion({ currentUser, academy }) {
  return (
    <div className={styles.seccion}>
      <h2 className={styles.seccionTitle}><Settings size={16} /> Configuración de la academia</h2>

      <div className={styles.configGrid}>
        {/* Info de la academia — solo lectura, gestionada por el superadmin */}
        <div className={styles.configCard}>
          <h3 className={styles.configCardTitle}>Información general</h3>
          <div className={styles.planInfo}>
            <div className={styles.planInfoRow}>
              <span className={styles.planInfoLabel}>Nombre</span>
              <span className={styles.planInfoVal}>{academy?.name || '—'}</span>
            </div>
            <div className={styles.planInfoRow}>
              <span className={styles.planInfoLabel}>Plan actual</span>
              <div className={styles.planChip}>{academy?.plan || '—'}</div>
            </div>
            <div className={styles.planInfoRow}>
              <span className={styles.planInfoLabel}>Academia ID</span>
              <span className={styles.planInfoMono}>{currentUser.academy_id?.slice(0, 16)}…</span>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--ink-subtle)', margin: 0 }}>
            Para cambiar el nombre o el plan, contacta con el administrador de FrostFox Academy.
          </p>
        </div>

        {/* Info del plan */}
        <div className={styles.configCard}>
          <h3 className={styles.configCardTitle}>Tu plan</h3>
          <div className={styles.planInfo}>
            <div className={styles.planInfoRow}>
              <span className={styles.planInfoLabel}>Plan</span>
              <span className={styles.planInfoVal} style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                {academy?.plan || '—'}
              </span>
            </div>
            <div className={styles.planInfoRow}>
              <span className={styles.planInfoLabel}>Academia ID</span>
              <span className={styles.planInfoMono}>{currentUser.academy_id?.slice(0, 12)}…</span>
            </div>
          </div>
          <div className={styles.planUpgrade}>
            <p className={styles.planUpgradeText}>
              ¿Necesitas más alumnos o asignaturas? Contacta con FrostFox Academy para cambiar de plan.
            </p>
            <a href="mailto:hola@frostfox.com" className={styles.planUpgradeBtn}>
              <Mail size={13} /> Contactar
            </a>
          </div>
        </div>

        {/* Facturación — front sin lógica */}
        <div className={styles.configCard}>
          <h3 className={styles.configCardTitle}>Facturación <span className={styles.proximamente}>Próximamente</span></h3>
          <div className={styles.facturaPlaceholder}>
            <Euro size={28} strokeWidth={1.2} />
            <p>Historial de facturas y gestión de pagos disponible próximamente.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Panel principal ─────────────────────────────────────────────────────── */
export default function GestionAcademia({ currentUser }) {
  const [tab,      setTab]      = useState('alumnos')
  const [academy,  setAcademy]  = useState(null)
  const [subjects, setSubjects] = useState([])
  const [loading,  setLoading]  = useState(true)

  const { studentProfiles, staffProfiles, loading: loadingProfiles,
          updateStudentProfile, reload } = useAcademyProfiles(currentUser?.academy_id)

  useEffect(() => {
    const load = async () => {
      const [{ data: ac }, { data: subs }] = await Promise.all([
        supabase.from('academies').select('id, name, plan, slug')
          .eq('id', currentUser.academy_id).single(),
        supabase.from('subjects').select('id, name, color, slug')
          .eq('academy_id', currentUser.academy_id).order('name'),
      ])
      setAcademy(ac)
      setSubjects(subs || [])
      setLoading(false)
    }
    load()
  }, [currentUser?.academy_id])

  if (loading || loadingProfiles) return (
    <div className={styles.state}>
      <RefreshCw size={22} className={styles.spinner} /><p>Cargando gestión…</p>
    </div>
  )

  const TABS = [
    { id: 'alumnos',   label: `Alumnos (${studentProfiles.length})`, icon: Users },
    { id: 'profesores',label: `Profesores (${staffProfiles.filter(p=>p.role==='profesor').length})`, icon: GraduationCap },
    { id: 'codigos',   label: 'Códigos',       icon: Key },
    { id: 'config',    label: 'Configuración', icon: Settings },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageIcon}><Building2 size={20} /></div>
          <div>
            <h1 className={styles.pageTitle}>Gestión de Academia</h1>
            <p className={styles.pageSubtitle}>{academy?.name || currentUser?.academyName}</p>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id}
            className={[styles.tab, tab === id ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab(id)}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === 'alumnos' && (
        <SeccionAlumnos
          studentProfiles={studentProfiles}
          subjects={subjects}
          updateStudentProfile={updateStudentProfile}
        />
      )}
      {tab === 'profesores' && (
        <SeccionProfesores
          staffProfiles={staffProfiles}
          subjects={subjects}
        />
      )}
      {tab === 'codigos' && (
        <SeccionCodigos
          academyId={currentUser?.academy_id}
          subjects={subjects}
        />
      )}
      {tab === 'config' && (
        <SeccionConfiguracion
          currentUser={currentUser}
          academy={academy}
        />
      )}
    </div>
  )
}
