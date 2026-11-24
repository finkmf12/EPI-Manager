import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, Package, RefreshCw, ShieldAlert, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '@/api/client'
import type { Delivery, Epi, StockBalance, StockLot } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { PageHeader } from '@/components/page-header'
import { formatDate, formatNumber } from '@/lib/utils'

type AlertLevel = 'critical' | 'warning' | 'info'
type AlertItem = {
  id: string
  title: string
  description: string
  level: AlertLevel
  dateLabel?: string
  href: string
  icon: typeof AlertTriangle
}

function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysUntil(date: Date, today: Date) {
  return Math.ceil((date.getTime() - today.getTime()) / 86400000)
}

export function NotificationsPage() {
  const { session } = useAuth()
  const [epis, setEpis] = useState<Epi[]>([])
  const [lots, setLots] = useState<StockLot[]>([])
  const [balances, setBalances] = useState<StockBalance[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'TODOS' | AlertLevel>('TODOS')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!session) return
    let active = true
    setLoading(true)
    void Promise.all([
      apiRequest<Epi[]>('/api/v1/epis', {}, session.accessToken),
      apiRequest<StockLot[]>('/api/v1/stock/lots', {}, session.accessToken),
      apiRequest<StockBalance[]>('/api/v1/stock/balances', {}, session.accessToken),
      apiRequest<Delivery[]>('/api/v1/deliveries?limit=100', {}, session.accessToken),
    ]).then(([epiData, lotData, balanceData, deliveryData]) => {
      if (!active) return
      setEpis(epiData); setLots(lotData); setBalances(balanceData); setDeliveries(deliveryData); setError('')
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível consultar os alertas.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session?.accessToken, refresh])

  const alerts = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const items: AlertItem[] = []

    for (const epi of epis) {
      if (!epi.ativo || !epi.caValidade) continue
      const date = parseDate(epi.caValidade)
      if (!date) continue
      const remaining = daysUntil(date, today)
      if (remaining <= 30) items.push({
        id: `ca-${epi.id}`,
        title: remaining < 0 ? 'CA vencido' : remaining === 0 ? 'CA vence hoje' : 'CA próximo do vencimento',
        description: `${epi.nome} · CA ${epi.numeroCa || 'não informado'}`,
        level: remaining < 0 ? 'critical' : 'warning',
        dateLabel: `${formatDate(epi.caValidade)} · ${remaining < 0 ? `vencido há ${Math.abs(remaining)} dia(s)` : remaining === 0 ? 'vence hoje' : `faltam ${remaining} dia(s)`}`,
        href: '/app/epis', icon: ShieldAlert,
      })
    }

    for (const lot of lots) {
      if (!lot.dataValidade || Number(lot.quantidadeDisponivel) <= 0) continue
      const date = parseDate(lot.dataValidade)
      if (!date) continue
      const remaining = daysUntil(date, today)
      if (remaining <= 30) items.push({
        id: `lot-${lot.id}`,
        title: remaining < 0 ? 'Lote vencido com saldo' : remaining === 0 ? 'Lote vence hoje' : 'Lote próximo do vencimento',
        description: `${lot.epiNome} · Lote ${lot.codigoLote} · Saldo: ${formatNumber(lot.quantidadeDisponivel)}`,
        level: remaining < 0 ? 'critical' : 'warning',
        dateLabel: `${formatDate(lot.dataValidade)} · ${remaining < 0 ? `vencido há ${Math.abs(remaining)} dia(s)` : remaining === 0 ? 'vence hoje' : `faltam ${remaining} dia(s)`}`,
        href: '/app/stock', icon: CalendarClock,
      })
    }

    for (const balance of balances) {
      if (balance.abaixoDoMinimo) items.push({
        id: `stock-${balance.epiId}`,
        title: 'Estoque abaixo do mínimo',
        description: `${balance.nome} · Disponível: ${formatNumber(balance.saldoDisponivel)} ${balance.unidadeMedida} · Mínimo: ${formatNumber(balance.estoqueMinimo)}`,
        level: 'warning', href: '/app/stock', icon: Package,
      })
    }

    for (const delivery of deliveries) {
      if (delivery.status !== 'RASCUNHO') continue
      items.push({
        id: `delivery-${delivery.id}`,
        title: 'Entrega aguardando confirmação',
        description: `Entrega ${delivery.id.slice(0, 8).toUpperCase()} · ${delivery.itens?.length ?? 0} item(ns)`,
        level: 'info', dateLabel: formatDate(delivery.dataEntrega),
        href: '/app/deliveries', icon: Truck,
      })
    }

    const rank: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 }
    return items.sort((a, b) => rank[a.level] - rank[b.level] || a.title.localeCompare(b.title, 'pt-BR'))
  }, [epis, lots, balances, deliveries])

  const visible = alerts.filter((item) => filter === 'TODOS' || item.level === filter)
  const criticalCount = alerts.filter((item) => item.level === 'critical').length
  const warningCount = alerts.filter((item) => item.level === 'warning').length
  const infoCount = alerts.filter((item) => item.level === 'info').length

  return (
    <div className="page-stack">
      <PageHeader eyebrow="MONITORAMENTO AUTOMÁTICO" title="Central de notificações" description="Alertas calculados a partir dos dados atuais de estoque, catálogo de EPIs e entregas." action={<button className="secondary-button" type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading}><RefreshCw size={16} /> Atualizar</button>} />
      <div className="notification-summary-grid">
        <div className="panel notification-summary-card notification-summary-card--critical"><ShieldAlert size={19} /><strong>{loading ? '—' : criticalCount}</strong><span>Críticos</span></div>
        <div className="panel notification-summary-card notification-summary-card--warning"><AlertTriangle size={19} /><strong>{loading ? '—' : warningCount}</strong><span>Atenção</span></div>
        <div className="panel notification-summary-card notification-summary-card--info"><Truck size={19} /><strong>{loading ? '—' : infoCount}</strong><span>Pendências</span></div>
        <div className="panel notification-summary-card"><Bell size={19} /><strong>{loading ? '—' : alerts.length}</strong><span>Total de alertas</span></div>
      </div>
      {error && <div className="notice notice--warning"><AlertTriangle size={18} /><div><strong>Não foi possível atualizar os alertas.</strong><p>{error}</p></div></div>}
      <section className="panel notification-list-panel">
        <div className="notification-toolbar">
          <div><h2>Alertas identificados</h2><p>Vencimentos são sinalizados quando faltam até 30 dias ou já passaram da validade.</p></div>
          <select aria-label="Filtrar alertas" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            <option value="TODOS">Todos os alertas</option><option value="critical">Críticos</option><option value="warning">Atenção</option><option value="info">Pendências</option>
          </select>
        </div>
        {loading ? <div className="loading-cell loading-pad">Verificando informações...</div> : visible.length === 0 ? (
          <div className="notification-empty"><CheckCircle2 size={25} /><strong>Nenhum alerta nesta categoria</strong><span>Não há ocorrências identificadas nos dados consultados.</span></div>
        ) : <div className="notification-list">{visible.map((item) => {
          const Icon = item.icon
          return <article className={`notification-item notification-item--${item.level}`} key={item.id}>
            <div className="notification-item__icon"><Icon size={18} /></div>
            <div className="notification-item__content"><strong>{item.title}</strong><p>{item.description}</p>{item.dateLabel && <small>{item.dateLabel}</small>}</div>
            <Link to={item.href} className="text-link">Ver detalhes</Link>
          </article>
        })}</div>}
        <div className="notification-footer">Os alertas são recalculados ao abrir ou atualizar esta página. Nenhum registro operacional é alterado automaticamente.</div>
      </section>
    </div>
  )
}
