import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  FileText, Download, AlertCircle, CheckCircle, Clock,
  XCircle, Euro, Calendar, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react'
import ErrorState from '../../ui/ErrorState'
import CobrosAcademia from './CobrosAcademia'
import { useCobros } from '../../../hooks/useCobros'
import type { AcademyPayment } from '../../../hooks/useCobros'
import type { CurrentUser, Invoice } from '../../../types'
import styles from './FacturacionDirector.module.css'

const fmt = (cents: number): string =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const currentYear = new Date().getFullYear()

function useFacturacionDirector(academyId: string | null | undefined) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!academyId) return
    setLoading(true); setError(null)
    const { data, error: err } = await supabase
      .from('invoices').select('*').eq('academy_id', academyId).order('created_at', { ascending: false })
    if (err) { setError('No se pudieron cargar las facturas'); setLoading(false); return }
    setInvoices((data ?? []) as Invoice[])
    setLoading(false)
  }, [academyId])

  useEffect(() => { load() }, [load])
  return { invoices, loading, error, reload: load }
}

function useHistoricoCobros(academyId: string | null | undefined) {
  const [historico, setHistorico] = useState<{
    month: string; cobrado: number; pendiente: number; total: number; nPagados: number; nTotal: number
  }[]>([])

  useEffect(() => {
    if (!academyId) return
    supabase.from('academy_payments')
      .select('month, status, amount')
      .eq('academy_id', academyId)
      .order('month', { ascending: true })
      .then(({ data }) => {
        const byMonth: Record<string, { cobrado: number; pendiente: number; total: number; nPagados: number; nTotal: number }> = {}
        for (const p of (data ?? []) as any[]) {
          if (!byMonth[p.month]) byMonth[p.month] = { cobrado:0, pendiente:0, total:0, nPagados:0, nTotal:0 }
          byMonth[p.month]!.total += p.amount
          byMonth[p.month]!.nTotal++
          if (p.status === 'paid') { byMonth[p.month]!.cobrado += p.amount; byMonth[p.month]!.nPagados++ }
          else byMonth[p.month]!.pendiente += p.amount
        }
        setHistorico(Object.entries(byMonth).map(([month, v]) => ({ month, ...v })))
      })
  }, [academyId])

  return historico
}

function EstadoBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    paid:      { label: 'Pagada',    icon: CheckCircle, cls: styles.badgePaid      ?? '' },
    pending:   { label: 'Pendiente', icon: Clock,       cls: styles.badgePending   ?? '' },
    cancelled: { label: 'Anulada',   icon: XCircle,     cls: styles.badgeCancelled ?? '' },
    overdue:   { label: 'Vencida',   icon: AlertCircle, cls: styles.badgeOverdue   ?? '' },
  }
  const c    = config[status] ?? config['pending']!
  const Icon = c.icon
  return (
    <span className={`${styles.badge} ${c.cls}`}>
      <Icon size={11} strokeWidth={2.5} />{c.label}
    </span>
  )
}

