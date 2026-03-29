import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Flame, TrendingUp, Plus, X, Check, CalendarDays } from 'lucide-react'
import s from './StudyHeatmap.module.css'

/* ─── utils ─────────────────────────────────────────────────────────────── */
const pad    = n  => String(n).padStart(2, '0')
const toDS   = d  => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const getNow = () => { const d = new Date(); d.setHours(12,0,0,0); return d }
const fmtFull= ds => new Date(ds+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})
const getDIM = (y,m) => new Date(y,m+1,0).getDate()
const getFDOW= (y,m) => { const d=new Date(y,m,1).getDay(); return d===0?6:d-1 }
const lvl    = n  => !n?0:n===1?1:n===2?2:n<=4?3:4

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS   = ['L','M','X','J','V','S','D']

/* ─────────────────────────────────────────────────────────────────────────── */
export default function StudyHeatmap({
  sessions=[], planDates=new Set(),
  dueForReview=[], streakDays=0, avgScore=0
}) {
  const now      = getNow()
  const todayStr = toDS(now)

  const [yr,  setYr]  = useState(now.getFullYear())
  const [mo,  setMo]  = useState(now.getMonth())
  const [sel, setSel] = useState(null)
  const [notes,setNotes] = useState({})
  const [draft,setDraft] = useState('')
  const [edit, setEdit]  = useState(false)

  /* index sessions */
  const byDate = useMemo(() => {
    const m = {}
    sessions.forEach(s => {
      const d = s.played_at?.slice(0,10)||s.created_at?.slice(0,10)
      if (!d) return
      if (!m[d]) m[d]={count:0,q:0,correct:0,scores:[]}
      m[d].count++; m[d].q+=(s.total||0); m[d].correct+=(s.correct||0)
      if (s.score!=null) m[d].scores.push(s.score)
    })
    Object.values(m).forEach(v=>{v.avg=v.scores.length?Math.round(v.scores.reduce((a,b)=>a+b,0)/v.scores.length):null})
    return m
  },[sessions])

  /* month aggregate */
  const ms = useMemo(()=>{
    const pre=`${yr}-${pad(mo+1)}`
    const days=Object.entries(byDate).filter(([d])=>d.startsWith(pre)&&byDate[d].count>0)
    const sc=days.flatMap(([,v])=>v.scores)
    return {
      days: days.length,
      ses:  days.reduce((s,[,v])=>s+v.count,0),
      avg:  sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):null,
    }
  },[byDate,yr,mo])

  /* grid cells */
  const cells = useMemo(()=>{
    const fdow=getFDOW(yr,mo), dim=getDIM(yr,mo)
    const pDim=getDIM(yr,mo===0?11:mo-1)
    const g=[]
    for(let i=fdow-1;i>=0;i--){
      const d=pDim-i,pm=mo===0?11:mo-1,py=mo===0?yr-1:yr
      g.push({ds:`${py}-${pad(pm+1)}-${pad(d)}`,day:d,other:true})
    }
    for(let d=1;d<=dim;d++){
      const ds=`${yr}-${pad(mo+1)}-${pad(d)}`
      g.push({ds,day:d,other:false,isToday:ds===todayStr,future:ds>todayStr})
    }
    const rem=7-(g.length%7)
    if(rem<7) for(let d=1;d<=rem;d++){
      const nm=mo===11?0:mo+1,ny=mo===11?yr+1:yr
      g.push({ds:`${ny}-${pad(nm+1)}-${pad(d)}`,day:d,other:true,future:true})
    }
    return g
  },[yr,mo,todayStr])

  const prev = () => { mo===0?(setYr(y=>y-1),setMo(11)):setMo(m=>m-1); setSel(null) }
  const next = () => { mo===11?(setYr(y=>y+1),setMo(0)):setMo(m=>m+1); setSel(null) }
  const isCur= yr===now.getFullYear()&&mo===now.getMonth()

  const sd = sel ? byDate[sel] : null
  const saveNote = () => { setNotes(n=>({...n,[sel]:draft.trim()})); setEdit(false) }

  return (
    <div className={s.root}>

      {/* ── LEFT: calendar ── */}
      <div className={s.calSide}>

        {/* month header */}
        <div className={s.mhdr}>
          <div className={s.mhdrLeft}>
            <span className={s.mName}>{MONTHS[mo]}</span>
            <span className={s.mYear}>{yr}</span>
          </div>
          <div className={s.mhdrRight}>
            {!isCur&&<button className={s.todayBtn} onClick={()=>{setYr(now.getFullYear());setMo(now.getMonth());setSel(null)}}>Hoy</button>}
            <button className={s.arrowBtn} onClick={prev}><ChevronLeft size={13}/></button>
            <button className={s.arrowBtn} onClick={next}><ChevronRight size={13}/></button>
          </div>
        </div>

        {/* day names */}
        <div className={s.dnames}>
          {DAYS.map(d=><div key={d} className={s.dname}>{d}</div>)}
        </div>

        {/* cells */}
        <div className={s.grid}>
          {cells.map((cell,i)=>{
            const data  = byDate[cell.ds]
            const lv    = (cell.other||cell.future) ? 0 : lvl(data?.count||0)
            const isSel = sel===cell.ds
            const hasPlan = planDates.has(cell.ds)&&!cell.other
            const hasNote = !!notes[cell.ds]&&!cell.other

            return (
              <button
                key={i}
                className={[
                  s.cell,
                  cell.other   ? s.cOther   : '',
                  cell.future  ? s.cFuture  : '',
                  cell.isToday ? s.cToday   : '',
                  isSel&&!cell.isToday ? s.cSel : '',
                  !cell.other&&!cell.future ? s['lv'+lv] : '',
                ].filter(Boolean).join(' ')}
                onClick={()=>{ if(cell.other)return; setSel(s=>s===cell.ds?null:cell.ds); setEdit(false); setDraft(notes[cell.ds]||'') }}
                disabled={cell.other}
              >
                <span className={s.cNum}>{cell.day}</span>
                {hasPlan && <div className={s.planDot}/>}
                {hasNote  && <div className={s.noteDot}/>}
              </button>
            )
          })}
        </div>

        {/* legend */}
        <div className={s.leg}>
          <span className={s.legLbl}>Sin actividad</span>
          <div className={[s.legCell,s.lv0].join(' ')}/>
          <div className={[s.legCell,s.lv1].join(' ')}/>
          <div className={[s.legCell,s.lv2].join(' ')}/>
          <div className={[s.legCell,s.lv3].join(' ')}/>
          <div className={[s.legCell,s.lv4].join(' ')}/>
          <span className={s.legLbl}>Máximo</span>
        </div>
      </div>

      {/* ── RIGHT: stats + detail ── */}
      <div className={s.infoSide}>

        {/* streak + score */}
        <div className={s.pillRow}>
          {streakDays>0&&(
            <div className={s.pill} style={{background:'#FEF9E7',color:'#7D5A00',borderColor:'#F5D06E'}}>
              <Flame size={12}/> {streakDays} días de racha
            </div>
          )}
          <div className={s.pill} style={{
            background:avgScore>=70?'#F0FDF4':avgScore>=50?'#FFFBEB':'#FEF2F2',
            color:avgScore>=70?'#166534':avgScore>=50?'#78350F':'#991B1B',
            borderColor:avgScore>=70?'#86EFAC':avgScore>=50?'#FDE68A':'#FECACA',
          }}>
            <TrendingUp size={12}/> {avgScore}% media
          </div>
        </div>

        {/* month stats */}
        <div className={s.mStats}>
          <div className={s.mStat}>
            <span className={s.mStatV}>{ms.days}</span>
            <span className={s.mStatL}>días activos</span>
          </div>
          <div className={s.mStatSep}/>
          <div className={s.mStat}>
            <span className={s.mStatV}>{ms.ses}</span>
            <span className={s.mStatL}>sesiones</span>
          </div>
          <div className={s.mStatSep}/>
          <div className={s.mStat}>
            <span className={s.mStatV}>{ms.avg!==null?`${ms.avg}%`:'—'}</span>
            <span className={s.mStatL}>nota media</span>
          </div>
        </div>

        {/* due for review alert */}
        {dueForReview.length>0&&(
          <div className={s.reviewAlert}>
            <div className={s.reviewDot}/>
            <div>
              <div className={s.reviewTitle}>{dueForReview.length} pendiente{dueForReview.length!==1?'s':''} hoy</div>
              <div className={s.reviewSub}>Preguntas de repaso listas</div>
            </div>
          </div>
        )}

        {/* day detail */}
        {sel ? (
          <div className={s.detail}>
            <div className={s.detailHead}>
              <div className={s.detailDate}>{fmtFull(sel)}</div>
              <button className={s.detailX} onClick={()=>{setSel(null);setEdit(false)}}><X size={12}/></button>
            </div>

            {planDates.has(sel)&&(
              <div className={s.planTag}><CalendarDays size={10}/> Plan del profesor</div>
            )}

            {sd?.count>0?(
              <div className={s.detailStats}>
                {[
                  {v:sd.count,l:'Sesiones',c:'#059669'},
                  {v:sd.q,l:'Preguntas',c:'#7C3AED'},
                  {v:sd.avg!==null?`${sd.avg}%`:'—',l:'Nota',c:sd.avg>=70?'#059669':sd.avg>=50?'#D97706':'#DC2626'},
                ].map((p,i)=>(
                  <div key={i} className={s.dStat}>
                    <span className={s.dStatV} style={{color:p.c}}>{p.v}</span>
                    <span className={s.dStatL}>{p.l}</span>
                  </div>
                ))}
              </div>
            ):(
              <p className={s.detailEmpty}>Sin actividad registrada</p>
            )}

            {/* note */}
            <div className={s.noteArea}>
              {edit?(
                <>
                  <textarea className={s.noteTA} value={draft} onChange={e=>setDraft(e.target.value)}
                    placeholder="Nota para este día..." rows={2} autoFocus/>
                  <div className={s.noteBtns}>
                    <button className={s.noteCancel} onClick={()=>setEdit(false)}>Cancelar</button>
                    <button className={s.noteSave} onClick={saveNote}><Check size={11}/> Guardar</button>
                  </div>
                </>
              ):notes[sel]?(
                <div className={s.noteShow} onClick={()=>{setEdit(true);setDraft(notes[sel])}}>
                  <span>{notes[sel]}</span>
                  <span className={s.noteHint}>Editar</span>
                </div>
              ):(
                <button className={s.noteAdd} onClick={()=>{setEdit(true);setDraft('')}}>
                  <Plus size={11}/> Añadir nota
                </button>
              )}
            </div>
          </div>
        ):(
          <div className={s.detailEmpty2}>
            <CalendarDays size={18} strokeWidth={1.5}/>
            <span>Pulsa un día para ver el detalle</span>
          </div>
        )}
      </div>
    </div>
  )
}
