import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Plus, Euro, FileText, Check, X, ChevronDown, ChevronUp,
  AlertTriangle, Clock, CheckCircle, XCircle, Download,
  Building2, Calendar, RefreshCw, Edit3, Ban, RotateCcw,
  Info, CreditCard, TrendingUp, Zap
} from 'lucide-react'
import type { Invoice } from '../../types'
import styles from './ManualBillingTab.module.css'

function fmt(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
function today(): string { return new Date().toISOString().slice(0, 10) }
function addDays(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10)
}

const STATUS: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  paid:      { label: 'Pagada',    color: '#22C55E',              bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',  icon: CheckCircle },
  pending:   { label: 'Pendiente', color: '#F59E0B',              bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', icon: Clock },
  overdue:   { label: 'Vencida',   color: '#EF4444',              bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  icon: AlertTriangle },
  cancelled: { label: 'Anulada',   color: 'rgba(232,244,248,0.25)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', icon: Ban },
}
const METHODS  = ['transferencia', 'bizum', 'tarjeta', 'domiciliación']
const CONCEPTS = ['Alta de plataforma', 'Mensualidad', 'Cuota trimestral', 'Cuota anual', 'Otros']

interface CompanySettings {
  id?:             string
  legal_name?:     string | null
  nif?:            string | null
  address?:        string | null
  invoice_prefix?: string | null
}

interface Academia { id: string; name: string; plan?: string; billing_name?: string | null; billing_nif?: string | null; billing_address?: string | null; price_monthly?: number | null; deleted_at?: string | null }

// ── Hook de datos ──────────────────────────────────────────────────────────
function useManualBilling(academias: Academia[]) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [company,  setCompany]  = useState<CompanySettings | null>(null)
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: invData }, { data: compData }] = await Promise.all([
      supabase.from('invoices').select('*').eq('is_manual', true).order('created_at', { ascending: false }),
      supabase.from('company_settings').select('*').maybeSingle(),
    ])
    setInvoices((invData ?? []) as Invoice[])
    setCompany(compData as CompanySettings | null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createInvoice = useCallback(async (data: Record<string, any>) => {
    const { data: numData } = await supabase.rpc('next_invoice_number', { prefix: company?.invoice_prefix ?? 'FF' })
    const { data: { user } } = await supabase.auth.getUser()
    const academia = academias.find(a => a.id === data.academy_id)
    const base     = Math.round(parseFloat(data.base_amount) * 100)
    const vatRate  = parseFloat(data.vat_rate ?? 21)
    const vat      = Math.round(base * vatRate / 100)
    const total    = base + vat

    const { data: inv, error } = await supabase.from('invoices').insert({
      academy_id: data.academy_id, invoice_number: numData,
      concept: data.concept, base_amount: base, vat_rate: vatRate,
      vat_amount: vat, amount_cents: total, currency: 'eur',
      status: data.status ?? 'pending', payment_method: data.payment_method,
      due_date: data.due_date, notes: data.notes ?? null, is_manual: true,
      created_by: user?.id,
      paid_at: data.status === 'paid' ? today() : null,
      period_start: data.period_start ?? null, period_end: data.period_end ?? null,
      issuer_name: company?.legal_name ?? null, issuer_nif: company?.nif ?? null,
      issuer_address: company?.address ?? null,
      client_name: academia?.billing_name ?? academia?.name ?? null,
      client_nif: academia?.billing_nif ?? null,
      client_address: academia?.billing_address ?? null,
    }).select().maybeSingle()

    if (error) return { error: error.message }
    await load()
    return { data: inv }
  }, [academias, company, load])

  const markPaid = useCallback(async (id: string) => {
    const { error } = await supabase.from('invoices').update({ status: 'paid', paid_at: today() }).eq('id', id)
    if (!error) await load()
    return !error
  }, [load])

  const cancelInvoice = useCallback(async (id: string, invoiceNumber: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: numData }  = await supabase.rpc('next_invoice_number', { prefix: company?.invoice_prefix ?? 'FF' })
    const orig = invoices.find(i => i.id === id)
    if (!orig) return false
    await supabase.from('invoices').update({ cancelled_at: new Date().toISOString(), status: 'cancelled' }).eq('id', id)
    await supabase.from('invoices').insert({
      academy_id: orig.academy_id, invoice_number: numData,
      concept: `Factura rectificativa de ${invoiceNumber}`,
      base_amount: -(orig.base_amount ?? 0), vat_rate: orig.vat_rate, vat_amount: -(orig.vat_amount ?? 0),
      amount_cents: -(orig.amount_cents ?? 0), currency: 'eur', status: 'cancelled',
      is_manual: true, cancels_invoice: invoiceNumber, created_by: user?.id,
      issuer_name: orig.issuer_name, issuer_nif: orig.issuer_nif, issuer_address: orig.issuer_address,
      client_name: orig.client_name, client_nif: orig.client_nif, client_address: orig.client_address,
    })
    await load()
    return true
  }, [invoices, company, load])

  return { invoices, company, loading, createInvoice, markPaid, cancelInvoice, reload: load }
}

