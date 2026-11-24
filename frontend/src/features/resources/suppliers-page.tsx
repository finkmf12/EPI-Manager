import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, Edit3, Plus, RefreshCw, Search, ShieldCheck, Truck, X } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Supplier } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatNumber } from '@/lib/utils'

type SupplierForm = { razaoSocial: string; nomeFantasia: string; cnpj: string; email: string; telefone: string; contato: string }
type StatusFilter = 'TODOS' | 'ATIVOS' | 'INATIVOS'
const emptyForm: SupplierForm = { razaoSocial: '', nomeFantasia: '', cnpj: '', email: '', telefone: '', contato: '' }

function normalizeCnpj(value: string) { return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() }
function formatCnpj(value: string) {
  const raw = normalizeCnpj(value).slice(0, 14)
  if (raw === 'DEMO0000000000') return raw
  if (raw.length <= 2) return raw
  if (raw.length <= 5) return raw.replace(/^(.{2})(.*)$/, '$1.$2')
  if (raw.length <= 8) return raw.replace(/^(.{2})(.{3})(.*)$/, '$1.$2.$3')
  if (raw.length <= 12) return raw.replace(/^(.{2})(.{3})(.{3})(.*)$/, '$1.$2.$3/$4')
  return raw.replace(/^(.{2})(.{3})(.{3})(.{4})(.*)$/, '$1.$2.$3/$4-$5')
}
function validCnpj(value: string) {
  const cnpj = normalizeCnpj(value)
  if (!cnpj) return true
  if (cnpj === 'DEMO0000000000') return true
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj) || new Set(cnpj).size === 1) return false
  const digit = (base: string, weights: number[]) => {
    const sum = [...base].reduce((total, char, index) => total + (char.charCodeAt(0) - 48) * weights[index], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  const first = digit(cnpj.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2])
  const second = digit(cnpj.slice(0, 12) + first, [6,5,4,3,2,9,8,7,6,5,4,3,2])
  return cnpj.endsWith(`${first}${second}`)
}

