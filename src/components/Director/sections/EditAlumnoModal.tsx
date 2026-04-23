import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import type { AlumnoConExtended } from '../../../types'
import styles from '../GestionAcademia/GestionAcademia.module.css'

export interface AlumnoForm {
  full_name:     string
  phone:         string
  email_contact: string
  city:          string
  exam_date:     string
  monthly_price: string
  access_until:  string
}

export function EditAlumnoModal({ alumno, onSave, onClose }: {
  alumno:  AlumnoConExtended
  onSave:  (id: string, form: AlumnoForm) => Promise<void>
  onClose: () => void
}) {
  const ext = alumno.extended
  const [form, setForm] = useState<AlumnoForm>({
    full_name:     String(ext?.full_name     ?? ''),
    phone:         String(ext?.phone         ?? ''),
    email_contact: String(ext?.email_contact ?? ''),
    city:          String(ext?.city          ?? ''),
    exam_date:     String(ext?.exam_date     ?? ''),
    monthly_price: ext?.monthly_price != null ? String(ext.monthly_price) : '',
    access_until:  alumno.access_until?.slice(0, 10) ?? '',
  })
  const [saving, setSaving] = useState(false)

  // ESC para cerrar + bloquear scroll del body mientras está abierto
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, saving])

  const handleSave = async () => {
    setSaving(true)
    await onSave(alumno.id, form)
    setSaving(false)
    onClose()
  }

  const nombre = (ext?.full_name ?? '') || alumno.username

  const modal = (
    <AnimatePresence>
      <motion.div
        key="overlay"
        className={styles.overlay}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          key="modal"
          className={styles.modal}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,   scale: 1 }}
          exit={{    opacity: 0, y: -16, scale: 0.98 }}
          transition={{
            type: 'spring',
            damping: 26,
            stiffness: 320,
            mass: 0.8,
          }}
        >
          <div className={styles.modalHead}>
            <div className={styles.modalAvatar}>{nombre[0]!.toUpperCase()}</div>
            <div className={styles.modalIdent}>
              <h3 className={styles.modalTitle}>{nombre}</h3>
              <span className={styles.modalSub}>@{alumno.username}</span>
            </div>
            <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar"><X size={14} /></button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              {([
                { key: 'full_name',     label: 'Nombre completo',    type: 'text',   placeholder: 'Nombre y apellidos' },
                { key: 'phone',         label: 'Teléfono',           type: 'tel',    placeholder: '612 345 678' },
                { key: 'email_contact', label: 'Email de contacto',  type: 'email',  placeholder: 'email@ejemplo.com' },
                { key: 'city',          label: 'Ciudad',             type: 'text',   placeholder: 'Madrid' },
                { key: 'exam_date',     label: 'Fecha del examen',   type: 'date',   placeholder: '' },
                { key: 'monthly_price', label: 'Precio mensual (€)', type: 'number', placeholder: '89' },
                { key: 'access_until',  label: 'Acceso hasta',       type: 'date',   placeholder: '' },
              ] as { key: keyof AlumnoForm; label: string; type: string; placeholder: string }[]).map(({ key, label, type, placeholder }) => (
                <div key={key} className={styles.formField}>
                  <label className={styles.formLabel}>{label}</label>
                  <input
                    className={styles.formInput}
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.modalFoot}>
            <button className={styles.btnCancelar} onClick={onClose} disabled={saving}>Cancelar</button>
            <button className={styles.btnGuardar} onClick={handleSave} disabled={saving}>
              <Save size={13} /> {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  // Portal al body para que el position:fixed no herede contextos raros
  // (backdrop-filter / transform de ancestros que rompen el viewport coords)
  return createPortal(modal, document.body)
}
