import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Edit3, Plus, RefreshCw, Search, Users, X } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Collaborator, Sector } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatNumber } from '@/lib/utils'

type SectorForm = { nome: string; descricao: string }
type StatusFilter = 'TODOS' | 'ATIVOS' | 'INATIVOS'
const emptyForm: SectorForm = { nome: '', descricao: '' }

export function SectorsPage() {
  const { session } = useAuth()
  const [sectors, setSectors] = useState<Sector[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SectorForm>(emptyForm)
  const canManage = session?.companyProfile === 'ADMIN' || session?.companyProfile === 'ALMOXARIFE'
  const isAdmin = session?.companyProfile === 'ADMIN'

  async function load() {
    if (!session) return
    setLoading(true); setError('')
    const results = await Promise.allSettled([
      apiRequest<Sector[]>('/api/v1/sectors?includeInactive=true', {}, session.accessToken),
      apiRequest<Collaborator[]>('/api/v1/collaborators', {}, session.accessToken),
    ])
    const failures: string[] = []
    if (results[0].status === 'fulfilled') setSectors(results[0].value)
    else failures.push(results[0].reason instanceof Error ? results[0].reason.message : 'Não foi possível consultar os setores.')
    if (results[1].status === 'fulfilled') setCollaborators(results[1].value)
    else failures.push(results[1].reason instanceof Error ? results[1].reason.message : 'Não foi possível consultar os vínculos de colaboradores.')
    setError(failures.join(' ')); setLoading(false)
  }

  useEffect(() => { void load() }, [session?.accessToken])

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return sectors.filter((sector) =>
      (statusFilter === 'TODOS' || (statusFilter === 'ATIVOS' ? sector.ativo : !sector.ativo)) &&
      (!query || [sector.nome, sector.descricao].some((value) => value?.toLocaleLowerCase('pt-BR').includes(query))),
    )
  }, [sectors, search, statusFilter])

  function openCreate() { setEditingId(null); setForm(emptyForm); setError(''); setSuccess(''); setShowForm(true) }
  function openEdit(sector: Sector) { setEditingId(sector.id); setForm({ nome: sector.nome, descricao: sector.descricao ?? '' }); setError(''); setSuccess(''); setShowForm(true) }
  function change(field: keyof SectorForm, value: string) { setForm((current) => ({ ...current, [field]: value })) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    const nome = form.nome.trim()
    if (sectors.some((sector) => sector.id !== editingId && sector.nome.trim().toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))) {
      setError('Já existe um setor com este nome nesta empresa.'); return
    }
    setError(''); setSuccess(''); setSaving(true)
    try {
      await apiRequest<Sector>(editingId ? `/api/v1/sectors/${editingId}` : '/api/v1/sectors', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({ nome, descricao: form.descricao.trim() || null }),
      }, session.accessToken)
      setShowForm(false); setSuccess(editingId ? 'Setor atualizado com sucesso.' : 'Setor cadastrado com sucesso.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o setor.') }
    finally { setSaving(false) }
  }

  async function changeStatus(sector: Sector, active: boolean) {
    if (!session) return
    const action = active ? 'reativar' : 'inativar'
    const detail = active ? 'O setor voltará a aparecer nas opções de vínculo.' : 'O histórico e os vínculos existentes serão preservados. Novos vínculos com setores inativos são bloqueados pela API.'
    if (!window.confirm(`Deseja ${action} o setor "${sector.nome}"? ${detail}`)) return
    setError(''); setSuccess('')
    try {
      await apiRequest<Sector>(`/api/v1/sectors/${sector.id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' }, session.accessToken)
      setSuccess(`Setor "${sector.nome}" ${active ? 'reativado' : 'inativado'} com sucesso.`)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a situação do setor.') }
  }

  const activeCount = sectors.filter((sector) => sector.ativo).length
  const inactiveCount = sectors.length - activeCount
  const linkedCount = (id: string) => collaborators.filter((person) => person.setorId === id).length

  return <div className="page-stack">
    <PageHeader eyebrow="ESTRUTURA ORGANIZACIONAL" title="Setores" description="Organize os departamentos da empresa e acompanhe os colaboradores vinculados a cada área." action={canManage ? <button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Novo setor</button> : undefined} />
    {success && <div className="notice notice--success"><CheckCircle2 size={17} /><span>{success}</span></div>}
    {error && <div className="notice notice--danger" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
    <div className="collaborator-kpi-grid">
      <div className="collaborator-kpi"><span>Setores ativos</span><strong>{loading ? '—' : formatNumber(activeCount, 0)}</strong><small>Disponíveis para novos vínculos</small></div>
      <div className="collaborator-kpi collaborator-kpi--muted"><span>Setores inativos</span><strong>{loading ? '—' : formatNumber(inactiveCount, 0)}</strong><small>Cadastros preservados</small></div>
      <div className="collaborator-kpi collaborator-kpi--warning"><span>Colaboradores vinculados</span><strong>{loading ? '—' : formatNumber(collaborators.filter((person) => person.setorId).length, 0)}</strong><small>Vínculos cadastrados na empresa</small></div>
    </div>

    {showForm && <section className="panel collaborator-form-panel">
      <div className="panel-heading"><div><h2>{editingId ? 'Editar setor' : 'Cadastrar setor'}</h2><p>Informe o nome e uma descrição para identificar a área.</p></div><button className="icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X size={18} /></button></div>
      <form className="receipt-form" onSubmit={submit}>
        <div className="form-grid">
          <div className="form-field form-field--wide"><label htmlFor="sector-name">Nome do setor *</label><input id="sector-name" value={form.nome} onChange={(event) => change('nome', event.target.value)} maxLength={120} required /></div>
          <div className="form-field form-field--wide"><label htmlFor="sector-description">Descrição</label><textarea id="sector-description" value={form.descricao} onChange={(event) => change('descricao', event.target.value)} maxLength={2000} rows={3} /></div>
        </div>
        <div className="collaborator-form-note"><Users size={16} /><span>O nome do setor deve ser único dentro da empresa. A inativação não apaga colaboradores nem o histórico de entregas.</span></div>
        <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar setor'}</button></div>
      </form>
    </section>}

    <section className="panel data-panel">
      <div className="data-toolbar collaborator-toolbar">
        <div className="data-toolbar__summary"><strong>{loading ? '—' : formatNumber(filtered.length, 0)}</strong><span>setores encontrados</span></div>
        <div className="data-toolbar__actions">
          <label className="search-field"><Search size={16} /><input aria-label="Pesquisar setores" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou descrição" /></label>
          <select aria-label="Filtrar situação do setor" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="TODOS">Todas as situações</option><option value="ATIVOS">Ativos</option><option value="INATIVOS">Inativos</option></select>
          <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Atualizar</button>
        </div>
      </div>
      {loading ? <div className="loading-cell loading-pad">Carregando setores...</div> : filtered.length === 0 ? <EmptyState title={search || statusFilter !== 'TODOS' ? 'Nenhum setor encontrado' : 'Nenhum setor cadastrado'} description={search || statusFilter !== 'TODOS' ? 'Altere os filtros ou os termos da pesquisa.' : 'Cadastre os setores para organizar os colaboradores da empresa.'} /> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Setor</th><th>Descrição</th><th>Colaboradores</th><th>Situação</th>{canManage && <th>Ações</th>}</tr></thead>
          <tbody>{filtered.map((sector) => <tr key={sector.id}>
            <td><div className="collaborator-name-cell"><strong>{sector.nome}</strong><small>Cadastro organizacional</small></div></td>
            <td>{sector.descricao || '—'}</td><td>{formatNumber(linkedCount(sector.id), 0)}</td><td><StatusBadge value={sector.ativo ? 'ATIVO' : 'INATIVO'} /></td>
            {canManage && <td><div className="collaborator-row-actions">
              <button className="secondary-button" type="button" onClick={() => openEdit(sector)}><Edit3 size={14} /> Editar</button>
              {isAdmin && sector.ativo && <button className="collaborator-action collaborator-action--danger" type="button" onClick={() => void changeStatus(sector, false)}>Inativar</button>}
              {isAdmin && !sector.ativo && <button className="collaborator-action collaborator-action--success" type="button" onClick={() => void changeStatus(sector, true)}>Reativar</button>}
            </div></td>}
          </tr>)}</tbody>
        </table></div>
      )}
      <div className="data-panel__footer"><span>Empresa: <strong>{session?.companyName}</strong></span><span>Dados consultados pela API autenticada</span></div>
    </section>
  </div>
}