// ── KpiCard ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType
}) {
  return (
    <div className={styles.kpiCard} style={{ ['--kc' as string]: color }}>
      <div className={styles.kpiIcon} style={{ background: `${color}18`, border: `1px solid ${color}28` }}><Icon size={15} style={{ color }} /></div>
      <div className={styles.kpiVal} style={{ color }}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

// ── InvoiceRow ─────────────────────────────────────────────────────────────
function InvoiceRow({ inv, onMarkPaid, onCancel }: {
  inv:        Invoice
  onMarkPaid: (id: string) => Promise<boolean>
  onCancel:   (id: string, num: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const isOverdue = inv.status === 'pending' && !!inv.due_date && inv.due_date < today()
  const stKey     = inv.cancelled_at ? 'cancelled' : isOverdue ? 'overdue' : (inv.status ?? 'pending')
  const st        = STATUS[stKey] ?? STATUS['pending']!
  const StIcon    = st.icon

  const handlePaid   = async () => { setBusy(true); await onMarkPaid(inv.id); setBusy(false) }
  const handleCancel = async () => {
    if (!confirm(`¿Anular la factura ${inv.invoice_number}? Se generará una factura rectificativa.`)) return
    setBusy(true); await onCancel(inv.id, inv.invoice_number ?? ''); setBusy(false)
  }

  return (
    <div className={[styles.row, open ? styles.rowOpen : ''].join(' ')}>
      <button className={styles.rowHead} onClick={() => setOpen(o => !o)}>
        <span className={styles.rowNum}>{inv.invoice_number ?? '—'}</span>
        <span className={styles.rowConcept}>{inv.concept ?? '—'}</span>
        <span className={styles.rowDate}>{fmtDate(inv.created_at)}</span>
        <span className={styles.rowAmount} style={{ color: (inv.amount_cents ?? 0) < 0 ? '#EF4444' : '#e8f4f8' }}>
          {(inv.amount_cents ?? 0) < 0 ? '−' : ''}€{fmt(Math.abs(inv.amount_cents ?? 0))}
        </span>
        <span className={styles.rowStatus} style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
          <StIcon size={10} />{isOverdue ? 'Vencida' : st.label}
        </span>
        <span className={styles.rowChevron}>{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
      </button>

      {open && (
        <div className={styles.rowBody}>
          <div className={styles.rowGrid}>
            <div className={styles.rowCol}>
              <div className={styles.rowColTitle}>Detalle fiscal</div>
              <div className={styles.rowField}><span className={styles.rowFieldLabel}>Base imponible</span><span className={styles.rowFieldVal}>€{fmt(inv.base_amount ?? 0)}</span></div>
              <div className={styles.rowField}><span className={styles.rowFieldLabel}>IVA ({inv.vat_rate ?? 21}%)</span><span className={styles.rowFieldVal}>€{fmt(inv.vat_amount ?? 0)}</span></div>
              <div className={[styles.rowField, styles.rowFieldTotal].join(' ')}><span className={styles.rowFieldLabel}>Total</span><span className={styles.rowFieldVal} style={{ color: '#2563EB' }}>€{fmt(inv.amount_cents ?? 0)}</span></div>
              {inv.period_start && <div className={styles.rowField}><span className={styles.rowFieldLabel}>Período</span><span className={styles.rowFieldVal}>{fmtDate(inv.period_start)} — {fmtDate(inv.period_end)}</span></div>}
            </div>

            <div className={styles.rowCol}>
              <div className={styles.rowColTitle}>Partes</div>
              {inv.issuer_name ? (
                <div className={styles.rowParty}>
                  <span className={styles.rowPartyRole}>Emisor</span>
                  <span className={styles.rowPartyName}>{inv.issuer_name}</span>
                  {inv.issuer_nif     && <span className={styles.rowPartyMeta}>NIF {inv.issuer_nif}</span>}
                  {inv.issuer_address && <span className={styles.rowPartyMeta}>{inv.issuer_address}</span>}
                </div>
              ) : <div className={styles.rowNoData}><Info size={12} /> Sin datos fiscales del emisor</div>}
              <div className={styles.rowParty} style={{ marginTop: '0.75rem' }}>
                <span className={styles.rowPartyRole}>Receptor</span>
                <span className={styles.rowPartyName}>{inv.client_name ?? '—'}</span>
                {inv.client_nif     && <span className={styles.rowPartyMeta}>NIF {inv.client_nif}</span>}
                {inv.client_address && <span className={styles.rowPartyMeta}>{inv.client_address}</span>}
              </div>
            </div>

            <div className={styles.rowCol}>
              <div className={styles.rowColTitle}>Pago</div>
              <div className={styles.rowField}><span className={styles.rowFieldLabel}>Método</span><span className={styles.rowFieldVal} style={{ textTransform: 'capitalize' }}>{inv.payment_method ?? '—'}</span></div>
              {inv.due_date && <div className={styles.rowField}><span className={styles.rowFieldLabel}>Vencimiento</span><span className={styles.rowFieldVal} style={{ color: isOverdue ? '#EF4444' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>{fmtDate(inv.due_date)}</span></div>}
              {inv.paid_at  && <div className={styles.rowField}><span className={styles.rowFieldLabel}>Pagada el</span><span className={styles.rowFieldVal}>{fmtDate(inv.paid_at)}</span></div>}
              {inv.cancels_invoice && <div className={styles.rowField}><span className={styles.rowFieldLabel}>Rectifica</span><span className={styles.rowFieldVal}>{inv.cancels_invoice}</span></div>}
              {inv.notes && <div className={styles.rowNotes}>{inv.notes}</div>}
              {!inv.cancelled_at && (
                <div className={styles.rowActions}>
                  {inv.status !== 'paid' && (
                    <button className={styles.btnPay} onClick={handlePaid} disabled={busy}>
                      {busy ? <RefreshCw size={11} className={styles.spin} /> : <Check size={11} />} Marcar pagada
                    </button>
                  )}
                  <button className={styles.btnCancel} onClick={handleCancel} disabled={busy}><Ban size={11} /> Anular</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── NewInvoiceModal ────────────────────────────────────────────────────────
interface InvoiceForm {
  academy_id: string; concept: string; base_amount: string; vat_rate: string
  payment_method: string; status: string; due_date: string
  period_start: string; period_end: string; notes: string
}

function NewInvoiceModal({ academias, company, onCreate, onClose }: {
  academias: Academia[]; company: CompanySettings | null
  onCreate:  (d: Record<string, any>) => Promise<{ error?: string; data?: any }>
  onClose:   () => void
}) {
  const [form, setForm] = useState<InvoiceForm>({
    academy_id: '', concept: 'Mensualidad', base_amount: '', vat_rate: '21',
    payment_method: 'transferencia', status: 'pending',
    due_date: addDays(30), period_start: '', period_end: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k: keyof InvoiceForm, v: string) => setForm(f => ({ ...f, [k]: v }))

  const base  = parseFloat(form.base_amount) || 0
  const vat   = base * parseFloat(form.vat_rate) / 100
  const total = base + vat

  const handleSubmit = async () => {
    if (!form.academy_id)               { setError('Selecciona una academia'); return }
    if (!form.base_amount || base <= 0) { setError('Introduce un importe válido'); return }
    if (!form.concept)                  { setError('Introduce un concepto'); return }
    if (!company?.nif)                  { setError('Completa primero los datos fiscales de FrostFox'); return }
    setSaving(true); setError('')
    const res = await onCreate(form)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalTitleWrap}><FileText size={16} style={{ color: '#2563EB' }} /><span className={styles.modalTitle}>Nueva factura</span></div>
          <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.label}>Academia *</label>
            <select className={styles.select} value={form.academy_id} onChange={e => {
              const ac = academias.find(a => a.id === e.target.value)
              set('academy_id', e.target.value)
              if (ac?.price_monthly) set('base_amount', String(ac.price_monthly))
            }}>
              <option value="">Seleccionar academia…</option>
              {academias.filter(a => !a.deleted_at).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Concepto *</label>
            <select className={styles.select} value={form.concept} onChange={e => set('concept', e.target.value)}>
              {CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Base imponible (€) *</label>
              <input className={styles.input} type="number" min="0" step="0.01" value={form.base_amount} onChange={e => set('base_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>IVA (%)</label>
              <input className={styles.input} type="number" min="0" max="100" value={form.vat_rate} onChange={e => set('vat_rate', e.target.value)} />
            </div>
          </div>
          {base > 0 && (
            <div className={styles.preview}>
              <span>Base: <strong>€{base.toFixed(2)}</strong></span>
              <span>IVA {form.vat_rate}%: <strong>€{vat.toFixed(2)}</strong></span>
              <span className={styles.previewTotal}>Total: <strong>€{total.toFixed(2)}</strong></span>
            </div>
          )}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Método de pago</label>
              <select className={styles.select} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                {METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Estado inicial</label>
              <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagada</option>
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Fecha de vencimiento</label>
            <input className={styles.input} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Período desde</label>
              <input className={styles.input} type="date" value={form.period_start} onChange={e => set('period_start', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Período hasta</label>
              <input className={styles.input} type="date" value={form.period_end} onChange={e => set('period_end', e.target.value)} />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Notas internas</label>
            <textarea className={styles.textarea} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observaciones, número de transferencia…" />
          </div>
          {error && <div className={styles.error}><AlertTriangle size={13} />{error}</div>}
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
            {saving ? <><RefreshCw size={12} className={styles.spin} /> Generando…</> : <><FileText size={12} /> Generar factura</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function CompanyWarning({ company }: { company: CompanySettings | null }) {
  if (company?.nif) return null
  return (
    <div className={styles.warning}>
      <AlertTriangle size={14} />
      <span>Datos fiscales de FrostFox incompletos — complétalo al darte de alta como autónomo.</span>
    </div>
  )
}

export default function ManualBillingTab({ academias = [] as Academia[] }) {
  const { invoices, company, loading, createInvoice, markPaid, cancelInvoice } = useManualBilling(academias)
  const [showNew,  setShowNew]  = useState(false)
  const [filterAc, setFilterAc] = useState('all')
  const [filterSt, setFilterSt] = useState('all')

  const active       = invoices.filter(i => !i.cancelled_at)
  const paid         = active.filter(i => i.status === 'paid')
  const pending      = active.filter(i => i.status === 'pending' && (!i.due_date || i.due_date >= today()))
  const overdue      = active.filter(i => i.status === 'pending' && !!i.due_date && i.due_date < today())
  const totalCobrado = paid.reduce((s, i) => s + (i.amount_cents ?? 0), 0)

  const filtered = invoices.filter(i => {
    if (filterAc !== 'all' && i.academy_id !== filterAc) return false
    if (filterSt === 'paid'      && i.status !== 'paid') return false
    if (filterSt === 'pending'   && (i.status !== 'pending' || (!!i.due_date && i.due_date < today()))) return false
    if (filterSt === 'overdue'   && !(i.status === 'pending' && !!i.due_date && i.due_date < today())) return false
    if (filterSt === 'cancelled' && !i.cancelled_at) return false
    return true
  })

  if (loading) return <div className={styles.loading}><RefreshCw size={18} className={styles.spin} /><span>Cargando facturación…</span></div>

  return (
    <div className={styles.wrap}>
      <CompanyWarning company={company} />

      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Facturación manual</h2>
          <p className={styles.sectionSub}>Gestión directa de facturas · activo ahora</p>
        </div>
        <button className={styles.btnNew} onClick={() => setShowNew(true)}><Plus size={14} /> Nueva factura</button>
      </div>

      <div className={styles.kpis}>
        <KpiCard label="Cobrado total"    value={`€${fmt(totalCobrado)}`} color="#22C55E" icon={Euro} />
        <KpiCard label="Facturas pagadas" value={paid.length}             color="#22C55E" icon={CheckCircle} />
        <KpiCard label="Pendientes"       value={pending.length}          color="#F59E0B" icon={Clock} />
        <KpiCard label="Vencidas"         value={overdue.length}          color="#EF4444" icon={AlertTriangle} sub={overdue.length > 0 ? 'Requieren acción' : undefined} />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <select className={styles.filterSelect} value={filterAc} onChange={e => setFilterAc(e.target.value)}>
            <option value="all">Todas las academias</option>
            {academias.filter(a => !a.deleted_at).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className={styles.filterTabs}>
            {[
              { id: 'all',       label: 'Todas' },
              { id: 'paid',      label: 'Pagadas' },
              { id: 'pending',   label: 'Pendientes' },
              { id: 'overdue',   label: 'Vencidas' },
              { id: 'cancelled', label: 'Anuladas' },
            ].map(f => (
              <button key={f.id} className={[styles.filterTab, filterSt === f.id ? styles.filterTabActive : ''].join(' ')} onClick={() => setFilterSt(f.id)}>
                {f.label}
                {f.id === 'overdue' && overdue.length > 0 && <span className={styles.filterBadge}>{overdue.length}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.list}>
        <div className={styles.listHead}><span>Nº factura</span><span>Concepto</span><span>Fecha</span><span>Importe</span><span>Estado</span><span /></div>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={28} strokeWidth={1.2} /><span>No hay facturas que mostrar</span>
            {invoices.length === 0 && <button className={styles.btnNewEmpty} onClick={() => setShowNew(true)}><Plus size={13} /> Crear primera factura</button>}
          </div>
        ) : filtered.map(inv => <InvoiceRow key={inv.id} inv={inv} onMarkPaid={markPaid} onCancel={cancelInvoice} />)}
      </div>

      {showNew && <NewInvoiceModal academias={academias} company={company} onCreate={createInvoice} onClose={() => setShowNew(false)} />}
    </div>
  )
}
