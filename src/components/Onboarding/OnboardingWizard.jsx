import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  User, Phone, MapPin, Target, Calendar,
  ChevronRight, ChevronLeft, Check, Sparkles
} from 'lucide-react'
import styles from './OnboardingWizard.module.css'

/* ─── Mascotas ────────────────────────────────────────────────────────────── */
const MASCOTAS = [
  { id: 'zorro',     emoji: '🦊', nombre: 'Zorro',     desc: 'Astuto y estratega. Siempre encuentra el camino.' },
  { id: 'buho',      emoji: '🦉', nombre: 'Búho',      desc: 'Sabio y paciente. Aprende de cada error.' },
  { id: 'leon',      emoji: '🦁', nombre: 'León',      desc: 'Valiente y constante. Nunca se rinde.' },
  { id: 'tortuga',   emoji: '🐢', nombre: 'Tortuga',   desc: 'Metódica y perseverante. Lenta pero segura.' },
  { id: 'aguila',    emoji: '🦅', nombre: 'Águila',    desc: 'Visionaria y enfocada. Ve el objetivo desde lejos.' },
  { id: 'dragon',    emoji: '🐉', nombre: 'Dragón',    desc: 'Legendario y poderoso. Nació para superar lo imposible.' },
  { id: 'lobo',      emoji: '🐺', nombre: 'Lobo',      desc: 'Disciplinado y leal. Fuerte en equipo.' },
  { id: 'mariposa',  emoji: '🦋', nombre: 'Mariposa',  desc: 'Transformadora y libre. Cada sesión te hace más grande.' },
]

