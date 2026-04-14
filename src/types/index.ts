// ─────────────────────────────────────────────────────────────────────────────
// FrostFox Academy — Tipos globales
// ─────────────────────────────────────────────────────────────────────────────

// ── Roles ────────────────────────────────────────────────────────────────────
export type Role = 'alumno' | 'profesor' | 'director' | 'superadmin'

// ── ModeId ───────────────────────────────────────────────────────────────────
export type ModeId =
  | 'beginner'
  | 'advanced'
  | 'exam'
  | 'quick_review'
  | 'review_due'
  | 'all_fails'
  | (string & {})

// ── Usuario autenticado ───────────────────────────────────────────────────────
export interface CurrentUser {
  id:                  string
  username:            string
  displayName:         string
  role:                Role
  academy_id:          string | null
  subject_id:          string | null
  access_until:        string | null
  academyName:         string | null
  academySuspended:    boolean
  academyDeleted:      boolean
  subjectName:         string | null
  accesoExpirado:      boolean
  forcePasswordChange: boolean
  onboardingCompleted: boolean
  examConfig:          ExamConfig | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Tablas de Supabase
// ─────────────────────────────────────────────────────────────────────────────

export interface Profile {
  id:                    string
  username:              string
  role:                  Role
  academy_id:            string | null
  subject_id:            string | null
  access_until:          string | null
  force_password_change: boolean
  created_at:            string
  academies?: {
    name:       string
    suspended:  boolean
    deleted_at: string | null
  } | null
  subjects?: {
    name: string
  } | null
}

export interface StudentProfile {
  id:                   string
  full_name:            string | null
  phone:                string | null
  email_contact:        string | null
  city:                 string | null
  exam_date:            string | null
  monthly_price:        number | null
  mascota:              string | null
  onboarding_completed: boolean | null
  created_at:           string
  updated_at:           string | null
}

export interface StaffProfile {
  id:            string
  full_name:     string | null
  phone:         string | null
  email_contact: string | null
  bio:           string | null
  created_at:    string
  updated_at:    string | null
}

export interface Session {
  id:            string
  user_id:       string
  academy_id:    string | null
  subject_id:    string | null
  mode_id:       ModeId
  score:         number
  correct:       number
  total:         number
  duration_secs: number
  played_at:     string
  created_at:    string
}

export interface WrongAnswer {
  id:             string
  user_id:        string
  academy_id:     string | null
  subject_id:     string | null
  question_id:    string
  block:          string
  fail_count:     number
  correct_streak: number
  next_review:    string
  last_seen:      string
  created_at:     string
}

export interface Question {
  id:          string
  academy_id:  string
  subject_id:  string | null
  block_id:    string | null
  topic_id:    string | null
  question:    string
  options:     string[]
  answer:      0 | 1 | 2 | 3
  explanation: string | null
  difficulty:  string | null
  category:    string | null
}

export interface ContentBlock {
  id:         string
  academy_id: string
  subject_id: string | null
  label:      string
  color:      string
  position:   number
}

export interface ContentTopic {
  id:           string
  block_id:     string
  title:        string
  position:     number
  content_json: { text: string } | null
  keywords:     string[]
  laws:         string[]
  dates:        string[]
}

export interface StructuredTopic {
  id:       string
  title:    string
  content:  string
  laws:     string[]
  dates:    string[]
  keywords: string[]
}

export interface StructuredBlock {
  id:               string
  label:            string
  color:            string
  bg:               string
  estimatedMinutes: number
  topics:           StructuredTopic[]
}

export interface Notification {
  id:         string
  user_id:    string
  type:       string
  title:      string
  body:       string | null
  link:       string | null
  read:       boolean
  created_at: string
}

export interface Announcement {
  id:         string
  academy_id: string
  subject_id: string | null
  author_id:  string
  tipo:       string
  title:      string
  body:       string | null
  expires_at: string | null
  created_at: string
}

export interface InviteCode {
  id:            string
  code:          string
  academy_id:    string
  subject_id:    string | null
  created_by:    string
  used_by:       string | null
  used_at:       string | null
  expires_at:    string
  access_months: number
  created_at:    string
}

export interface ExamConfig {
  test_questions:    number
  test_minutes:      number
  test_penalty:      boolean
  supuestos_count:   number
  supuestos_minutes: number
}

export interface Subject {
  id:          string
  academy_id:  string
  name:        string
  slug:        string
  color:       string | null
  created_at:  string
  exam_config: ExamConfig | null
}

export interface Academy {
  id:                     string
  name:                   string
  slug:                   string
  plan:                   string
  suspended:              boolean
  deleted_at:             string | null
  contact_email:          string | null
  contact_phone:          string | null
  city:                   string | null
  province:               string | null
  billing_name:           string | null
  billing_nif:            string | null
  billing_address:        string | null
  notes:                  string | null
  logo_url:               string | null
  price_monthly:          number
  contract_start:         string | null
  contract_renews:        string | null
  payment_status:         string | null
  payment_method:         string | null
  stripe_customer_id:     string | null
  stripe_subscription_id: string | null
  stripe_price_id:        string | null
  trial_ends_at:          string | null
  billing_cycle:          string | null
  setup_fee_paid:         boolean
  created_at:             string
}

export interface StudyPlan {
  id:         string
  academy_id: string
  subject_id: string | null
  created_by: string
  week_start: string
  block_ids:  string[]
  topic_ids:  string[]
  notes:      string | null
  created_at: string
}

export interface StudyHighlight {
  id:           string
  user_id:      string
  topic_id:     string
  academy_id:   string | null
  subject_id:   string | null
  start_offset: number
  end_offset:   number
  text:         string
  color:        string
  created_at:   string
}

export interface CompanySettings {
  id:             string
  legal_name:     string
  nif:            string
  address:        string
  city:           string
  postal_code:    string
  country:        string
  email:          string | null
  phone:          string | null
  invoice_prefix: string
  updated_at:     string | null
}

export interface Invoice {
  id:              string
  academy_id:      string
  amount_cents:    number | null
  currency:        string
  status:          string
  description:     string | null
  invoice_url:     string | null
  invoice_pdf:     string | null
  stripe_price_id: string | null
  paid_at:         string | null
  period_start:    string | null
  period_end:      string | null
  created_at:      string | null
  invoice_number:  string | null
  concept:         string | null
  base_amount:     number | null
  vat_rate:        number | null
  vat_amount:      number | null
  payment_method:  string | null
  due_date:        string | null
  notes:           string | null
  is_manual:       boolean
  cancelled_at:    string | null
  cancels_invoice: string | null
  created_by:      string | null
  issuer_name:     string | null
  issuer_nif:      string | null
  issuer_address:  string | null
  client_name:     string | null
  client_nif:      string | null
  client_address:  string | null
}

export interface SupuestoQuestion {
  id:          string
  supuesto_id: string
  question:    string
  options:     string[]
  answer:      0 | 1 | 2 | 3
  explanation: string | null
  position:    number
}

export interface Supuesto {
  id:         string
  academy_id: string
  subject_id: string | null
  slug:       string
  title:      string
  subtitle:   string | null
  scenario:   string | null
  position:   number
  created_at: string
  questions?: SupuestoQuestion[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlays de App.tsx
// ─────────────────────────────────────────────────────────────────────────────

export interface TestOverlay {
  type:        'test'
  modeId:      string
  modeLabel:   string
  topicId?:    string
  topicLabel?: string
}

export interface FlashcardsOverlay {
  type: 'flashcards'
}

export interface SupuestoOverlay {
  type:     'supuesto'
  supuesto: Supuesto
}

export interface SimulacroOverlay {
  type:       'simulacro'
  examConfig: ExamConfig
}

export type AppOverlay = TestOverlay | FlashcardsOverlay | SupuestoOverlay | SimulacroOverlay

// ─────────────────────────────────────────────────────────────────────────────
// Tipos calculados — construidos por los hooks
// ─────────────────────────────────────────────────────────────────────────────

export interface AlumnoConStats {
  id:              string
  username:        string
  fullName:        string | null
  examDate:        string | null
  createdAt:       string
  sesiones:        number
  notaMedia:       number | null
  temasLeidos:     number
  fallos:          number
  pendientesHoy:   number
  racha:           number
  ultimaSesion:    string | null
  diasInactivo:    number | null
  enRiesgo:        boolean
  accessUntil:     string | null
  accesoExpirado:  boolean
  diasParaExpirar: number | null
  proximoAExpirar: boolean
}

export interface StatsClase {
  totalAlumnos:     number
  alumnosActivos:   number
  enRiesgo:         number
  proximosAExpirar: number
  accesoExpirado:   number
  notaMediaClase:   number | null
  mediaTemasLeidos: number
  sesiones30d?:     number | null
}

export interface AlumnoEnRiesgoDetalle {
  id:           string
  username:     string
  diasInactivo: number | null
  accessUntil:  string | null
}

export interface AlumnoPorExpirarDetalle {
  id:            string
  username:      string
  diasRestantes: number
}

export interface AlumnoConNota {
  id:       string
  username: string
  nota:     number | null
  sesiones: number
  fallos:   number
}

export interface ProfesorStats {
  id:               string
  username:         string
  alumnos:          number
  sesionesThisWeek: number
  notaMedia:        number | null
}

export interface SubjectStats {
  id:                string
  name:              string
  slug:              string | null
  color:             string | null
  totalAlumnos:      number
  alumnosActivos:    number
  enRiesgo:          number
  porExpirar:        number
  notaMedia:         number | null
  sesiones30d:       number
  profesores:        ProfesorStats[]
  alumnosEnRiesgo:   AlumnoEnRiesgoDetalle[]
  alumnosPorExpirar: AlumnoPorExpirarDetalle[]
  alumnosConNota:    AlumnoConNota[]
}

export interface SemanaStats {
  label:          string
  sesiones:       number
  alumnosActivos: number
  notaMedia:      number | null
}

export interface DirectorFinanzas {
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

export interface DirectorStats {
  totalAlumnos:    number
  totalProfesores: number
  totalActivos:    number
  totalEnRiesgo:   number
  totalPorExpirar: number
  notaGlobal:      number | null
  sesiones30d:     number
  bySubject:       SubjectStats[]
  semanas:         SemanaStats[]
  finanzas?:       DirectorFinanzas
  profesorActivity?: {
    lastAvisoByProfesor:   Record<string, { created_at: string; title: string }>
    totalAvisosByProfesor: Record<string, number>
  }
}

export interface AlumnoConExtended extends Profile {
  extended: StudentProfile | null
}

export interface StaffConExtended extends Profile {
  extended: StaffProfile | null
}

export interface AcademiaConStats extends Academy {
  subjects:        Subject[]
  totalAlumnos:    number
  totalProfes:     number
  totalDirectors:  number
  alumnosActivos:  number
  notaMedia:       number | null
  sesiones30d:     number
  porExpirar:      number
  ultimaActividad: string | null
  healthScore:     number | null
}

export interface SuperadminStats {
  totalAcademias: number
  acadActivas:    number
  totalAlumnos:   number
  totalProfes:    number
  alumnosActivos: number
  sesiones30d:    number
  mrr:            number
  pendientePago:  number
  morosos:        number
}

export interface BloqueConTemas {
  id:               string
  label:            string
  color:            string
  temasEspecificos: { id: string; title: string; block_id: string }[]
  todosLosTemas:    boolean
}