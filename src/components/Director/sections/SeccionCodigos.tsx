import { useState, useEffect, useCallback } from 'react'
import { Key, Plus, RefreshCw, Copy, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { generateInviteCode } from '../../../lib/inviteCodes'
import { fmt } from '../../../lib/helpers'
import styles from '../GestionAcademia/GestionAcademia.module.css'

interface Subject { id: string; name: string; color: string; slug: string }

interface CodigoInvitacion {
  id:            string
  code:          string
  subject_id:    string | null
  access_months: number
  used_by:       string | null
  used_at:       string | null
  expires_at:    string
  created_at:    string | null
  created_by:    string | null
}

interface UserMini {
  id:        string
  username:  string
  full_name: string | null
}

export function SeccionCodigos({
  academyId,
  academyName,
  subjects,
}: {
  academyId:   string | null | undefined
  academyName: string | null | undefined
  subjects:    Subject[]
}) {
  const [codigos,   setCodigos]   = useState<CodigoInvitacion[]>([])
  const [userMap,   setUserMap]   = useState<Record<string, UserMini>>({})
  const [loading,   setLoading]   = useState(true)
  const [creando,   setCreando]   = useState(false)
  const [form,      setForm]      = useState({ subject_id: '', meses: '12' })
  const [copied,    setCopied]    = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [filtro,    setFiltro]    = useState<'activos' | 'usados' | 'caducados' | 'todos'>('activos')

  const load = useCallback(async () => {
    if (!academyId) return
    setLoading(true)
    const { data } = await supabase
      .from('invite_codes')
      .select('id, code, subject_id, access_months, used_by, used_at, expires_at, created_at, created_by')
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })

    const codigosData = (data ?? []) as CodigoInvitacion[]
    setCodigos(codigosData)

    // Resolver nombres de creadores / consumidores
    const ids = new Set<string>()
    for (const c of codigosData) {
      if (c.created_by) ids.add(c.created_by)
      if (c.used_by)    ids.add(c.used_by)
    }
    if (ids.size > 0) {
      const idList = Array.from(ids)
      const [{ data: profs }, { data: sps }, { data: sfps }] = await Promise.all([
        supabase.from('profiles').select('id, username').in('id', idList),
        supabase.from('student_profiles').select('id, full_name').in('id', idList),
        supabase.from('staff_profiles').select('id, full_name').in('id', idList),
      ])
      const fullNameMap: Record<string, string | null> = {}
      for (const sp  of (sps  ?? []) as { id: string; full_name: string | null }[]) fullNameMap[sp.id]  = sp.full_name
      for (const sfp of (sfps ?? []) as { id: string; full_name: string | null }[]) fullNameMap[sfp.id] = sfp.full_name
      const map: Record<string, UserMini> = {}
      for (const p of (profs ?? []) as { id: string; username: string }[]) {
        map[p.id] = { id: p.id, username: p.username, full_name: fullNameMap[p.id] ?? null }
      }
      setUserMap(map)
    } else {
      setUserMap({})
    }

    setLoading(false)
  }, [academyId])

  useEffect(() => { load() }, [load])

  const generarCodigo = async () => {
    if (!form.subject_id || !academyId) return
    setGenerando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setGenerando(false); return }
    const code    = generateInviteCode(academyName)
    const expires = new Date(); expires.setDate(expires.getDate() + 30)
    const { error } = await supabase.from('invite_codes').insert({
      academy_id:    academyId,
      subject_id:    form.subject_id,
      created_by:    user.id,
      code,
      access_months: parseInt(form.meses),
      expires_at:    expires.toISOString(),
    })
    if (!error) {
      await load()
      setCreando(false)
      setForm({ subject_id: '', meses: '12' })
    } else {
      alert('Error generando código: ' + error.message)
    }
    setGenerando(false)
  }

  const copiar = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const subMap: Record<string, Subject> = {}
  for (const s of subjects) subMap[s.id] = s

  const activos   = codigos.filter(c => !c.used_by && new Date(c.expires_at) > new Date())
  const usados    = codigos.filter(c => !!c.used_by)
  const caducados = codigos.filter(c => !c.used_by && new Date(c.expires_at) <= new Date())

  const listaFiltrada =
    filtro === 'activos'   ? activos   :
    filtro === 'usados'    ? usados    :
    filtro === 'caducados' ? caducados :
    codigos

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <div className={styles.seccionHeadLeft}>
          <h2 className={styles.seccionTitle}>Códigos de invitación</h2>
          <span className={styles.seccionCount}>{codigos.length}</span>
        </div>
        <div className={styles.seccionHeadRight}>
          <button className={styles.btnPrimary} onClick={() => setCreando(v => !v)}>
            <Plus size={13} /> Nuevo código
          </button>
        </div>
      </div>

      {creando && (
        <div className={styles.crearCodigo}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Asignatura</label>
            <select
              className={styles.formSelect}
              value={form.subject_id}
              onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
            >
              <option value="">Selecciona asignatura…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Duración del acceso</label>
            <select
              className={styles.formSelect}
              value={form.meses}
              onChange={e => setForm(p => ({ ...p, meses: e.target.value }))}
            >
              <option value="1">1 mes</option>
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="12">1 año</option>
              <option value="24">2 años</option>
            </select>
          </div>
          <div className={styles.crearBtns}>
            <button className={styles.btnCancelar} onClick={() => setCreando(false)}>Cancelar</button>
            <button
              className={styles.btnGuardar}
              onClick={generarCodigo}
              disabled={!form.subject_id || generando}
            >
              <Key size={13} /> {generando ? 'Generando…' : 'Generar código'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.pillBar}>
        {([
          { id: 'activos',   label: 'Activos',   count: activos.length },
          { id: 'usados',    label: 'Usados',    count: usados.length },
          { id: 'caducados', label: 'Caducados', count: caducados.length },
          { id: 'todos',     label: 'Todos',     count: codigos.length },
        ] as const).map(p => (
          <button
            key={p.id}
            className={[styles.pill, filtro === p.id ? styles.pillActive : ''].join(' ')}
            onClick={() => setFiltro(p.id)}
          >
            {p.label}
            <span className={styles.pillCount}>{p.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingMini}><RefreshCw size={16} className={styles.spinner} /></div>
      ) : listaFiltrada.length === 0 ? (
        <div className={styles.emptyBlock}>
          <Key size={28} strokeWidth={1.3} />
          <p>{filtro === 'activos' ? 'No hay códigos activos' : filtro === 'usados' ? 'Todavía no se ha usado ningún código' : 'Sin códigos'}</p>
        </div>
      ) : (
        <div className={styles.codigosList}>
          {listaFiltrada.map(c => {
            const sub        = c.subject_id ? subMap[c.subject_id] : null
            const isUsado    = !!c.used_by
            const isExpired  = !isUsado && new Date(c.expires_at) <= new Date()
            const estado     = isUsado ? 'usado' : isExpired ? 'caducado' : 'activo'
            const creador    = c.created_by ? userMap[c.created_by] : null
            const consumidor = c.used_by    ? userMap[c.used_by]    : null

            return (
              <div key={c.id} className={[styles.codigoItem, isExpired && !isUsado ? styles.codigo_caducado : ''].join(' ')}>
                <div className={styles.codigoMain}>
                  <span className={styles.codigoCodigo}>{c.code}</span>
                  {!isUsado && !isExpired && (
                    <button className={styles.codigoCopy} onClick={() => copiar(c.code)} aria-label="Copiar código">
                      {copied === c.code ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  )}
                </div>

                <div className={styles.codigoInfo}>
                  {sub && (
                    <span className={styles.codigoSubj}>
                      <span className={styles.subDot} style={{ background: sub.color }} />
                      {sub.name}
                    </span>
                  )}
                  <span className={styles.codigoMeta}>
                    {c.access_months} mes{c.access_months !== 1 ? 'es' : ''} de acceso
                  </span>
                  {creador && (
                    <span className={styles.codigoMeta}>
                      Creado por {creador.full_name ?? `@${creador.username}`}
                    </span>
                  )}
                  {isUsado && (
                    <span className={styles.codigoUsadoBy}>
                      {consumidor
                        ? <>Usado por {consumidor.full_name ?? `@${consumidor.username}`}</>
                        : 'Usado por cuenta eliminada'}
                    </span>
                  )}
                </div>

                <div className={styles.codigoTail}>
                  <span className={[styles.estadoChip, styles[`estado_${estado}`]].join(' ')}>
                    {isUsado ? 'Usado' : isExpired ? 'Caducado' : 'Activo'}
                  </span>
                  <span className={styles.codigoFecha}>
                    {isUsado
                      ? `${fmt(c.used_at ?? c.created_at)}`
                      : `Expira ${fmt(c.expires_at)}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
