import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Edit3, Plus, RefreshCw, Search, UserRound, UserX, X } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Collaborator, Sector } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatNumber } from '@/lib/utils'

type CollaboratorForm = { setorId: string; matricula: string; nome: string; email: string; telefone: string; cargo: string; dataAdmissao: string }
type StatusFilter = 'TODOS' | 'ATIVO' | 'AFASTADO' | 'INATIVO'
const emptyForm: CollaboratorForm = { setorId: '', matricula: '', nome: '', email: '', telefone: '', cargo: '', dataAdmissao: '' }
const today = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }

export function CollaboratorsPage() {
  const { session } = useAuth()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CollaboratorForm>(emptyForm)
  const canManage = session?.companyProfile === 'ADMIN' || session?.companyProfile === 'ALMOXARIFE'
  const isAdmin = session?.companyProfile === 'ADMIN'

  async function load() {
    if (!session) return
    setLoading(true); setError('')
    const results = await Promise.allSettled([
      apiRequest<Collaborator[]>('/api/v1/collaborators', {}, session.accessToken),
      apiRequest<Sector[]>('/api/v1/sectors?includeInactive=true', {}, session.accessToken),
    ])
    const failures: string[] = []
    if (results[0].status === 'fulfilled') setCollaborators(results[0].value)
    else failures.push(results[0].reason instanceof Error ? results[0].reason.message : 'Não foi possível consultar os colaboradores.')
    if (results[1].status === 'fulfilled') setSectors(results[1].value)
    else failures.push(results[1].reason instanceof Error ? results[1].reason.message : 'Não foi possível consultar os setores.')
    setError(failures.join(' ')); setLoading(false)
  }
  useEffect(() => { void load() }, [session?.accessToken])
  const sectorNames = useMemo(() => new Map(sectors.map((sector) => [sector.id, sector.nome])), [sectors])
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return collaborators.filter((person) => {
      const sector = person.setorId ? sectorNames.get(person.setorId) : ''
      return (statusFilter === 'TODOS' || person.status === statusFilter) &&
        (!query || [person.matricula, person.nome, person.email, person.telefone, person.cargo, sector].some((value) => value?.toLocaleLowerCase('pt-BR').includes(query)))
    })
  }, [collaborators, search, statusFilter, sectorNames])

  function openCreate() { setEditingId(null); setForm(emptyForm); setError(''); setSuccess(''); setShowForm(true) }
  function openEdit(person: Collaborator) {
    setEditingId(person.id)
    setForm({ setorId: person.setorId ?? '', matricula: person.matricula, nome: person.nome, email: person.email ?? '', telefone: person.telefone ?? '', cargo: person.cargo ?? '', dataAdmissao: person.dataAdmissao?.slice(0, 10) ?? '' })
    setError(''); setSuccess(''); setShowForm(true)
  }
  function change(field: keyof CollaboratorForm, value: string) { setForm((current) => ({ ...current, [field]: value })) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setError(''); setSuccess('')
    const matricula = form.matricula.trim()
    const duplicate = collaborators.some((person) => person.id !== editingId && person.matricula.trim().toLocaleLowerCase('pt-BR') === matricula.toLocaleLowerCase('pt-BR'))
    if (duplicate) { setError('Já existe um colaborador com esta matrícula nesta empresa.'); return }
    if (form.dataAdmissao && form.dataAdmissao > today()) { setError('A data de admissão não pode ser futura.'); return }
    setSaving(true)
    const payload = { setorId: form.setorId || null, matricula, nome: form.nome.trim(), email: form.email.trim() || null, telefone: form.telefone.trim() || null, cargo: form.cargo.trim() || null, dataAdmissao: form.dataAdmissao || null }
    try {
      await apiRequest<Collaborator>(editingId ? `/api/v1/collaborators/${editingId}` : '/api/v1/collaborators', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }, session.accessToken)
      setShowForm(false); setSuccess(editingId ? 'Cadastro do colaborador atualizado.' : 'Colaborador cadastrado com sucesso.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o colaborador.') }
    finally { setSaving(false) }
  }

  async function changeStatus(person: Collaborator, status: 'ATIVO' | 'INATIVO' | 'AFASTADO') {
    if (!session) return
    const labels = { ATIVO: 'reativar', INATIVO: 'inativar', AFASTADO: 'afastar' }
    const explanations = { ATIVO: 'O colaborador voltará a poder receber EPIs.', INATIVO: 'O colaborador não poderá receber novas entregas. O histórico será preservado.', AFASTADO: 'O colaborador ficará afastado e não poderá receber novas entregas.' }
    if (!window.confirm(`Deseja ${labels[status]} ${person.nome}? ${explanations[status]}`)) return
    setError(''); setSuccess('')
    try {
      await apiRequest<Collaborator>(`/api/v1/collaborators/${person.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, session.accessToken)
      setSuccess(`Situação de ${person.nome} alterada para ${status.toLocaleLowerCase('pt-BR')}.`)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a situação.') }
  }

  const activeCount = collaborators.filter((person) => person.status === 'ATIVO').length
  const awayCount = collaborators.filter((person) => person.status === 'AFASTADO').length
  const inactiveCount = collaborators.filter((person) => person.status === 'INATIVO').length

  return <div className="page-stack">
    <PageHeader eyebrow="GESTÃO DE PESSOAS" title="Colaboradores" description="Mantenha os dados cadastrais, vínculos com setores e situação dos profissionais da empresa." action={canManage ? <button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Novo colaborador</button> : undefined} />
    {success && <div className="notice notice--success"><CheckCircle2 size={17} /><span>{success}</span></div>}
    {error && <div className="notice notice--danger" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
    <div className="collaborator-kpi-grid">
      <div className="collaborator-kpi"><span>Ativos</span><strong>{loading ? '—' : formatNumber(activeCount, 0)}</strong><small>Elegíveis para novas entregas</small></div>
      <div className="collaborator-kpi collaborator-kpi--warning"><span>Afastados</span><strong>{loading ? '—' : formatNumber(awayCount, 0)}</strong><small>Temporariamente indisponíveis</small></div>
      <div className="collaborator-kpi collaborator-kpi--muted"><span>Inativos</span><strong>{loading ? '—' : formatNumber(inactiveCount, 0)}</strong><small>Histórico mantido no sistema</small></div>
    </div>

    {showForm && <section className="panel collaborator-form-panel">
      <div className="panel-heading"><div><h2>{editingId ? 'Editar colaborador' : 'Cadastrar colaborador'}</h2><p>Os campos marcados com * são obrigatórios.</p></div><button className="icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X size={18} /></button></div>
      <form className="receipt-form" onSubmit={submit}>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="person-registration">Matrícula *</label><input id="person-registration" value={form.matricula} onChange={(event) => change('matricula', event.target.value)} maxLength={40} autoComplete="off" required /></div>
          <div className="form-field form-field--wide"><label htmlFor="person-name">Nome completo *</label><input id="person-name" value={form.nome} onChange={(event) => change('nome', event.target.value)} maxLength={160} autoComplete="name" required /></div>
          <div className="form-field"><label htmlFor="person-sector">Setor</label><select id="person-sector" value={form.setorId} onChange={(event) => change('setorId', event.target.value)}><option value="">Sem setor vinculado</option>{sectors.filter((sector) => sector.ativo || sector.id === form.setorId).map((sector) => <option key={sector.id} value={sector.id}>{sector.nome}{sector.ativo ? '' : ' (inativo)'}</option>)}</select></div>
          <div className="form-field"><label htmlFor="person-role">Cargo / função</label><input id="person-role" value={form.cargo} onChange={(event) => change('cargo', event.target.value)} maxLength={120} /></div>
          <div className="form-field"><label htmlFor="person-email">E-mail</label><input id="person-email" type="email" value={form.email} onChange={(event) => change('email', event.target.value)} maxLength={254} autoComplete="email" /></div>
          <div className="form-field"><label htmlFor="person-phone">Telefone</label><input id="person-phone" type="tel" value={form.telefone} onChange={(event) => change('telefone', event.target.value)} maxLength={30} autoComplete="tel" /></div>
          <div className="form-field"><label htmlFor="person-admission">Data de admissão</label><input id="person-admission" type="date" max={today()} value={form.dataAdmissao} onChange={(event) => change('dataAdmissao', event.target.value)} /></div>
        </div>
        <div className="collaborator-form-note"><UserRound size={16} /><span>A matrícula deve ser única dentro da empresa. O status inicial de um novo cadastro será <strong>Ativo</strong>.</span></div>
        <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar colaborador'}</button></div>
      </form>
    </section>}

    <section className="panel data-panel">
      <div className="data-toolbar collaborator-toolbar">
        <div className="data-toolbar__summary"><strong>{loading ? '—' : formatNumber(filtered.length, 0)}</strong><span>colaboradores encontrados</span></div>
        <div className="data-toolbar__actions">
          <label className="search-field"><Search size={16} /><input aria-label="Pesquisar colaboradores" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, matrícula, cargo ou setor" /></label>
          <select aria-label="Filtrar situação do colaborador" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="TODOS">Todas as situações</option><option value="ATIVO">Ativos</option><option value="AFASTADO">Afastados</option><option value="INATIVO">Inativos</option></select>
          <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Atualizar</button>
        </div>
      </div>
      {loading ? <div className="loading-cell loading-pad">Carregando colaboradores...</div> : filtered.length === 0 ? <EmptyState title={search || statusFilter !== 'TODOS' ? 'Nenhum colaborador encontrado' : 'Nenhum colaborador cadastrado'} description={search || statusFilter !== 'TODOS' ? 'Altere os filtros ou os termos da pesquisa.' : 'Cadastre os profissionais para vincular entregas de EPIs.'} /> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Matrícula</th><th>Colaborador</th><th>Setor</th><th>Cargo</th><th>Admissão</th><th>Situação</th>{canManage && <th>Ações</th>}</tr></thead>
          <tbody>{filtered.map((person) => <tr key={person.id}>
            <td><span className="collaborator-registration">{person.matricula}</span></td>
            <td><div className="collaborator-name-cell"><strong>{person.nome}</strong><small>{person.email || person.telefone || 'Contato não informado'}</small></div></td>
            <td>{person.setorId ? sectorNames.get(person.setorId) || 'Setor não disponível' : '—'}</td>
            <td>{person.cargo || '—'}</td><td>{formatDate(person.dataAdmissao)}</td><td><StatusBadge value={person.status} /></td>
            {canManage && <td><div className="collaborator-row-actions">
              <button className="secondary-button" type="button" onClick={() => openEdit(person)}><Edit3 size={14} /> Editar</button>
              {isAdmin && person.status !== 'INATIVO' && <button className="collaborator-action collaborator-action--danger" type="button" onClick={() => void changeStatus(person, 'INATIVO')}><UserX size={14} /> Inativar</button>}
              {isAdmin && person.status === 'ATIVO' && <button className="collaborator-action collaborator-action--warning" type="button" onClick={() => void changeStatus(person, 'AFASTADO')}>Afastar</button>}
              {isAdmin && person.status !== 'ATIVO' && <button className="collaborator-action collaborator-action--success" type="button" onClick={() => void changeStatus(person, 'ATIVO')}>Reativar</button>}
            </div></td>}
          </tr>)}</tbody>
        </table></div>
      )}
      <div className="data-panel__footer"><span>Empresa: <strong>{session?.companyName}</strong></span><span>Dados consultados pela API autenticada</span></div>
    </section>
  </div>
}
