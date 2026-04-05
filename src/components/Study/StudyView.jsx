import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BookOpen, Clock, CheckCircle, Bookmark, BookmarkCheck,
  Zap, ArrowLeft, ChevronRight, ChevronLeft, Scale, LayoutGrid,
  Loader2, Tag, Calendar, Highlighter, Trash2
} from 'lucide-react'
import { useContent }        from '../../hooks/useContent'
import ErrorState from '../ui/ErrorState'
import useStudyProgress      from '../../hooks/useStudyProgress'
import { useHighlights }     from '../../hooks/useHighlights'
import styles from './StudyView.module.css'

/* ─── Donut ─────────────────────────────────────────────────────────────── */
function Donut({ pct, color, size = 56, stroke = 6 }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className={styles.donutSvg}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" className={styles.donutArc} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.22} fontWeight="800" fill="var(--ink)" fontFamily="var(--font-body)">
        {pct}%
      </text>
    </svg>
  )
}

/* ─── HighlightedText ───────────────────────────────────────────────────── */
function HighlightedText({ text, keywords = [], laws = [], dates = [] }) {
  if (!text) return null
  const allTerms = [
    ...keywords.map(k => ({ term: k, type: 'keyword' })),
    ...laws.map(l => ({ term: l, type: 'law' })),
    ...dates.map(d => ({ term: d, type: 'date' })),
  ]
    .filter(({ term }) => term && term.length >= 6)
    .sort((a, b) => b.term.length - a.term.length)

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

/* ─── ContentRenderer ───────────────────────────────────────────────────── */
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

/* ─── Constantes de color ─────────────────────────────────────────────────── */
const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Amarillo', bg: '#FEF08A' },
  { id: 'green',  label: 'Verde',    bg: '#BBF7D0' },
  { id: 'blue',   label: 'Azul',     bg: '#BAE6FD' },
  { id: 'pink',   label: 'Rosa',     bg: '#FBCFE8' },
]

/* ─── HighlightableContent ──────────────────────────────────────────────────
   Estrategia simple y robusta:
   - Guarda el texto exacto seleccionado (no offsets)
   - Para pintar: busca el texto en el contenido renderizado con indexOf
   - Renderiza párrafo a párrafo aplicando marks por búsqueda de texto
   - ContentRenderer se usa cuando no hay subrayados (diseño original intacto)
────────────────────────────────────────────────────────────────────────── */
function applyMarksToSection(sectionText, highlights) {
  // sectionText: texto plano del párrafo (sin markdown **)
  // highlights: [{text, color, id}] que pueden estar en esta sección
  // Devuelve array de segmentos {type:'text'|'mark', ...}

  // Construir lista de rangos a marcar en este párrafo
  const ranges = []
  for (const h of highlights) {
    let searchFrom = 0
    while (true) {
      const idx = sectionText.indexOf(h.text, searchFrom)
      if (idx === -1) break
      ranges.push({ start: idx, end: idx + h.text.length, color: h.color, id: h.id })
      searchFrom = idx + h.text.length
    }
  }

  if (!ranges.length) return null

  // Ordenar y eliminar solapamientos
  ranges.sort((a, b) => a.start - b.start)
  const merged = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r.start < last.end) continue // solapamiento — ignorar
    merged.push(r)
  }

  // Construir segmentos
  const segs = []
  let cursor = 0
  for (const r of merged) {
    if (r.start > cursor) segs.push({ type: 'text', text: sectionText.slice(cursor, r.start) })
    segs.push({ type: 'mark', text: sectionText.slice(r.start, r.end), color: r.color, id: r.id })
    cursor = r.end
  }
  if (cursor < sectionText.length) segs.push({ type: 'text', text: sectionText.slice(cursor) })
  return segs
}

// Aplica negritas del markdown a un segmento de texto plano
function renderMdText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

