import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit                   from '@tiptap/starter-kit'
import Placeholder                  from '@tiptap/extension-placeholder'
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Send, Loader2, Edit3,
  RefreshCw, MessageSquare, User
} from 'lucide-react'
import { useTareasAlumno, getGradeBadge, getGradeBadgeLabel } from '../../hooks/useTareas'
import type { CurrentUser } from '../../types'
import type { Assignment, Submission, InlineComment } from '../../hooks/useTareas'
import s from './TareasPage.module.css'

interface Props { currentUser: CurrentUser | null }
type Filter = 'todas' | 'pendiente' | 'entregada' | 'corregida' | 'revision'

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtFecha(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function isOverdue(d: string) { return new Date(d + 'T23:59:59') < new Date() }
function diasRestantes(d: string) {
  const diff = Math.ceil((new Date(d + 'T23:59:59').getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'Vencida'
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `${diff} días`
}
function escapeHtml(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/* ── Render con highlights ───────────────────────────────────── */
function renderWithHighlights(html: string, comments: InlineComment[], activeId: string | null) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const plain = tmp.textContent ?? ''
  if (comments.length === 0) return { __html: html }

  const sorted = [...comments].sort((a, b) => a.range_start - b.range_start)
  let result = '', cursor = 0

  for (const c of sorted) {
    if (c.range_start < cursor || c.range_start > plain.length) continue
    result += escapeHtml(plain.slice(cursor, c.range_start))
    const fragment = plain.slice(c.range_start, c.range_end)
    const cls = c.comment_type === 'correction' ? s.highlightCorrection
      : c.comment_type === 'suggestion' ? s.highlightSuggestion : s.highlightPositive
    result += `<span class="${cls}" data-comment-id="${c.id}">${escapeHtml(fragment)}</span>`
    if (activeId === c.id) {
      const tCls = c.comment_type === 'correction' ? s.annotationTypeCorrection
        : c.comment_type === 'suggestion' ? s.annotationTypeSuggestion : s.annotationTypePositive
      const label = c.comment_type === 'correction' ? 'Corrección'
        : c.comment_type === 'suggestion' ? 'Sugerencia' : 'Bien hecho'
      result += `<span class="${s.annotationTooltip} ${s.annotationTooltipVisible}">`
      result += `<span class="${s.annotationHeader}"><span class="${s.annotationType} ${tCls}">${label}</span>`
      result += `<span class="${s.annotationAuthor}">${escapeHtml(c.author?.username ?? 'Profesor')}</span></span>`
      result += `<span class="${s.annotationBody}">${escapeHtml(c.comment)}</span></span>`
    }
    cursor = c.range_end
  }
  result += escapeHtml(plain.slice(cursor))
  return { __html: result.replace(/\n/g, '<br/>') }
}

/* ── Editor ──────────────────────────────────────────────────── */
function RichEditor({ onSubmit, initial = '', sending, buttonLabel = 'Entregar', buttonClassName }: {
  onSubmit: (html: string) => void; initial?: string; sending: boolean;
  buttonLabel?: string; buttonClassName?: string
}) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Escribe tu entrega aquí…' })],
    content: initial,
    editorProps: { attributes: { class: s.editorContent ?? '' } },
  }, [initial])

  if (!editor) return null
  return (
    <>
      <div className={s.editorWrap}>
        <div className={s.editorToolbar}>
          <button type="button" className={`${s.toolbarBtn} ${editor.isActive('bold') ? s.toolbarBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita"><strong>N</strong></button>
          <button type="button" className={`${s.toolbarBtn} ${editor.isActive('italic') ? s.toolbarBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva"><em>I</em></button>
          <button type="button" className={`${s.toolbarBtn} ${editor.isActive('bulletList') ? s.toolbarBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">•</button>
          <button type="button" className={`${s.toolbarBtn} ${editor.isActive('orderedList') ? s.toolbarBtnActive : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">1.</button>
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className={s.editorActions}>
        <button className={buttonClassName ?? s.btnEntregar}
          onClick={() => onSubmit(editor.getHTML())} disabled={sending || editor.isEmpty}>
          {sending ? <Loader2 size={15} className={s.spinner} /> : <Send size={15} />}
          {sending ? 'Enviando…' : buttonLabel}
        </button>
      </div>
    </>
  )
}

/* ── Summary ─────────────────────────────────────────────────── */
function AnnotationsSummary({ comments }: { comments: InlineComment[] }) {
  if (comments.length === 0) return null
  const c = comments.filter(x => x.comment_type === 'correction').length
  const su = comments.filter(x => x.comment_type === 'suggestion').length
  const p = comments.filter(x => x.comment_type === 'positive').length
  return (
    <div className={s.annotationsSummary}>
      <MessageSquare size={12} />
      <span>{comments.length} anotacion{comments.length !== 1 ? 'es' : ''}</span>
      {c > 0 && <><span className={`${s.annotationDot} ${s.annotationDotCorrection}`} /><span>{c}</span></>}
      {su > 0 && <><span className={`${s.annotationDot} ${s.annotationDotSuggestion}`} /><span>{su}</span></>}
      {p > 0 && <><span className={`${s.annotationDot} ${s.annotationDotPositive}`} /><span>{p}</span></>}
      <span>— Pulsa en el texto resaltado</span>
    </div>
  )
}

/* ── Card ────────────────────────────────────────────────────── */
function TaskCard({ assignment, currentUser, getSubmission, entregar, loadComments }: {
  assignment: Assignment; currentUser: CurrentUser | null
  getSubmission: (id: string) => Submission | null
  entregar: (id: string, body: string) => Promise<{ ok?: boolean; error?: string }>
  loadComments: (id: string) => Promise<InlineComment[]>
}) {
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState(false)
  const [sending, setSending]   = useState(false)
  const [fb, setFb]             = useState<{ msg: string; ok: boolean } | null>(null)
  const [comments, setComments] = useState<InlineComment[]>([])
  const [loaded, setLoaded]     = useState(false)
  const [active, setActive]     = useState<string | null>(null)

  const submission = getSubmission(assignment.id)
  const overdue    = isOverdue(assignment.due_date)

  useEffect(() => {
    if (open && submission && (submission.status === 'corregida' || submission.status === 'revision') && !loaded)
      loadComments(submission.id).then(d => { setComments(d); setLoaded(true) })
  }, [open, submission, loaded, loadComments])

  const handleBodyClick = useCallback((e: React.MouseEvent) => {
    const id = (e.target as HTMLElement).closest('[data-comment-id]')?.getAttribute('data-comment-id')
    setActive(prev => id ? (prev === id ? null : id) : null)
  }, [])

  const showFb = (msg: string, ok: boolean) => { setFb({ msg, ok }); setTimeout(() => setFb(null), 3000) }

  const handleEntregar = async (html: string) => {
    setSending(true)
    const res = await entregar(assignment.id, html)
    setSending(false)
    if (res.error) return showFb('Error al entregar', false)
    showFb(submission?.status === 'revision' ? '¡Re-entregado!' : '¡Entregado!', true)
    setEditing(false); setLoaded(false)
  }

  const gradeBadge = submission?.grade != null ? getGradeBadge(submission.grade) : null

  return (
    <div className={s.taskCard}>
      <div className={s.taskHeader} onClick={() => setOpen(o => !o)}>
        <div className={s.taskHeaderLeft}>
          <p className={s.taskTitle}>{assignment.title}</p>
          <div className={s.taskMeta}>
            <span>Entrega: {fmtFecha(assignment.due_date)}</span>
            <span className={s.metaDot} />
            <span className={overdue && !submission ? s.taskMetaOverdue : undefined}>
              {diasRestantes(assignment.due_date)}
            </span>
            {assignment.creator && <><span className={s.metaDot} /><span>{assignment.creator.username}</span></>}
          </div>
        </div>
        <div className={s.taskHeaderRight}>
          {submission?.status === 'revision'
            ? <span className={`${s.badge} ${s.badgeRevision}`}><RefreshCw size={10} /> Revisión</span>
            : submission?.status === 'corregida'
            ? <span className={`${s.badge} ${s.badgeCorrected}`}><CheckCircle2 size={10} /> Corregida</span>
            : submission?.status === 'entregada'
            ? <span className={`${s.badge} ${s.badgeDone}`}><Clock size={10} /> Entregada</span>
            : overdue
            ? <span className={`${s.badge} ${s.badgeOverdue}`}><AlertCircle size={10} /> Vencida</span>
            : <span className={`${s.badge} ${s.badgePending}`}><Clock size={10} /> Pendiente</span>
          }
          {open ? <ChevronUp size={16} className={s.chevron} /> : <ChevronDown size={16} className={s.chevron} />}
        </div>
      </div>

      <p className={s.taskDesc}>{assignment.description}</p>

      {open && (
        <div className={s.taskBody}>
          {/* Revision banner */}
          {submission?.status === 'revision' && !editing && (
            <div className={s.revisionBanner}>
              <div className={s.revisionBannerIcon}><RefreshCw size={13} /></div>
              <div className={s.revisionBannerContent}>
                <p className={s.revisionBannerTitle}>Tu profesor te pide una revisión</p>
                <p className={s.revisionBannerText}>
                  {submission.feedback ?? 'Revisa los comentarios y vuelve a entregar.'}
                </p>
              </div>
            </div>
          )}

          {/* Grade */}
          {submission?.status === 'corregida' && submission.grade != null && (
            <div className={s.gradeDisplay}>
              <span className={s.gradeNumber}>{submission.grade}</span>
              <span className={s.gradeMax}>/ 10</span>
              {gradeBadge && (
                <span className={`${s.gradeBadge} ${
                  gradeBadge === 'suspenso' ? s.gradeSuspenso : gradeBadge === 'aprobado' ? s.gradeAprobado
                  : gradeBadge === 'notable' ? s.gradeNotable : s.gradeSobresaliente
                }`}>{getGradeBadgeLabel(gradeBadge)}</span>
              )}
            </div>
          )}

          {/* Who corrected */}
          {(submission?.status === 'corregida' || submission?.status === 'revision') && submission.corrected_at && (
            <div className={s.correctionMeta}>
              <div className={s.correctionMetaIcon}><User size={12} /></div>
              <span>Corregido por <strong>{submission.corrector?.username ?? 'Profesor'}</strong></span>
              <span>·</span>
              <span>{fmtFechaHora(submission.corrected_at)}</span>
            </div>
          )}

          {loaded && <AnnotationsSummary comments={comments} />}

          <span className={s.submissionLabel}>Tu entrega</span>

          {/* No submission — editor */}
          {!submission && <RichEditor onSubmit={handleEntregar} sending={sending} />}

          {/* Submitted — view */}
          {submission && !editing && (
            <>
              <div className={s.submissionView}
                dangerouslySetInnerHTML={loaded && comments.length > 0
                  ? renderWithHighlights(submission.body, comments, active) : { __html: submission.body }}
                onClick={handleBodyClick} />

              {submission.status === 'corregida' && submission.feedback && (
                <div className={s.feedbackBubble}>
                  <p className={s.feedbackLabel}>Comentario general del profesor</p>
                  <div className={`${s.feedbackText} ${s.feedbackHtml}`}
                    dangerouslySetInnerHTML={{ __html: submission.feedback }} />
                </div>
              )}

              {submission.status === 'entregada' && (
                <div className={s.taskActions}>
                  <button className={s.btnEditar} onClick={() => setEditing(true)}>
                    <Edit3 size={13} /> Editar entrega
                  </button>
                </div>
              )}
              {submission.status === 'revision' && (
                <div className={s.taskActions}>
                  <button className={s.btnReentregar} onClick={() => setEditing(true)}>
                    <RefreshCw size={13} /> Corregir y re-entregar
                  </button>
                </div>
              )}
            </>
          )}

          {/* Editing */}
          {submission && editing && (
            <RichEditor onSubmit={handleEntregar} initial={submission.body} sending={sending}
              buttonLabel={submission.status === 'revision' ? 'Re-entregar' : 'Actualizar'}
              buttonClassName={submission.status === 'revision' ? s.btnReentregar : undefined} />
          )}

          {fb && (
            <div className={`${s.inlineFeedback} ${fb.ok ? s.inlineFeedbackOk : s.inlineFeedbackError}`}>
              {fb.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />} {fb.msg}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Página ──────────────────────────────────────────────────── */
export default function TareasPage({ currentUser }: Props) {
  const { assignments, loading, error, getSubmission, entregar, loadComments } = useTareasAlumno(currentUser)
  const [filter, setFilter] = useState<Filter>('todas')

  const getStatus = (a: Assignment) => {
    const sub = getSubmission(a.id)
    return sub?.status ?? 'pendiente'
  }

  const filtered = assignments.filter(a => filter === 'todas' || getStatus(a) === filter)
  const counts = { pendiente: 0, entregada: 0, corregida: 0, revision: 0 }
  assignments.forEach(a => { const st = getStatus(a); if (st in counts) counts[st as keyof typeof counts]++ })

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'todas', label: `Todas (${assignments.length})` },
    { id: 'pendiente', label: `Pendientes (${counts.pendiente})` },
    { id: 'entregada', label: `Entregadas (${counts.entregada})` },
    { id: 'corregida', label: `Corregidas (${counts.corregida})` },
    ...(counts.revision > 0 ? [{ id: 'revision' as Filter, label: `Revisión (${counts.revision})` }] : []),
  ]

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Tareas</h1>
        <p className={s.subtitle}>Tus tareas y entregas</p>
      </div>
      {error && <div className={s.inlineFeedback}><AlertCircle size={14} /> {error}</div>}
      <div className={s.filters}>
        {FILTERS.map(f => (
          <button key={f.id} className={`${s.filterBtn} ${filter === f.id ? s.filterBtnActive : ''}`}
            onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
      {loading ? (
        <div className={s.loading}><Loader2 size={18} className={s.spinner} /> Cargando tareas…</div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>
          <ClipboardList size={36} className={s.emptyIcon} />
          <p className={s.emptyTitle}>{filter === 'todas' ? 'Sin tareas todavía' : 'Sin tareas en este filtro'}</p>
          <p className={s.emptySub}>{filter === 'todas' ? 'Tu profesor publicará tareas aquí' : 'Prueba otro filtro'}</p>
        </div>
      ) : (
        <div className={s.list}>
          {filtered.map(a => (
            <TaskCard key={a.id} assignment={a} currentUser={currentUser}
              getSubmission={getSubmission} entregar={entregar} loadComments={loadComments} />
          ))}
        </div>
      )}
    </div>
  )
}
