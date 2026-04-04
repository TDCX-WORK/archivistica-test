import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { FileText, Download, AlertCircle, CheckCircle, Clock, XCircle, Euro, Calendar, TrendingUp } from 'lucide-react'
import ErrorState from '../../ui/ErrorState'
import styles from './FacturacionDirector.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (cents) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const currentYear = new Date().getFullYear()

// ── Hook de datos ──────────────────────────────────────────────────────────
function useFacturacionDirector(academyId) {
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    if (!academyId) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('invoices')
      .select('*')
      .eq('academy_id', academyId)
      .order('created_at', { ascending: false })

    if (err) { setError('No se pudieron cargar las facturas'); setLoading(false); return }
    setInvoices(data || [])
    setLoading(false)
  }, [academyId])

  useEffect(() => { load() }, [load])

  return { invoices, loading, error, reload: load }
}

// ── Badge de estado ────────────────────────────────────────────────────────
function EstadoBadge({ status }) {
  const config = {
    paid:      { label: 'Pagada',    icon: CheckCircle, cls: styles.badgePaid    },
    pending:   { label: 'Pendiente', icon: Clock,       cls: styles.badgePending },
    cancelled: { label: 'Anulada',   icon: XCircle,     cls: styles.badgeCancelled },
    overdue:   { label: 'Vencida',   icon: AlertCircle, cls: styles.badgeOverdue },
  }
  const c = config[status] || config.pending
  const Icon = c.icon
  return (
    <span className={`${styles.badge} ${c.cls}`}>
      <Icon size={11} strokeWidth={2.5} />
      {c.label}
    </span>
  )
}

