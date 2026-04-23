import { useState } from 'react'
import {
  MessageCircle, CheckCircle2, Plus, Loader2,
  BookOpen, Layers, Building2
} from 'lucide-react'
import type { ForoThread, ForoSubject, ForoBlock } from '../../hooks/useForo'
import styles from './ThreadList.module.css'

type TabType = 'academia' | 'asignatura' | 'bloque'

interface Props {
  threads:    ForoThread[]
  subjects:   ForoSubject[]
  blocks:     ForoBlock[]
  loading:    boolean
  onOpen:     (thread: ForoThread) => void
  onNuevo:    () => void
}

function fmtFecha(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60)     return 'ahora'
  if (diff < 3600)   return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400)  return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function roleLabel(role: string): string {
  if (role === 'profesor')  return ' · Profesor'
  if (role === 'director')  return ' · Director'
  return ''
}

export default function ThreadList({ threads, subjects, blocks, loading, onOpen, onNuevo }: Props) {
  const [tab,        setTab]        = useState<TabType>('academia')
  const [subjectFil, setSubjectFil] = useState<string>('all')
  const [blockFil,   setBlockFil]   = useState<string>('all')

  const filtered = threads.filter(t => {
    if (tab === 'asignatura') {
      return subjectFil === 'all' ? t.subject_id !== null : t.subject_id === subjectFil
    }
    if (tab === 'bloque') {
      return blockFil === 'all' ? t.block_id !== null : t.block_id === blockFil
    }
    return true // academia = todos
  })

  const TABS: { id: TabType; label: string; Icon: React.ElementType }[] = [
    { id: 'academia',   label: 'Academia',   Icon: Building2 },
    { id: 'asignatura', label: 'Asignatura', Icon: BookOpen  },
    { id: 'bloque',     label: 'Bloque',     Icon: Layers    },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={[styles.tab, tab === id ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab(id)}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Barra superior */}
      <div className={styles.topBar}>
        <div className={styles.filterRow}>
          {tab === 'asignatura' && subjects.length > 0 && (
            <div className={styles.selectWrap}>
              <BookOpen size={13} className={styles.selectIcon} />
              <select
                className={styles.select}
                value={subjectFil}
                onChange={e => setSubjectFil(e.target.value)}
              >
                <option value="all">Todas las asignaturas</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          {tab === 'bloque' && blocks.length > 0 && (
            <div className={styles.selectWrap}>
              <Layers size={13} className={styles.selectIcon} />
              <select
                className={styles.select}
                value={blockFil}
                onChange={e => setBlockFil(e.target.value)}
              >
                <option value="all">Todos los bloques</option>
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button className={styles.btnNuevo} onClick={onNuevo}>
          <Plus size={15} />
          Nueva pregunta
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className={styles.loading}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando hilos…
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <MessageCircle size={32} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Ninguna pregunta todavía</p>
          <p className={styles.emptySub}>Sé el primero en preguntar algo</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(thread => (
            <button
              key={thread.id}
              className={[
                styles.threadCard,
                thread.is_solved ? styles.threadCardSolved : '',
              ].join(' ')}
              onClick={() => onOpen(thread)}
            >
              <div className={[
                styles.threadIcon,
                thread.is_solved ? styles.threadIconSolved : styles.threadIconOpen,
              ].join(' ')}>
                {thread.is_solved
                  ? <CheckCircle2 size={16} />
                  : <MessageCircle size={16} />
                }
              </div>

              <div className={styles.threadBody}>
                <div className={styles.threadTop}>
                  <span className={styles.threadTitle}>{thread.title}</span>
                  {thread.is_solved && (
                    <span className={styles.badgeSolved}>
                      <CheckCircle2 size={10} />
                      Solucionado
                    </span>
                  )}
                </div>
                <p className={styles.threadPreview}>{thread.body}</p>
                <div className={styles.threadMeta}>
                  <span>{thread.author?.username ?? 'Anónimo'}{roleLabel(thread.author?.role ?? '')}</span>
                  <span className={styles.metaDot} />
                  <span>{fmtFecha(thread.created_at)}</span>
                </div>
              </div>

              <div className={styles.threadReplies}>
                <span className={styles.threadRepliesCount}>{thread.reply_count}</span>
                <span className={styles.threadRepliesLabel}>
                  {thread.reply_count === 1 ? 'resp.' : 'resp.'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
