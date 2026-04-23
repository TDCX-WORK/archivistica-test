import { useState, useMemo } from 'react'
import { Users, Search, Phone, Mail, Edit3, Download } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { emit } from '../../../lib/eventBus'
import { fmt, diasHastaExpiracion, accesoExpirado, proximoAExpirar } from '../../../lib/helpers'
import type { AlumnoConExtended } from '../../../types'
import { EditAlumnoModal, type AlumnoForm } from './EditAlumnoModal'
import styles from '../GestionAcademia/GestionAcademia.module.css'

interface Subject { id: string; name: string; color: string; slug: string }

export function SeccionAlumnos({
  studentProfiles,
  subjects,
  updateStudentProfile,
  academyName,
}: {
  studentProfiles:      AlumnoConExtended[]
  subjects:             Subject[]
  updateStudentProfile: (id: string, fields: Record<string, any>) => Promise<boolean>
  academyName:          string | null | undefined
}) {
  const [busqueda,   setBusqueda]   = useState('')
  const [filtro,     setFiltro]     = useState<'todos' | 'ok' | 'pronto' | 'expirado'>('todos')
  const [editAlumno, setEditAlumno] = useState<AlumnoConExtended | null>(null)

  const subMap: Record<string, Subject> = {}
  for (const s of subjects) subMap[s.id] = s

  const filtrados = useMemo(() => studentProfiles.filter(a => {
    // Búsqueda
    const q = busqueda.toLowerCase().trim()
    if (q) {
      const nombre = String(a.extended?.full_name ?? '').toLowerCase()
      const city   = String(a.extended?.city      ?? '').toLowerCase()
      if (!a.username.toLowerCase().includes(q) && !nombre.includes(q) && !city.includes(q)) return false
    }
    // Filtro por estado
    if (filtro === 'todos') return true
    const exp      = accesoExpirado(a.access_until)
    const pronto   = proximoAExpirar(a.access_until, 14)
    if (filtro === 'expirado') return exp
    if (filtro === 'pronto')   return pronto
    if (filtro === 'ok')       return !exp && !pronto
    return true
  }), [studentProfiles, busqueda, filtro])

  // Contadores para las pills de filtro
  const counts = useMemo(() => {
    let ok = 0, pronto = 0, expirado = 0
    for (const a of studentProfiles) {
      if (accesoExpirado(a.access_until)) expirado++
      else if (proximoAExpirar(a.access_until, 14)) pronto++
      else ok++
    }
    return { todos: studentProfiles.length, ok, pronto, expirado }
  }, [studentProfiles])

  const handleSave = async (userId: string, form: AlumnoForm) => {
    const { error: upsertErr } = await supabase.from('student_profiles').upsert({
      id:             userId,
      full_name:      form.full_name     || null,
      phone:          form.phone         || null,
      email_contact:  form.email_contact || null,
      city:           form.city          || null,
      exam_date:      form.exam_date     || null,
      monthly_price:  form.monthly_price ? parseFloat(form.monthly_price) : null,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'id' })

    if (upsertErr) {
      console.error('Error guardando perfil:', upsertErr.message)
      alert('Error al guardar: ' + upsertErr.message)
      return
    }

    if (form.access_until) {
      await supabase.from('profiles')
        .update({ access_until: new Date(form.access_until + 'T23:59:59').toISOString() })
        .eq('id', userId)
    }
    updateStudentProfile(userId, {
      full_name:     form.full_name     || null,
      phone:         form.phone         || null,
      email_contact: form.email_contact || null,
      city:          form.city          || null,
      exam_date:     form.exam_date     || null,
      monthly_price: form.monthly_price ? parseFloat(form.monthly_price) : null,
    })
    emit('director-data-changed')
  }

  // ── Export CSV (espejo del import) ─────────────────────────────────────────
  const exportarCSV = () => {
    const rows: string[][] = [
      ['username', 'nombre_completo', 'email', 'telefono', 'ciudad', 'asignatura', 'precio_mensual', 'fecha_examen', 'acceso_hasta', 'alta'],
      ...studentProfiles.map(a => {
        const ext = a.extended
        const sub = a.subject_id ? subMap[a.subject_id] : null
        return [
          a.username,
          ext?.full_name     ?? '',
          ext?.email_contact ?? '',
          ext?.phone         ?? '',
          ext?.city          ?? '',
          sub?.name ?? '',
          ext?.monthly_price != null ? String(ext.monthly_price) : '',
          ext?.exam_date ?? '',
          a.access_until ? a.access_until.slice(0, 10) : '',
          a.created_at ? a.created_at.slice(0, 10) : '',
        ]
      })
    ]
    // RFC 4180 escape
    const csv = rows
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM para Excel ES
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const slug = (academyName ?? 'academia').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `alumnos-${slug}-${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <div className={styles.seccion}>
      <div className={styles.seccionHead}>
        <div className={styles.seccionHeadLeft}>
          <h2 className={styles.seccionTitle}>Alumnos</h2>
          <span className={styles.seccionCount}>{studentProfiles.length}</span>
        </div>
        <div className={styles.seccionHeadRight}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar alumno…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <button
            className={styles.btnSecondary}
            onClick={exportarCSV}
            disabled={studentProfiles.length === 0}
            title="Exportar alumnos a CSV"
          >
            <Download size={13} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className={styles.pillBar}>
        {([
          { id: 'todos',    label: 'Todos',       count: counts.todos },
          { id: 'ok',       label: 'Activos',     count: counts.ok },
          { id: 'pronto',   label: 'Expiran pronto', count: counts.pronto },
          { id: 'expirado', label: 'Expirados',   count: counts.expirado },
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

      {filtrados.length === 0 ? (
        <div className={styles.emptyBlock}>
          <Users size={28} strokeWidth={1.3} />
          <p>{busqueda ? 'No se encontraron alumnos con esa búsqueda' : 'No hay alumnos que coincidan con el filtro'}</p>
        </div>
      ) : (
        <div className={styles.alumnosGrid}>
          {filtrados.map(a => {
            const ext      = a.extended
            const sub      = a.subject_id ? subMap[a.subject_id] : null
            const exp      = accesoExpirado(a.access_until)
            const pronto   = !exp && proximoAExpirar(a.access_until, 14)
            const nombre   = (ext?.full_name ?? '') || a.username
            const dias     = diasHastaExpiracion(a.access_until)
            const estado   = exp ? 'expirado' : pronto ? 'pronto' : 'ok'

            return (
              <div
                key={a.id}
                className={[
                  styles.alumnoCard,
                  exp ? styles.alumnoCardExpirado : pronto ? styles.alumnoCardPronto : styles.alumnoCardOk
                ].join(' ')}
              >
                <div className={styles.alumnoCardHead}>
                  <div className={styles.alumnoCardAvatar}>{nombre[0]!.toUpperCase()}</div>
                  <div className={styles.alumnoCardIdent}>
                    <span className={styles.alumnoCardNombre}>{nombre}</span>
                    <span className={styles.alumnoCardUser}>@{a.username}</span>
                  </div>
                  <button
                    className={styles.alumnoCardEdit}
                    onClick={() => setEditAlumno(a)}
                    title="Editar alumno"
                    aria-label="Editar alumno"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>

                <div className={styles.alumnoCardGrid}>
                  {sub && (
                    <div className={styles.alumnoCardRow}>
                      <span className={styles.alumnoCardLabel}>Asignatura</span>
                      <div className={styles.alumnoCardVal}>
                        <span className={styles.subDot} style={{ background: sub.color }} />
                        <span>{sub.name}</span>
                      </div>
                    </div>
                  )}
                  <div className={styles.alumnoCardRow}>
                    <span className={styles.alumnoCardLabel}>Precio</span>
                    <span className={styles.alumnoCardVal}>
                      {ext?.monthly_price != null
                        ? <>{ext.monthly_price}<span className={styles.alumnoCardValUnit}>€/mes</span></>
                        : <span className={styles.muted}>—</span>}
                    </span>
                  </div>
                  <div className={styles.alumnoCardRow}>
                    <span className={styles.alumnoCardLabel}>Contacto</span>
                    <div className={styles.alumnoCardContacto}>
                      {ext?.phone         && <span><Phone size={11} />{ext.phone}</span>}
                      {ext?.email_contact && <span><Mail  size={11} />{ext.email_contact}</span>}
                      {!ext?.phone && !ext?.email_contact && <span className={styles.muted}>Sin datos</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.alumnoCardFoot}>
                  <span className={styles.alumnoCardFootLabel}>Acceso</span>
                  <span className={[styles.estadoChip, styles[`estado_${estado}`]].join(' ')}>
                    {exp
                      ? 'Expirado'
                      : pronto
                        ? `${dias}d restantes`
                        : dias !== null ? fmt(a.access_until) : 'Sin fecha'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editAlumno && (
        <EditAlumnoModal
          alumno={editAlumno}
          onSave={handleSave}
          onClose={() => setEditAlumno(null)}
        />
      )}
    </div>
  )
}
