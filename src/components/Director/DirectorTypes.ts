// Shared types and helpers for Director panels
import type { CurrentUser } from '../../types'
export type { CurrentUser }

// ── Types ──────────────────────────────────────────────────────────────────
export interface SubjectStats {
  id:               string
  slug:             string
  name:             string
  color:            string
  totalAlumnos:     number
  alumnosActivos:   number
  notaMedia:        number | null
  sesiones30d:      number
  enRiesgo:         number
  porExpirar:       number
  alumnosConNota:   { id: string; username: string; nota: number | null; sesiones: number }[]
  alumnosEnRiesgo:  { id: string; username: string; diasInactivo: number | null }[]
  alumnosPorExpirar:{ id: string; username: string; diasRestantes: number }[]
  profesores:       { id: string; username: string; alumnos: number; notaMedia: number | null; sesionesThisWeek: number }[]
}

export interface Stats {
  totalAlumnos:    number
  totalActivos:    number
  totalProfesores: number
  totalEnRiesgo:   number
  totalPorExpirar: number
  notaGlobal:      number | null
  sesiones30d:     number
  bySubject:       SubjectStats[]
  semanas:         { label: string; sesiones: number; alumnosActivos: number; notaMedia: number | null }[]
  profesorActivity?: {
    lastAvisoByProfesor:  Record<string, { created_at: string; title: string }>
    totalAvisosByProfesor:Record<string, number>
  }
  finanzas?: {
    mrrAcademia:           number
    mrrActivos:            number
    alumnosSinPrecio:      number
    totalAlumnosConPrecio: number
    spMap:                 Record<string, { monthly_price: number | null; exam_date: string | null; full_name: string | null; city: string | null; payment_status: string }>
    pagos: {
      pagados:     number
      pendientes:  number
      vencidos:    number
      mrrCobrado:  number
      mrrPendiente:number
      mrrVencido:  number
    }
  }
}

export interface ProfileSimple {
  id:           string
  username:     string
  role:         string
  access_until: string | null
  created_at:   string
}

export interface StudentProfile {
  id:            string
  username:      string
  role:          string
  access_until:  string | null
  created_at:    string | null
  subject_name?: string | null
  extended:      Record<string, any> | null
}

export interface AlumnoEnriquecido {
  id:            string
  username:      string
  nota:          number | null
  sesiones:      number
  subjectName:   string
  subjectColor:  string
  enRiesgo:      boolean
  diasInactivo:  number | null
  diasRestantes: number | null
  extended:      Record<string, any> | null
  access_until:  string | null
  created_at:    string | null
}

export interface AlumnoDetalleForm {
  full_name:     string
  phone:         string
  email_contact: string
  city:          string
  exam_date:     string
  monthly_price: string
  access_until:  string
}



import imgZorro     from '../../assets/zorro.webp'
import imgConejo    from '../../assets/conejo.webp'
import imgDino      from '../../assets/dino.webp'
import imgPanda     from '../../assets/panda.webp'
import imgPandarojo from '../../assets/pandarojo.webp'
import imgPato      from '../../assets/pato.webp'
import imgPerro     from '../../assets/perro.webp'
import imgRana      from '../../assets/rana.webp'

const MASCOTAS: Record<string, { img: string; nombre: string }> = {
  zorro:     { img: imgZorro,     nombre: 'Zorro'      },
  conejo:    { img: imgConejo,    nombre: 'Conejo'     },
  dino:      { img: imgDino,      nombre: 'Dino'       },
  panda:     { img: imgPanda,     nombre: 'Panda'      },
  pandarojo: { img: imgPandarojo, nombre: 'Panda Rojo' },
  pato:      { img: imgPato,      nombre: 'Pato'       },
  perro:     { img: imgPerro,     nombre: 'Perro'      },
  rana:      { img: imgRana,      nombre: 'Rana'       },
}

export { MASCOTAS }
export { scoreColor, fmt } from '../../lib/helpers'