import { useState } from 'react'
import { X, Send, Loader2, AlertCircle } from 'lucide-react'
import type { ForoSubject, ForoBlock } from '../../hooks/useForo'
import styles from './NewThreadModal.module.css'

interface Props {
  subjects:  ForoSubject[]
  blocks:    ForoBlock[]
  onCrear:   (params: {
    title:      string
    body:       string
    subject_id: string | null
    block_id:   string | null
  }) => Promise<{ ok?: boolean; error?: string }>
  onClose: () => void
}

export default function NewThreadModal({ subjects, blocks, onCrear, onClose }: Props) {
  const [title,      setTitle]      = useState('')
  const [body,       setBody]       = useState('')
  const [subjectId,  setSubjectId]  = useState<string>('none')
  const [blockId,    setBlockId]    = useState<string>('none')
  const [sending,    setSending]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const handlePublicar = async () => {
    if (!title.trim()) return setError('El título no puede estar vacío')
    if (!body.trim())  return setError('La pregunta no puede estar vacía')
    setError(null)
    setSending(true)

    const result = await onCrear({
      title:      title.trim(),
      body:       body.trim(),
      subject_id: subjectId === 'none' ? null : subjectId,
      block_id:   blockId   === 'none' ? null : blockId,
    })

    setSending(false)
    if (result.error) return setError(result.error)
    onClose()
  }

  // Cerrar al hacer clic en el overlay
  const handleOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlay}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nueva pregunta</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Título */}
        <div className={styles.field}>
          <label className={styles.label}>Título</label>
          <input
            className={styles.input}
            placeholder="¿Cuál es tu duda?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Cuerpo */}
        <div className={styles.field}>
          <label className={styles.label}>Descripción</label>
          <textarea
            className={styles.textarea}
            placeholder="Explica tu pregunta con más detalle…"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>

        {/* Asignatura + Bloque (opcionales) */}
        <div className={styles.selectRow}>
          {subjects.length > 0 && (
            <div className={styles.selectWrap}>
              <label className={styles.label}>Asignatura</label>
              <select
                className={styles.select}
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
              >
                <option value="none">Sin asignatura</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          {blocks.length > 0 && (
            <div className={styles.selectWrap}>
              <label className={styles.label}>Bloque</label>
              <select
                className={styles.select}
                value={blockId}
                onChange={e => setBlockId(e.target.value)}
              >
                <option value="none">Sin bloque</option>
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className={[styles.feedback, styles.feedbackError].join(' ')}>
            <AlertCircle size={13} />
            {error}
          </div>
        )}

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnCancelar} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.btnPublicar}
            onClick={handlePublicar}
            disabled={sending}
          >
            {sending
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={14} />
            }
            {sending ? 'Publicando…' : 'Publicar pregunta'}
          </button>
        </div>

      </div>
    </div>
  )
}
