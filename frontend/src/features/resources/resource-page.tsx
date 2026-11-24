import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { apiRequest } from '@/api/client'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatNumber } from '@/lib/utils'

type GenericRow = Record<string, unknown>
type ResourceDefinition = {
  title: string
  description: string
  path: string
  columns: { key: string; label: string; kind?: 'date' | 'number' | 'status' }[]
  emptyTitle?: string
}

export const resources: Record<string, ResourceDefinition> = {
  collaborators: {
    title: 'Colaboradores', description: 'Consulte os colaboradores vinculados à empresa selecionada.', path: '/api/v1/collaborators',
    columns: [{ key: 'matricula', label: 'Matrícula' }, { key: 'nome', label: 'Nome' }, { key: 'cargo', label: 'Cargo' }, { key: 'email', label: 'E-mail' }, { key: 'dataAdmissao', label: 'Admissão', kind: 'date' }, { key: 'status', label: 'Situação', kind: 'status' }],
  },
  sectors: {
    title: 'Setores', description: 'Organize os colaboradores por área ou departamento.', path: '/api/v1/sectors',
    columns: [{ key: 'nome', label: 'Setor' }, { key: 'descricao', label: 'Descrição' }, { key: 'ativo', label: 'Situação', kind: 'status' }],
  },
  epis: {
    title: 'Catálogo de EPIs', description: 'Consulte os equipamentos cadastrados, seus CAs e parâmetros de estoque.', path: '/api/v1/epis',
    columns: [{ key: 'codigo', label: 'Código' }, { key: 'nome', label: 'EPI' }, { key: 'numeroCa', label: 'CA' }, { key: 'caValidade', label: 'Validade do CA', kind: 'date' }, { key: 'unidadeMedida', label: 'Unidade' }, { key: 'estoqueMinimo', label: 'Estoque mínimo', kind: 'number' }, { key: 'ativo', label: 'Situação', kind: 'status' }],
  },
  categories: {
    title: 'Categorias', description: 'Gerencie a classificação do catálogo de equipamentos.', path: '/api/v1/categories',
    columns: [{ key: 'nome', label: 'Categoria' }, { key: 'descricao', label: 'Descrição' }, { key: 'ativo', label: 'Situação', kind: 'status' }],
  },
  suppliers: {
    title: 'Fornecedores', description: 'Consulte os fornecedores vinculados aos recebimentos de estoque.', path: '/api/v1/suppliers',
    columns: [{ key: 'razaoSocial', label: 'Razão social' }, { key: 'nomeFantasia', label: 'Nome fantasia' }, { key: 'cnpj', label: 'CNPJ' }, { key: 'email', label: 'E-mail' }, { key: 'telefone', label: 'Telefone' }, { key: 'ativo', label: 'Situação', kind: 'status' }],
  },
  deliveries: {
    title: 'Entregas', description: 'Acompanhe as entregas de EPIs e o estado de confirmação de cada registro.', path: '/api/v1/deliveries?limit=100',
    columns: [{ key: 'id', label: 'Identificador' }, { key: 'colaboradorId', label: 'Colaborador' }, { key: 'dataEntrega', label: 'Data', kind: 'date' }, { key: 'itens', label: 'Itens', kind: 'number' }, { key: 'status', label: 'Status', kind: 'status' }],
  },
  returns: {
    title: 'Devoluções', description: 'Acompanhe devoluções vinculadas a entregas confirmadas.', path: '/api/v1/returns?limit=100',
    columns: [{ key: 'id', label: 'Identificador' }, { key: 'entregaId', label: 'Entrega' }, { key: 'dataDevolucao', label: 'Data', kind: 'date' }, { key: 'itens', label: 'Itens', kind: 'number' }, { key: 'status', label: 'Status', kind: 'status' }],
  },
}

function displayValue(row: GenericRow, column: ResourceDefinition['columns'][number]) {
  const value = row[column.key]
  if (value === null || value === undefined || value === '') return '—'
  if (column.kind === 'date') return formatDate(String(value))
  if (column.kind === 'number') {
    if (Array.isArray(value)) return formatNumber(value.length, 0)
    return formatNumber(value as number | string)
  }
  if (column.kind === 'status') return <StatusBadge value={value as string | boolean} />
  if (column.key === 'id' || column.key.toLowerCase().endsWith('id')) return String(value).slice(0, 8).toUpperCase()
  return String(value)
}

export function ResourcePage({ resourceKey }: { resourceKey: string }) {
  const definition = resources[resourceKey]
  const { session } = useAuth()
  const [rows, setRows] = useState<GenericRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    if (!session || !definition) return
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest<GenericRow[]>(definition.path, {}, session.accessToken)
      setRows(Array.isArray(result) ? result : [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [session?.accessToken, resourceKey])

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return rows
    return rows.filter((row) => Object.values(row).some((value) => {
      if (value === null || value === undefined) return false
      if (Array.isArray(value)) return String(value.length).includes(normalized)
      return String(value).toLocaleLowerCase('pt-BR').includes(normalized)
    }))
  }, [rows, search])

  if (!definition) return <EmptyState title="Módulo indisponível" description="A rota solicitada não possui uma definição de recurso." />

  return (
    <div className="page-stack">
      <PageHeader eyebrow="GESTÃO OPERACIONAL" title={definition.title} description={definition.description} />
      <section className="panel data-panel">
        <div className="data-toolbar">
          <div className="data-toolbar__summary"><strong>{loading ? 'Consultando...' : formatNumber(rows.length, 0)}</strong><span>registros retornados</span></div>
          <div className="data-toolbar__actions">
            <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar nesta lista" /></label>
            <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Atualizar</button>
          </div>
        </div>
        {error && <div className="notice notice--danger data-notice">{error}</div>}
        {!loading && !error && filteredRows.length === 0 ? (
          <EmptyState title={search ? 'Nenhum resultado para esta pesquisa' : definition.emptyTitle} description={search ? 'Altere o texto de pesquisa e tente novamente.' : 'A API não retornou registros para esta empresa. Nenhum dado de demonstração é exibido.'} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr>{definition.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
              <tbody>
                {loading && <tr><td colSpan={definition.columns.length} className="loading-cell">Carregando registros da API...</td></tr>}
                {!loading && filteredRows.map((row, index) => (
                  <tr key={String(row.id ?? index)}>
                    {definition.columns.map((column) => <td key={column.key} className={column.key === 'nome' || column.key === 'razaoSocial' ? 'cell-primary' : ''}>{displayValue(row, column)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="data-panel__footer"><span>Escopo atual: <strong>{session?.companyName}</strong></span><span>Leitura por API autenticada</span></div>
      </section>
    </div>
  )
}
