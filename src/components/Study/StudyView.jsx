import { useState } from 'react'
import {
  BookOpen, Clock, ChevronRight, ChevronDown, CheckCircle,
  Bookmark, BookmarkCheck, Zap, Tag, Calendar,
  Scale, LayoutGrid, Loader2
} from 'lucide-react'
import STUDY_BLOCKS from '../../data/study-content'
import useStudyProgress from '../../hooks/useStudyProgress'
import styles from './StudyView.module.css'

const ICONS = { BookOpen, FileText: BookOpen, Archive: BookOpen, Layers: BookOpen, Shield: BookOpen, History: BookOpen, Scale, LayoutGrid }

function HighlightedText({ text, keywords = [], laws = [], dates = [] }) {
  if (!text) return null
  const allTerms = [
    ...keywords.map(k => ({ term: k, type: 'keyword' })),
    ...laws.map(l => ({ term: l, type: 'law' })),
    ...dates.map(d => ({ term: d, type: 'date' })),
  ].sort((a, b) => b.term.length - a.term.length)

  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <p className={styles.paragraph}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i}>{part.slice(2, -2)}</strong>
        let segments = [{ text: part, type: null }]
        for (const { term, type } of allTerms) {
          segments = segments.flatMap(seg => {
            if (seg.type || !seg.text.includes(term)) return [seg]
            return seg.text.split(term).flatMap((p, j, arr) =>
              j < arr.length - 1
                ? [{ text: p, type: null }, { text: term, type }]
                : [{ text: p, type: null }]
            )
          })
        }
        return segments.map((seg, j) =>
          !seg.type
            ? <span key={`${i}-${j}`}>{seg.text}</span>
            : <span key={`${i}-${j}`} className={styles[`hl_${seg.type}`]}
                title={seg.type === 'law' ? '📋 Norma legal' : seg.type === 'date' ? '📅 Fecha clave' : '🔑 Concepto clave'}>
                {seg.text}
              </span>
        )
      })}
    </p>
  )
}

function ContentRenderer({ content, keywords, laws, dates }) {
  return (
    <div className={styles.contentBody}>
      {content.split('\n\n').map((section, i) => {
        if (section.startsWith('**') && section.endsWith('**'))
          return <h4 key={i} className={styles.contentH4}>{section.slice(2, -2)}</h4>
        if (section.match(/^- /m)) {
          return (
            <ul key={i} className={styles.contentList}>
              {section.split('\n').filter(l => l.startsWith('- ')).map((item, j) => (
                <li key={j}><HighlightedText text={item.slice(2)} keywords={keywords} laws={laws} dates={dates} /></li>
              ))}
            </ul>
          )
        }
        if (section.match(/^\d+\. /m)) {
          return (
            <ol key={i} className={styles.contentList}>
              {section.split('\n').filter(l => l.match(/^\d+\. /)).map((item, j) => (
                <li key={j}><HighlightedText text={item.replace(/^\d+\. /, '')} keywords={keywords} laws={laws} dates={dates} /></li>
              ))}
            </ol>
          )
        }
        return <HighlightedText key={i} text={section} keywords={keywords} laws={laws} dates={dates} />
      })}
    </div>
  )
}

