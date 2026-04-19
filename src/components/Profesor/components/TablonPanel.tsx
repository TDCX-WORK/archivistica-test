import { useState } from 'react'
import { Megaphone, Check, RefreshCw, Trash2 } from 'lucide-react'
import type { CurrentUser, Announcement } from '../../../types'
import styles from './TablonPanel.module.css'

const TIPOS_AVISO = [
  { id:'info',         label:'Info',         color:'#0891B2', bg:'#EFF6FF' },
  { id:'importante',   label:'Importante',   color:'#DC2626', bg:'#FEF2F2' },
  { id:'examen',       label:'Examen',       color:'#7C3AED', bg:'#F5F3FF' },
  { id:'recordatorio', label:'Recordatorio', color:'#D97706', bg:'#FFFBEB' },
]

interface TablonPanelProps {
  announcements: Announcement[]
  onAdd:         (a: { authorId: string | undefined; tipo: string; title: string; body: string | null; expiresAt: string | null }) => Promise<Announcement | null | void>
  onDelete:      (id: string) => Promise<void>
  currentUser:   CurrentUser | null
}

export default function TablonPanel({ announcements, onAdd, onDelete, currentUser }: TablonPanelProps) {
  const [titulo, setTitulo]     = useState('')
  const [cuerpo, setCuerpo]     = useState('')
  const [tipo, setTipo]         = useState('info')
  const [expira, setExpira]     = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)

  const handlePublicar = async () => {
    if (!titulo.trim()) return
    setEnviando(true)
    await onAdd({
      authorId: currentUser?.id,
      tipo,
      title: titulo.trim(),
      body: cuerpo.trim() || null,
      expiresAt: expira ? new Date(expira + 'T23:59:59').toISOString() : null,
    })
    setTitulo(''); setCuerpo(''); setTipo('info'); setExpira('')
    setEnviando(false); setEnviado(true)
    setTimeout(() => setEnviado(false), 2000)
  }

  return (
    <div className={styles.tablonPage}>
      {/* Formulario */}
      <div className={styles.tablonForm}>
        <h3 className={styles.tablonFormTitle}><Megaphone size={15} /> Publicar nuevo aviso</h3>

        <div className={styles.tipoRow}>
          {TIPOS_AVISO.map(t => (
            <button key={t.id}
              className={[styles.tipoBtn, tipo === t.id ? styles.tipoBtnActive : ''].join(' ')}
              style={tipo === t.id ? { background: t.bg, color: t.color, borderColor: t.color + '40' } : {}}
              onClick={() => setTipo(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <input className={styles.tablonInput} placeholder="Título del aviso *"
          value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120} />

        <textarea className={styles.tablonTextarea} placeholder="Descripción (opcional)"
          value={cuerpo} onChange={e => setCuerpo(e.target.value)} rows={3} />

        <div className={styles.tablonFooter}>
          <div className={styles.expiraWrap}>
            <label className={styles.expiraLabel}>Expira el</label>
            <input type="date" className={styles.expiraInput}
              value={expira} onChange={e => setExpira(e.target.value)}
              min={new Date().toISOString().slice(0, 10)} />
            {expira && <button className={styles.expiraClear} onClick={() => setExpira('')}>×</button>}
          </div>
          <button className={styles.tablonPublicar} onClick={handlePublicar} disabled={!titulo.trim() || enviando}>
            {enviado ? <><Check size={14} /> Publicado</> : enviando ? <RefreshCw size={14} className={styles.spinner} /> : <><Megaphone size={14} /> Publicar</>}
          </button>
        </div>
      </div>

      {/* Lista de avisos */}
      <div className={styles.tablonLista}>
        <h3 className={styles.tablonListaTitle}>
          Avisos activos <span className={styles.tablonCount}>{announcements.length}</span>
        </h3>
        {announcements.length === 0 ? (
          <div className={styles.tablonVacio}>
            <Megaphone size={28} strokeWidth={1.4} />
            <p>No hay avisos publicados</p>
            <span>Los avisos aparecerán en el Home de tus alumnos</span>
          </div>
        ) : (
          <div className={styles.tablonItems}>
            {announcements.map(a => {
              const meta = TIPOS_AVISO.find(t => t.id === a.tipo) ?? TIPOS_AVISO[0]!
              return (
                <div key={a.id} className={styles.tablonItem}>
                  <div className={styles.tablonItemLeft}>
                    <span className={styles.tablonItemTipo} style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                    <p className={styles.tablonItemTitle}>{a.title}</p>
                    {a.body && <p className={styles.tablonItemBody}>{a.body}</p>}
                    <div className={styles.tablonItemMeta}>
                      <span>Publicado {a.created_at ? new Date(a.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                      {a.expires_at && <span>· Expira {new Date(a.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                  <button className={styles.tablonItemDelete} onClick={() => onDelete(a.id)} title="Eliminar aviso">
                    <Trash2 size={14} />
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