export function SuppliersPage() {
  const { session } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ATIVOS')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SupplierForm>(emptyForm)
  const canManage = session?.companyProfile === 'ADMIN' || session?.companyProfile === 'ALMOXARIFE'
  const isAdmin = session?.companyProfile === 'ADMIN'

  async function load() {
    if (!session) return
    setLoading(true); setError('')
    try {
      setSuppliers(await apiRequest<Supplier[]>('/api/v1/suppliers?includeInactive=true', {}, session.accessToken))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível consultar os fornecedores.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [session?.accessToken])

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return suppliers.filter((supplier) => {
      const matchesStatus = statusFilter === 'TODOS' || (statusFilter === 'ATIVOS' ? supplier.ativo : !supplier.ativo)
      const matchesText = !query || [supplier.razaoSocial, supplier.nomeFantasia, supplier.cnpj, supplier.email, supplier.telefone, supplier.contato]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(query))
      return matchesStatus && matchesText
    })
  }, [suppliers, search, statusFilter])

  function openCreate() { setEditingId(null); setForm(emptyForm); setError(''); setSuccess(''); setShowForm(true) }
  function openEdit(supplier: Supplier) {
    setEditingId(supplier.id)
    setForm({ razaoSocial: supplier.razaoSocial, nomeFantasia: supplier.nomeFantasia ?? '', cnpj: supplier.cnpj ? formatCnpj(supplier.cnpj) : '', email: supplier.email ?? '', telefone: supplier.telefone ?? '', contato: supplier.contato ?? '' })
    setError(''); setSuccess(''); setShowForm(true)
  }
  function change(field: keyof SupplierForm, value: string) { setForm((current) => ({ ...current, [field]: value })) }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    const cnpj = normalizeCnpj(form.cnpj)
    if (!validCnpj(cnpj)) { setError('CNPJ inválido. Confira os 14 caracteres e os dígitos verificadores.'); return }
    if (cnpj && suppliers.some((supplier) => supplier.id !== editingId && normalizeCnpj(supplier.cnpj ?? '') === cnpj)) {
      setError('Já existe um fornecedor com este CNPJ nesta empresa.'); return
    }
    setError(''); setSuccess(''); setSaving(true)
    const payload = {
      razaoSocial: form.razaoSocial.trim(), nomeFantasia: form.nomeFantasia.trim() || null,
      cnpj: cnpj || null, email: form.email.trim() || null, telefone: form.telefone.trim() || null,
      contato: form.contato.trim() || null,
    }
    try {
      await apiRequest<Supplier>(editingId ? `/api/v1/suppliers/${editingId}` : '/api/v1/suppliers', {
        method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload),
      }, session.accessToken)
      setShowForm(false); setSuccess(editingId ? 'Cadastro do fornecedor atualizado.' : 'Fornecedor cadastrado com sucesso.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o fornecedor.') }
    finally { setSaving(false) }
  }

  async function changeStatus(supplier: Supplier, active: boolean) {
    if (!session) return
    const action = active ? 'reativar' : 'inativar'
    const detail = active ? 'Ele voltará a aparecer nas opções de novos recebimentos.' : 'O fornecedor deixará de aparecer para novas operações. Lotes e movimentações já registrados serão preservados.'
    if (!window.confirm(`Deseja ${action} "${supplier.nomeFantasia || supplier.razaoSocial}"? ${detail}`)) return
    setError(''); setSuccess('')
    try {
      await apiRequest<Supplier>(`/api/v1/suppliers/${supplier.id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' }, session.accessToken)
      setSuccess(`Fornecedor ${active ? 'reativado' : 'inativado'} com sucesso. Histórico preservado.`)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a situação do fornecedor.') }
  }

  const activeCount = suppliers.filter((item) => item.ativo).length
  const inactiveCount = suppliers.length - activeCount
  const contactCount = suppliers.filter((item) => item.ativo && (item.email || item.telefone)).length

  return <div className="page-stack">
    <PageHeader eyebrow="CADEIA DE SUPRIMENTOS" title="Fornecedores" description="Mantenha os dados comerciais e contatos dos fornecedores vinculados às entradas de estoque." action={canManage ? <button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Novo fornecedor</button> : undefined} />
    {success && <div className="notice notice--success"><CheckCircle2 size={17} /><span>{success}</span></div>}
    {error && <div className="notice notice--danger" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
    <div className="collaborator-kpi-grid">
      <div className="collaborator-kpi"><span>Fornecedores ativos</span><strong>{loading ? '—' : formatNumber(activeCount, 0)}</strong><small>Disponíveis para novos recebimentos</small></div>
      <div className="collaborator-kpi collaborator-kpi--muted"><span>Fornecedores inativos</span><strong>{loading ? '—' : formatNumber(inactiveCount, 0)}</strong><small>Histórico comercial preservado</small></div>
      <div className="collaborator-kpi collaborator-kpi--warning"><span>Com contato cadastrado</span><strong>{loading ? '—' : formatNumber(contactCount, 0)}</strong><small>Ativos com e-mail ou telefone</small></div>
    </div>

    {showForm && <section className="panel collaborator-form-panel">
      <div className="panel-heading"><div><h2>{editingId ? 'Editar fornecedor' : 'Cadastrar fornecedor'}</h2><p>Preencha os dados legais e os canais de contato comercial.</p></div><button className="icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X size={18} /></button></div>
      <form className="receipt-form" onSubmit={submit}>
        <div className="form-grid">
          <div className="form-field form-field--wide"><label htmlFor="supplier-legal-name">Razão social *</label><input id="supplier-legal-name" value={form.razaoSocial} onChange={(event) => change('razaoSocial', event.target.value)} maxLength={180} required /></div>
          <div className="form-field"><label htmlFor="supplier-trade-name">Nome fantasia</label><input id="supplier-trade-name" value={form.nomeFantasia} onChange={(event) => change('nomeFantasia', event.target.value)} maxLength={180} /></div>
          <div className="form-field"><label htmlFor="supplier-cnpj">CNPJ</label><input id="supplier-cnpj" value={form.cnpj} onChange={(event) => change('cnpj', formatCnpj(event.target.value))} maxLength={18} placeholder="00.000.000/0000-00" autoComplete="off" /><small className="supplier-field-hint">Aceita CNPJ numérico ou o novo formato alfanumérico.</small></div>
          <div className="form-field"><label htmlFor="supplier-email">E-mail comercial</label><input id="supplier-email" type="email" value={form.email} onChange={(event) => change('email', event.target.value)} maxLength={254} /></div>
          <div className="form-field"><label htmlFor="supplier-phone">Telefone</label><input id="supplier-phone" type="tel" value={form.telefone} onChange={(event) => change('telefone', event.target.value)} maxLength={30} placeholder="(00) 00000-0000" /></div>
          <div className="form-field"><label htmlFor="supplier-contact">Pessoa de contato</label><input id="supplier-contact" value={form.contato} onChange={(event) => change('contato', event.target.value)} maxLength={120} /></div>
        </div>
        <div className="collaborator-form-note"><Truck size={16} /><span>O CNPJ é validado com dígitos verificadores e não pode se repetir dentro da mesma empresa. A inativação não apaga lotes ou recebimentos anteriores.</span></div>
        <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar fornecedor'}</button></div>
      </form>
    </section>}

    <section className="panel data-panel">
      <div className="data-toolbar collaborator-toolbar">
        <div className="data-toolbar__summary"><strong>{loading ? '—' : formatNumber(filtered.length, 0)}</strong><span>fornecedores encontrados</span></div>
        <div className="data-toolbar__actions">
          <label className="search-field"><Search size={16} /><input aria-label="Pesquisar fornecedores" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Razão social, CNPJ ou contato" /></label>
          <select aria-label="Filtrar situação do fornecedor" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="ATIVOS">Ativos</option><option value="INATIVOS">Inativos</option><option value="TODOS">Todos</option></select>
          <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Atualizar</button>
        </div>
      </div>
      {loading ? <div className="loading-cell loading-pad">Carregando fornecedores...</div> : filtered.length === 0 ? <EmptyState title="Nenhum fornecedor encontrado" description={search || statusFilter !== 'TODOS' ? 'Altere os filtros ou os termos da pesquisa.' : 'Cadastre fornecedores para associá-los aos recebimentos de estoque.'} /> : (
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Fornecedor</th><th>CNPJ</th><th>Contato comercial</th><th>Pessoa de contato</th><th>Situação</th>{canManage && <th>Ações</th>}</tr></thead>
          <tbody>{filtered.map((supplier) => <tr key={supplier.id}>
            <td><div className="collaborator-name-cell"><strong>{supplier.nomeFantasia || supplier.razaoSocial}</strong><small>{supplier.nomeFantasia ? supplier.razaoSocial : 'Razão social'}</small></div></td>
            <td className="supplier-cnpj">{supplier.cnpj ? formatCnpj(supplier.cnpj) : '—'}</td>
            <td><div className="supplier-contact-cell"><span>{supplier.email || '—'}</span><small>{supplier.telefone || 'Sem telefone'}</small></div></td>
            <td>{supplier.contato || '—'}</td><td><StatusBadge value={supplier.ativo ? 'ATIVO' : 'INATIVO'} /></td>
            {canManage && <td><div className="collaborator-row-actions">
              <button className="secondary-button" type="button" onClick={() => openEdit(supplier)} disabled={!supplier.ativo}><Edit3 size={14} /> Editar</button>
              {isAdmin && supplier.ativo && <button className="collaborator-action collaborator-action--danger" type="button" onClick={() => void changeStatus(supplier, false)}>Inativar</button>}
              {isAdmin && !supplier.ativo && <button className="collaborator-action collaborator-action--success" type="button" onClick={() => void changeStatus(supplier, true)}>Reativar</button>}
            </div></td>}
          </tr>)}</tbody>
        </table></div>
      )}
      <div className="data-panel__footer"><span>Empresa: <strong>{session?.companyName}</strong></span><span>Cadastro integrado à API autenticada</span></div>
    </section>
  </div>
}
