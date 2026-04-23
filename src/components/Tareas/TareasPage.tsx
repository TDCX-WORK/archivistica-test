import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit                   from '@tiptap/starter-kit'
import Placeholder                  from '@tiptap/extension-placeholder'
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Send, Loader2, Edit3
} from 'lucide-react'
import { useTareasAlumno } from '../../hooks/useTareas'
import type { CurrentUser } from '../../types'
import type { Assignment }  from '../../hooks/useTareas'
import styles from './TareasPage.module.css'

interface Props {
  currentUser: CurrentUser | null
}

type Filter = 'todas' | 'pendiente' | 'entregada' | 'corregida'

function fmtFecha(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate + 'T23:59:59') < new Date()
}

function diasRestantes(dueDate: string): string {
  const diff = Math.ceil(
    (new Date(dueDate + 'T23:59:59').getTime() - new Date().getTime()) / 86400000
  )
  if (diff < 0)  return 'Vencida'
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `${diff} días`
}

/* ── Editor TipTap ───────────────────────────────────────────────── */
function RichEditor({
  onSubmit, initial = '', sending
}: {
  onSubmit: (html: string) => void
  initial?: string
  sending:  boolean
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escribe tu entrega aquí…' }),
    ],
    content: initial,
    editorProps: {
  attributes: { class: styles.editorContent ?? '' },
},
  })

  if (!editor) return null

  return (
    <div>
      <div className={styles.editorWrap}>
        <div className={styles.editorToolbar}>
          <button
            type="button"
            className={[styles.toolbarBtn, editor.isActive('bold') ? styles.toolbarBtnActive : ''].join(' ')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrita"
          >
            <strong>N</strong>
          </button>
          <button
            type="button"
            className={[styles.toolbarBtn, editor.isActive('italic') ? styles.toolbarBtnActive : ''].join(' ')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Cursiva"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={[styles.toolbarBtn, editor.isActive('bulletList') ? styles.toolbarBtnActive : ''].join(' ')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista"
          >
            •
          </button>
          <button
            type="button"
            className={[styles.toolbarBtn, editor.isActive('orderedList') ? styles.toolbarBtnActive : ''].join(' ')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista numerada"
          >
            1.
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className={styles.taskActions} style={{ marginTop: '0.6rem' }}>
        <button
          className={styles.btnEntregar}
          onClick={() => onSubmit(editor.getHTML())}
          disabled={sending || editor.isEmpty}
        >
          {sending
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={14} />
          }
          {sending ? 'Enviando…' : 'Entregar'}
        </button>
      </div>
    </div>
  )
}

/* ── Card de tarea ───────────────────────────────────────────────── */
function TaskCard({
  assignment,
  currentUser,
  getSubmission,
  entregar,
}: {
  assignment:   Assignment
  currentUser:  CurrentUser | null
  getSubmission: (id: string) => ReturnType<ReturnType<typeof useTareasAlumno>['getSubmission']>
  entregar:     (id: string, body: string) => Promise<{ ok?: boolean; error?: string }>
}) {
  const [open,     setOpen]     = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [sending,  setSending]  = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const submission = getSubmission(assignment.id)
  const overdue    = isOverdue(assignment.due_date)
  const status     = submission?.status ?? (overdue ? 'vencida' : 'pendiente')

  const cardClass = [
    styles.taskCard,
    status === 'pendiente' || status === 'vencida'
      ? overdue ? styles.taskCardOverdue : styles.taskCardPending
      : status === 'entregada' ? styles.taskCardDone
      : styles.taskCardCorrected,
  ].join(' ')

  const mostrarFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleEntregar = async (html: string) => {
    setSending(true)
    const result = await entregar(assignment.id, html)
    setSending(false)
    if (result.error) return mostrarFeedback('Error al entregar', false)
    mostrarFeedback('¡Entregado correctamente!', true)
    setEditing(false)
  }

  const BadgeContent = () => {
    if (submission?.status === 'corregida')
      return <><CheckCircle2 size={10} /> Corregida</>
    if (submission?.status === 'entregada')
      return <><Clock size={10} /> Entregada</>
    if (overdue)
      return <><AlertCircle size={10} /> Vencida</>
    return <><Clock size={10} /> Pendiente</>
  }

  const badgeClass = submission?.status === 'corregida' ? styles.badgeCorrected
    : submission?.status === 'entregada' ? styles.badgeDone
    : overdue ? styles.badgeOverdue
    : styles.badgePending

  return (
    <div className={cardClass}>
      <div className={styles.taskHeader} onClick={() => setOpen(o => !o)}>
        <div className={styles.taskHeaderLeft}>
          <p className={styles.taskTitle}>{assignment.title}</p>
          <div className={styles.taskMeta}>
            <span>Entrega: {fmtFecha(assignment.due_date)}</span>
            <span className={styles.metaDot} />
            <span style={{ color: overdue && !submission ? '#DC2626' : 'inherit' }}>
              {diasRestantes(assignment.due_date)}
            </span>
            {assignment.creator && (
              <>
                <span className={styles.metaDot} />
                <span>{assignment.creator.username}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={[styles.badge, badgeClass].join(' ')}>
            <BadgeContent />
          </span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      <p className={styles.taskDesc}>{assignment.description}</p>

      {open && (
        <div className={styles.taskBody}>
          <span className={styles.submissionLabel}>Tu entrega</span>

          {/* Sin entrega todavía */}
          {!submission && !editing && (
            <RichEditor onSubmit={handleEntregar} sending={sending} />
          )}

          {/* Entregada — mostrar texto */}
          {submission && !editing && (
            <>
              <div
                className={styles.submissionView}
                dangerouslySetInnerHTML={{ __html: submission.body }}
              />
              {submission.status === 'corregida' && submission.feedback && (
                <div className={styles.feedbackBubble}>
                  <p className={styles.feedbackLabel}>Comentario del profesor</p>
                  <p className={styles.feedbackText}>{submission.feedback}</p>
                </div>
              )}
              {submission.status === 'entregada' && (
                <div className={styles.taskActions}>
                  <button className={styles.btnEditar} onClick={() => setEditing(true)}>
                    <Edit3 size={13} /> Editar entrega
                  </button>
                </div>
              )}
            </>
          )}

          {/* Editando entrega existente */}
          {submission && editing && (
            <RichEditor
              onSubmit={handleEntregar}
              initial={submission.body}
              sending={sending}
            />
          )}

          {feedback && (
            <div className={[
              styles.inlineFeedback,
              feedback.ok ? styles.inlineFeedbackOk : styles.inlineFeedbackError,
            ].join(' ')}>
              {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {feedback.msg}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Página principal ────────────────────────────────────────────── */
export default function TareasPage({ currentUser }: Props) {
  const { assignments, loading, error, getSubmission, entregar } = useTareasAlumno(currentUser)
  const [filter, setFilter] = useState<Filter>('todas')

  const filtered = assignments.filter(a => {
    if (filter === 'todas') return true
    const sub     = getSubmission(a.id)
    const overdue = isOverdue(a.due_date)
    if (filter === 'pendiente')  return !sub && !overdue
    if (filter === 'entregada')  return sub?.status === 'entregada'
    if (filter === 'corregida')  return sub?.status === 'corregida'
    return true
  })

  const counts = {
    pendiente: assignments.filter(a => !getSubmission(a.id) && !isOverdue(a.due_date)).length,
    entregada: assignments.filter(a => getSubmission(a.id)?.status === 'entregada').length,
    corregida: assignments.filter(a => getSubmission(a.id)?.status === 'corregida').length,
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'todas',     label: `Todas (${assignments.length})`        },
    { id: 'pendiente', label: `Pendientes (${counts.pendiente})`     },
    { id: 'entregada', label: `Entregadas (${counts.entregada})`     },
    { id: 'corregida', label: `Corregidas (${counts.corregida})`     },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tareas</h1>
        <p className={styles.subtitle}>Tus tareas y entregas</p>
      </div>

      {error && (
        <div className={styles.inlineFeedback} style={{ marginBottom: '1rem' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={[styles.filterBtn, filter === f.id ? styles.filterBtnActive : ''].join(' ')}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando tareas…
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <ClipboardList size={32} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>
            {filter === 'todas' ? 'Sin tareas todavía' : `Sin tareas ${filter}s`}
          </p>
          <p className={styles.emptySub}>
            {filter === 'todas'
              ? 'Tu profesor publicará tareas aquí'
              : 'Cambia el filtro para ver otras tareas'}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(a => (
            <TaskCard
              key={a.id}
              assignment={a}
              currentUser={currentUser}
              getSubmission={getSubmission}
              entregar={entregar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
