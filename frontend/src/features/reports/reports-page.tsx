import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Printer, RefreshCw } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Collaborator, Delivery, EpiReturn, StockBalance } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { PageHeader } from '@/components/page-header'
import { formatDate, formatNumber } from '@/lib/utils'

type ReportKind = 'stock' | 'deliveries' | 'returns' | 'collaborators'
type ReportRow = Record<string, string | number>

function dateValue(value: string) {
  return value ? new Date(`${value}T00:00:00`).getTime() : null
}

function csvCell(value: string | number) {
  const text = String(value ?? '')
  const safe = /^[=+@\-]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, rows: ReportRow[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const content = [
    headers.map(csvCell).join(';'),
    ...rows.map((row) => headers.map((header) => csvCell(row[header] ?? '')).join(';')),
  ].join('\r\n')
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const { session } = useAuth()
  const [kind, setKind] = useState<ReportKind>('stock')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [balances, setBalances] = useState<StockBalance[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [returns, setReturns] = useState<EpiReturn[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    if (!session) return
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([
      apiRequest<StockBalance[]>('/api/v1/stock/balances', {}, session.accessToken),
      apiRequest<Delivery[]>('/api/v1/deliveries?limit=100', {}, session.accessToken),
      apiRequest<EpiReturn[]>('/api/v1/returns?limit=100', {}, session.accessToken),
      apiRequest<Collaborator[]>('/api/v1/collaborators', {}, session.accessToken),
    ])
    const errors: string[] = []
    if (results[0].status === 'fulfilled') setBalances(results[0].value)
    else errors.push('estoque')
    if (results[1].status === 'fulfilled') setDeliveries(results[1].value)
    else errors.push('entregas')
    if (results[2].status === 'fulfilled') setReturns(results[2].value)
    else errors.push('devoluções')
    if (results[3].status === 'fulfilled') setCollaborators(results[3].value)
    else errors.push('colaboradores')
    if (errors.length) setError(`Não foi possível carregar: ${errors.join(', ')}. Confira sua conexão e permissões.`)
    setLoading(false)
  }

  useEffect(() => { void load() }, [session?.accessToken])

  const collaboratorNames = useMemo(
    () => new Map(collaborators.map((person) => [person.id, person.nome])),
    [collaborators],
  )

  const rows = useMemo<ReportRow[]>(() => {
    const inPeriod = (value: string) => {
      const timestamp = dateValue(value)
      if (timestamp === null || Number.isNaN(timestamp)) return !from && !to
      const start = dateValue(from)
      const end = dateValue(to)
      return (start === null || timestamp >= start)
        && (end === null || timestamp <= end)
    }

    if (kind === 'stock') return balances.map((item) => ({
      Código: item.codigo,
      EPI: item.nome,
      Unidade: item.unidadeMedida,
      'Saldo disponível': Number(item.saldoDisponivel),
      'Saldo vencido': Number(item.saldoVencido),
      'Estoque mínimo': Number(item.estoqueMinimo),
      Situação: item.abaixoDoMinimo ? 'Abaixo do mínimo' : 'Regular',
    }))

    if (kind === 'deliveries') return deliveries
      .filter((item) => inPeriod(item.dataEntrega))
      .map((item) => ({
        Identificador: item.id.slice(0, 8).toUpperCase(),
        Colaborador: collaboratorNames.get(item.colaboradorId) ?? 'Colaborador não localizado',
        Data: item.dataEntrega,
        Itens: item.itens?.length ?? 0,
        Quantidade: (item.itens ?? []).reduce((sum, line) => sum + Number(line.quantidade), 0),
        Status: item.status,
      }))

    if (kind === 'returns') return returns
      .filter((item) => inPeriod(item.dataDevolucao))
      .map((item) => ({
        Identificador: item.id.slice(0, 8).toUpperCase(),
        Entrega: item.entregaId.slice(0, 8).toUpperCase(),
        Data: item.dataDevolucao,
        Itens: item.itens?.length ?? 0,
        Quantidade: (item.itens ?? []).reduce((sum, line) => sum + Number(line.quantidade), 0),
        'Condição registrada': [...new Set((item.itens ?? []).map((line) => line.condicao))].join(', ') || '—',
        Status: item.status,
      }))

    return collaborators.map((person) => ({
      Matrícula: person.matricula,
      Nome: person.nome,
      Setor: person.setorId ?? '—',
      Cargo: person.cargo ?? '—',
      Situação: person.status,
    }))
  }, [kind, balances, deliveries, returns, collaborators, collaboratorNames, from, to])

  const titles: Record<ReportKind, string> = {
    stock: 'Relatório de estoque',
    deliveries: 'Relatório de entregas',
    returns: 'Relatório de devoluções',
    collaborators: 'Relatório de colaboradores',
  }

  const totalQuantity = rows.reduce((sum, row) => sum + (typeof row['Saldo disponível'] === 'number'
    ? row['Saldo disponível'] : typeof row.Quantidade === 'number' ? row.Quantidade : 0), 0)

  function exportCsv() {
    downloadCsv(`epi-manager-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <div className="page-stack reports-page">
      <PageHeader
        eyebrow="GESTÃO E ANÁLISE"
        title="Relatórios"
        description="Consulte informações operacionais e exporte os dados da empresa selecionada."
        action={<button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Atualizar</button>}
      />

      {error && <div className="notice notice--warning">{error}</div>}

      <section className="panel reports-controls">
        <div className="panel-heading"><div><h2>Configuração do relatório</h2><p>Selecione o conjunto de dados e, quando aplicável, o período.</p></div></div>
        <div className="reports-filter-grid">
          <div className="form-field">
            <label htmlFor="report-kind">Tipo de relatório</label>
            <select id="report-kind" value={kind} onChange={(event) => setKind(event.target.value as ReportKind)}>
              <option value="stock">Estoque</option>
              <option value="deliveries">Entregas</option>
              <option value="returns">Devoluções</option>
              <option value="collaborators">Colaboradores</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="report-from">Data inicial</label>
            <input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} disabled={kind === 'stock' || kind === 'collaborators'} />
          </div>
          <div className="form-field">
            <label htmlFor="report-to">Data final</label>
            <input id="report-to" type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} disabled={kind === 'stock' || kind === 'collaborators'} />
          </div>
        </div>
        <div className="reports-actions">
          <button className="primary-button" type="button" onClick={exportCsv} disabled={loading || rows.length === 0}><FileSpreadsheet size={16} /> Exportar Excel (CSV)</button>
          <button className="secondary-button" type="button" onClick={() => window.print()} disabled={loading || rows.length === 0}><Printer size={16} /> Imprimir / Salvar PDF</button>
        </div>
        <p className="form-hint">O arquivo CSV é compatível com Excel. Para gerar PDF, escolha “Salvar como PDF” na janela de impressão.</p>
      </section>

      <section className="panel reports-result">
        <div className="panel-heading">
          <div><h2>{titles[kind]}</h2><p>{session?.companyName ?? 'Empresa selecionada'} · {rows.length} registro(s)</p></div>
          <span className="report-period">{from || to ? `${from ? formatDate(from) : 'Início'} até ${to ? formatDate(to) : 'Hoje'}` : 'Todos os registros disponíveis'}</span>
        </div>
        {loading ? <div className="loading-cell">Carregando dados...</div> : rows.length === 0 ? (
          <div className="compact-empty"><FileText size={19} /><span>Nenhum registro encontrado para os filtros selecionados.</span></div>
        ) : (
          <div className="mini-table-wrap">
            <table className="data-table">
              <thead><tr>{Object.keys(rows[0]).map((header) => <th key={header}>{header}</th>)}</tr></thead>
              <tbody>{rows.map((row, index) => <tr key={index}>{Object.values(row).map((value, cell) => <td key={cell}>{typeof value === 'number' ? formatNumber(value) : value}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="reports-footnote">
          <span>{kind === 'stock' ? `Saldo disponível total: ${formatNumber(totalQuantity)}` : `Dados limitados aos registros retornados pela API (até 100 por consulta).`}</span>
          <span>Gerado em {new Date().toLocaleString('pt-BR')}</span>
        </div>
      </section>
    </div>
  )
}
