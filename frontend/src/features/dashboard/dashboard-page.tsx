import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  Package,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Collaborator, Delivery, Epi, EpiReturn, StockBalance } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatNumber } from '@/lib/utils'
import { Link } from 'react-router-dom'

type DashboardData = {
  collaborators?: Collaborator[]
  epis?: Epi[]
  balances?: StockBalance[]
  deliveries?: Delivery[]
  returns?: EpiReturn[]
}

export function DashboardPage() {
  const { session } = useAuth()
  const [data, setData] = useState<DashboardData>({})
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!session) return
    let active = true
    setLoading(true)
    const sources = [
      ['collaborators', '/api/v1/collaborators'],
      ['epis', '/api/v1/epis'],
      ['balances', '/api/v1/stock/balances'],
      ['deliveries', '/api/v1/deliveries?limit=100'],
      ['returns', '/api/v1/returns?limit=100'],
    ] as const

    void Promise.all(sources.map(async ([key, path]) => {
      try {
        const value = await apiRequest<unknown[]>(path, {}, session.accessToken)
        return { key, value, error: undefined }
      } catch (error) {
        return { key, value: undefined, error: error instanceof Error ? error.message : 'Falha ao consultar a API.' }
      }
    })).then((results) => {
      if (!active) return
      const next: DashboardData = {}
      const nextErrors: string[] = []
      for (const result of results) {
        if (result.error) nextErrors.push(result.error)
        switch (result.key) {
          case 'collaborators': next.collaborators = result.value as Collaborator[] | undefined; break
          case 'epis': next.epis = result.value as Epi[] | undefined; break
          case 'balances': next.balances = result.value as StockBalance[] | undefined; break
          case 'deliveries': next.deliveries = result.value as Delivery[] | undefined; break
          case 'returns': next.returns = result.value as EpiReturn[] | undefined; break
        }
      }
      setData(next)
      setErrors(nextErrors)
      setLoading(false)
    })
    return () => { active = false }
  }, [session])

  const belowMinimum = data.balances?.filter((balance) => balance.abaixoDoMinimo).length
  const activeDeliveries = data.deliveries?.filter((delivery) => delivery.status === 'RASCUNHO').length
  const metrics: { label: string; value: number | undefined; icon: LucideIcon; link: string; note: string; warning?: boolean }[] = [
    { label: 'Colaboradores', value: data.collaborators?.length, icon: Users, link: '/app/collaborators', note: 'Cadastros da empresa' },
    { label: 'EPIs cadastrados', value: data.epis?.length, icon: Package, link: '/app/epis', note: 'Itens no catálogo' },
    { label: 'Itens abaixo do mínimo', value: belowMinimum, icon: AlertTriangle, link: '/app/stock', note: 'Com base no saldo disponível', warning: (belowMinimum ?? 0) > 0 },
    { label: 'Entregas em rascunho', value: activeDeliveries, icon: Truck, link: '/app/deliveries', note: 'Aguardando confirmação' },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="PAINEL OPERACIONAL"
        title="Visão geral"
        description={`Acompanhe a operação de ${session?.companyName ?? 'sua empresa'} em um só lugar.`}
        action={<span className="live-pill"><span /> Sessão autenticada</span>}
      />

      {errors.length > 0 && (
        <div className="notice notice--warning">
          <AlertTriangle size={18} />
          <div><strong>Algumas informações não puderam ser carregadas.</strong><p>Confira a conexão com o Back-End e as permissões do seu perfil. O painel não apresenta dados simulados.</p></div>
        </div>
      )}

      <div className="section-heading"><div><h2>Indicadores principais</h2><p>Dados obtidos dos módulos operacionais.</p></div><span className="subtle-meta">{loading ? 'Consultando...' : 'Consulta concluída'}</span></div>
      <div className="metric-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Link className={`metric-card ${metric.warning ? 'metric-card--warning' : ''}`} to={metric.link} key={metric.label}>
              <div className="metric-card__top"><span className="metric-icon"><Icon size={19} /></span><ArrowUpRight size={16} className="metric-arrow" /></div>
              <div className="metric-value">{loading ? '—' : metric.value === undefined ? '—' : formatNumber(metric.value, 0)}</div>
              <div className="metric-label">{metric.label}</div>
              <div className="metric-note">{metric.note}</div>
            </Link>
          )
        })}
      </div>

      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h2>Entregas recentes</h2><p>Últimos registros retornados pela API.</p></div><Link to="/app/deliveries" className="text-link">Ver entregas <ArrowUpRight size={15} /></Link></div>
          {!loading && (data.deliveries?.length ?? 0) === 0 ? (
            <div className="compact-empty"><ClipboardList size={19} /><span>Nenhuma entrega cadastrada para esta empresa.</span></div>
          ) : (
            <div className="mini-table-wrap">
              <table className="data-table data-table--compact">
                <thead><tr><th>Identificador</th><th>Data</th><th>Itens</th><th>Status</th></tr></thead>
                <tbody>
                  {(data.deliveries ?? []).slice(0, 5).map((delivery) => (
                    <tr key={delivery.id}><td className="cell-primary">{delivery.id.slice(0, 8).toUpperCase()}</td><td>{delivery.dataEntrega}</td><td>{delivery.itens?.length ?? 0}</td><td><StatusBadge value={delivery.status} /></td></tr>
                  ))}
                  {loading && <tr><td colSpan={4} className="loading-cell">Carregando registros...</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel compliance-panel">
          <div className="panel-heading"><div><h2>Resumo do estoque</h2><p>Condição dos saldos registrados.</p></div><span className="panel-icon"><ShieldCheck size={18} /></span></div>
          <div className="compliance-stats">
            <div><span className="compliance-dot compliance-dot--green" /><span>Dentro do mínimo</span><strong>{loading ? '—' : data.balances ? data.balances.filter((item) => !item.abaixoDoMinimo).length : '—'}</strong></div>
            <div><span className="compliance-dot compliance-dot--amber" /><span>Abaixo do mínimo</span><strong>{loading ? '—' : belowMinimum ?? '—'}</strong></div>
            <div><span className="compliance-dot compliance-dot--slate" /><span>Saldo vencido</span><strong>{loading ? '—' : data.balances ? data.balances.filter((item) => Number(item.saldoVencido) > 0).length : '—'}</strong></div>
          </div>
          <Link to="/app/stock" className="panel-bottom-link">Abrir controle de estoque <ArrowUpRight size={15} /></Link>
        </section>
      </div>

      <div className="dashboard-footer-note"><ShieldCheck size={16} /><span>Os indicadores respeitam o escopo da empresa selecionada e as permissões do seu usuário.</span></div>
    </div>
  )
}