// ── Generar PDF de factura (modelo legal español) ─────────────────────────
function generarPDFFactura(inv) {
  const baseEur  = (inv.base_amount  / 100).toFixed(2).replace('.', ',')
  const vatEur   = (inv.vat_amount   / 100).toFixed(2).replace('.', ',')
  const totalEur = (inv.amount_cents / 100).toFixed(2).replace('.', ',')
  const vatRate  = inv.vat_rate || 21
  const isPaid   = inv.status === 'paid'
  const isCancelled = inv.status === 'cancelled'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Factura ${inv.invoice_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 800; color: #111; letter-spacing: -0.02em; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 2px solid #111; }
  .brand { display: flex; flex-direction: column; gap: 4px; }
  .brand-name { font-size: 20px; font-weight: 800; color: #111; }
  .brand-name span { color: #2563EB; }
  .brand-sub { font-size: 11px; color: #6b7280; }
  .invoice-meta { text-align: right; }
  .invoice-num { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 6px; }
  .invoice-date { font-size: 11px; color: #6b7280; }
  ${isCancelled ? '.watermark { position: fixed; top: 45%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 80px; font-weight: 900; color: rgba(220,38,38,0.08); pointer-events: none; z-index: 0; letter-spacing: -0.02em; }' : ''}
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
  .party-block { padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; }
  .party-label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
  .party-name { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px; }
  .party-detail { font-size: 11px; color: #6b7280; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead { background: #111; color: #fff; }
  thead th { padding: 10px 14px; font-size: 11px; font-weight: 600; text-align: left; letter-spacing: 0.04em; }
  tbody td { padding: 12px 14px; border-bottom: 1px solid #f3f4f6; font-size: 12px; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  .amount-col { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-left: auto; width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
  .totals-row.total { border-bottom: none; border-top: 2px solid #111; margin-top: 4px; padding-top: 12px; font-size: 15px; font-weight: 800; color: #111; }
  .totals-row .label { color: #6b7280; }
  .paid-stamp { margin-top: 20px; display: inline-flex; align-items: center; gap: 8px; background: #f0fdf4; border: 1.5px solid #059669; border-radius: 8px; padding: 8px 16px; color: #059669; font-weight: 700; font-size: 13px; }
  .dates-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
  .date-block { padding: 14px; background: #f9fafb; border-radius: 8px; }
  .date-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .date-val { font-size: 13px; font-weight: 600; color: #111; }
  .legal { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; line-height: 1.6; }
  .notes { margin-bottom: 24px; padding: 14px; background: #f9fafb; border-radius: 8px; font-size: 11px; color: #6b7280; }
  @media print { body { padding: 32px; } }
</style>
</head>
<body>
${isCancelled ? '<div class="watermark">ANULADA</div>' : ''}
<div class="header">
  <div class="brand">
    <div class="brand-name">Frost<span>Fox</span></div>
    <div class="brand-sub">Soluciones digitales B2B para academias</div>
  </div>
  <div class="invoice-meta">
    <div class="invoice-num">${inv.invoice_number}</div>
    <div class="invoice-date">Emitida el ${fmtDate(inv.created_at)}</div>
  </div>
</div>

<div class="parties">
  <div class="party-block">
    <div class="party-label">Emisor</div>
    <div class="party-name">${inv.issuer_name || 'FrostFox'}</div>
    <div class="party-detail">
      NIF: ${inv.issuer_nif || '—'}<br>
      ${inv.issuer_address || ''}
    </div>
  </div>
  <div class="party-block">
    <div class="party-label">Cliente / Destinatario</div>
    <div class="party-name">${inv.client_name || '—'}</div>
    <div class="party-detail">
      NIF/CIF: ${inv.client_nif || '—'}<br>
      ${inv.client_address || ''}
    </div>
  </div>
</div>

<div class="dates-row">
  <div class="date-block">
    <div class="date-label">Fecha de emisión</div>
    <div class="date-val">${fmtDate(inv.created_at)}</div>
  </div>
  <div class="date-block">
    <div class="date-label">Fecha de vencimiento</div>
    <div class="date-val">${fmtDate(inv.due_date)}</div>
  </div>
  <div class="date-block">
    <div class="date-label">Período facturado</div>
    <div class="date-val">${inv.period_start ? `${fmtDate(inv.period_start)} – ${fmtDate(inv.period_end)}` : '—'}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:50%">Concepto</th>
      <th>Unidades</th>
      <th>Base imponible</th>
      <th>IVA (${vatRate}%)</th>
      <th class="amount-col">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${inv.concept || 'Servicio FrostFox Academy'}</td>
      <td>1</td>
      <td>${baseEur} €</td>
      <td>${vatEur} €</td>
      <td class="amount-col"><strong>${totalEur} €</strong></td>
    </tr>
  </tbody>
</table>

<div class="totals">
  <div class="totals-row"><span class="label">Base imponible</span><span>${baseEur} €</span></div>
  <div class="totals-row"><span class="label">IVA (${vatRate}%)</span><span>${vatEur} €</span></div>
  <div class="totals-row total"><span>TOTAL</span><span>${totalEur} €</span></div>
</div>

${isPaid ? `<div class="paid-stamp">✓ Pagada el ${fmtDate(inv.paid_at)}</div>` : ''}

${inv.notes ? `<div class="notes"><strong>Notas:</strong> ${inv.notes}</div>` : ''}

${inv.payment_method ? `<p style="margin-top:16px;font-size:11px;color:#6b7280;">Método de pago: <strong>${inv.payment_method}</strong></p>` : ''}

${inv.cancels_invoice ? `<p style="margin-top:12px;font-size:11px;color:#dc2626;">Esta es una factura rectificativa de la factura ${inv.cancels_invoice}.</p>` : ''}

<div class="legal">
  Factura emitida de conformidad con lo dispuesto en el Real Decreto 1619/2012, de 30 de noviembre, por el que se aprueba el Reglamento por el que se regulan las obligaciones de facturación. Esta factura está sujeta a IVA según la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido. La operación tributa al tipo general del ${vatRate}% de IVA. En caso de discrepancia, contacte con nosotros en el plazo de 30 días desde la fecha de emisión.
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.print()
}

// ── Componente principal ───────────────────────────────────────────────────
export default function FacturacionDirector({ currentUser }) {
  const academyId = currentUser?.academy_id
  const { invoices, loading, error, reload } = useFacturacionDirector(academyId)

  // ── KPIs
  const facturasAnyo = invoices.filter(i =>
    i.status !== 'cancelled' && new Date(i.created_at).getFullYear() === currentYear
  )
  const totalPagado   = facturasAnyo.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount_cents, 0)
  const totalPendiente = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount_cents, 0)
  const proximoVenc   = invoices
    .filter(i => i.status === 'pending' && i.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]

  if (loading) return (
    <div className={styles.loadingWrap}>
      <div className={styles.spinner} />
    </div>
  )

  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Facturación</div>
          <h2 className={styles.title}>Historial de facturas</h2>
          <p className={styles.subtitle}>Facturas emitidas por FrostFox Academy para tu academia.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(5,150,105,0.1)', color: '#059669' }}>
            <CheckCircle size={18} strokeWidth={1.8} />
          </div>
          <div className={styles.kpiVal}>{fmt(totalPagado)}</div>
          <div className={styles.kpiLabel}>Pagado en {currentYear}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
            <Clock size={18} strokeWidth={1.8} />
          </div>
          <div className={styles.kpiVal}>{fmt(totalPendiente)}</div>
          <div className={styles.kpiLabel}>Pendiente de pago</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
            <Calendar size={18} strokeWidth={1.8} />
          </div>
          <div className={styles.kpiVal}>{proximoVenc ? fmtDate(proximoVenc.due_date) : '—'}</div>
          <div className={styles.kpiLabel}>Próximo vencimiento</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
            <TrendingUp size={18} strokeWidth={1.8} />
          </div>
          <div className={styles.kpiVal}>{facturasAnyo.length}</div>
          <div className={styles.kpiLabel}>Facturas en {currentYear}</div>
        </div>
      </div>

      {/* Lista de facturas */}
      {invoices.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={36} strokeWidth={1.2} className={styles.emptyIcon} />
          <p className={styles.emptyText}>Aún no hay facturas emitidas para tu academia.</p>
          <p className={styles.emptySubtext}>Aquí aparecerán las facturas de FrostFox Academy cuando sean emitidas.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nº Factura</th>
                <th>Concepto</th>
                <th>Emisión</th>
                <th>Vencimiento</th>
                <th>Base</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className={inv.status === 'cancelled' ? styles.rowCancelled : ''}>
                  <td className={styles.invoiceNum}>{inv.invoice_number}</td>
                  <td className={styles.concept}>{inv.concept || 'Servicio FrostFox Academy'}</td>
                  <td className={styles.dateCell}>{fmtDate(inv.created_at)}</td>
                  <td className={`${styles.dateCell} ${inv.status === 'pending' && inv.due_date && new Date(inv.due_date) < new Date() ? styles.overdue : ''}`}>
                    {fmtDate(inv.due_date)}
                  </td>
                  <td className={styles.amountCell}>{fmt(inv.base_amount)}</td>
                  <td className={styles.amountCell}>{fmt(inv.vat_amount)}</td>
                  <td className={styles.amountCell}>
                    <strong>{fmt(inv.amount_cents)}</strong>
                  </td>
                  <td><EstadoBadge status={inv.status} /></td>
                  <td>
                    <button
                      className={styles.downloadBtn}
                      onClick={() => generarPDFFactura(inv)}
                      title="Descargar factura"
                    >
                      <Download size={14} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Nota legal */}
      <p className={styles.legalNote}>
        Las facturas se emiten de conformidad con el Real Decreto 1619/2012 sobre obligaciones de facturación. IVA al tipo general del 21% según la Ley 37/1992. Conserva estas facturas durante el período legal mínimo de 4 años.
      </p>
    </div>
  )
}