function HighlightableContent({ topic, highlights, onAdd, onRemove, highlightMode }) {
  const containerRef      = useRef(null)
  const [tooltip, setTooltip] = useState(null) // {x, y, text}
  const pendingRef        = useRef(null) // guarda la selección mientras se elige color

  // Lógica compartida entre mouseup y touchend
  const handleSelectionEnd = useCallback((clientY = null) => {
    if (!highlightMode) return

    // En iOS la selección puede tardar un tick en confirmarse tras touchend
    const process = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) return
      const selectedText = sel.toString().trim()
      if (!selectedText || selectedText.length < 2) return

      const range         = sel.getRangeAt(0)
      const container     = containerRef.current
      if (!container?.contains(range.commonAncestorContainer)) return

      const rect          = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      pendingRef.current = selectedText

      // En táctil usamos la posición Y del touch si está disponible
      const tooltipY = clientY != null
        ? clientY - containerRect.top - 68
        : rect.top - containerRect.top - 58

      setTooltip({
        x: Math.max(70, Math.min(
          rect.left - containerRect.left + rect.width / 2,
          containerRect.width - 70
        )),
        y: tooltipY,
        text: selectedText,
      })
    }

    // Pequeño delay para iOS — la selección se confirma tras el touchend
    setTimeout(process, 30)
  }, [highlightMode])

  const handleMouseUp = useCallback((e) => {
    handleSelectionEnd()
  }, [handleSelectionEnd])

  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches?.[0]
    handleSelectionEnd(touch?.clientY ?? null)
  }, [handleSelectionEnd])

  const handlePickColor = useCallback(async (colorEntry, e) => {
    e.preventDefault()
    e.stopPropagation()
    const text = pendingRef.current
    if (!text) return

    await onAdd({
      topicId:     topic.id,
      startOffset: 0,
      endOffset:   0,
      text,
      color: colorEntry.bg,
    })

    pendingRef.current = null
    setTooltip(null)
    window.getSelection()?.removeAllRanges()
  }, [onAdd, topic.id])

  // Cerrar tooltip al desactivar modo o cambiar tema
  useEffect(() => {
    setTooltip(null)
    pendingRef.current = null
    window.getSelection()?.removeAllRanges()
  }, [highlightMode, topic.id])

  // ── Renderizar con marks ─────────────────────────────────────────────────
  const renderWithMarks = () => {
    const sections = topic.content.split('\n\n')

    return sections.map((section, i) => {
      // Texto plano de la sección (sin **)
      const plain = section.replace(/\*\*([^*]+)\*\*/g, '$1')

      // ¿Algún highlight cae en este párrafo?
      const secHL = highlights.filter(h => plain.includes(h.text))
      const segs  = applyMarksToSection(plain, secHL)

      // Encabezado
      if (section.startsWith('**') && section.endsWith('**'))
        return <h4 key={i} className={styles.contentH4}>{section.slice(2, -2)}</h4>

      // Lista con guión
      if (section.match(/^- /m)) {
        return (
          <ul key={i} className={styles.contentList}>
            {section.split('\n').filter(l => l.startsWith('- ')).map((item, j) => {
              const itemPlain = item.slice(2).replace(/\*\*([^*]+)\*\*/g, '$1')
              const itemHL    = highlights.filter(h => itemPlain.includes(h.text))
              const itemSegs  = applyMarksToSection(itemPlain, itemHL)
              return (
                <li key={j}>
                  {itemSegs
                    ? itemSegs.map((s, k) =>
                        s.type === 'mark'
                          ? <mark key={k} className={styles.hlMark} style={{ background: s.color }}
                              onClick={() => onRemove(s.id)} title="Clic para eliminar">{s.text}</mark>
                          : renderMdText(s.text)
                      )
                    : renderMdText(item.slice(2))
                  }
                </li>
              )
            })}
          </ul>
        )
      }

      // Lista numerada
      if (section.match(/^\d+\. /m)) {
        return (
          <ol key={i} className={styles.contentList}>
            {section.split('\n').filter(l => l.match(/^\d+\. /)).map((item, j) => {
              const raw       = item.replace(/^\d+\. /, '')
              const itemPlain = raw.replace(/\*\*([^*]+)\*\*/g, '$1')
              const itemHL    = highlights.filter(h => itemPlain.includes(h.text))
              const itemSegs  = applyMarksToSection(itemPlain, itemHL)
              return (
                <li key={j}>
                  {itemSegs
                    ? itemSegs.map((s, k) =>
                        s.type === 'mark'
                          ? <mark key={k} className={styles.hlMark} style={{ background: s.color }}
                              onClick={() => onRemove(s.id)} title="Clic para eliminar">{s.text}</mark>
                          : renderMdText(s.text)
                      )
                    : renderMdText(raw)
                  }
                </li>
              )
            })}
          </ol>
        )
      }

      // Párrafo normal
      return (
        <p key={i} className={styles.paragraph}>
          {segs
            ? segs.map((s, k) =>
                s.type === 'mark'
                  ? <mark key={k} className={styles.hlMark} style={{ background: s.color }}
                      onClick={() => onRemove(s.id)} title="Clic para eliminar">{s.text}</mark>
                  : renderMdText(s.text)
              )
            : renderMdText(section)
          }
        </p>
      )
    })
  }

  return (
    <div
      ref={containerRef}
      className={[styles.highlightableContent, highlightMode ? styles.highlightModeActive : ''].join(' ')}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
    >
      {/* Paleta de colores flotante */}
      {tooltip && highlightMode && (
        <div
          className={styles.colorPicker}
          style={{ left: tooltip.x, top: tooltip.y }}
          onMouseDown={e => e.preventDefault()}
          onTouchStart={e => e.preventDefault()}
          onClick={e => e.stopPropagation()}
        >
          <span className={styles.colorPickerLabel}>Color:</span>
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.id}
              className={styles.colorDot}
              style={{ background: c.bg }}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
              onTouchStart={e => { e.preventDefault(); e.stopPropagation() }}
              onClick={e => handlePickColor(c, e)}
              title={c.label}
            />
          ))}
        </div>
      )}

      {/* Contenido con marks o ContentRenderer original */}
      {highlights.length > 0
        ? <div className={styles.contentBody}>{renderWithMarks()}</div>
        : <ContentRenderer content={topic.content} keywords={topic.keywords} laws={topic.laws} dates={topic.dates} />
      }

      {/* Pills de subrayados al pie */}
      {highlights.length > 0 && (
        <div className={styles.highlightList}>
          <span className={styles.highlightListTitle}>Subrayados en este tema</span>
          {highlights.map(h => (
            <div key={h.id} className={styles.highlightPill} style={{ background: h.color }}>
              <span className={styles.highlightPillText}>
                {h.text.length > 60 ? h.text.slice(0, 60) + '…' : h.text}
              </span>
              <button className={styles.highlightPillRemove}
                onMouseDown={e => e.preventDefault()}
                onTouchStart={e => e.preventDefault()}
                onClick={e => { e.stopPropagation(); onRemove(h.id) }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Mis Apuntes ────────────────────────────────────────────────────────── */
function MisApuntes({ highlights, blocks, onRemove }) {
  if (!highlights.length) {
    return (
      <div className={styles.apuntesEmpty}>
        <Highlighter size={28} strokeWidth={1.4} />
        <p>Aún no tienes nada subrayado</p>
        <span>Selecciona texto mientras lees el temario y pulsa "Subrayar"</span>
      </div>
    )
  }

  // Agrupar por bloque → tema
  const byBlock = {}
  for (const block of blocks) {
    for (const topic of block.topics) {
      const hl = highlights.filter(h => h.topic_id === topic.id)
      if (!hl.length) continue
      if (!byBlock[block.id]) byBlock[block.id] = { block, topics: {} }
      byBlock[block.id].topics[topic.id] = { topic, hl }
    }
  }

  if (!Object.keys(byBlock).length) {
    return (
      <div className={styles.apuntesEmpty}>
        <Highlighter size={28} strokeWidth={1.4} />
        <p>Tus subrayados aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className={styles.apuntesList}>
      {Object.values(byBlock).map(({ block, topics }) => (
        <div key={block.id} className={styles.apuntesBlock}>
          <div className={styles.apuntesBlockHeader} style={{ color: block.color }}>
            <BookOpen size={13} strokeWidth={2} />
            <span>{block.label}</span>
          </div>
          {Object.values(topics).map(({ topic, hl }) => (
            <div key={topic.id} className={styles.apuntesTopic}>
              <div className={styles.apuntesTopicTitle}>{topic.title}</div>
              <div className={styles.apuntesFragments}>
                {hl.map(h => (
                  <div key={h.id} className={styles.apuntesFragment}>
                    <mark className={styles.apuntesMark} style={{ background: h.color }}>
                      "{h.text}"
                    </mark>
                    <button className={styles.apuntesRemove} onClick={() => onRemove(h.id)} title="Eliminar">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── ReadMode ───────────────────────────────────────────────────────────── */
function ReadMode({ block, topicIndex, onClose, onToggleRead, onToggleBookmark,
  readTopics, bookmarks, onTest, highlights, onAddHighlight, onRemoveHighlight }) {
  const [idx, setIdx]               = useState(topicIndex)
  const [highlightMode, setHL]      = useState(false)
  const scrollRef                   = useRef(null)
  const topic                       = block.topics[idx]
  const isRead                      = readTopics.has(topic.id)
  const isBookmarked                = bookmarks.has(topic.id)
  const totalTopics                 = block.topics.length
  const readCount                   = block.topics.filter(t => readTopics.has(t.id)).length
  const topicHL                     = highlights.filter(h => h.topic_id === topic.id)

  // Al cambiar de tema, desactivar modo subrayado
  useEffect(() => { setHL(false) }, [idx])

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [idx])
  useEffect(() => { if (!isRead) onToggleRead(topic.id, block.id) }, [idx]) // eslint-disable-line

  return (
    <div className={styles.readOverlay}>
      <div className={styles.readTopBar}>
        <button className={styles.readBackBtn} onClick={onClose}>
          <ArrowLeft size={16} /> <span>Volver</span>
        </button>
        <div className={styles.readProgressDots}>
          {block.topics.map((t, i) => (
            <button key={t.id}
              className={[styles.readDot, i===idx?styles.readDotActive:'', readTopics.has(t.id)?styles.readDotDone:''].join(' ')}
              style={(i===idx||readTopics.has(t.id))?{'--bc':block.color}:{}}
              onClick={() => setIdx(i)} title={t.title} />
          ))}
        </div>
        <div className={styles.readTopRight}>
          <button
            className={[styles.readActionBtn, isBookmarked ? styles.readActionActive : ''].join(' ')}
            style={isBookmarked ? { color: block.color } : {}}
            onClick={() => onToggleBookmark(topic.id, block.id)}
          >
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
          {/* Botón modo subrayado — prominente */}
          <button
            className={[styles.highlightToggleBtn, highlightMode ? styles.highlightToggleBtnActive : ''].join(' ')}
            onClick={() => setHL(v => !v)}
          >
            <Highlighter size={13} />
            {highlightMode ? 'Listo' : 'Subrayar'}
          </button>
          {topicHL.length > 0 && (
            <span className={styles.highlightBadge}>
              <Highlighter size={11} /> {topicHL.length}
            </span>
          )}
          <span className={styles.readCounter}>{readCount}/{totalTopics}</span>
        </div>
      </div>

      <div className={styles.readScroll} ref={scrollRef}>
        <div className={styles.readContent}>
          <div className={styles.readBlockBadge} style={{ background: block.bg, color: block.color }}>
            <BookOpen size={12} strokeWidth={2} /> {block.label}
          </div>
          <h1 className={styles.readTitle}>{topic.title}</h1>

          {(topic.laws.length > 0 || topic.dates.length > 0) && (
            <div className={styles.readTags}>
              {topic.laws.map(l => <span key={l} className={styles.tagLaw}><Scale size={10} /> {l}</span>)}
              {topic.dates.map(d => <span key={d} className={styles.tagDate}><Calendar size={10} /> {d}</span>)}
            </div>
          )}

          {highlightMode && (
            <div className={styles.highlightHint}>
              <Highlighter size={11} /> Selecciona el texto que quieres subrayar
            </div>
          )}

          <HighlightableContent
            topic={topic}
            highlights={topicHL}
            onAdd={onAddHighlight}
            onRemove={onRemoveHighlight}
            highlightMode={highlightMode}
          />

          {topic.keywords.length > 0 && (
            <div className={styles.readKeywords}>
              <Tag size={12} />
              {topic.keywords.map(k => <span key={k} className={styles.keyword}>{k}</span>)}
            </div>
          )}
          <div className={styles.readCTA}>
            <button className={styles.readCTABtn} onClick={() => onTest(block.id, block.label, topic.id, topic.title)}>
              <Zap size={15} /> Practicar este tema
            </button>
          </div>
        </div>
      </div>

      <div className={styles.readBottomNav}>
        <button className={styles.readNavBtn} onClick={() => setIdx(i => Math.max(0, i-1))} disabled={idx===0}>
          <ChevronLeft size={16} /> Anterior
        </button>
        <span className={styles.readNavLabel}>{idx+1} / {totalTopics}</span>
        <button className={styles.readNavBtn} onClick={() => setIdx(i => Math.min(totalTopics-1, i+1))} disabled={idx===totalTopics-1}>
          Siguiente <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function StudyView({ currentUser, onSelectMode, initialBlockId }) {
  const { blocks, loading: loadingContent, error: errorContent } = useContent(currentUser?.id, currentUser?.subject_id)
  const { readTopics, bookmarks, loading: loadingProgress, toggleRead, toggleBookmark } =
    useStudyProgress(currentUser?.id)
  const { highlights, addHighlight, removeHighlight, highlightCountByTopic } =
    useHighlights(currentUser?.id, currentUser?.academy_id, currentUser?.subject_id)

  const [readMode,  setReadMode]  = useState(null)
  const [expanded,  setExpanded]  = useState({})
  const [activeTab, setActiveTab] = useState('temario')

  const loading     = loadingContent || loadingProgress
  const totalTopics = blocks.reduce((s, b) => s + b.topics.length, 0)
  const globalPct   = totalTopics > 0 ? Math.round((readTopics.size / totalTopics) * 100) : 0

  useEffect(() => {
    if (initialBlockId && blocks.length > 0) {
      setExpanded(prev => ({ ...prev, [initialBlockId]: true }))
      setTimeout(() => {
        document.getElementById(`block-${initialBlockId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    }
  }, [initialBlockId, blocks.length])

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (errorContent) return <ErrorState message="No se pudo cargar el temario. Comprueba tu conexión." onRetry={() => window.location.reload()} />
  if (loading) return <div className={styles.loadingState}><Loader2 size={24} className={styles.spinner} /></div>

  if (readMode) return (
    <ReadMode
      block={readMode.block} topicIndex={readMode.topicIndex}
      onClose={() => setReadMode(null)}
      onToggleRead={toggleRead} onToggleBookmark={toggleBookmark}
      readTopics={readTopics} bookmarks={bookmarks} onTest={onSelectMode}
      highlights={highlights} onAddHighlight={addHighlight} onRemoveHighlight={removeHighlight}
    />
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Temario</h1>
          <p className={styles.pageSubtitle}>{currentUser?.subjectName || currentUser?.academyName || 'Temario'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.studyTabs}>
        <button className={[styles.studyTab, activeTab==='temario'?styles.studyTabActive:''].join(' ')}
          onClick={() => setActiveTab('temario')}>
          <BookOpen size={14} /> Temario
        </button>
        <button className={[styles.studyTab, activeTab==='apuntes'?styles.studyTabActive:''].join(' ')}
          onClick={() => setActiveTab('apuntes')}>
          <Highlighter size={14} /> Mis apuntes
          {highlights.length > 0 && <span className={styles.studyTabBadge}>{highlights.length}</span>}
        </button>
      </div>

      {/* Mis apuntes */}
      {activeTab === 'apuntes' && (
        <MisApuntes highlights={highlights} blocks={blocks} onRemove={removeHighlight} />
      )}

      {/* Temario */}
      {activeTab === 'temario' && (
        <>
          <div className={styles.globalCard}>
            <Donut pct={globalPct} color="var(--primary)" size={72} stroke={7} />
            <div className={styles.globalRight}>
              <p className={styles.globalLabel}>Progreso total del temario</p>
              <p className={styles.globalStat}>{readTopics.size} <span>/ {totalTopics} temas leídos</span></p>
              <div className={styles.globalBar}><div className={styles.globalBarFill} style={{ width: `${globalPct}%` }} /></div>
            </div>
          </div>

          <div className={styles.blocksList}>
            {blocks.map(block => {
              const read   = block.topics.filter(t => readTopics.has(t.id)).length
              const total  = block.topics.length
              const pct    = total > 0 ? Math.round((read / total) * 100) : 0
              const isOpen = !!expanded[block.id]
              const blockHL= block.topics.reduce((s, t) => s + (highlightCountByTopic[t.id]||0), 0)

              return (
                <div key={block.id} id={`block-${block.id}`}
                  className={[styles.blockRow, isOpen?styles.blockRowOpen:'', pct===100?'cardDone':''].join(' ')}
                  style={pct===100?{'--done-color':block.color}:{}}>

                  <button className={styles.blockRowHeader} onClick={() => toggleExpand(block.id)} style={{'--bc':block.color}}>
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
                          {blockHL > 0 && <span style={{ color:'#D97706' }}><Highlighter size={10} /> {blockHL}</span>}
                        </div>
                      </div>
                    </div>
                    <div className={styles.blockRowRight}>
                      <Donut pct={pct} color={block.color} size={44} stroke={4} />
                      <ChevronRight size={16} className={styles.blockRowChevron}
                        style={{ transform: isOpen?'rotate(90deg)':'rotate(0deg)' }} />
                    </div>
                  </button>

                  <div className={styles.blockRowBar}>
                    <div className={styles.blockRowBarFill} style={{ width:`${pct}%`, background:block.color }} />
                  </div>

                  {isOpen && (
                    <div className={styles.blockTopics}>
                      {block.topics.map((topic, i) => {
                        const isRead       = readTopics.has(topic.id)
                        const isBookmarked = bookmarks.has(topic.id)
                        const hlCount      = highlightCountByTopic[topic.id] || 0
                        return (
                          <button key={topic.id}
                            className={[styles.topicRow, isRead?styles.topicRowRead:'', isRead?'cardDone':''].join(' ')}
                            style={isRead?{'--bc':block.color,'--done-color':block.color}:{'--bc':block.color}}
                            onClick={() => setReadMode({ block, topicIndex: i })}>
                            <span className={[styles.topicRowDot, isRead?styles.topicRowDotRead:''].join(' ')}>
                              {isRead && <CheckCircle size={9} />}
                            </span>
                            <span className={styles.topicRowTitle}>{topic.title}</span>
                            <div className={styles.topicRowRight}>
                              {hlCount > 0 && (
                                <span className={styles.topicHlBadge}><Highlighter size={9} /> {hlCount}</span>
                              )}
                              {isBookmarked && <BookmarkCheck size={12} style={{ color:block.color, flexShrink:0 }} />}
                              <ChevronRight size={13} className={styles.topicRowArrow} />
                            </div>
                          </button>
                        )
                      })}
                      <div className={styles.blockTopicsFooter}>
                        <button className={styles.practiceBtn} style={{'--bc':block.color,'--bb':block.bg}}
                          onClick={() => onSelectMode && onSelectMode(block.id, block.label)}>
                          <Zap size={13} /> Practicar todo el bloque
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
