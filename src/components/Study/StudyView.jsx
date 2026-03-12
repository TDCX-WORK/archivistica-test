import { useState, useEffect, useRef } from 'react'
import {
  BookOpen, Clock, CheckCircle, Bookmark, BookmarkCheck,
  Zap, ArrowLeft, ChevronRight, ChevronLeft, Scale, LayoutGrid,
  Loader2, Tag, Calendar
} from 'lucide-react'
import { STUDY_BLOCKS } from '../../data/study-content'
import useStudyProgress from '../../hooks/useStudyProgress'
import styles from './StudyView.module.css'

function Donut({ pct, color, size = 56, stroke = 6 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className={styles.donutSvg}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        className={styles.donutArc}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.22} fontWeight="800" fill="var(--ink)" fontFamily="var(--font-body)">
        {pct}%
      </text>
    </svg>
  )
}

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

function ReadMode({ block, topicIndex, onClose, onToggleRead, onToggleBookmark, readTopics, bookmarks, onTest }) {
  const [idx, setIdx] = useState(topicIndex)
  const scrollRef = useRef(null)
  const topic = block.topics[idx]
  const isRead = readTopics.has(topic.id)
  const isBookmarked = bookmarks.has(topic.id)
  const totalTopics = block.topics.length
  const readCount = block.topics.filter(t => readTopics.has(t.id)).length

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [idx])

  useEffect(() => {
    if (!isRead) onToggleRead(topic.id, block.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  return (
    <div className={styles.readOverlay}>
      <div className={styles.readTopBar}>
        <button className={styles.readBackBtn} onClick={onClose}>
          <ArrowLeft size={16} /> <span>Volver</span>
        </button>
        <div className={styles.readProgressDots}>
          {block.topics.map((t, i) => (
            <button
              key={t.id}
              className={[styles.readDot, i === idx ? styles.readDotActive : '', readTopics.has(t.id) ? styles.readDotDone : ''].join(' ')}
              style={(i === idx || readTopics.has(t.id)) ? { '--bc': block.color } : {}}
              onClick={() => setIdx(i)}
              title={t.title}
            />
          ))}
        </div>
        <div className={styles.readTopRight}>
          <button
            className={[styles.readActionBtn, isBookmarked ? styles.readActionActive : ''].join(' ')}
            style={isBookmarked ? { color: block.color } : {}}
            onClick={() => onToggleBookmark(topic.id, block.id)}
            title={isBookmarked ? 'Quitar marcador' : 'Marcar'}
          >
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
          <span className={styles.readCounter}>{readCount}/{totalTopics}</span>
        </div>
      </div>

      <div className={styles.readScroll} ref={scrollRef}>
        <div className={styles.readContent}>
          <div className={styles.readBlockBadge} style={{ background: block.bg, color: block.color }}>
            <BookOpen size={12} strokeWidth={2} />
            {block.label}
          </div>
          <h1 className={styles.readTitle}>{topic.title}</h1>
          {(topic.laws.length > 0 || topic.dates.length > 0) && (
            <div className={styles.readTags}>
              {topic.laws.map(l => <span key={l} className={styles.tagLaw}><Scale size={10} /> {l}</span>)}
              {topic.dates.map(d => <span key={d} className={styles.tagDate}><Calendar size={10} /> {d}</span>)}
            </div>
          )}
          <ContentRenderer content={topic.content} keywords={topic.keywords} laws={topic.laws} dates={topic.dates} />
          {topic.keywords.length > 0 && (
            <div className={styles.readKeywords}>
              <Tag size={12} />
              {topic.keywords.map(k => <span key={k} className={styles.keyword}>{k}</span>)}
            </div>
          )}
          <div className={styles.readCTA}>
            <button className={styles.readCTABtn} onClick={() => onTest(block.id)}>
              <Zap size={15} /> Practicar este bloque
            </button>
          </div>
        </div>
      </div>

      <div className={styles.readBottomNav}>
        <button className={styles.readNavBtn} onClick={() => setIdx(i => i - 1)} disabled={idx === 0}>
          <ChevronLeft size={16} /> <span>Anterior</span>
        </button>
        <span className={styles.readNavLabel}>{idx + 1} / {totalTopics}</span>
        {idx < totalTopics - 1 ? (
          <button className={styles.readNavBtn} onClick={() => setIdx(i => i + 1)}>
            <span>Siguiente</span> <ChevronRight size={16} />
          </button>
        ) : (
          <button className={[styles.readNavBtn, styles.readNavBtnFinish].join(' ')} onClick={onClose}>
            <CheckCircle size={15} /> <span>Completado</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function StudyView({ currentUser, onSelectMode }) {
  const { readTopics, bookmarks, loading, toggleRead, toggleBookmark } =
    useStudyProgress(currentUser?.id)
  const [readMode, setReadMode] = useState(null)
  const [expanded, setExpanded] = useState({})

  const totalTopics = STUDY_BLOCKS.reduce((s, b) => s + b.topics.length, 0)
  const globalPct   = Math.round((readTopics.size / totalTopics) * 100)

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) return (
    <div className={styles.loadingState}>
      <Loader2 size={24} className={styles.spinner} />
      <p>Cargando tu progreso…</p>
    </div>
  )

  if (readMode) return (
    <ReadMode
      block={readMode.block}
      topicIndex={readMode.topicIndex}
      onClose={() => setReadMode(null)}
      onToggleRead={toggleRead}
      onToggleBookmark={toggleBookmark}
      readTopics={readTopics}
      bookmarks={bookmarks}
      onTest={onSelectMode}
    />
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Temario</h1>
          <p className={styles.pageSubtitle}>Cuerpo Facultativo de Archiveros · Ministerio de Cultura</p>
        </div>
      </div>

      {/* Global progress */}
      <div className={styles.globalCard} ref={el => { if (el) el.style.setProperty('--global-w', el.offsetWidth + 'px') }}>
        <Donut pct={globalPct} color="var(--primary)" size={72} stroke={7} />
        <div className={styles.globalRight}>
          <p className={styles.globalLabel}>Progreso total del temario</p>
          <p className={styles.globalStat}>{readTopics.size} <span>/ {totalTopics} temas leídos</span></p>
          <div className={styles.globalBar}>
            <div className={styles.globalBarFill} style={{ width: `${globalPct}%` }} />
          </div>
        </div>
      </div>

      {/* Blocks — vertical expandable */}
      <div className={styles.blocksList}>
        {STUDY_BLOCKS.map(block => {
          const read  = block.topics.filter(t => readTopics.has(t.id)).length
          const total = block.topics.length
          const pct   = Math.round((read / total) * 100)
          const isOpen = !!expanded[block.id]
          return (
            <div key={block.id}
                className={[styles.blockRow, isOpen ? styles.blockRowOpen : '', pct === 100 ? 'cardDone' : ''].join(' ')}
                style={pct === 100 ? { '--done-color': block.color } : {}}>
              {/* Header — siempre visible */}
              <button
                className={styles.blockRowHeader}
                onClick={() => toggleExpand(block.id)}
                style={{ '--bc': block.color }}
              >
                <div className={styles.blockRowLeft}>
                  <div className={styles.blockRowIcon} style={{ background: block.bg, color: block.color }}>
                    <BookOpen size={16} strokeWidth={1.8} />
                  </div>
                  <div className={styles.blockRowInfo}>
                    <span className={styles.blockRowTitle}>{block.label}</span>
                    <div className={styles.blockRowMeta}>
                      <span><Clock size={10} /> {block.estimatedMinutes} min</span>
                      <span><LayoutGrid size={10} /> {total} temas</span>
                      <span style={{ color: block.color, fontWeight: 700 }}>{read}/{total} leídos</span>
                    </div>
                  </div>
                </div>
                <div className={styles.blockRowRight}>
                  <Donut pct={pct} color={block.color} size={44} stroke={4} />
                  <ChevronRight
                    size={16}
                    className={styles.blockRowChevron}
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </div>
              </button>

              {/* Barra de progreso alineada con la global */}
              <div className={styles.blockRowBar}>
                <div className={styles.blockRowBarFill} style={{ width: `${pct}%`, background: block.color }} />
              </div>

              {/* Topics — expandible */}
              {isOpen && (
                <div className={styles.blockTopics}>
                  {block.topics.map((topic, i) => {
                    const isRead = readTopics.has(topic.id)
                    const isBookmarked = bookmarks.has(topic.id)
                    return (
                      <button
                        key={topic.id}
                        className={[styles.topicRow, isRead ? styles.topicRowRead : '', isRead ? 'cardDone' : ''].join(' ')}
                        style={isRead ? { '--bc': block.color, '--done-color': block.color } : { '--bc': block.color }}
                        onClick={() => setReadMode({ block, topicIndex: i })}
                      >
                        <span className={[styles.topicRowDot, isRead ? styles.topicRowDotRead : ''].join(' ')}>
                          {isRead && <CheckCircle size={9} />}
                        </span>
                        <span className={styles.topicRowTitle}>{topic.title}</span>
                        <div className={styles.topicRowRight}>
                          {isBookmarked && <BookmarkCheck size={12} style={{ color: block.color, flexShrink: 0 }} />}
                          <ChevronRight size={13} className={styles.topicRowArrow} />
                        </div>
                      </button>
                    )
                  })}
                  <div className={styles.blockTopicsFooter}>
                    <button
                      className={styles.practiceBtn}
                      style={{ '--bc': block.color, '--bb': block.bg }}
                      onClick={() => onSelectMode && onSelectMode(block.id)}
                    >
                      <Zap size={13} /> Practicar este bloque
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
