import { useState } from 'react'
import {
  CalendarDays, Plus, Trash2, Loader2,
  CheckCircle2, AlertCircle, Tag
} from 'lucide-react'
import { useCalendarEvents } from '../../../hooks/useCalendarEvents'
import type { CurrentUser }  from '../../../types'
import styles from './EventosCalendario.module.css'

interface Props {
  currentUser: CurrentUser | null
}

type EventType = 'clase' | 'hito' | 'evento'

const TYPE_META: Record<EventType, { label: string; color: string }> = {
  clase:  { label: 'Clase',  color: '#059669' },
  hito:   { label: 'Hito',   color: '#D97706' },
  evento: { label: 'Evento', color: '#7C3AED' },
}

function fmtFecha(ds: string): string {
  return new Date(ds + 'T12:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function EventosCalendario({ currentUser }: Props) {
  const { events, crearEvento, borrarEvento } = useCalendarEvents(currentUser)

  const [title,    setTitle]    = useState('')
  const [date,     setDate]     = useState('')
  const [type,     setType]     = useState<EventType>('evento')
  const [desc,     setDesc]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  // Solo mostrar eventos manuales (no los auto-generados de tareas/examen)
  const manualEvents = events.filter(e =>
    e.type === 'clase' || e.type === 'hito' || e.type === 'evento'
  )

  const mostrarFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleCrear = async () => {
    if (!title.trim()) return mostrarFeedback('El título es obligatorio', false)
    if (!date)         return mostrarFeedback('La fecha es obligatoria', false)

    setSaving(true)
    const result = await crearEvento({
      title:       title.trim(),
      event_date:  date,
      type,
      description: desc.trim() || null,
    })
    setSaving(false)

    if (result?.error) return mostrarFeedback('Error al crear el evento', false)
    setTitle('')
    setDate('')
    setDesc('')
    mostrarFeedback('Evento creado correctamente', true)
  }

  return (
    <div className={styles.wrap}>

      {/* Formulario */}
      <div className={styles.form}>
        <p className={styles.formTitle}>Nuevo evento</p>

        <input
          className={styles.input}
          placeholder="Título del evento"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <div className={styles.row}>
          <input
            type="date"
            className={styles.input}
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)}
          />

          <div className={styles.selectWrap}>
            <Tag size={13} className={styles.selectIcon} />
            <select
              className={styles.select}
              value={type}
              onChange={e => setType(e.target.value as EventType)}
            >
              <option value="evento">Evento general</option>
              <option value="clase">Clase en directo</option>
              <option value="hito">Hito del temario</option>
            </select>
          </div>
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Descripción opcional…"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />

        {feedback && (
          <div className={[styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackError].join(' ')}>
            {feedback.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {feedback.msg}
          </div>
        )}

        <button className={styles.btnCrear} onClick={handleCrear} disabled={saving}>
          {saving
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Plus size={14} />
          }
          {saving ? 'Creando…' : 'Añadir evento'}
        </button>
      </div>

      {/* Lista */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <CalendarDays size={13} />
          Eventos creados ({manualEvents.length})
        </div>

        {manualEvents.length === 0 ? (
          <div className={styles.empty}>
            <CalendarDays size={26} className={styles.emptyIcon} />
            <p className={styles.emptyText}>Aún no hay eventos</p>
          </div>
        ) : (
          <div className={styles.eventList}>
            {manualEvents.map(ev => {
              const meta = TYPE_META[ev.type as EventType] ?? TYPE_META.evento
              return (
                <div key={ev.id} className={styles.eventItem}>
                  <div
                    className={styles.eventColorDot}
                    style={{ background: meta.color }}
                  />
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{ev.title}</span>
                    <span className={styles.eventMeta}>
                      <span>{meta.label}</span>
                      <span className={styles.metaDot} />
                      <span>{fmtFecha(ev.event_date)}</span>
                      {ev.description && (
                        <>
                          <span className={styles.metaDot} />
                          <span>{ev.description}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    className={styles.btnDelete}
                    onClick={() => borrarEvento(ev.id)}
                    title="Eliminar evento"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