/* ─── Paso 1: Datos personales ────────────────────────────────────────────── */
function Paso1({ datos, onChange }) {
  return (
    <div className={styles.paso}>
      <div className={styles.pasoIcon}><User size={22} /></div>
      <h2 className={styles.pasoTitle}>Cuéntanos sobre ti</h2>
      <p className={styles.pasoDesc}>Estos datos son privados y solo los ve tu academia.</p>

      <div className={styles.campos}>
        <div className={styles.campo}>
          <label className={styles.campoLabel}>Nombre completo</label>
          <input className={styles.campoInput}
            type="text" placeholder="Tu nombre y apellidos"
            value={datos.full_name}
            onChange={e => onChange('full_name', e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.campoRow}>
          <div className={styles.campo}>
            <label className={styles.campoLabel}>Teléfono</label>
            <input className={styles.campoInput}
              type="tel" placeholder="612 345 678"
              value={datos.phone}
              onChange={e => onChange('phone', e.target.value)}
            />
          </div>
          <div className={styles.campo}>
            <label className={styles.campoLabel}>Ciudad</label>
            <input className={styles.campoInput}
              type="text" placeholder="Madrid"
              value={datos.city}
              onChange={e => onChange('city', e.target.value)}
            />
          </div>
        </div>
        <div className={styles.campo}>
          <label className={styles.campoLabel}>Email de contacto <span className={styles.opcional}>(opcional)</span></label>
          <input className={styles.campoInput}
            type="email" placeholder="tu@email.com"
            value={datos.email_contact}
            onChange={e => onChange('email_contact', e.target.value)}
          />
        </div>
        <div className={styles.campo}>
          <label className={styles.campoLabel}>
            <Target size={13} style={{ display: 'inline', marginRight: 4 }} />
            Fecha del examen <span className={styles.opcional}>(si la conoces)</span>
          </label>
          <input className={styles.campoInput}
            type="date" value={datos.exam_date}
            onChange={e => onChange('exam_date', e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Paso 2: Mascota ─────────────────────────────────────────────────────── */
function Paso2({ mascota, onChange }) {
  return (
    <div className={styles.paso}>
      <div className={styles.pasoIcon}><Sparkles size={22} /></div>
      <h2 className={styles.pasoTitle}>Elige tu mascota de estudio</h2>
      <p className={styles.pasoDesc}>Tu compañero de oposición. Te acompañará durante todo el camino.</p>

      <div className={styles.mascotasGrid}>
        {MASCOTAS.map(m => (
          <button key={m.id}
            className={[styles.mascotaCard, mascota === m.id ? styles.mascotaCardActive : ''].join(' ')}
            onClick={() => onChange('mascota', m.id)}
            type="button"
          >
            <span className={styles.mascotaEmoji}>{m.emoji}</span>
            <span className={styles.mascotaNombre}>{m.nombre}</span>
            <span className={styles.mascotaDesc}>{m.desc}</span>
            {mascota === m.id && (
              <div className={styles.mascotaCheck}><Check size={12} /></div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Paso 3: Confirmación ────────────────────────────────────────────────── */
function Paso3({ datos }) {
  const mascota = MASCOTAS.find(m => m.id === datos.mascota)
  return (
    <div className={styles.paso}>
      <div className={styles.pasoIconGrande}>{mascota?.emoji || '🎯'}</div>
      <h2 className={styles.pasoTitle}>¡Todo listo, {datos.full_name?.split(' ')[0] || 'campeón'}!</h2>
      <p className={styles.pasoDesc}>
        Tu compañero de estudio es el {mascota?.nombre || 'Zorro'}. {mascota?.desc}
      </p>

      <div className={styles.resumen}>
        {datos.full_name && (
          <div className={styles.resumenRow}>
            <User size={13} /><span>{datos.full_name}</span>
          </div>
        )}
        {datos.city && (
          <div className={styles.resumenRow}>
            <MapPin size={13} /><span>{datos.city}</span>
          </div>
        )}
        {datos.phone && (
          <div className={styles.resumenRow}>
            <Phone size={13} /><span>{datos.phone}</span>
          </div>
        )}
        {datos.exam_date && (
          <div className={styles.resumenRow}>
            <Target size={13} />
            <span>Examen el {new Date(datos.exam_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      <p className={styles.pasoMotivacion}>
        Las oposiciones se aprueban con constancia. Un día a la vez. ¡Tú puedes!
      </p>
    </div>
  )
}

/* ─── Wizard principal ────────────────────────────────────────────────────── */
export default function OnboardingWizard({ currentUser, onComplete }) {
  const [paso,    setPaso]    = useState(1)
  const [saving,  setSaving]  = useState(false)
  const [datos,   setDatos]   = useState({
    full_name:     '',
    phone:         '',
    city:          '',
    email_contact: '',
    exam_date:     '',
    mascota:       '',
  })

  const onChange = (key, value) => setDatos(prev => ({ ...prev, [key]: value }))

  const canNext = () => {
    if (paso === 1) return datos.full_name.trim().length >= 2
    if (paso === 2) return datos.mascota !== ''
    return true
  }

  const handleNext = () => {
    if (paso < 3) { setPaso(p => p + 1); return }
    handleFinish()
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await supabase.from('student_profiles').upsert({
        id:                  currentUser.id,
        full_name:           datos.full_name.trim() || null,
        phone:               datos.phone.trim()     || null,
        city:                datos.city.trim()       || null,
        email_contact:       datos.email_contact.trim() || null,
        exam_date:           datos.exam_date         || null,
        mascota:             datos.mascota            || null,
        onboarding_completed: true,
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'id' })

      onComplete()
    } catch (err) {
      console.error('Error guardando onboarding:', err)
      setSaving(false)
    }
  }

  const PASOS_LABEL = ['Tus datos', 'Tu mascota', '¡Listo!']

  return (
    <div className={styles.overlay}>
      <div className={styles.wizard}>

        {/* Header con logo */}
        <div className={styles.wizardHeader}>
          <span className={styles.wizardBrand}>🦊 FrostFox Academy</span>
          <span className={styles.wizardSub}>Configuración inicial</span>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          {PASOS_LABEL.map((label, i) => {
            const n = i + 1
            const done   = n < paso
            const active = n === paso
            return (
              <div key={n} className={styles.stepperItem}>
                <div className={[
                  styles.stepperCircle,
                  done   ? styles.stepperDone   : '',
                  active ? styles.stepperActive : '',
                ].join(' ')}>
                  {done ? <Check size={12} strokeWidth={2.5} /> : n}
                </div>
                <span className={[styles.stepperLabel, active ? styles.stepperLabelActive : ''].join(' ')}>
                  {label}
                </span>
                {i < PASOS_LABEL.length - 1 && (
                  <div className={[styles.stepperLine, done ? styles.stepperLineDone : ''].join(' ')} />
                )}
              </div>
            )
          })}
        </div>

        {/* Contenido del paso */}
        <div className={styles.wizardBody}>
          {paso === 1 && <Paso1 datos={datos} onChange={onChange} />}
          {paso === 2 && <Paso2 mascota={datos.mascota} onChange={onChange} />}
          {paso === 3 && <Paso3 datos={datos} />}
        </div>

        {/* Botones */}
        <div className={styles.wizardFooter}>
          {paso > 1 && (
            <button className={styles.btnVolver} onClick={() => setPaso(p => p - 1)}>
              <ChevronLeft size={15} /> Volver
            </button>
          )}
          {paso === 1 && (
            <button className={styles.btnSaltar}
              onClick={() => setPaso(2)}>
              Rellenar después
            </button>
          )}
          <button
            className={styles.btnSiguiente}
            onClick={handleNext}
            disabled={!canNext() || saving}
          >
            {saving ? 'Guardando…' : paso === 3 ? '¡Empezar a estudiar! 🚀' : 'Siguiente'}
            {paso < 3 && !saving && <ChevronRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
