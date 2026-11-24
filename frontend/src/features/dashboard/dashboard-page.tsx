import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Activity, ClipboardList,
  Database, Package, RefreshCw, ShieldCheck, Truck, Users, Clock3,
} from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { AuditLog, Collaborator, Delivery, Epi, EpiReturn, StockBalance, StockMovement } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDateTime, formatNumber } from '@/lib/utils'
import { Link } from 'react-router-dom'

type DashboardData = {
  collaborators?: Collaborator[]
  epis?: Epi[]
  balances?: StockBalance[]
  deliveries?: Delivery[]
  returns?: EpiReturn[]
  movements?: StockMovement[]
  audit?: AuditLog[]
}

const number = (value: number | string | null | undefined) => Number(value ?? 0)
const monthLabel = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')

function isEntry(type: string) {
  return /ENTRADA|RECEBIMENTO|DEVOLUCAO|RETORNO/i.test(type)
}
function isExit(type: string) {
  return /SAIDA|ENTREGA|BAIXA/i.test(type)
}

export function DashboardPage() {
  const { session } = useAuth()
  const [data, setData] = useState<DashboardData>({})
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedError, setSeedError] = useState('')
  const [seedSuccess, setSeedSuccess] = useState('')

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
      ['movements', '/api/v1/stock/movements?limit=200'],
      ...(session.companyProfile === 'ADMIN' ? [['audit', '/api/v1/audit-logs?limit=8']] : []),
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
          case 'movements': next.movements = result.value as StockMovement[] | undefined; break
          case 'audit': next.audit = result.value as AuditLog[] | undefined; break
        }
      }
      setData(next)
      setErrors(nextErrors)
      setLoading(false)
    })
    return () => { active = false }
  }, [session, refreshKey])

  async function loadDemoData() {
    if (!session) return
    setSeedLoading(true); setSeedError(''); setSeedSuccess('')
    try {
      const result = await apiRequest<{ alreadyLoaded: boolean; message: string }>(
        '/api/v1/demo/seed', { method: 'POST' }, session.accessToken,
      )
      setSeedSuccess(result.message)
      setRefreshKey((value) => value + 1)
    } catch (error) {
      setSeedError(error instanceof Error ? error.message : 'Não foi possível carregar os dados demonstrativos.')
    } finally { setSeedLoading(false) }
  }

  const showDemoLoader = !loading && session?.companyProfile === 'ADMIN'
    && (data.collaborators?.length ?? 0) === 0 && (data.epis?.length ?? 0) === 0
    && (data.deliveries?.length ?? 0) === 0

  const belowMinimum = data.balances?.filter((balance) => balance.abaixoDoMinimo).length
  const expired = data.balances?.filter((balance) => number(balance.saldoVencido) > 0) ?? []
  const pendingDeliveries = data.deliveries?.filter((delivery) => delivery.status === 'RASCUNHO').length
  const confirmedDeliveries = data.deliveries?.filter((delivery) => delivery.status === 'CONFIRMADA').length ?? 0
  const confirmedReturns = data.returns?.filter((item) => item.status === 'CONFIRMADA').length ?? 0

  const metrics: { label: string; value: number | undefined; icon: LucideIcon; link: string; note: string; warning?: boolean }[] = [
    { label: 'Colaboradores', value: data.collaborators?.length, icon: Users, link: '/app/collaborators', note: 'Cadastros da empresa' },
    { label: 'EPIs cadastrados', value: data.epis?.length, icon: Package, link: '/app/epis', note: 'Itens no catálogo' },
    { label: 'Itens abaixo do mínimo', value: belowMinimum, icon: AlertTriangle, link: '/app/stock', note: 'Com base no saldo disponível', warning: (belowMinimum ?? 0) > 0 },
    { label: 'Entregas em rascunho', value: pendingDeliveries, icon: Truck, link: '/app/deliveries', note: 'Aguardando confirmação' },
  ]

  const monthly = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0')
      const records = (data.movements ?? []).filter((movement) => (movement.createdAt ?? '').slice(0, 7) === key)
      return {
        label: monthLabel(date),
        entries: records.filter((movement) => isEntry(movement.tipo)).reduce((sum, movement) => sum + number(movement.quantidade), 0),
        exits: records.filter((movement) => isExit(movement.tipo)).reduce((sum, movement) => sum + number(movement.quantidade), 0),
      }
    })
  }, [data.movements])
  const maxMovement = Math.max(1, ...monthly.flatMap((item) => [item.entries, item.exits]))

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="PAINEL OPERACIONAL"
        title="Visão geral"
        description={`Acompanhe a operação de ${session?.companyName ?? 'sua empresa'} em um só lugar.`}
        action={<div className="dashboard-actions"><span className="live-pill"><span /> Sessão autenticada</span><button className="icon-button" type="button" title="Atualizar painel" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}><RefreshCw size={16} /></button>{showDemoLoader && <button className="primary-button demo-seed-button" type="button" onClick={() => void loadDemoData()} disabled={seedLoading}><Database size={15} />{seedLoading ? 'Preparando demonstração...' : 'Carregar dados demonstrativos'}</button>}</div>}
      />
      {seedError && <div className="notice notice--danger"><AlertTriangle size={18} /><div><strong>Não foi possível preparar a demonstração.</strong><p>{seedError}</p></div></div>}
      {seedSuccess && <div className="notice notice--success"><ShieldCheck size={18} /><div><strong>{seedSuccess}</strong><p>Os registros são fictícios. Os identificadores de CA são ilustrativos e não substituem certificados reais.</p></div></div>}
      {errors.length > 0 && <div className="notice notice--warning"><AlertTriangle size={18} /><div><strong>Algumas informações não puderam ser carregadas.</strong><p>Confira a conexão com o Back-End e as permissões do seu perfil. O painel não apresenta dados simulados.</p></div></div>}

      <div className="section-heading"><div><h2>Indicadores principais</h2><p>Dados obtidos dos módulos operacionais.</p></div><span className="subtle-meta">{loading ? 'Consultando...' : 'Consulta concluída'}</span></div>
      <div className="metric-grid">
        {metrics.map((metric) => { const Icon = metric.icon; return (
          <Link className={`metric-card ${metric.warning ? 'metric-card--warning' : ''}`} to={metric.link} key={metric.label}>
            <div className="metric-card__top"><span className="metric-icon"><Icon size={19} /></span><ArrowUpRight size={16} className="metric-arrow" /></div>
            <div className="metric-value">{loading ? '—' : metric.value === undefined ? '—' : formatNumber(metric.value, 0)}</div>
            <div className="metric-label">{metric.label}</div><div className="metric-note">{metric.note}</div>
          </Link>
        )})}
      </div>

      <div className="dashboard-insight-grid">
        <section className="panel dashboard-chart-panel">
          <div className="panel-heading"><div><h2>Movimentação de estoque</h2><p>Quantidade movimentada por mês, conforme histórico da API.</p></div><Activity size={18} /></div>
          <div className="chart-legend"><span><i className="legend-dot legend-dot--entry" /> Entradas</span><span><i className="legend-dot legend-dot--exit" /> Saídas</span></div>
          {loading ? <div className="loading-cell loading-pad">Carregando movimentações...</div> : !data.movements ? <div className="compact-empty">Não foi possível consultar as movimentações.</div> : (
            <div className="monthly-chart" role="img" aria-label="Gráfico de entradas e saídas de estoque nos últimos seis meses">
              {monthly.map((item) => <div className="monthly-chart__column" key={item.label}>
                <div className="monthly-chart__bars">
                  <div className="monthly-bar monthly-bar--entry" style={{ height: `${Math.max(item.entries ? 4 : 0, item.entries / maxMovement * 100)}%` }} title={`Entradas: ${item.entries}`} />
                  <div className="monthly-bar monthly-bar--exit" style={{ height: `${Math.max(item.exits ? 4 : 0, item.exits / maxMovement * 100)}%` }} title={`Saídas: ${item.exits}`} />
                </div><span>{item.label}</span>
              </div>)}
            </div>
          )}
          <div className="chart-footnote">Os totais consideram os movimentos disponíveis no histórico consultado (até 200 registros).</div>
        </section>
        <section className="panel dashboard-summary-panel">
          <div className="panel-heading"><div><h2>Resumo operacional</h2><p>Atividade confirmada nos módulos.</p></div><ClipboardList size={18} /></div>
          <div className="operational-stat"><span className="operational-stat__icon operational-stat__icon--blue"><Truck size={17} /></span><span>Entregas confirmadas</span><strong>{loading ? '—' : confirmedDeliveries}</strong></div>
          <div className="operational-stat"><span className="operational-stat__icon operational-stat__icon--green"><ArrowDownRight size={17} /></span><span>Devoluções confirmadas</span><strong>{loading ? '—' : confirmedReturns}</strong></div>
          <div className="operational-stat"><span className="operational-stat__icon operational-stat__icon--amber"><Package size={17} /></span><span>EPIs abaixo do mínimo</span><strong>{loading ? '—' : belowMinimum ?? '—'}</strong></div>
          <Link to="/app/reports" className="panel-bottom-link">Consultar relatórios <ArrowUpRight size={15} /></Link>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h2>Entregas recentes</h2><p>Últimos registros retornados pela API.</p></div><Link to="/app/deliveries" className="text-link">Ver entregas <ArrowUpRight size={15} /></Link></div>
          {!loading && (data.deliveries?.length ?? 0) === 0 ? <div className="compact-empty"><ClipboardList size={19} /><span>Nenhuma entrega cadastrada para esta empresa.</span></div> : (
            <div className="mini-table-wrap"><table className="data-table data-table--compact"><thead><tr><th>Identificador</th><th>Data</th><th>Itens</th><th>Status</th></tr></thead><tbody>
              {(data.deliveries ?? []).slice(0, 5).map((delivery) => <tr key={delivery.id}><td className="cell-primary">{delivery.id.slice(0, 8).toUpperCase()}</td><td>{delivery.dataEntrega}</td><td>{delivery.itens?.length ?? 0}</td><td><StatusBadge value={delivery.status} /></td></tr>)}
              {loading && <tr><td colSpan={4} className="loading-cell">Carregando registros...</td></tr>}
            </tbody></table></div>
          )}
        </section>
        <section className="panel compliance-panel">
          <div className="panel-heading"><div><h2>Alertas de estoque</h2><p>Itens que precisam de atenção.</p></div><AlertTriangle size={18} /></div>
          <div className="compliance-stats">
            <div><span className="compliance-dot compliance-dot--green" /><span>Dentro do mínimo</span><strong>{loading ? '—' : data.balances ? data.balances.filter((item) => !item.abaixoDoMinimo).length : '—'}</strong></div>
            <div><span className="compliance-dot compliance-dot--amber" /><span>Abaixo do mínimo</span><strong>{loading ? '—' : belowMinimum ?? '—'}</strong></div>
            <div><span className="compliance-dot compliance-dot--slate" /><span>Com saldo vencido</span><strong>{loading ? '—' : expired.length}</strong></div>
          </div>
          <Link to="/app/stock" className="panel-bottom-link">Abrir controle de estoque <ArrowUpRight size={15} /></Link>
        </section>
      </div>

      <section className="panel dashboard-alert-panel">
        <div className="panel-heading"><div><h2>Alertas prioritários</h2><p>Itens com saldo abaixo do mínimo ou saldo vencido.</p></div><AlertTriangle size={18} /></div>
        {loading ? <div className="loading-cell loading-pad">Verificando alertas...</div> : (data.balances ?? []).filter((item) => item.abaixoDoMinimo || number(item.saldoVencido) > 0).length === 0 ? (
          <div className="compact-empty"><ShieldCheck size={19} /><span>Nenhum alerta de estoque identificado nos saldos consultados.</span></div>
        ) : <div className="dashboard-alert-list">{(data.balances ?? []).filter((item) => item.abaixoDoMinimo || number(item.saldoVencido) > 0).slice(0, 6).map((item) => (
          <div className="dashboard-alert-item" key={item.epiId}><span className="dashboard-alert-item__icon"><AlertTriangle size={16} /></span><div><strong>{item.nome}</strong><small>{item.codigo} · Saldo disponível: {formatNumber(number(item.saldoDisponivel), 0)} {item.unidadeMedida}</small></div><div className="dashboard-alert-item__tags">{item.abaixoDoMinimo && <span className="alert-tag alert-tag--warning">Abaixo do mínimo</span>}{number(item.saldoVencido) > 0 && <span className="alert-tag alert-tag--danger">Saldo vencido: {formatNumber(number(item.saldoVencido), 0)}</span>}</div></div>
        ))}</div>}
      </section>

      {session?.companyProfile === 'ADMIN' && <section className="panel dashboard-audit-panel">
        <div className="panel-heading"><div><h2>Atividades recentes</h2><p>Últimos eventos registrados na auditoria.</p></div><Link to="/app/audit" className="text-link">Ver auditoria <ArrowUpRight size={15} /></Link></div>
        {loading ? <div className="loading-cell loading-pad">Carregando atividades...</div> : !data.audit || data.audit.length === 0 ? <div className="compact-empty"><Clock3 size={18} /><span>Nenhuma atividade recente registrada.</span></div> : (
          <div className="dashboard-audit-list">{data.audit.slice(0, 5).map((log) => <div className="dashboard-audit-item" key={log.id}><span className="dashboard-audit-item__icon"><Activity size={15} /></span><div><strong>{log.acao.replaceAll('_', ' ')}</strong><small>{log.usuarioNome || 'Usuário'} · {log.entidade.replaceAll('_', ' ')} · {log.registroId?.slice(0, 8) || '—'}</small></div><time>{formatDateTime(log.createdAt)}</time></div>)}</div>
        )}
      </section>}

      <div className="dashboard-footer-note"><ShieldCheck size={16} /><span>Os indicadores respeitam o escopo da empresa selecionada e as permissões do seu usuário.</span></div>
    </div>
  )
}
