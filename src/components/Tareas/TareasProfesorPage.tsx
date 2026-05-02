import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Plus, ClipboardList, Inbox, Trash2, CheckCircle2,
  Clock, X, Loader2, AlertCircle, Users, User, Calendar,
  MessageSquare, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useTareasProfesor, getGradeBadge, getGradeBadgeLabel } from '../../hooks/useTareas'
import type { CurrentUser } from '../../types'
import type { Assignment, Submission, InlineComment, GradeBadge } from '../../hooks/useTareas'
import s from './TareasProfesorPage.module.css'

interface Props { currentUser: CurrentUser | null }

function fmtFecha(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function isOverdue(d: string) { return new Date(d + 'T23:59:59') < new Date() }
function escapeHtml(t: string) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

const AVATAR_COLORS = [
  { bg: 'rgba(37,99,235,0.12)', border: '#93C5FD' },
  { bg: 'rgba(124,58,237,0.12)', border: '#C4B5FD' },
  { bg: 'rgba(5,150,105,0.12)', border: '#6EE7B7' },
  { bg: 'rgba(217,119,6,0.12)', border: '#FCD34D' },
  { bg: 'rgba(220,38,38,0.12)', border: '#FCA5A5' },
  { bg: 'rgba(8,145,178,0.12)', border: '#67E8F9' },
]
function avatarColor(id: string) {
  return AVATAR_COLORS[id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]!
}

function renderWithHighlights(html: string, comments: InlineComment[], activeId: string | null) {
  const tmp = document.createElement('div'); tmp.innerHTML = html
  const plain = tmp.textContent ?? ''
  if (!comments.length) return { __html: html }
  const sorted = [...comments].sort((a, b) => a.range_start - b.range_start)
  let result = '', cursor = 0
  for (const c of sorted) {
    if (c.range_start < cursor || c.range_start > plain.length) continue
    result += escapeHtml(plain.slice(cursor, c.range_start))
    const fragment = plain.slice(c.range_start, c.range_end)
    const cls = c.comment_type === 'correction' ? s.highlightCorrection : c.comment_type === 'suggestion' ? s.highlightSuggestion : s.highlightPositive
    result += `<span class="${cls}" data-comment-id="${c.id}">${escapeHtml(fragment)}</span>`
    if (activeId === c.id) {
      const tCls = c.comment_type === 'correction' ? s.annotationTypeCorrection : c.comment_type === 'suggestion' ? s.annotationTypeSuggestion : s.annotationTypePositive
      const label = c.comment_type === 'correction' ? 'Corrección' : c.comment_type === 'suggestion' ? 'Sugerencia' : 'Bien hecho'
      result += `<span class="${s.annotationTooltip} ${s.annotationTooltipVisible}">`
      result += `<span class="${s.annotationHeader}"><span class="${s.annotationType} ${tCls}">${label}</span>`
      result += `<span class="${s.annotationAuthor}">${escapeHtml(c.author?.username ?? 'Profesor')}</span></span>`
      result += `<span class="${s.annotationBody}">${escapeHtml(c.comment)}</span>`
      result += `<button class="${s.annotationDelete}" data-delete-comment="${c.id}" title="Eliminar">✕</button></span>`
    }
    cursor = c.range_end
  }
  result += escapeHtml(plain.slice(cursor))
  return { __html: result.replace(/\n/g, '<br/>') }
}

function GradeBadgeTag({ badge }: { badge: GradeBadge }) {
  const cls = badge === 'suspenso' ? s.gradeSuspenso : badge === 'aprobado' ? s.gradeAprobado : badge === 'notable' ? s.gradeNotable : s.gradeSobresaliente
  return <span className={`${s.gradeBadge} ${cls}`}>{getGradeBadgeLabel(badge)}</span>
}

function AnnotationsSummary({ comments }: { comments: InlineComment[] }) {
  if (!comments.length) return null
  const co = comments.filter(x => x.comment_type === 'correction').length
  const su = comments.filter(x => x.comment_type === 'suggestion').length
  const po = comments.filter(x => x.comment_type === 'positive').length
  return (
    <div className={s.annotationsSummary}>
      <MessageSquare size={12} />
      <span>{comments.length} anotacion{comments.length !== 1 ? 'es' : ''}</span>
      {co > 0 && <><span className={`${s.annotationDot} ${s.annotationDotCorrection}`} /><span>{co}</span></>}
      {su > 0 && <><span className={`${s.annotationDot} ${s.annotationDotSuggestion}`} /><span>{su}</span></>}
      {po > 0 && <><span className={`${s.annotationDot} ${s.annotationDotPositive}`} /><span>{po}</span></>}
    </div>
  )
}

function AddCommentPopover({ selectedText, onAdd, onCancel }: {
  selectedText: string
  onAdd: (comment: string, type: 'correction' | 'suggestion' | 'positive') => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [type, setType] = useState<'correction' | 'suggestion' | 'positive'>('correction')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  const types: { id: 'correction' | 'suggestion' | 'positive'; label: string }[] = [
    { id: 'correction', label: 'Corrección' }, { id: 'suggestion', label: 'Sugerencia' }, { id: 'positive', label: 'Bien' },
  ]
  const btnCls = type === 'correction' ? s.btnAddCommentCorrection : type === 'suggestion' ? s.btnAddCommentSuggestion : s.btnAddCommentPositive
  return (
    <div className={s.commentPopover}>
      <div className={s.commentPopoverQuote}>{selectedText}</div>
      <div className={s.commentTypeRow}>
        {types.map(t => (
          <button key={t.id} className={`${s.commentTypeBtn} ${type === t.id ? (t.id === 'correction' ? s.commentTypeBtnCorrection : t.id === 'suggestion' ? s.commentTypeBtnSuggestion : s.commentTypeBtnPositive) : ''}`}
            onClick={() => setType(t.id)}>{t.label}</button>
        ))}
      </div>
      <textarea ref={ref} className={s.commentPopoverTextarea} placeholder="Escribe tu comentario…"
        value={text} onChange={e => setText(e.target.value)} />
      <div className={s.commentPopoverActions}>
        <button className={s.btnCancelar} onClick={onCancel}>Cancelar</button>
        <button className={`${s.btnAddComment} ${btnCls}`} onClick={() => { if (text.trim()) onAdd(text.trim(), type) }} disabled={!text.trim()}>
          <MessageSquare size={13} /> Añadir
        </button>
      </div>
    </div>
  )
}

/* ── Rich editor for feedback ────────────────────────────────── */
function FeedbackEditor({ onReady }: { onReady: (getHtml: () => string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Comentario general para el alumno…' })],
    content: '',
    editorProps: { attributes: { class: s.correctionEditorContent ?? '' } },
  })
  useEffect(() => {
    if (editor) onReady(() => editor.getHTML())
  }, [editor, onReady])
  if (!editor) return null
  return (
    <div className={s.correctionEditorWrap}>
      <div className={s.correctionEditorToolbar}>
        <button type="button" className={`${s.toolbarBtn} ${editor.isActive('bold') ? s.toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><strong>N</strong></button>
        <button type="button" className={`${s.toolbarBtn} ${editor.isActive('italic') ? s.toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><em>I</em></button>
        <button type="button" className={`${s.toolbarBtn} ${editor.isActive('bulletList') ? s.toolbarBtnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">•</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

/* ── Submission review ───────────────────────────────────────── */
function SubmissionReviewRow({ submission, currentUser, loadComments, addComment, deleteComment, corregir }: {
  submission: Submission; currentUser: CurrentUser | null
  loadComments: (id: string) => Promise<InlineComment[]>
  addComment: (p: { submission_id: string; range_start: number; range_end: number; selected_text: string; comment: string; comment_type: 'correction' | 'suggestion' | 'positive' }) => Promise<{ data?: InlineComment; error?: string }>
  deleteComment: (id: string) => Promise<{ ok?: boolean; error?: string }>
  corregir: (id: string, p: { feedback: string; grade: number | null; action: 'approve' | 'request_revision' }) => Promise<{ ok?: boolean; error?: string }>
}) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<InlineComment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selection, setSelection] = useState<{ text: string; start: number; end: number } | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [correcting, setCorrecting] = useState(false)
  const [gradeText, setGradeText] = useState('')
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const getFeedbackHtml = useRef<(() => string) | null>(null)

  const nombre = submission.alumno?.username ?? submission.alumno_id.slice(0, 8)
  const color = avatarColor(submission.alumno_id)

  useEffect(() => {
    if (open && !loaded) loadComments(submission.id).then(d => { setComments(d); setLoaded(true) })
  }, [open, loaded, submission.id, loadComments])

  const handleMouseUp = useCallback(() => {
    if (!bodyRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setSelection(null); return }
    const range = sel.getRangeAt(0)
    if (!bodyRef.current.contains(range.commonAncestorContainer)) { setSelection(null); return }
    const text = sel.toString().trim()
    if (!text || text.length < 2) { setSelection(null); return }
    const full = bodyRef.current.textContent ?? ''
    const start = full.indexOf(text)
    if (start >= 0) setSelection({ text: text.substring(0, 200), start, end: start + text.length })
  }, [])

  const handleBodyClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const delId = target.closest('[data-delete-comment]')?.getAttribute('data-delete-comment')
    if (delId) { deleteComment(delId).then(() => setComments(prev => prev.filter(c => c.id !== delId))); setActive(null); return }
    const cid = target.closest('[data-comment-id]')?.getAttribute('data-comment-id')
    setActive(prev => cid ? (prev === cid ? null : cid) : null)
  }, [deleteComment])

  const handleAddComment = async (comment: string, type: 'correction' | 'suggestion' | 'positive') => {
    if (!selection) return
    const res = await addComment({ submission_id: submission.id, range_start: selection.start, range_end: selection.end, selected_text: selection.text, comment, comment_type: type })
    if (res.data) setComments(prev => [...prev, res.data!].sort((a, b) => a.range_start - b.range_start))
    setSelection(null); window.getSelection()?.removeAllRanges()
  }

  const handleCorregir = async (action: 'approve' | 'request_revision') => {
    setSaving(true)
    const grade = gradeText.trim() ? parseFloat(gradeText) : null
    if (grade !== null && (isNaN(grade) || grade < 0 || grade > 10)) { setSaving(false); return }
    const feedbackHtml = getFeedbackHtml.current ? getFeedbackHtml.current() : ''
    // Strip empty paragraphs
    const cleanFeedback = feedbackHtml.replace(/<p><\/p>/g, '').trim()
    await corregir(submission.id, { feedback: cleanFeedback, grade, action })
    setSaving(false); setCorrecting(false); setGradeText('')
  }

  const gradeBadge = submission.grade != null ? getGradeBadge(submission.grade) : null
  const previewGrade = gradeText.trim() ? parseFloat(gradeText) : null
  const previewBadge = (previewGrade !== null && !isNaN(previewGrade) && previewGrade >= 0 && previewGrade <= 10) ? getGradeBadge(previewGrade) : null

  const statusBadge = submission.status === 'corregida'
    ? <span className={`${s.badge} ${s.badgeCorrected}`}><CheckCircle2 size={10} /> Corregida</span>
    : submission.status === 'revision'
    ? <span className={`${s.badge} ${s.badgeRevision}`}><RefreshCw size={10} /> Revisión</span>
    : <span className={`${s.badge} ${s.badgeDone}`}><Clock size={10} /> Entregada</span>

  return (
    <div className={s.submissionRow}>
      <div className={s.submissionHeader} onClick={() => setOpen(o => !o)}>
        <div className={s.submissionAuthor}>
          <div className={s.submissionAvatar} style={{ background: color.bg, borderColor: color.border }}>
            {nombre[0]?.toUpperCase() ?? '?'}
          </div>
          <span className={s.submissionName}>{nombre}</span>
        </div>
        <div className={s.submissionHeaderRight}>
          <span className={s.submissionDate}>{fmtFechaHora(submission.created_at)}</span>
          {statusBadge}
          {gradeBadge && <GradeBadgeTag badge={gradeBadge} />}
          {open ? <ChevronUp size={14} className={s.chevron} /> : <ChevronDown size={14} className={s.chevron} />}
        </div>
      </div>

      {open && (
        <div className={s.submissionExpanded}>
          <div className={s.selectionHint}>
            <MessageSquare size={12} /> Selecciona texto para añadir un comentario inline
          </div>
          {loaded && <AnnotationsSummary comments={comments} />}
          <div ref={bodyRef} className={s.submissionBody}
            dangerouslySetInnerHTML={loaded && comments.length > 0 ? renderWithHighlights(submission.body, comments, active) : { __html: submission.body }}
            onMouseUp={handleMouseUp} onClick={handleBodyClick} />

          {selection && (
            <AddCommentPopover selectedText={selection.text} onAdd={handleAddComment}
              onCancel={() => { setSelection(null); window.getSelection()?.removeAllRanges() }} />
          )}

          {(submission.status === 'corregida' || submission.status === 'revision') && !correcting && (
            <div className={s.correctedInfo}>
              <div className={s.correctedInfoRow}>
                {submission.grade != null && <><strong>Nota: {submission.grade}/10</strong>{gradeBadge && <GradeBadgeTag badge={gradeBadge} />}</>}
                {submission.corrector && <span><User size={10} /> {submission.corrector.username}</span>}
                {submission.corrected_at && <span>· {fmtFechaHora(submission.corrected_at)}</span>}
              </div>
              {submission.feedback && (
                <div className={s.correctedFeedback} dangerouslySetInnerHTML={{ __html: submission.feedback }} />
              )}
            </div>
          )}

          {submission.status === 'entregada' && !correcting && (
            <div className={s.btnCorregirWrap}>
              <button className={s.btnCorregir} onClick={() => setCorrecting(true)}>
                <CheckCircle2 size={14} /> Corregir
              </button>
            </div>
          )}

          {correcting && (
            <div className={s.correctionPanel}>
              <span className={s.correctionPanelTitle}><CheckCircle2 size={16} /> Corrección</span>
              <div className={s.gradeRow}>
                <span className={s.gradeLabel}>Nota</span>
                <input type="number" className={s.gradeInput} placeholder="—" min="0" max="10" step="0.5"
                  value={gradeText} onChange={e => setGradeText(e.target.value)} />
                <span className={s.gradeSuffix}>/ 10</span>
                {previewBadge && <div className={s.gradeBadgePreview}><GradeBadgeTag badge={previewBadge} /></div>}
              </div>
              <span className={s.feedbackLabel}>Comentario general</span>
              <FeedbackEditor onReady={fn => { getFeedbackHtml.current = fn }} />
              <div className={s.correctionActions}>
                <button className={s.btnCancelar} onClick={() => setCorrecting(false)}>Cancelar</button>
                <button className={s.btnRevision} onClick={() => handleCorregir('request_revision')} disabled={saving}>
                  {saving ? <Loader2 size={13} className={s.spinner} /> : <RefreshCw size={13} />} Pedir revisión
                </button>
                <button className={s.btnAprobar} onClick={() => handleCorregir('approve')} disabled={saving}>
                  {saving ? <Loader2 size={13} className={s.spinner} /> : <CheckCircle2 size={13} />} Aprobar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Página ──────────────────────────────────────────────────── */
export default function TareasProfesorPage({ currentUser }: Props) {
  const {
    assignments, loading, error, alumnos,
    crearAssignment, borrarAssignment, corregir,
    getSubmissionsForAssignment, loadComments, addComment, deleteComment,
  } = useTareasProfesor(currentUser)

  const [selected, setSelected] = useState<Assignment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [alumnoId, setAlumnoId] = useState<string>('clase')

  const showFb = (msg: string, ok: boolean) => { setFeedback({ msg, ok }); setTimeout(() => setFeedback(null), 3000) }

  const handleCrear = async () => {
    if (!title.trim()) return showFb('El título es obligatorio', false)
    if (!desc.trim()) return showFb('La descripción es obligatoria', false)
    if (!dueDate) return showFb('La fecha límite es obligatoria', false)
    setSaving(true)
    const res = await crearAssignment({
      title, description: desc, due_date: dueDate,
      alumno_id: alumnoId === 'clase' ? null : alumnoId,
      subject_id: currentUser?.subject_id ?? null,
    })
    setSaving(false)
    if (res?.error) return showFb('Error al crear la tarea', false)
    setTitle(''); setDesc(''); setDueDate(''); setAlumnoId('clase')
    setShowModal(false); showFb('Tarea creada', true)
  }

  const selectedSubs = selected ? getSubmissionsForAssignment(selected.id) : []

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>Tareas</h1>
          <p className={s.subtitle}>Crea tareas y revisa las entregas de tus alumnos</p>
        </div>
        <button className={s.btnNueva} onClick={() => setShowModal(true)}><Plus size={16} /> Nueva tarea</button>
      </div>

      {feedback && (
        <div className={`${s.feedback} ${feedback.ok ? s.feedbackOk : s.feedbackError} ${s.feedbackWrap}`}>
          {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />} {feedback.msg}
        </div>
      )}

      {loading ? (
        <div className={s.loading}><Loader2 size={18} className={s.spinner} /> Cargando tareas…</div>
      ) : (
        <div className={s.grid}>
          <div className={s.panel}>
            <div className={s.panelHeader}>
              <div className={`${s.panelHeaderIcon} ${s.panelHeaderIconBlue}`}><ClipboardList size={16} /></div>
              Tareas ({assignments.length})
            </div>
            {!assignments.length ? (
              <div className={s.empty}>
                <ClipboardList size={30} className={s.emptyIcon} />
                <p className={s.emptyTitle}>Sin tareas todavía</p>
                <p className={s.emptySub}>Crea la primera tarea para tu clase</p>
              </div>
            ) : assignments.map(a => {
              const subs = getSubmissionsForAssignment(a.id)
              const overdue = isOverdue(a.due_date)
              const pending = subs.filter(x => x.status === 'entregada').length
              return (
                <button key={a.id} className={`${s.taskRow} ${selected?.id === a.id ? s.taskRowActive : ''}`}
                  onClick={() => setSelected(prev => prev?.id === a.id ? null : a)}>
                  <div className={s.taskRowInfo}>
                    <p className={s.taskRowTitle}>{a.title}</p>
                    <div className={s.taskRowMeta}>
                      <Calendar size={11} />
                      <span className={overdue ? s.taskRowMetaOverdue : undefined}>
                        {fmtFecha(a.due_date)}{overdue ? ' · Vencida' : ''}
                      </span>
                      <span className={s.metaDot} />
                      {a.alumno_id ? <><User size={11} /> Individual</> : <><Users size={11} /> Clase</>}
                    </div>
                  </div>
                  <div className={s.taskRowRight}>
                    <span className={`${s.countBadge} ${pending > 0 ? s.countBadgeHas : ''}`}>
                      {pending > 0 ? `${pending} por corregir` : `${subs.length} entrega${subs.length !== 1 ? 's' : ''}`}
                    </span>
                    <button className={s.btnBorrar} onClick={e => { e.stopPropagation(); borrarAssignment(a.id) }} title="Eliminar tarea">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </button>
              )
            })}
          </div>

          <div className={s.reviewPanel}>
            <div className={s.panelHeader}>
              <div className={`${s.panelHeaderIcon} ${s.panelHeaderIconGreen}`}><Inbox size={16} /></div>
              {selected ? `Entregas — ${selected.title}` : 'Entregas'}
            </div>
            {!selected ? (
              <div className={s.empty}>
                <Inbox size={30} className={s.emptyIcon} />
                <p className={s.emptyTitle}>Selecciona una tarea</p>
                <p className={s.emptySub}>Verás aquí las entregas de tus alumnos</p>
              </div>
            ) : !selectedSubs.length ? (
              <div className={s.empty}>
                <Clock size={30} className={s.emptyIcon} />
                <p className={s.emptyTitle}>Sin entregas todavía</p>
                <p className={s.emptySub}>Los alumnos aún no han entregado esta tarea</p>
              </div>
            ) : selectedSubs.map(sub => (
              <SubmissionReviewRow key={sub.id} submission={sub} currentUser={currentUser}
                loadComments={loadComments} addComment={addComment} deleteComment={deleteComment} corregir={corregir} />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Nueva tarea</h2>
              <button className={s.closeBtn} onClick={() => setShowModal(false)}><X size={17} /></button>
            </div>
            <div className={s.field}>
              <label className={s.label}>Título</label>
              <input className={s.input} placeholder="Título de la tarea" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>
            <div className={s.field}>
              <label className={s.label}>Descripción</label>
              <textarea className={s.textarea} placeholder="Explica qué tienen que hacer los alumnos…" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div className={s.selectRow}>
              <div className={s.field}>
                <label className={s.label}>Fecha límite</label>
                <input type="date" className={s.input} value={dueDate} min={new Date().toISOString().split('T')[0]} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className={s.selectWrap}>
                <label className={s.label}>Destinatario</label>
                <Users size={14} className={s.selectIcon} />
                <select className={s.select} value={alumnoId} onChange={e => setAlumnoId(e.target.value)}>
                  <option value="clase">Toda la clase</option>
                  {alumnos.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
                </select>
              </div>
            </div>
            <div className={s.modalFooter}>
              <button className={s.btnCancelar} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={s.btnCrear} onClick={handleCrear} disabled={saving}>
                {saving ? <Loader2 size={15} className={s.spinner} /> : <Plus size={15} />}
                {saving ? 'Creando…' : 'Crear tarea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
