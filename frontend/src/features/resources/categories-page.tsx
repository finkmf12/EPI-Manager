import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Edit3, Package, Plus, RefreshCw, Search, X } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Category, Epi } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatNumber } from '@/lib/utils'

type CategoryForm = { nome: string; descricao: string }
type StatusFilter = 'TODOS' | 'ATIVOS' | 'INATIVOS'
const emptyForm: CategoryForm = { nome: '', descricao: '' }

export function CategoriesPage() {
  const { session } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [epis, setEpis] = useState<Epi[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const canManage = session?.companyProfile === 'ADMIN' || session?.companyProfile === 'ALMOXARIFE'
  const isAdmin = session?.companyProfile === 'ADMIN'

  async function load() {
    if (!session) return
    setLoading(true); setError('')
    const results = await Promise.allSettled([
      apiRequest<Category[]>('/api/v1/categories?includeInactive=true', {}, session.accessToken),
      apiRequest<Epi[]>('/api/v1/epis', {}, session.accessToken),
    ])
    const failures: string[] = []
    if (results[0].status === 'fulfilled') setCategories(results[0].value)
    else failures.push(results[0].reason instanceof Error ? results[0].reason.message : 'Não foi possível consultar as categorias.')
    if (results[1].status === 'fulfilled') setEpis(results[1].value)
    else failures.push(results[1].reason instanceof Error ? results[1].reason.message : 'Não foi possível consultar os vínculos com EPIs.')
    setError(failures.join(' ')); setLoading(false)
  }

  useEffect(() => { void load() }, [session?.accessToken])

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return categories.filter((category) =>
      (statusFilter === 'TODOS' || (statusFilter === 'ATIVOS' ? category.ativo : !category.ativo)) &&
      (!query || [category.nome, category.descricao].some((value) => value?.toLocaleLowerCase('pt-BR').includes(query))),
    )
  }, [categories, search, statusFilter])

  function openCreate() { setEditingId(null); setForm(emptyForm); setError(''); setSuccess(''); setShowForm(true) }
  function openEdit(category: Category) { setEditingId(category.id); setForm({ nome: category.nome, descricao: category.descricao ?? '' }); setError(''); setSuccess(''); setShowForm(true) }
  function change(field: keyof CategoryForm, value: string) { setForm((current) => ({ ...current, [field]: value })) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    const nome = form.nome.trim()
    if (categories.some((category) => category.id !== editingId && category.nome.trim().toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))) {
      setError('Já existe uma categoria com este nome nesta empresa.'); return
    }
    setError(''); setSuccess(''); setSaving(true)
    try {
      await apiRequest<Category>(editingId ? `/api/v1/categories/${editingId}` : '/api/v1/categories', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({ nome, descricao: form.descricao.trim() || null }),
      }, session.accessToken)
      setShowForm(false); setSuccess(editingId ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a categoria.') }
    finally { setSaving(false) }
  }

  async function changeStatus(category: Category, active: boolean) {
    if (!session) return
    const action = active ? 'reativar' : 'inativar'
    const detail = active ? 'A categoria voltará a aparecer nas opções do catálogo.' : 'Os EPIs e o histórico existentes serão preservados. Novos cadastros não poderão usar esta categoria.'
    if (!window.confirm(`Deseja ${action} a categoria "${category.nome}"? ${detail}`)) return
    setError(''); setSuccess('')
    try {
      await apiRequest<Category>(`/api/v1/categories/${category.id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' }, session.accessToken)
      setSuccess(`Categoria "${category.nome}" ${active ? 'reativada' : 'inativada'} com sucesso.`)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a situação da categoria.') }
  }

  const activeCount = categories.filter((category) => category.ativo).length
  const inactiveCount = categories.length - activeCount
  const linkedCount = (id: string) => epis.filter((epi) => epi.categoriaId === id).length

  return <div className="page-stack">
    <PageHeader eyebrow="CATÁLOGO E CLASSIFICAÇÃO" title="Categorias" description="Organize os equipamentos por tipo e mantenha o catálogo padronizado." action={canManage ? <button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Nova categoria</button> : undefined} />
    {success && <div className="notice notice--success"><CheckCircle2 size={17} /><span>{success}</span></div>}
    {error && <div className="notice notice--danger" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
    <div className="collaborator-kpi-grid">
      <div className="collaborator-kpi"><span>Categorias ativas</span><strong>{loading ? '—' : formatNumber(activeCount, 0)}</strong><small>Disponíveis para o catálogo</small></div>
      <div className="collaborator-kpi collaborator-kpi--muted"><span>Categorias inativas</span><strong>{loading ? '—' : formatNumber(inactiveCount, 0)}</strong><small>Cadastros preservados</small></div>
      <div className="collaborator-kpi collaborator-kpi--warning"><span>EPIs classificados</span><strong>{loading ? '—' : formatNumber(epis.filter((epi) => epi.categoriaId).length, 0)}</strong><small>Equipamentos com categoria vinculada</small></div>
    </div>

    {showForm && <section className="panel collaborator-form-panel">
      <div className="panel-heading"><div><h2>{editingId ? 'Editar categoria' : 'Cadastrar categoria'}</h2><p>Informe um nome claro e uma descrição para classificar os EPIs.</p></div><button className="icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X size={18} /></button></div>
      <form className="receipt-form" onSubmit={submit}>
        <div className="form-grid">
          <div className="form-field form-field--wide"><label htmlFor="category-name">Nome da categoria *</label><input id="category-name" value={form.nome} onChange={(event) => change('nome', event.target.value)} maxLength={120} required /></div>
          <div className="form-field form-field--wide"><label htmlFor="category-description">Descrição</label><textarea id="category-description" value={form.descricao} onChange={(event) => change('descricao', event.target.value)} maxLength={2000} rows={3} /></div>
        </div>
        <div className="collaborator-form-note"><Package size={16} /><span>O nome deve ser único dentro da empresa. A inativação preserva os EPIs já vinculados e o histórico operacional.</span></div>
        <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar categoria'}</button></div>
      </form>
    </section>}

    <section className="panel data-panel">
      <div className="data-toolbar collaborator-toolbar">
        <div className="data-toolbar__summary"><strong>{loading ? '—' : formatNumber(filtered.length, 0)}</strong><span>categorias encontradas</span></div>
        <div className="data-toolbar__actions">
          <label className="search-field"><Search size={16} /><input aria-label="Pesquisar categorias" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou descrição" /></label>
          <select aria-label="Filtrar situação da categoria" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="TODOS">Todas as situações</option><option value="ATIVOS">Ativas</option><option value="INATIVOS">Inativas</option></select>
          <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Atualizar</button>
        </div>
      </div>
      {loading ? <div className="loading-cell loading-pad">Carregando categorias...</div> : filtered.length === 0 ? <EmptyState title={search || statusFilter !== 'TODOS' ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'} description={search || statusFilter !== 'TODOS' ? 'Altere os filtros ou os termos da pesquisa.' : 'Cadastre categorias para organizar os equipamentos de proteção.'} /> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Categoria</th><th>Descrição</th><th>EPIs vinculados</th><th>Situação</th>{canManage && <th>Ações</th>}</tr></thead>
          <tbody>{filtered.map((category) => <tr key={category.id}>
            <td><div className="collaborator-name-cell"><strong>{category.nome}</strong><small>Classificação de equipamentos</small></div></td>
            <td>{category.descricao || '—'}</td><td>{formatNumber(linkedCount(category.id), 0)}</td><td><StatusBadge value={category.ativo ? 'ATIVO' : 'INATIVO'} /></td>
            {canManage && <td><div className="collaborator-row-actions">
              {category.ativo && <button className="secondary-button" type="button" onClick={() => openEdit(category)}><Edit3 size={14} /> Editar</button>}
              {isAdmin && category.ativo && <button className="collaborator-action collaborator-action--danger" type="button" onClick={() => void changeStatus(category, false)}>Inativar</button>}
              {isAdmin && !category.ativo && <button className="collaborator-action collaborator-action--success" type="button" onClick={() => void changeStatus(category, true)}>Reativar</button>}
            </div></td>}
          </tr>)}</tbody>
        </table></div>
      )}
      <div className="data-panel__footer"><span>Empresa: <strong>{session?.companyName}</strong></span><span>Dados consultados pela API autenticada</span></div>
    </section>
  </div>
}
