import { useState } from 'react'
import {
  AlertTriangle, ShieldOff, Clock, UserX, Key, Check, Trash2,
  MessageSquare, ExternalLink, Bell,
  RotateCcw, CheckCircle2
} from 'lucide-react'
import type { AlumnoConStats, InviteCode } from '../../../types'
import type { DirectMessage } from '../../../hooks/useDirectMessages'
import styles from './InboxPanel.module.css'

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function formatDias(n: number | null): string {
  if (n === null) return 'Nunca'
  if (n === 0)    return 'Hoy'
  if (n === 1)    return 'Ayer'
  return `${n}d inactivo`
}

/* ── Wallet Card ─────────────────────────────────────────────────────────── */
function WalletSection({ title, icon: Icon, count, color, colorBg, tabLabel, active, onClick }: {
  title: string; icon: React.ElementType; count: number; color: string; colorBg: string
  tabLabel: string; active: boolean; onClick: () => void
}) {
  return (
    <button className={[styles.wallet, active ? styles.walletActive : ''].join(' ')}
      style={{ ['--wc' as string]: color, ['--wcb' as string]: colorBg }}
      onClick={onClick}>
      {/* Fondo */}
      <div className={styles.walletBg} />

      {/* Tab que asoma */}
      <div className={styles.walletTab}>
        <span className={styles.walletTabDot} />
        <span className={styles.walletTabLabel}>{tabLabel}</span>
        {count > 0 && <span className={styles.walletTabBadge}>{count}</span>}
      </div>

      {/* Bolsillo */}
      <div className={styles.walletPocket}>
        <div className={styles.walletContent}>
          <div className={styles.walletIconWrap}>
            <Icon size={18} strokeWidth={2} />
          </div>
          <span className={styles.walletTitle}>{title}</span>
          <span className={styles.walletCount}>
            {count > 0 ? `${count} pendiente${count !== 1 ? 's' : ''}` : 'Todo al día'}
          </span>
        </div>
      </div>
    </button>
  )
}

/* ── Fila de alumno en riesgo ─────────────────────────────────────────────── */
function AlertaRow({ alumno, onRenovar, onVerAlumno, onEnviarMensaje }: {
  alumno: AlumnoConStats
  onRenovar: (a: AlumnoConStats) => void
  onVerAlumno: (a: AlumnoConStats) => void
  onEnviarMensaje: (a: AlumnoConStats) => void
}) {
  const isExpirado = alumno.accesoExpirado
  const isExpirando = alumno.proximoAExpirar && !alumno.accesoExpirado

  const chipLabel = isExpirado ? 'Expirado'
    : isExpirando ? `Expira en ${alumno.diasParaExpirar}d`
    : formatDias(alumno.diasInactivo)

  const chipCls = isExpirado ? styles.chipDanger
    : isExpirando ? styles.chipWarning
    : styles.chipMuted

  const avatarColor = isExpirado ? '#DC2626' : isExpirando ? '#D97706' : '#7C3AED'
  const avatarBg = isExpirado ? '#FEF2F2' : isExpirando ? '#FFFBEB' : '#F5F3FF'

  return (
    <div className={styles.actionRow}>
      <div className={styles.actionAvatar} style={{ background: avatarBg, color: avatarColor }}>
        {isExpirado ? <ShieldOff size={14} /> : alumno.username[0]!.toUpperCase()}
      </div>
      <div className={styles.actionInfo}>
        <span className={styles.actionName}>{alumno.fullName || alumno.username}</span>
        <span className={[styles.actionChip, chipCls].join(' ')}>{chipLabel}</span>
      </div>
      <div className={styles.actionBtns}>
        {(isExpirado || isExpirando) && (
          <button className={styles.btnSmall} onClick={() => onRenovar(alumno)} title="Renovar"><RotateCcw size={12} /></button>
        )}
        <button className={styles.btnSmall} onClick={() => onEnviarMensaje(alumno)} title="Mensaje"><MessageSquare size={12} /></button>
        <button className={styles.btnSmall} onClick={() => onVerAlumno(alumno)} title="Ver detalle"><ExternalLink size={12} /></button>
      </div>
    </div>
  )
}

