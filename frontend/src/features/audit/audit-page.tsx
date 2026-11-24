import { useEffect, useMemo, useState } from 'react'
import { Activity, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { AuditLog } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { PageHeader } from '@/components/page-header'
import { formatDateTime } from '@/lib/utils'

const actionLabels: Record<string, string> = {
  ENTRADA_ESTOQUE: 'Entrada no estoque',
  CRIAR_RASCUNHO: 'Criação de rascunho',
  CONFIRMAR: 'Confirmação',
  CANCELAR: 'Cancelamento',
}

function detailsSummary(value?: string | null) {
  if (!value) return '—'
  try {
    const data = JSON.parse(value) as Record<string, unknown>
    return Object.entries(data)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join(' · ')
  } catch {
    return value
  }
}

export function AuditPage() {
  const { session } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('TODAS')

  async function load() {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest<AuditLog[]>('/api/v1/audit-logs?limit=200', {}, session.accessToken)
      setLogs(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico de auditoria.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [session?.accessToken])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return logs.filter((log) => {
      const matchesAction = action === 'TODAS' || log.acao === action
      const haystack = [log.usuarioNome, log.acao, log.entidade, log.registroId,
        detailsSummary(log.dadosNovos), detailsSummary(log.dadosAnteriores)].join(' ').toLocaleLowerCase('pt-BR')
      return matchesAction && (!term || haystack.includes(term))
    })
  }, [logs, search, action])

  return (
    <div className="page-stack audit-page">
      <PageHeader
        eyebrow="SEGURANÇA E RASTREABILIDADE"
        title="Auditoria do sistema"
        description="Histórico de operações realizadas na empresa, com identificação do usuário, ação e horário."
        action={<button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Atualizar</button>}
      />

      <div className="audit-summary-grid">
        <section className="panel audit-summary-card"><div className="audit-summary-icon"><Activity size={18} /></div><div><strong>{logs.length}</strong><span>Registros carregados</span></div></section>
        <section className="panel audit-summary-card"><div className="audit-summary-icon"><ShieldCheck size={18} /></div><div><strong>{new Set(logs.map((log) => log.usuarioId).filter(Boolean)).size}</strong><span>Usuários identificados</span></div></section>
      </div>

      {error && <div className="notice notice--warning">{error}</div>}

      <section className="panel data-panel">
        <div className="audit-toolbar">
          <div className="audit-search"><Search size={16} /><input aria-label="Pesquisar auditoria" placeholder="Pesquisar usuário, ação ou registro..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <select aria-label="Filtrar por ação" value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="TODAS">Todas as ações</option>
            <option value="ENTRADA_ESTOQUE">Entrada no estoque</option>
            <option value="CRIAR_RASCUNHO">Criação de rascunho</option>
            <option value="CONFIRMAR">Confirmação</option>
            <option value="CANCELAR">Cancelamento</option>
          </select>
        </div>
        {loading ? <div className="loading-cell loading-pad">Consultando histórico...</div> : filtered.length === 0 ? (
          <div className="compact-empty"><Activity size={19} /><span>Nenhum registro de auditoria encontrado.</span></div>
        ) : (
          <div className="table-wrap"><table className="data-table audit-table">
            <thead><tr><th>Data e horário</th><th>Usuário</th><th>Ação</th><th>Entidade</th><th>Registro</th><th>Detalhes</th></tr></thead>
            <tbody>{filtered.map((log) => <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td className="cell-primary">{log.usuarioNome || 'Usuário não localizado'}</td>
              <td><span className="audit-action">{actionLabels[log.acao] || log.acao.replaceAll('_', ' ')}</span></td>
              <td>{log.entidade.replaceAll('_', ' ')}</td>
              <td><code>{log.registroId?.slice(0, 8).toUpperCase() || '—'}</code></td>
              <td className="audit-details">{detailsSummary(log.dadosNovos)}</td>
            </tr>)}</tbody>
          </table></div>
        )}
        <div className="data-panel__footer"><span>Exibindo até 200 eventos mais recentes.</span><span>Registros de auditoria não podem ser alterados ou excluídos pelo sistema.</span></div>
      </section>
    </div>
  )
}
