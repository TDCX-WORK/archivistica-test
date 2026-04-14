import { useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  Users, Zap, AlertTriangle, Shield, BarChart2, BookOpen,
  RefreshCw, TrendingUp, TrendingDown, GraduationCap,
  Clock, FileText, CheckCircle, X, Check, Key, Euro,
  UserPlus, Star, BookMarked, Rocket, ArrowUpDown, ArrowRight,
  MessageSquare, Send, Trash2, CornerDownLeft, Megaphone, RotateCcw,
  Phone, MapPin, Mail, Target, Calendar, Edit3,
  Save, ChevronLeft, ChevronUp
} from 'lucide-react'
import type { CurrentUser } from '../../../types'
import { scoreColor, fmt, MASCOTAS } from '../DirectorTypes'
import styles from './AlumnoDetallePanel.module.css'

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

interface ProfileSimple {
  id:           string
  username:     string
  role:         string
  access_until: string | null
  created_at:   string
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

interface AlumnoDetalleForm {
  full_name:     string
  phone:         string
  email_contact: string
  city:          string
  exam_date:     string
  monthly_price: string
  access_until:  string
}


// ── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className={styles.infoRow}>
      <Icon size={13} className={styles.infoIcon} />
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}


// ── AlumnoDetallePanel ─────────────────────────────────────────────────────
function AlumnoDetallePanel({ alumno, statsAlumno, onBack, onSave }: {
  alumno:      AlumnoEnriquecido
  statsAlumno: { nota: number | null; sesiones: number; fallos: number; enRiesgo: boolean; diasInactivo: number | null } | undefined
  onBack:      () => void
  onSave:      (id: string, fields: AlumnoDetalleForm) => Promise<void>
}) {
  const ext     = alumno.extended ?? {}
  const mascota = MASCOTAS[ext.mascota as string] ?? null
  const [editando, setEditando] = useState(false)
  const [form,     setForm]     = useState<AlumnoDetalleForm>({
    full_name:     String(ext.full_name     ?? ''),
    phone:         String(ext.phone         ?? ''),
    email_contact: String(ext.email_contact ?? ''),
    city:          String(ext.city          ?? ''),
    exam_date:     String(ext.exam_date     ?? ''),
    monthly_price: String(ext.monthly_price ?? ''),
    access_until:  alumno.access_until?.slice(0, 10) ?? '',
  })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave(alumno.id, form); setSaving(false); setEditando(false) }

  return (
    <div className={styles.detallePanel}>
      <div className={styles.detallePanelHead}>
        <button className={styles.btnBack} onClick={onBack}><ChevronLeft size={16} /> Volver</button>
        <div className={styles.detalleAvatar} style={{ background: scoreColor(statsAlumno?.nota) + '22', color: scoreColor(statsAlumno?.nota) }}>
          {mascota ? mascota.emoji : alumno.username[0]!.toUpperCase()}
        </div>
        <div className={styles.detalleTitleWrap}>
          <h2 className={styles.detalleTitle}>{String(ext.full_name ?? alumno.username)}</h2>
          <div className={styles.detalleMeta}>
            <span className={styles.detalleUsername}>@{alumno.username}</span>
            {mascota && <span className={styles.detalleMascota}>{mascota.emoji} {mascota.nombre}</span>}
          </div>
        </div>
        <button className={styles.btnEditarPerfil} onClick={() => setEditando(v => !v)}>
          <Edit3 size={13} /> {editando ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className={styles.detalleLayout}>
        <div className={styles.detalleLeft}>
          <div className={styles.detalleCard}>
            <h3 className={styles.detalleCardTitle}>Datos personales</h3>
            {editando ? (
              <div className={styles.editForm}>
                {([
                  { key: 'full_name',     label: 'Nombre completo',   type: 'text',   placeholder: 'Nombre y apellidos' },
                  { key: 'phone',         label: 'Teléfono',           type: 'tel',    placeholder: '612 345 678' },
                  { key: 'email_contact', label: 'Email',              type: 'email',  placeholder: 'email@ejemplo.com' },
                  { key: 'city',          label: 'Ciudad',             type: 'text',   placeholder: 'Madrid' },
                  { key: 'exam_date',     label: 'Fecha del examen',   type: 'date',   placeholder: '' },
                  { key: 'monthly_price', label: 'Precio mensual (€)', type: 'number', placeholder: '89' },
                  { key: 'access_until',  label: 'Acceso hasta',       type: 'date',   placeholder: '' },
                ] as { key: keyof AlumnoDetalleForm; label: string; type: string; placeholder: string }[]).map(({ key, label, type, placeholder }) => (
                  <div key={key} className={styles.editCampo}>
                    <label className={styles.editLabel}>{label}</label>
                    <input className={styles.editInput} type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <button className={styles.btnGuardar} onClick={handleSave} disabled={saving}>
                  <Save size={13} /> {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            ) : (
              <div className={styles.infoList}>
                <InfoRow icon={Users}    label="Usuario"      value={alumno.username} />
                <InfoRow icon={Users}    label="Nombre"       value={String(ext.full_name ?? '')} />
                <InfoRow icon={Phone}    label="Teléfono"     value={String(ext.phone ?? '')} />
                <InfoRow icon={Mail}     label="Email"        value={String(ext.email_contact ?? '')} />
                <InfoRow icon={MapPin}   label="Ciudad"       value={String(ext.city ?? '')} />
                <InfoRow icon={Calendar} label="Alta"         value={fmt(alumno.created_at)} />
                <InfoRow icon={Shield}   label="Acceso hasta" value={fmt(alumno.access_until)} />
                <InfoRow icon={Target}   label="Fecha examen" value={ext.exam_date ? fmt(String(ext.exam_date) + 'T12:00:00') : null} />
                <InfoRow icon={Euro}     label="Precio/mes"   value={ext.monthly_price ? `${ext.monthly_price} €` : null} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.detalleRight}>
          <div className={styles.detalleKpisGrid}>
            <div className={styles.detalleKpi}>
              <span className={styles.detalleKpiVal} style={{ color: scoreColor(statsAlumno?.nota) }}>
                {statsAlumno?.nota != null ? `${statsAlumno.nota}%` : '—'}
              </span>
              <span className={styles.detalleKpiLabel}>Nota media</span>
            </div>
            <div className={styles.detalleKpi}><span className={styles.detalleKpiVal}>{statsAlumno?.sesiones ?? 0}</span><span className={styles.detalleKpiLabel}>Sesiones</span></div>
            <div className={styles.detalleKpi}><span className={styles.detalleKpiVal}>{statsAlumno?.fallos ?? 0}</span><span className={styles.detalleKpiLabel}>Fallos</span></div>
            <div className={styles.detalleKpi}>
              <span className={styles.detalleKpiVal} style={{ color: statsAlumno?.enRiesgo ? '#DC2626' : '#059669' }}>
                {statsAlumno?.enRiesgo ? 'En riesgo' : 'Activo'}
              </span>
              <span className={styles.detalleKpiLabel}>Estado</span>
            </div>
          </div>
          {statsAlumno?.enRiesgo && (
            <div className={styles.detalleAlerta}><AlertTriangle size={14} /> Lleva {statsAlumno.diasInactivo ?? '?'} días sin estudiar.</div>
          )}
          {ext.exam_date && (() => {
            const dias = Math.ceil((new Date(String(ext.exam_date)).getTime() - new Date().getTime()) / 86400000)
            if (dias < 0) return null
            return (
              <div className={styles.detalleExamen}>
                <Target size={14} />
                <div><span className={styles.detalleExamenNum}>{dias}</span><span className={styles.detalleExamenLabel}> días para el examen</span></div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ── ProfesorDetallePanel ───────────────────────────────────────────────────
function ProfesorDetallePanel({ profesor, onBack }: { profesor: StudentProfile; onBack: () => void }) {
  const ext = profesor.extended ?? {}
  return (
    <div className={styles.detallePanel}>
      <div className={styles.detallePanelHead}>
        <button className={styles.btnBack} onClick={onBack}><ChevronLeft size={16} /> Volver</button>
        <div className={styles.detalleAvatar} style={{ background: '#7C3AED22', color: '#7C3AED' }}>
          {(String(ext.full_name ?? '') || profesor.username)[0]!.toUpperCase()}
        </div>
        <div className={styles.detalleTitleWrap}>
          <h2 className={styles.detalleTitle}>{String(ext.full_name ?? '') || profesor.username}</h2>
          <span className={styles.detalleUsername}>@{profesor.username} · {profesor.role}</span>
        </div>
      </div>
      <div className={styles.detalleCard} style={{ maxWidth: 480 }}>
        <h3 className={styles.detalleCardTitle}>Datos de contacto</h3>
        <div className={styles.infoList}>
          <InfoRow icon={Users}    label="Usuario"   value={profesor.username} />
          <InfoRow icon={Users}    label="Nombre"    value={String(ext.full_name    ?? '')} />
          <InfoRow icon={Phone}    label="Teléfono"  value={String(ext.phone        ?? '')} />
          <InfoRow icon={Mail}     label="Email"     value={String(ext.email_contact ?? '')} />
          <InfoRow icon={BookOpen} label="Bio"       value={String(ext.bio          ?? '')} />
          <InfoRow icon={Calendar} label="Alta"      value={fmt(profesor.created_at)} />
        </div>
        {!ext.full_name && !ext.phone && !ext.email_contact && (
          <p className={styles.emptyExtended}>Este profesor aún no ha completado su perfil.</p>
        )}
      </div>
    </div>
  )
}


export { AlumnoDetallePanel, ProfesorDetallePanel }