/* ── Fila de mensaje ─────────────────────────────────────────────────────── */
function MensajeRow({ mensaje, alumno, onLeido, onDelete }: {
  mensaje: DirectMessage; alumno: AlumnoConStats
  onLeido: (id: string) => void; onDelete: (id: string) => void
}) {
  return (
    <div className={styles.actionRow}>
      <div className={styles.actionAvatar} style={{ background: '#ECFDF5', color: '#059669' }}>
        {alumno.username[0]!.toUpperCase()}
      </div>
      <div className={styles.actionInfo}>
        <span className={styles.actionName}>{alumno.fullName || alumno.username}</span>
        <span className={styles.actionPreview}>
          {mensaje.reply_body ? mensaje.reply_body.slice(0, 50) + (mensaje.reply_body.length > 50 ? '…' : '') : ''}
        </span>
      </div>
      <div className={styles.actionBtns}>
        <button className={styles.btnLeido} onClick={() => onLeido(mensaje.id)} title="Marcar como leído"><Check size={12} /></button>
        <button className={styles.btnEliminar} onClick={() => onDelete(mensaje.id)} title="Eliminar"><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

/* ── InboxPanel principal ─────────────────────────────────────────────────── */
interface InboxPanelProps {
  alumnos:          AlumnoConStats[]
  inviteCodes:      InviteCode[]
  onVerAlumno:      (a: AlumnoConStats) => void
  onRenovar:        (a: AlumnoConStats) => void
  onEnviarMensaje:  (a: AlumnoConStats) => void
  mensajes:         DirectMessage[]
  onMensajeLeido:   (id: string) => void
  onDeleteMensaje:  (id: string) => void
}

export default function InboxPanel({ alumnos, inviteCodes, onVerAlumno, onRenovar, onEnviarMensaje, mensajes, onMensajeLeido, onDeleteMensaje }: InboxPanelProps) {
  const alumnosConAlerta = alumnos.filter(a => a.accesoExpirado || a.proximoAExpirar || a.enRiesgo)
  const mensajesConRespuesta = mensajes.filter(m => m.reply_body)
  const codigosCaducados = inviteCodes.filter(c => !c.used_by && new Date(c.expires_at) < new Date())

  const [activeSection, setActiveSection] = useState<string | null>(
    alumnosConAlerta.length > 0 ? 'riesgo' : mensajesConRespuesta.length > 0 ? 'mensajes' : null
  )

  return (
    <div className={styles.inbox}>
      {/* 3 Wallets lado a lado */}
      <div className={styles.walletRow}>
        <WalletSection
          title="Alumnos en riesgo" icon={AlertTriangle} count={alumnosConAlerta.length}
          color="#DC2626" colorBg="#FEF2F2" tabLabel="En riesgo"
          active={activeSection === 'riesgo'}
          onClick={() => setActiveSection(prev => prev === 'riesgo' ? null : 'riesgo')}
        />
        <WalletSection
          title="Mensajes" icon={MessageSquare} count={mensajesConRespuesta.length}
          color="#059669" colorBg="#ECFDF5" tabLabel="Con respuesta"
          active={activeSection === 'mensajes'}
          onClick={() => setActiveSection(prev => prev === 'mensajes' ? null : 'mensajes')}
        />
        <WalletSection
          title="Códigos caducados" icon={Key} count={codigosCaducados.length}
          color="#6B7280" colorBg="#F3F4F6" tabLabel="Caducados"
          active={activeSection === 'codigos'}
          onClick={() => setActiveSection(prev => prev === 'codigos' ? null : 'codigos')}
        />
      </div>

      {/* Panel expandido debajo de los wallets */}
      {activeSection === 'riesgo' && (
        <div className={styles.expandedPanel}>
          <div className={styles.expandedHeader} style={{ color: '#DC2626' }}>
            <AlertTriangle size={15} />
            <span>{alumnosConAlerta.length} alumno{alumnosConAlerta.length !== 1 ? 's' : ''} en riesgo</span>
          </div>
          {alumnosConAlerta.length === 0 ? (
            <div className={styles.expandedEmpty}>Ningún alumno en riesgo</div>
          ) : (
            <div className={styles.actionList}>
              {alumnosConAlerta.map(a => (
                <AlertaRow key={a.id} alumno={a} onRenovar={onRenovar} onVerAlumno={onVerAlumno} onEnviarMensaje={onEnviarMensaje} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'mensajes' && (
        <div className={styles.expandedPanel}>
          <div className={styles.expandedHeader} style={{ color: '#059669' }}>
            <MessageSquare size={15} />
            <span>{mensajesConRespuesta.length} mensaje{mensajesConRespuesta.length !== 1 ? 's' : ''} con respuesta</span>
          </div>
          {mensajesConRespuesta.length === 0 ? (
            <div className={styles.expandedEmpty}>Sin mensajes con respuesta</div>
          ) : (
            <div className={styles.actionList}>
              {mensajesConRespuesta.map(m => {
                const alumno = alumnos.find(a => a.id === m.to_id)
                if (!alumno) return null
                return <MensajeRow key={m.id} mensaje={m} alumno={alumno} onLeido={onMensajeLeido} onDelete={onDeleteMensaje} />
              })}
            </div>
          )}
        </div>
      )}

      {activeSection === 'codigos' && (
        <div className={styles.expandedPanel}>
          <div className={styles.expandedHeader} style={{ color: '#6B7280' }}>
            <Key size={15} />
            <span>{codigosCaducados.length} código{codigosCaducados.length !== 1 ? 's' : ''} caducado{codigosCaducados.length !== 1 ? 's' : ''}</span>
          </div>
          {codigosCaducados.length === 0 ? (
            <div className={styles.expandedEmpty}>Todos los códigos están activos o usados</div>
          ) : (
            <div className={styles.actionList}>
              {codigosCaducados.map(c => (
                <div key={c.id} className={styles.codigoRow}>
                  <span className={styles.codigoCode}>{c.code}</span>
                  <span className={styles.codigoMeta}>Expiró sin usar</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