function generarPDFFactura(inv: Invoice) {
  const baseEur  = ((inv.base_amount  ?? 0) / 100).toFixed(2).replace('.', ',')
  const vatEur   = ((inv.vat_amount   ?? 0) / 100).toFixed(2).replace('.', ',')
  const totalEur = ((inv.amount_cents ?? 0) / 100).toFixed(2).replace('.', ',')
  const vatRate  = inv.vat_rate ?? 21
  const isPaid      = inv.status === 'paid'
  const isCancelled = inv.status === 'cancelled'

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Factura ${inv.invoice_number}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;padding:48px;max-width:800px;margin:0 auto}h1{font-size:28px;font-weight:800;color:#111;letter-spacing:-0.02em}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:32px;border-bottom:2px solid #111}.brand-name{font-size:20px;font-weight:800;color:#111}.brand-name span{color:#2563EB}.brand-sub{font-size:11px;color:#6b7280}.invoice-num{font-size:22px;font-weight:800;color:#111;margin-bottom:6px}.invoice-date{font-size:11px;color:#6b7280}${isCancelled?'.watermark{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:900;color:rgba(220,38,38,0.08);pointer-events:none;z-index:0}':''}.parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:36px}.party-block{padding:20px;border:1px solid #e5e7eb;border-radius:10px}.party-label{font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px}.party-name{font-size:15px;font-weight:700;color:#111;margin-bottom:4px}.party-detail{font-size:11px;color:#6b7280;line-height:1.6}table{width:100%;border-collapse:collapse;margin-bottom:24px}thead{background:#111;color:#fff}thead th{padding:10px 14px;font-size:11px;font-weight:600;text-align:left;letter-spacing:0.04em}tbody td{padding:12px 14px;border-bottom:1px solid #f3f4f6;font-size:12px}.amount-col{text-align:right;font-variant-numeric:tabular-nums}.totals{margin-left:auto;width:280px}.totals-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:12px}.totals-row.total{border-bottom:none;border-top:2px solid #111;margin-top:4px;padding-top:12px;font-size:15px;font-weight:800;color:#111}.totals-row .label{color:#6b7280}.paid-stamp{margin-top:20px;display:inline-flex;align-items:center;gap:8px;background:#f0fdf4;border:1.5px solid #059669;border-radius:8px;padding:8px 16px;color:#059669;font-weight:700;font-size:13px}.legal{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;line-height:1.6}@media print{body{padding:32px}}</style>
</head><body>
${isCancelled?'<div class="watermark">ANULADA</div>':''}
<div class="header"><div class="brand"><div class="brand-name">Frost<span>Fox</span></div><div class="brand-sub">Soluciones digitales B2B para academias</div></div><div style="text-align:right"><div class="invoice-num">${inv.invoice_number}</div><div class="invoice-date">Emitida el ${fmtDate(inv.created_at)}</div></div></div>
<div class="parties"><div class="party-block"><div class="party-label">Emisor</div><div class="party-name">${inv.issuer_name??'FrostFox'}</div><div class="party-detail">NIF: ${inv.issuer_nif??'—'}<br>${inv.issuer_address??''}</div></div><div class="party-block"><div class="party-label">Cliente</div><div class="party-name">${inv.client_name??'—'}</div><div class="party-detail">NIF/CIF: ${inv.client_nif??'—'}<br>${inv.client_address??''}</div></div></div>
<table><thead><tr><th style="width:50%">Concepto</th><th>Unidades</th><th>Base</th><th>IVA (${vatRate}%)</th><th class="amount-col">Total</th></tr></thead><tbody><tr><td>${inv.concept??'Servicio FrostFox Academy'}</td><td>1</td><td>${baseEur} €</td><td>${vatEur} €</td><td class="amount-col"><strong>${totalEur} €</strong></td></tr></tbody></table>
<div class="totals"><div class="totals-row"><span class="label">Base imponible</span><span>${baseEur} €</span></div><div class="totals-row"><span class="label">IVA (${vatRate}%)</span><span>${vatEur} €</span></div><div class="totals-row total"><span>TOTAL</span><span>${totalEur} €</span></div></div>
${isPaid?`<div class="paid-stamp">✓ Pagada el ${fmtDate(inv.paid_at)}</div>`:''}
<div class="legal">Factura emitida de conformidad con el Real Decreto 1619/2012. IVA al tipo general del ${vatRate}% según la Ley 37/1992.</div>
</body></html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html); win.document.close(); win.print()
}