function TopicCard({ topic, blockId, blockColor, isRead, isBookmarked, isCompact, onToggleRead, onToggleBookmark, onTest }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={[styles.topicCard, isRead ? styles.topicRead : ''].join(' ')}>
      <div className={styles.topicHeader} onClick={() => setOpen(v => !v)}>
        <div className={styles.topicLeft}>
          <div
            className={[styles.topicReadDot, isRead ? styles.dotRead : ''].join(' ')}
            style={{ '--bc': blockColor }}
            onClick={e => { e.stopPropagation(); onToggleRead(topic.id, blockId) }}
            title={isRead ? 'Marcar como no leído' : 'Marcar como leído'}
          >
            {isRead && <CheckCircle size={11} />}
          </div>
          <div>
            <h3 className={styles.topicTitle}>{topic.title}</h3>
            {isCompact && <p className={styles.topicSummary}>{topic.summary}</p>}
          </div>
        </div>
        <div className={styles.topicRight}>
          <button
            className={[styles.bookmarkBtn, isBookmarked ? styles.bookmarked : ''].join(' ')}
            onClick={e => { e.stopPropagation(); onToggleBookmark(topic.id, blockId) }}
            title={isBookmarked ? 'Quitar marcador' : 'Añadir marcador'}
          >
            {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
          <ChevronDown size={16} className={[styles.chevron, open ? styles.chevronOpen : ''].join(' ')} />
        </div>
      </div>

      {!isCompact && !open && (
        <p className={styles.topicSummaryBelow}>{topic.summary}</p>
      )}

      {open && (
        <div className={styles.topicContent}>
          {(topic.laws.length > 0 || topic.dates.length > 0) && (
            <div className={styles.tagsRow}>
              {topic.laws.map(l => <span key={l} className={styles.tagLaw}><Scale size={10} /> {l}</span>)}
              {topic.dates.map(d => <span key={d} className={styles.tagDate}><Calendar size={10} /> {d}</span>)}
            </div>
          )}
          <ContentRenderer content={topic.content} keywords={topic.keywords} laws={topic.laws} dates={topic.dates} />
          {topic.keywords.length > 0 && (
            <div className={styles.keywordsRow}>
              <Tag size={11} className={styles.keywordsIcon} />
              {topic.keywords.map(k => <span key={k} className={styles.keyword}>{k}</span>)}
            </div>
          )}
          <div className={styles.topicActions}>
            <button className={styles.actionBtn} onClick={() => onToggleRead(topic.id, blockId)}>
              <CheckCircle size={14} />
              {isRead ? 'Marcar como no leído' : 'Marcar como leído'}
            </button>
            <button className={styles.actionBtnPrimary} onClick={onTest}>
              <Zap size={14} /> Practicar este tema
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BlockProgressRow({ block, readCount, totalCount }) {
  const pct = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0
  const Icon = ICONS[block.icon] || BookOpen
  return (
    <div className={styles.blockProgress} style={{ '--bc': block.color, '--bb': block.bg }}>
      <div className={styles.blockProgressIcon}><Icon size={13} strokeWidth={2} /></div>
      <div className={styles.blockProgressInfo}>
        <span className={styles.blockProgressLabel}>{block.label}</span>
        <div className={styles.blockProgressBar}>
          <div className={styles.blockProgressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className={styles.blockProgressPct}>{pct}%</span>
    </div>
  )
}

export default function StudyView({ currentUser, onSelectMode }) {
  const { readTopics, bookmarks, loading, toggleRead, toggleBookmark } =
    useStudyProgress(currentUser?.id)

  const [activeBlock, setActiveBlock] = useState(STUDY_BLOCKS[0].id)
  const [isCompact,   setIsCompact]   = useState(false)
  const [tab,         setTab]         = useState('temario')

  const currentBlock  = STUDY_BLOCKS.find(b => b.id === activeBlock)
  const totalTopics   = STUDY_BLOCKS.reduce((s, b) => s + b.topics.length, 0)
  const globalPct     = Math.round((readTopics.size / totalTopics) * 100)

  const bookmarkedTopics = STUDY_BLOCKS.flatMap(b =>
    b.topics.filter(t => bookmarks.has(t.id))
      .map(t => ({ ...t, blockLabel: b.label, blockColor: b.color, blockId: b.id }))
  )

  if (loading) return (
    <div className={styles.loadingState}>
      <Loader2 size={24} className={styles.spinner} />
      <p>Cargando tu progreso…</p>
    </div>
  )

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Temario</h1>
          <p className={styles.pageSubtitle}>Cuerpo Facultativo de Archiveros · Ministerio de Cultura</p>
        </div>
        <button
          className={[styles.toggleBtn, isCompact ? styles.toggleActive : ''].join(' ')}
          onClick={() => setIsCompact(v => !v)}
        >
          <LayoutGrid size={14} />
          {isCompact ? 'Expandido' : 'Compacto'}
        </button>
      </div>

      <div className={styles.globalProgress}>
        <div className={styles.globalProgressTop}>
          <span className={styles.globalProgressLabel}>Progreso total del temario</span>
          <span className={styles.globalProgressPct}>{globalPct}% — {readTopics.size}/{totalTopics} temas leídos</span>
        </div>
        <div className={styles.globalProgressBar}>
          <div className={styles.globalProgressFill} style={{ width: `${globalPct}%` }} />
        </div>
        <div className={styles.blockProgressList}>
          {STUDY_BLOCKS.map(b => (
            <BlockProgressRow key={b.id} block={b}
              readCount={b.topics.filter(t => readTopics.has(t.id)).length}
              totalCount={b.topics.length}
            />
          ))}
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={[styles.tab, tab === 'temario' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('temario')}>
          <BookOpen size={14} /> Temario
        </button>
        <button className={[styles.tab, tab === 'marcadores' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('marcadores')}>
          <Bookmark size={14} /> Marcadores
          {bookmarks.size > 0 && <span className={styles.tabBadge}>{bookmarks.size}</span>}
        </button>
      </div>

      {tab === 'marcadores' && (
        <div className={styles.bookmarksList}>
          {bookmarkedTopics.length === 0 ? (
            <div className={styles.emptyState}>
              <Bookmark size={28} strokeWidth={1.4} />
              <p>Sin marcadores aún. Pulsa el 🔖 en cualquier tema para guardarlo aquí.</p>
            </div>
          ) : (
            bookmarkedTopics.map(t => (
              <div key={t.id} className={styles.bookmarkItem}
                onClick={() => { setTab('temario'); setActiveBlock(t.blockId) }}>
                <div className={styles.bookmarkDot} style={{ background: t.blockColor }} />
                <div>
                  <p className={styles.bookmarkTitle}>{t.title}</p>
                  <p className={styles.bookmarkBlock}>{t.blockLabel}</p>
                </div>
                <ChevronRight size={14} className={styles.bookmarkArrow} />
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'temario' && (
        <div className={styles.studyLayout}>
          <nav className={styles.blockNav}>
            {STUDY_BLOCKS.map(block => {
              const Icon   = ICONS[block.icon] || BookOpen
              const read   = block.topics.filter(t => readTopics.has(t.id)).length
              const total  = block.topics.length
              const pct    = Math.round((read / total) * 100)
              const active = activeBlock === block.id
              return (
                <button key={block.id}
                  className={[styles.blockNavItem, active ? styles.blockNavActive : ''].join(' ')}
                  style={active ? { '--bc': block.color, '--bb': block.bg } : {}}
                  onClick={() => setActiveBlock(block.id)}
                >
                  <div className={styles.blockNavIcon}
                    style={{ background: active ? block.color : block.bg, color: active ? '#fff' : block.color }}>
                    <Icon size={14} strokeWidth={2} />
                  </div>
                  <div className={styles.blockNavBody}>
                    <span className={styles.blockNavLabel}>{block.label}</span>
                    <div className={styles.blockNavMeta}>
                      <Clock size={10} /> {block.estimatedMinutes} min
                      <span className={styles.blockNavDot}>·</span>
                      {total} temas
                    </div>
                  </div>
                  <div className={styles.blockNavPct} style={{ color: pct === 100 ? '#059669' : '#9CA3AF' }}>
                    {pct === 100 ? <CheckCircle size={14} /> : `${pct}%`}
                  </div>
                </button>
              )
            })}
          </nav>

          {currentBlock && (
            <div className={styles.blockContent}>
              <div className={styles.blockContentHeader}>
                <div className={styles.blockContentMeta}>
                  <span className={styles.blockContentTag}
                    style={{ background: currentBlock.bg, color: currentBlock.color }}>
                    {(() => { const I = ICONS[currentBlock.icon] || BookOpen; return <I size={11} strokeWidth={2} /> })()}
                    {currentBlock.label}
                  </span>
                  <span className={styles.blockContentTime}>
                    <Clock size={12} /> ~{currentBlock.estimatedMinutes} min
                  </span>
                </div>
                <div className={styles.blockContentStats}>
                  {currentBlock.topics.filter(t => readTopics.has(t.id)).length}/{currentBlock.topics.length} leídos
                </div>
              </div>

              <div className={styles.topicsList}>
                {currentBlock.topics.map(topic => (
                  <TopicCard key={topic.id}
                    topic={topic} blockId={currentBlock.id} blockColor={currentBlock.color}
                    isRead={readTopics.has(topic.id)} isBookmarked={bookmarks.has(topic.id)}
                    isCompact={isCompact}
                    onToggleRead={toggleRead} onToggleBookmark={toggleBookmark}
                    onTest={() => onSelectMode && onSelectMode(currentBlock.id)}
                  />
                ))}
              </div>

              <div className={styles.blockCTA}>
                <div>
                  <p className={styles.blockCTATitle}>¿Listo para practicar?</p>
                  <p className={styles.blockCTADesc}>Refuerza lo aprendido con preguntas de {currentBlock.label}.</p>
                </div>
                <button className={styles.blockCTABtn} onClick={() => onSelectMode && onSelectMode(currentBlock.id)}>
                  <Zap size={15} /> Practicar este bloque
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
