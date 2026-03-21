import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Calendar, Check, RefreshCw, Save, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import styles from './PlanSemanal.module.css'

// Fecha local YYYY-MM-DD sin problemas de timezone
function localDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function getLunesDeOffset(offset = 0) {
  const today = new Date()
  const day   = today.getDay()
  const diff  = day === 0 ? -6 : 1 - day
  const lunes = new Date(today)
  lunes.setDate(today.getDate() + diff + offset * 7)
  return lunes
}

function getDiaDeHoy() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1 // 0=lun…6=dom
}

function formatWeek(lunes) {
  const dom = new Date(lunes)
  dom.setDate(dom.getDate() + 6)
  const o = { day: '2-digit', month: 'short' }
  return `${lunes.toLocaleDateString('es-ES', o)} – ${dom.toLocaleDateString('es-ES', o)}`
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// ── Overlay de guardado con SVG animado ─────────────────────────────────
function SavedOverlay({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={styles.savedOverlay}>
      <div className={styles.savedBox}>
        <svg className={styles.savedSvg} viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="28" stroke="#059669" strokeWidth="3"
            className={styles.savedCircle} />
          <path d="M18 30 L26 38 L42 22" stroke="#059669" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={styles.savedCheck} />
        </svg>
        <p className={styles.savedText}>¡Plan guardado!</p>
      </div>
    </div>
  )
}

export default function PlanSemanal({ currentUser }) {
  const [modo,        setModo]        = useState('semanal')
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [diaActivo,   setDiaActivo]   = useState(getDiaDeHoy) // preselecciona hoy
  const [bloques,     setBloques]     = useState([])
  const [selBlocks,   setSelBlocks]   = useState([])
  const [selTopics,   setSelTopics]   = useState([])
  const [notes,       setNotes]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [showSaved,   setShowSaved]   = useState(false)
  const [error,       setError]       = useState(null)
  const [expanded,    setExpanded]    = useState(null)

  const academyId = currentUser?.academy_id
  const userId    = currentUser?.id

  // Calcular la fecha objetivo según modo
  const lunesDate   = getLunesDeOffset(weekOffset)
  const targetDate  = modo === 'diario'
    ? (() => { const d = new Date(lunesDate); d.setDate(d.getDate() + diaActivo); return d })()
    : lunesDate
  const targetKey   = localDateStr(targetDate)

  // Cargar bloques y temas (una sola vez)
  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      const { data: blks } = await supabase
        .from('content_blocks').select('id, label, color')
        .eq('academy_id', academyId).order('position')
      const { data: tops } = await supabase
        .from('content_topics').select('id, title, block_id')
        .in('block_id', (blks || []).map(b => b.id)).order('position')
      setBloques((blks || []).map(b => ({
        ...b, topics: (tops || []).filter(t => t.block_id === b.id)
      })))
    }
    load()
  }, [academyId])

  // Cargar plan del período seleccionado
  useEffect(() => {
    if (!academyId) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('study_plans').select('*')
        .eq('academy_id', academyId)
        .eq('week_start', targetKey)
        .maybeSingle()

      if (data) {
        setSelBlocks(data.block_ids || [])
        setSelTopics(data.topic_ids || [])
        setNotes(data.notes || '')
      } else {
        setSelBlocks([]); setSelTopics([]); setNotes('')
      }
      setLoading(false)
    }
    load()
  }, [academyId, targetKey])

  const toggleBlock = useCallback((blockId) => {
    setSelBlocks(prev => {
      const next = prev.includes(blockId) ? prev.filter(b => b !== blockId) : [...prev, blockId]
      if (!next.includes(blockId)) {
        const blk = bloques.find(b => b.id === blockId)
        const tIds = (blk?.topics || []).map(t => t.id)
        setSelTopics(pt => pt.filter(t => !tIds.includes(t)))
      }
      return next
    })
  }, [bloques])

  const toggleTopic = useCallback((topicId) => {
    setSelTopics(prev => prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId])
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(null)
    const { error: err } = await supabase
      .from('study_plans')
      .upsert({
        academy_id: academyId,
        created_by: userId,
        week_start: targetKey,
        block_ids:  selBlocks,
        topic_ids:  selTopics,
        notes:      notes.trim() || null,
      }, { onConflict: 'academy_id,week_start' })

    setSaving(false)
    if (err) { setError(`Error: ${err.message}`); return }
    setShowSaved(true)
  }

  // Temas únicos seleccionados (sueltos + los de bloques completos)
  const uniqueTemas = new Set([
    ...selTopics,
    ...bloques.filter(b => selBlocks.includes(b.id)).flatMap(b => b.topics.map(t => t.id))
  ]).size

  const modoLabel = modo === 'diario'
    ? targetDate.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })
    : (weekOffset === 0 ? 'Semana actual' : weekOffset === 1 ? 'Semana siguiente' : weekOffset === -1 ? 'Semana pasada' : `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`)

  return (
    <div className={styles.page}>
      {showSaved && <SavedOverlay onDone={() => setShowSaved(false)} />}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Plan de estudio</h1>
          <p className={styles.pageSubtitle}>Los alumnos verán los objetivos en su pantalla de inicio</p>
        </div>
        <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={14} className={styles.spinner} /> : <Save size={14} />}
          Guardar
        </button>
      </div>

      {/* Selector modo */}
      <div className={styles.modoRow}>
        <button className={[styles.modoBtn, modo === 'semanal' ? styles.modoBtnActive : ''].join(' ')}
          onClick={() => setModo('semanal')}>
          <CalendarDays size={14} /> Semanal
        </button>
        <button className={[styles.modoBtn, modo === 'diario' ? styles.modoBtnActive : ''].join(' ')}
          onClick={() => setModo('diario')}>
          <Calendar size={14} /> Diario
        </button>
      </div>

      {/* Nav semana */}
      <div className={styles.weekNav}>
        <button className={styles.weekBtn} onClick={() => setWeekOffset(w => w - 1)}>‹</button>
        <div className={styles.weekInfo}>
          {modo === 'semanal' ? <CalendarDays size={14} /> : <Calendar size={14} />}
          <span className={styles.weekLabel}>{modoLabel}</span>
          {modo === 'semanal' && <span className={styles.weekDates}>{formatWeek(lunesDate)}</span>}
        </div>
        <button className={styles.weekBtn} onClick={() => setWeekOffset(w => w + 1)}>›</button>
      </div>

      {/* Selector días (modo diario) */}
      {modo === 'diario' && (
        <div className={styles.diasRow}>
          {DIAS.map((dia, i) => {
            const d = new Date(lunesDate)
            d.setDate(d.getDate() + i)
            const isHoy = localDateStr(d) === localDateStr()
            return (
              <button key={i}
                className={[styles.diaBtn, diaActivo === i ? styles.diaBtnActive : '', isHoy ? styles.diaBtnHoy : ''].join(' ')}
                onClick={() => setDiaActivo(i)}>
                <span className={styles.diaNombre}>{dia}</span>
                <span className={styles.diaDia}>{d.getDate()}</span>
                {isHoy && <span className={styles.diaHoyDot} />}
              </button>
            )
          })}
        </div>
      )}

      {error && <div className={styles.errorBanner}><AlertTriangle size={14} />{error}</div>}

      {loading ? (
        <div className={styles.state}><RefreshCw size={22} className={styles.spinner} /><p>Cargando…</p></div>
      ) : (
        <>
          {(selBlocks.length > 0 || selTopics.length > 0) && (
            <div className={styles.resumenBanner}>
              <Check size={14} />
              <span>
                {selBlocks.length > 0 && <><strong>{selBlocks.length} bloque{selBlocks.length !== 1 ? 's' : ''} completo{selBlocks.length !== 1 ? 's' : ''}</strong></>}
                {selBlocks.length > 0 && selTopics.length > 0 && ' · '}
                {selTopics.length > 0 && <><strong>{selTopics.length} tema{selTopics.length !== 1 ? 's' : ''} específico{selTopics.length !== 1 ? 's' : ''}</strong></>}
                {' · '}<strong>{uniqueTemas} temas en total</strong>
              </span>
            </div>
          )}

          <div className={styles.notasCard}>
            <label className={styles.notasLabel}>Nota para los alumnos (opcional)</label>
            <textarea className={styles.notasInput}
              placeholder="Ej: Esta semana nos centramos en legislación archivística..."
              value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div className={styles.bloquesLista}>
            {bloques.map(blk => {
              const blkSel   = selBlocks.includes(blk.id)
              const isOpen   = expanded === blk.id
              const topsSel  = blk.topics.filter(t => selTopics.includes(t.id)).length
              const totalTop = blk.topics.length

              return (
                <div key={blk.id} className={[styles.bloqueCard, blkSel ? styles.bloqueSeleccionado : ''].join(' ')}>
                  <div className={styles.bloqueHeaderRow}>
                    <button
                      className={[styles.bloqueCheck, blkSel ? styles.bloqueCheckActive : ''].join(' ')}
                      onClick={() => toggleBlock(blk.id)}
                      style={{ '--blk-color': blk.color }}
                      title={blkSel ? 'Deseleccionar bloque completo' : 'Seleccionar bloque completo'}>
                      {blkSel && <Check size={12} />}
                    </button>
                    <button className={styles.bloqueToggle} onClick={() => setExpanded(isOpen ? null : blk.id)}>
                      <div className={styles.bloqueColor} style={{ background: blk.color }} />
                      <span className={styles.bloqueLabel}>{blk.label}</span>
                      {(topsSel > 0 || blkSel) && (
                        <span className={styles.topsSel}>
                          {blkSel ? `${totalTop}/${totalTop}` : `${topsSel}/${totalTop}`}
                        </span>
                      )}
                      {isOpen ? <ChevronUp size={14} className={styles.chevron} /> : <ChevronDown size={14} className={styles.chevron} />}
                    </button>
                  </div>

                  {isOpen && (
                    <div className={styles.topicsLista}>
                      {blk.topics.map(t => {
                        const tSel = selTopics.includes(t.id) || blkSel
                        return (
                          <button key={t.id}
                            className={[styles.topicRow, tSel ? styles.topicSel : ''].join(' ')}
                            onClick={() => !blkSel && toggleTopic(t.id)}
                            disabled={blkSel}>
                            <div className={[styles.topicDot, tSel ? styles.topicDotSel : ''].join(' ')}
                              style={tSel ? { background: blk.color } : {}} />
                            <span>{t.title}</span>
                            {tSel && <Check size={11} className={styles.topicCheck} style={{ color: blk.color }} />}
                          </button>
                        )
                      })}
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