export default function FacturacionDirector({ currentUser }: { currentUser: CurrentUser | null }) {
  const academyId = currentUser?.academy_id
  const now       = new Date()

  const [activeTab, setActiveTab] = useState<'cobros' | 'facturas'>('cobros')
  const [mes,       setMes]       = useState(now.getMonth())
  const [ano,       setAno]       = useState(now.getFullYear())

  const month = `${ano}-${String(mes+1).padStart(2,'0')}`

  const { alumnos, loading: loadingCobros, saving, updateStatus, updateNotes, generarMes, exportarCSV } =
    useCobros(academyId, month)

  const historico   = useHistoricoCobros(academyId)
  const { invoices, loading: loadingFacturas, error, reload } = useFacturacionDirector(academyId)

  const prevMes = () => { if (mes===0) { setMes(11); setAno(a=>a-1) } else setMes(m=>m-1) }
  const nextMes = () => { if (mes===11) { setMes(0); setAno(a=>a+1) } else setMes(m=>m+1) }

  const facturasAnyo   = invoices.filter(i => i.status!=='cancelled' && new Date(i.created_at??'').getFullYear()===currentYear)
  const totalPagado    = facturasAnyo.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.amount_cents??0),0)
  const totalPendiente = invoices.filter(i=>i.status==='pending').reduce((s,i)=>s+(i.amount_cents??0),0)
  const proximoVenc    = invoices.filter(i=>i.status==='pending'&&i.due_date).sort((a,b)=>new Date(a.due_date!).getTime()-new Date(b.due_date!).getTime())[0]

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Facturación</div>
          <h2 className={styles.title}>Gestión financiera</h2>
          <p className={styles.subtitle}>Cobros de tu academia y facturas de FrostFox.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={[styles.tab, activeTab==='cobros'?styles.tabActive:''].join(' ')}
          onClick={() => setActiveTab('cobros')}>
          <Euro size={15}/> Cobros academia
        </button>
        <button
          className={[styles.tab, activeTab==='facturas'?styles.tabActive:''].join(' ')}
          onClick={() => setActiveTab('facturas')}>
          <FileText size={15}/> Facturas FrostFox
        </button>
      </div>

      {/* Tab: Cobros */}
      {activeTab === 'cobros' && (
        <CobrosAcademia
          alumnos={alumnos}
          loading={loadingCobros}
          saving={saving}
          mes={mes}
          ano={ano}
          onPrevMes={prevMes}
          onNextMes={nextMes}
          onStatus={(id: string, status: AcademyPayment['status']) => updateStatus(id, status)}
          onNota={(id: string, nota: string) => updateNotes(id, nota)}
          onGenerar={generarMes}
          onExportar={exportarCSV}
          historico={historico}
        />
      )}

      {/* Tab: Facturas FrostFox */}
      {activeTab === 'facturas' && (
        <>
          {loadingFacturas ? (
            <div className={styles.loadingWrap}><div className={styles.spinner}/></div>
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <>
              <div className={styles.kpis}>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiIcon} style={{background:'rgba(5,150,105,0.1)',color:'#059669'}}><CheckCircle size={18} strokeWidth={1.8}/></div>
                  <div className={styles.kpiVal}>{fmt(totalPagado)}</div>
                  <div className={styles.kpiLabel}>Pagado en {currentYear}</div>
                </div>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiIcon} style={{background:'rgba(245,158,11,0.1)',color:'#d97706'}}><Clock size={18} strokeWidth={1.8}/></div>
                  <div className={styles.kpiVal}>{fmt(totalPendiente)}</div>
                  <div className={styles.kpiLabel}>Pendiente de pago</div>
                </div>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiIcon} style={{background:'rgba(37,99,235,0.1)',color:'#2563eb'}}><Calendar size={18} strokeWidth={1.8}/></div>
                  <div className={styles.kpiVal}>{proximoVenc ? fmtDate(proximoVenc.due_date) : '—'}</div>
                  <div className={styles.kpiLabel}>Próximo vencimiento</div>
                </div>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiIcon} style={{background:'rgba(124,58,237,0.1)',color:'#7c3aed'}}><TrendingUp size={18} strokeWidth={1.8}/></div>
                  <div className={styles.kpiVal}>{facturasAnyo.length}</div>
                  <div className={styles.kpiLabel}>Facturas en {currentYear}</div>
                </div>
              </div>

              {invoices.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileText size={36} strokeWidth={1.2} className={styles.emptyIcon}/>
                  <p className={styles.emptyText}>Aún no hay facturas emitidas para tu academia.</p>
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr><th>Nº Factura</th><th>Concepto</th><th>Emisión</th><th>Vencimiento</th><th>Base</th><th>IVA</th><th>Total</th><th>Estado</th><th></th></tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id} className={inv.status==='cancelled'?styles.rowCancelled:''}>
                          <td className={styles.invoiceNum}>{inv.invoice_number}</td>
                          <td className={styles.concept}>{inv.concept??'Servicio FrostFox Academy'}</td>
                          <td className={styles.dateCell}>{fmtDate(inv.created_at)}</td>
                          <td className={`${styles.dateCell} ${inv.status==='pending'&&inv.due_date&&new Date(inv.due_date)<new Date()?styles.overdue:''}`}>
                            {fmtDate(inv.due_date)}
                          </td>
                          <td className={styles.amountCell}>{fmt(inv.base_amount??0)}</td>
                          <td className={styles.amountCell}>{fmt(inv.vat_amount??0)}</td>
                          <td className={styles.amountCell}><strong>{fmt(inv.amount_cents??0)}</strong></td>
                          <td><EstadoBadge status={inv.status}/></td>
                          <td>
                            <button className={styles.downloadBtn} onClick={()=>generarPDFFactura(inv)} title="Descargar factura">
                              <Download size={14} strokeWidth={2}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className={styles.legalNote}>
                Las facturas se emiten de conformidad con el Real Decreto 1619/2012. IVA al tipo general del 21%.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
