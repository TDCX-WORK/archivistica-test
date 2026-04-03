import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { BookOpen, ChevronDown, ChevronUp, Search, Layers } from 'lucide-react'
import styles from './BancoPreguntas.module.css'

const LETRAS = ['A', 'B', 'C', 'D']

function PreguntaCard({ pregunta, idx }) {
  const [abierta, setAbierta] = useState(false)
  const opciones = Array.isArray(pregunta.options) ? pregunta.options : []

  return (
    <div className={styles.preguntaCard}>
      <button className={styles.preguntaHeader} onClick={() => setAbierta(v => !v)}>
        <span className={styles.preguntaNum}>{idx + 1}</span>
        <span className={styles.preguntaTexto}>{pregunta.question}</span>
        {abierta ? <ChevronUp size={14} className={styles.chevron} /> : <ChevronDown size={14} className={styles.chevron} />}
      </button>

      {abierta && (
        <div className={styles.preguntaBody}>
          <div className={styles.opciones}>
            {opciones.map((op, i) => (
              <div
                key={i}
                className={[
                  styles.opcion,
                  i === pregunta.answer ? styles.opcionCorrecta : ''
                ].join(' ')}
              >
                <span className={styles.opcionLetra}>{LETRAS[i]}</span>
                <span className={styles.opcionTexto}>{op}</span>
                {i === pregunta.answer && (
                  <span className={styles.opcionBadge}>✓ Correcta</span>
                )}
              </div>
            ))}
          </div>
          {pregunta.explanation && (
            <div className={styles.explicacion}>
              <span className={styles.explicacionLabel}>Explicación</span>
              <p className={styles.explicacionTexto}>{pregunta.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BancoPreguntas({ currentUser, onLoad }) {
  const [bloques,    setBloques]    = useState([])
  const [preguntas,  setPreguntas]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [bloqueSel,  setBloqueSel]  = useState('todos')
  const [busqueda,   setBusqueda]   = useState('')

  const subjectId = currentUser?.subject_id
  const academyId = currentUser?.academy_id

  useEffect(() => {
    if (!subjectId || !academyId) return
    const load = async () => {
      setLoading(true)
      const [{ data: bls }, { data: qs }] = await Promise.all([
        supabase
          .from('content_blocks')
          .select('id, label, color, position')
          .eq('subject_id', subjectId)
          .order('position'),
        supabase
          .from('questions')
          .select('id, question, options, answer, explanation, block_id, topic_id')
          .eq('subject_id', subjectId)
          .eq('academy_id', academyId)
          .order('block_id'),
      ])
      setBloques(bls || [])
      setPreguntas(qs || [])
      setLoading(false)
      if (onLoad) onLoad((qs || []).length)
    }
    load()
  }, [subjectId, academyId])

  const preguntasFiltradas = useMemo(() => {
    let lista = preguntas
    if (bloqueSel !== 'todos') lista = lista.filter(q => q.block_id === bloqueSel)
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase()
      lista = lista.filter(q => q.question.toLowerCase().includes(term))
    }
    return lista
  }, [preguntas, bloqueSel, busqueda])

  const bloqueActual = bloques.find(b => b.id === bloqueSel)

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner} />
      <p>Cargando banco de preguntas…</p>
    </div>
  )

  return (
    <div className={styles.page}>

      {/* Cabecera con stats */}
      <div className={styles.header}>
        <div className={styles.headerStat}>
          <Layers size={16} className={styles.headerIcon} />
          <span><strong>{bloques.length}</strong> bloques</span>
        </div>
        <div className={styles.headerStat}>
          <BookOpen size={16} className={styles.headerIcon} />
          <span><strong>{preguntas.length}</strong> preguntas en total</span>
        </div>
      </div>

      {/* Filtros de bloque */}
      <div className={styles.filtros}>
        <button
          className={[styles.filtroBtn, bloqueSel === 'todos' ? styles.filtroActive : ''].join(' ')}
          onClick={() => setBloqueSel('todos')}
        >
          Todos ({preguntas.length})
        </button>
        {bloques.map(b => {
          const count = preguntas.filter(q => q.block_id === b.id).length
          return (
            <button
              key={b.id}
              className={[styles.filtroBtn, bloqueSel === b.id ? styles.filtroActive : ''].join(' ')}
              style={bloqueSel === b.id ? { borderColor: b.color, color: b.color, background: b.color + '15' } : {}}
              onClick={() => setBloqueSel(b.id)}
            >
              <span className={styles.filtroDot} style={{ background: b.color }} />
              {b.label.split(':')[0]} ({count})
            </button>
          )
        })}
      </div>

      {/* Buscador */}
      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Buscar pregunta…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Título del bloque seleccionado */}
      {bloqueActual && (
        <div className={styles.bloqueTitle} style={{ borderLeftColor: bloqueActual.color }}>
          <span style={{ color: bloqueActual.color }}>{bloqueActual.label}</span>
          <span className={styles.bloqueTitleCount}>{preguntasFiltradas.length} preguntas</span>
        </div>
      )}

      {/* Lista de preguntas */}
      {preguntasFiltradas.length === 0 ? (
        <div className={styles.empty}>
          <BookOpen size={32} strokeWidth={1.2} />
          <p>{busqueda ? 'No hay preguntas que coincidan con la búsqueda.' : 'No hay preguntas en este bloque.'}</p>
        </div>
      ) : (
        <div className={styles.lista}>
          {preguntasFiltradas.map((q, idx) => (
            <PreguntaCard key={q.id} pregunta={q} idx={idx} />
          ))}
        </div>
      )}

    </div>
  )
}
