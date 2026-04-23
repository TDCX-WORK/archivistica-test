import { useState } from 'react'
import {
  Plus, ClipboardList, Inbox, Trash2, CheckCircle2,
  Clock, X, Loader2, AlertCircle, Users, User, Calendar
} from 'lucide-react'
import { useTareasProfesor } from '../../hooks/useTareas'
import { useProfesor }       from '../../hooks/useProfesor'
import type { CurrentUser }  from '../../types'
import type { Assignment, Submission } from '../../hooks/useTareas'
import styles from './TareasProfesorPage.module.css'

interface Props {
  currentUser: CurrentUser | null
}

function fmtFecha(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate + 'T23:59:59') < new Date()
}

const AVATAR_COLORS = [
  { bg: 'rgba(37,99,235,0.12)',  border: '#2563EB' },
  { bg: 'rgba(124,58,237,0.12)', border: '#7C3AED' },
  { bg: 'rgba(5,150,105,0.12)',  border: '#059669' },
  { bg: 'rgba(217,119,6,0.12)',  border: '#D97706' },
  { bg: 'rgba(220,38,38,0.12)',  border: '#DC2626' },
  { bg: 'rgba(8,145,178,0.12)',  border: '#0891B2' },
]
function avatarColor(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

/* ── Fila de entrega ─────────────────────────────────────────────── */
function SubmissionRow({
  submission,
  onCorregir,
}: {
  submission: Submission
  onCorregir: (id: string, feedback: string) => Promise<{ ok?: boolean; error?: string }>
}) {
  const [correcting, setCorrecting] = useState(false)
  const [fbText,     setFbText]     = useState('')
  const [saving,     setSaving]     = useState(false)

  const nombre = submission.alumno?.username ?? submission.alumno_id.slice(0, 8)
  const color  = avatarColor(submission.alumno_id)

  const handleCorregir = async () => {
    setSaving(true)
    await onCorregir(submission.id, fbText)
    setSaving(false)
    setCorrecting(false)
  }

  return (
    <div className={styles.submissionRow}>
      <div className={styles.submissionTop}>
        <div className={styles.submissionAuthor}>
          <div
            className={styles.submissionAvatar}
            style={{ background: color.bg, borderColor: color.border }}
          >
            {nombre[0]?.toUpperCase() ?? '?'}
          </div>
          <span className={styles.submissionName}>{nombre}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className={styles.submissionDate}>{fmtFecha(submission.created_at)}</span>
          <span className={[
            styles.badge,
            submission.status === 'corregida' ? styles.badgeCorrected : styles.badgeDone,
          ].join(' ')}>
            {submission.status === 'corregida'
              ? <><CheckCircle2 size={10} /> Corregida</>
              : <><Clock size={10} /> Entregada</>
            }
          </span>
        </div>
      </div>

      {/* Cuerpo de la entrega */}
      <div
        className={styles.submissionBody}
        dangerouslySetInnerHTML={{ __html: submission.body }}
      />

      {/* Feedback existente */}
      {submission.status === 'corregida' && submission.feedback && (
        <div className={styles.feedbackExistente}>
          💬 {submission.feedback}
        </div>
      )}

      {/* Botón corregir */}
      {submission.status === 'entregada' && !correcting && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className={styles.btnCorregir}
            onClick={() => setCorrecting(true)}
          >
            <CheckCircle2 size={13} />
            Corregir
          </button>
        </div>
      )}

      {/* Formulario corrección */}
      {correcting && (
        <div className={styles.corregirForm}>
          <span className={styles.corregirLabel}>Comentario (opcional)</span>
          <textarea
            className={styles.corregirTextarea}
            placeholder="Escribe un comentario para el alumno…"
            value={fbText}
            onChange={e => setFbText(e.target.value)}
            autoFocus
          />
          <div className={styles.corregirActions}>
            <button
              className={styles.btnCancelar}
              onClick={() => setCorrecting(false)}
            >
              Cancelar
            </button>
            <button
              className={styles.btnCorregir}
              onClick={handleCorregir}
              disabled={saving}
            >
              {saving
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <CheckCircle2 size={13} />
              }
              {saving ? 'Guardando…' : 'Marcar como corregida'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Página principal ────────────────────────────────────────────── */
export default function TareasProfesorPage({ currentUser }: Props) {
  const {
    assignments, loading, error,
    crearAssignment, borrarAssignment, corregir,
    getSubmissionsForAssignment,
  } = useTareasProfesor(currentUser)

  const { alumnos } = useProfesor(currentUser)

  const [selected,   setSelected]   = useState<Assignment | null>(null)
  const [showModal,  setShowModal]   = useState(false)
  const [saving,     setSaving]      = useState(false)
  const [feedback,   setFeedback]    = useState<{ msg: string; ok: boolean } | null>(null)

  // Campos del modal
  const [title,      setTitle]      = useState('')
  const [desc,       setDesc]       = useState('')
  const [dueDate,    setDueDate]    = useState('')
  const [alumnoId,   setAlumnoId]   = useState<string>('clase')

  const mostrarFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleCrear = async () => {
    if (!title.trim()) return mostrarFeedback('El título es obligatorio', false)
    if (!desc.trim())  return mostrarFeedback('La descripción es obligatoria', false)
    if (!dueDate)      return mostrarFeedback('La fecha límite es obligatoria', false)

    setSaving(true)
    const result = await crearAssignment({
      title,
      description: desc,
      due_date:    dueDate,
      alumno_id:   alumnoId === 'clase' ? null : alumnoId,
      subject_id:  currentUser?.subject_id ?? null,
    })
    setSaving(false)

    if (result?.error) return mostrarFeedback('Error al crear la tarea', false)
    setTitle(''); setDesc(''); setDueDate(''); setAlumnoId('clase')
    setShowModal(false)
    mostrarFeedback('Tarea creada correctamente', true)
  }

  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setShowModal(false)
  }

  const selectedSubs = selected ? getSubmissionsForAssignment(selected.id) : []

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Tareas</h1>
          <p className={styles.subtitle}>Crea tareas y revisa las entregas de tus alumnos</p>
        </div>
        <button className={styles.btnNueva} onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Nueva tarea
        </button>
      </div>

      {feedback && (
        <div className={[
          styles.feedback,
          feedback.ok ? styles.feedbackOk : styles.feedbackError,
        ].join(' ')} style={{ marginBottom: '1rem' }}>
          {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {feedback.msg}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando tareas…
        </div>
      ) : (
        <div className={styles.grid}>

          {/* Lista de tareas */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div
                className={styles.panelHeaderIcon}
                style={{ background: '#EFF6FF', color: '#2563EB' }}
              >
                <ClipboardList size={15} />
              </div>
              Tareas ({assignments.length})
            </div>

            {assignments.length === 0 ? (
              <div className={styles.empty}>
                <ClipboardList size={28} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Sin tareas todavía</p>
                <p className={styles.emptySub}>Crea la primera tarea para tu clase</p>
              </div>
            ) : (
              assignments.map(a => {
                const subs    = getSubmissionsForAssignment(a.id)
                const overdue = isOverdue(a.due_date)
                return (
                  <button
                    key={a.id}
                    className={[
                      styles.taskRow,
                      selected?.id === a.id ? styles.taskRowActive : '',
                    ].join(' ')}
                    onClick={() => setSelected(prev => prev?.id === a.id ? null : a)}
                  >
                    <div className={styles.taskRowInfo}>
                      <p className={styles.taskRowTitle}>{a.title}</p>
                      <div className={styles.taskRowMeta}>
                        <Calendar size={10} />
                        <span style={{ color: overdue ? '#DC2626' : 'inherit' }}>
                          {fmtFecha(a.due_date)}{overdue ? ' · Vencida' : ''}
                        </span>
                        <span className={styles.metaDot} />
                        {a.alumno_id
                          ? <><User size={10} /> Individual</>
                          : <><Users size={10} /> Toda la clase</>
                        }
                      </div>
                    </div>
                    <div className={styles.taskRowRight}>
                      <span className={[
                        styles.countBadge,
                        subs.length > 0 ? styles.countBadgeHas : '',
                      ].join(' ')}>
                        {subs.length} entrega{subs.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        className={styles.btnBorrar}
                        onClick={e => { e.stopPropagation(); borrarAssignment(a.id) }}
                        title="Eliminar tarea"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Panel entregas */}
          <div className={styles.submissionsPanel}>
            <div className={styles.panelHeader}>
              <div
                className={styles.panelHeaderIcon}
                style={{ background: '#ECFDF5', color: '#059669' }}
              >
                <Inbox size={15} />
              </div>
              {selected
                ? `Entregas — ${selected.title}`
                : 'Entregas'
              }
            </div>

            {!selected ? (
              <div className={styles.empty}>
                <Inbox size={28} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Selecciona una tarea</p>
                <p className={styles.emptySub}>Verás aquí las entregas de tus alumnos</p>
              </div>
            ) : selectedSubs.length === 0 ? (
              <div className={styles.empty}>
                <Clock size={28} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Sin entregas todavía</p>
                <p className={styles.emptySub}>Los alumnos aún no han entregado esta tarea</p>
              </div>
            ) : (
              selectedSubs.map(sub => (
                <SubmissionRow
                  key={sub.id}
                  submission={sub}
                  onCorregir={corregir}
                />
              ))
            )}
          </div>

        </div>
      )}

      {/* Modal nueva tarea */}
      {showModal && (
        <div className={styles.overlay} onClick={handleOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nueva tarea</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Título</label>
              <input
                className={styles.input}
                placeholder="Título de la tarea"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descripción</label>
              <textarea
                className={styles.textarea}
                placeholder="Explica qué tienen que hacer los alumnos…"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>

            <div className={styles.selectRow}>
              <div className={styles.field}>
                <label className={styles.label}>Fecha límite</label>
                <input
                  type="date"
                  className={styles.input}
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>

              <div className={styles.selectWrap}>
                <label className={styles.label}>Destinatario</label>
                <Users size={13} className={styles.selectIcon} style={{ top: '65%' }} />
                <select
                  className={styles.select}
                  value={alumnoId}
                  onChange={e => setAlumnoId(e.target.value)}
                >
                  <option value="clase">Toda la clase</option>
                  {alumnos.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.fullName ?? a.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {feedback && (
              <div className={[
                styles.feedback,
                feedback.ok ? styles.feedbackOk : styles.feedbackError,
              ].join(' ')}>
                {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {feedback.msg}
              </div>
            )}

            <div className={styles.modalFooter}>
              <button className={styles.btnCancelar} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className={styles.btnCrear}
                onClick={handleCrear}
                disabled={saving}
              >
                {saving
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Plus size={14} />
                }
                {saving ? 'Creando…' : 'Crear tarea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
