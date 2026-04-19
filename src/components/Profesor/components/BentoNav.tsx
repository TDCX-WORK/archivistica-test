import {
  Users, TrendingUp, TrendingDown, Bell, CalendarDays,
  Megaphone, Key, BookOpen as BookIcon
} from 'lucide-react'
import { Ripple }              from '../../magicui/Ripple'
import { AnimatedGridPattern } from '../../magicui/AnimatedGridPattern'
import type { AlumnoConStats, Announcement, StatsClase } from '../../../types'
import styles from './BentoNav.module.css'

interface BentoNavProps {
  tab:            string
  setTab:         (t: string) => void
  statsClase:     StatsClase | null
  nAcciones:      number
  announcements:  Announcement[]
  preguntas:      number
  supuestos:      number
  alumnos:        AlumnoConStats[]
}

export default function BentoNav({ tab, setTab, statsClase, nAcciones, announcements, preguntas, supuestos }: BentoNavProps) {
  const bancoDesc      = preguntas > 0 ? `${preguntas} preguntas` : 'Ver temario completo'
  const bancoDescExtra = supuestos > 0 ? `${supuestos} supuesto${supuestos !== 1 ? 's' : ''} práctico${supuestos !== 1 ? 's' : ''}` : null

  const cards = [
    { id:'clase',    label:'Mi clase',          desc: statsClase?`${statsClase.totalAlumnos} alumnos · ${statsClase.alumnosActivos} activos`:'Ver alumnos', descExtra: null as string|null, icon:Users,        color:'#2563EB', big:true,  badge:null as number|null },
    { id:'inbox',    label:'Acciones',           desc: nAcciones>0?`${nAcciones} pendiente${nAcciones!==1?'s':''}`:'Todo al día', descExtra: null, icon:Bell, color:nAcciones>0?'#DC2626':'#059669', badge:nAcciones>0?nAcciones:null },
    { id:'evolucion',label:'Evolución',          desc: statsClase?`Nota media ${statsClase.notaMediaClase??0}%`:'Ver progreso', descExtra: null, icon:TrendingUp,  color:'#7C3AED' },
    { id:'fallos',   label:'Fallos clase',       desc:'Preguntas con más errores', descExtra: null, icon:TrendingDown, color:'#DC2626' },
    { id:'plan',     label:'Plan semanal',       desc:'Organiza el temario', descExtra: null, icon:CalendarDays, color:'#D97706' },
    { id:'tablon',   label:'Tablón',             desc: announcements.length>0?`${announcements.length} aviso${announcements.length!==1?'s':''} activo${announcements.length!==1?'s':''}`:'Sin avisos activos', descExtra: null, icon:Megaphone, color:'#059669', badge:announcements.length>0?announcements.length:null },
    { id:'codigos',  label:'Códigos',            desc:'Invitaciones de acceso', descExtra: null, icon:Key, color:'#0891B2' },
    { id:'banco',    label:'Banco de preguntas', desc: bancoDesc, descExtra: bancoDescExtra, icon:BookIcon, color:'#6366F1', big:true },
    { id:'examenes', label:'Fecha de examen',    desc:'Ver fechas por alumno', descExtra: null, icon:CalendarDays, color:'#0891B2', big:true,  badge:null as number|null },
  ]

  return (
    <div className={styles.bentoGrid}>
      {cards.map(card => {
        const Icon = card.icon, active = tab===card.id
        return (
          <button key={card.id} className={[styles.bentoCard, card.big?styles.bentoBig:'', active?styles.bentoActive:''].join(' ')} style={{ ['--bento-color' as string]: card.color }} onClick={() => setTab(card.id)}>
            {card.big && <AnimatedGridPattern numSquares={18} maxOpacity={active?0.12:0.06} duration={4} color={card.color} lineColor={card.color+'20'} />}
            <Ripple mainCircleSize={card.big?60:40} mainCircleOpacity={active?0.25:0.12} numCircles={card.big?5:3} color={card.color} duration={card.big?3:3.5} />
            <div className={styles.bentoContent}>
              <div className={styles.bentoIconWrap} style={{ background:card.color+'18', color:card.color }}><Icon size={card.big?20:16} strokeWidth={1.8} /></div>
              <div className={styles.bentoText}>
                <span className={styles.bentoLabel}>{card.label}</span>
                <span className={styles.bentoDesc}>{card.desc}</span>
                {card.descExtra && <span className={styles.bentoDescExtra}>{card.descExtra}</span>}
              </div>
              {card.badge!=null && card.badge>0 && <span className={styles.bentoBadge} style={{ background:card.color }}>{card.badge}</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}
