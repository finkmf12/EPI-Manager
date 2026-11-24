import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, CalendarClock, Edit3, Plus, RefreshCw, Search, ShieldCheck, X } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Epi } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatNumber } from '@/lib/utils'

type CategoryOption = { id: string; nome: string; ativo: boolean }
type EpiForm = {
  categoriaId: string; codigo: string; nome: string; descricao: string; fabricante: string
  modelo: string; numeroCa: string; caValidade: string; unidadeMedida: string
  estoqueMinimo: string; vidaUtilDias: string
}
const emptyForm: EpiForm = {
  categoriaId: '', codigo: '', nome: '', descricao: '', fabricante: '', modelo: '',
  numeroCa: '', caValidade: '', unidadeMedida: 'UN', estoqueMinimo: '0', vidaUtilDias: '',
}
const units = ['UN', 'PAR', 'CX', 'KG', 'G', 'L', 'ML', 'M', 'M2']

function caStatus(epi: Epi) {
  if (!epi.numeroCa) return { label: 'Não informado', tone: 'neutral' }
  if (!epi.caValidade) return { label: 'Sem validade cadastrada', tone: 'warning' }
  const expiry = new Date(`${epi.caValidade.slice(0, 10)}T12:00:00`)
  const today = new Date(); today.setHours(12, 0, 0, 0)
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
  if (days < 0) return { label: 'CA vencido', tone: 'danger' }
  if (days <= 30) return { label: days === 0 ? 'Vence hoje' : `Vence em ${days} dia(s)`, tone: 'warning' }
  return { label: 'Regular', tone: 'success' }
}

export function EpisPage() {
  const { session } = useAuth()
  const [epis, setEpis] = useState<Epi[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('ATIVOS')
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<EpiForm>(emptyForm)

  const canManage = session?.companyProfile === 'ADMIN' || session?.companyProfile === 'ALMOXARIFE'
  const isAdmin = session?.companyProfile === 'ADMIN'

  async function load() {
    if (!session) return
    setLoading(true); setError('')
    const results = await Promise.allSettled([
      apiRequest<Epi[]>('/api/v1/epis?includeInactive=true', {}, session.accessToken),
      apiRequest<CategoryOption[]>('/api/v1/categories', {}, session.accessToken),
    ])
    if (results[0].status === 'fulfilled') setEpis(results[0].value)
    else setError(results[0].reason instanceof Error ? results[0].reason.message : 'Não foi possível consultar o catálogo.')
    if (results[1].status === 'fulfilled') setCategories(results[1].value.filter((item) => item.ativo))
    else if (!error) setError(results[1].reason instanceof Error ? results[1].reason.message : 'Não foi possível consultar as categorias.')
    setLoading(false)
  }

  useEffect(() => { void load() }, [session?.accessToken])

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return epis.filter((epi) => {
      const matchesStatus = statusFilter === 'TODOS' || (statusFilter === 'ATIVOS' ? epi.ativo : !epi.ativo)
      const matchesText = !query || [epi.codigo, epi.nome, epi.numeroCa, epi.fabricante, epi.modelo]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(query))
      return matchesStatus && matchesText
    })
  }, [epis, search, statusFilter])

  function openCreate() {
    setEditing(null); setForm(emptyForm); setError(''); setSuccess(''); setShowForm(true)
  }

  function openEdit(epi: Epi) {
    setEditing(epi.id); setError(''); setSuccess('')
    setForm({
      categoriaId: epi.categoriaId ?? '', codigo: epi.codigo, nome: epi.nome,
      descricao: epi.descricao ?? '', fabricante: epi.fabricante ?? '', modelo: epi.modelo ?? '',
      numeroCa: epi.numeroCa ?? '', caValidade: epi.caValidade?.slice(0, 10) ?? '',
      unidadeMedida: epi.unidadeMedida, estoqueMinimo: String(epi.estoqueMinimo),
      vidaUtilDias: epi.vidaUtilDias ? String(epi.vidaUtilDias) : '',
    })
    setShowForm(true)
  }

  function change(field: keyof EpiForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setSaving(true); setError(''); setSuccess('')
    const payload = {
      categoriaId: form.categoriaId || null,
      codigo: form.codigo.trim(), nome: form.nome.trim(),
      descricao: form.descricao.trim() || null, fabricante: form.fabricante.trim() || null,
      modelo: form.modelo.trim() || null, numeroCa: form.numeroCa.trim() || null,
      caValidade: form.caValidade || null, unidadeMedida: form.unidadeMedida,
      estoqueMinimo: Number(form.estoqueMinimo),
      vidaUtilDias: form.vidaUtilDias ? Number(form.vidaUtilDias) : null,
    }
    try {
      await apiRequest<Epi>(editing ? `/api/v1/epis/${editing}` : '/api/v1/epis', {
        method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload),
      }, session.accessToken)
      setShowForm(false); setSuccess(editing ? 'Cadastro do EPI atualizado.' : 'EPI cadastrado com sucesso.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o EPI.')
    } finally { setSaving(false) }
  }

  async function deactivate(epi: Epi) {
    if (!session || !window.confirm(`Inativar "${epi.nome}"? O histórico será preservado e o EPI deixará de ser usado em novas operações.`)) return
    setError(''); setSuccess('')
    try {
      await apiRequest<void>(`/api/v1/epis/${epi.id}/deactivate`, { method: 'PATCH' }, session.accessToken)
      setSuccess('EPI inativado. O histórico foi preservado.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível inativar o EPI.')
    }
  }

  const caExpired = epis.filter((epi) => epi.ativo && caStatus(epi).tone === 'danger').length
  const caAttention = epis.filter((epi) => epi.ativo && caStatus(epi).tone === 'warning').length

  return (
    <div className="page-stack">
      <PageHeader eyebrow="CADASTRO E CONFORMIDADE" title="Catálogo de EPIs" description="Gerencie equipamentos, parâmetros de estoque e validade dos Certificados de Aprovação." action={canManage ? <button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Novo EPI</button> : undefined} />
      {success && <div className="notice notice--success"><ShieldCheck size={17} /><span>{success}</span></div>}
      {error && <div className="notice notice--warning"><AlertTriangle size={17} /><span>{error}</span></div>}
      <div className="epi-kpi-grid">
        <div className="epi-kpi"><span>EPIs ativos</span><strong>{loading ? '—' : formatNumber(epis.filter((item) => item.ativo).length, 0)}</strong><small>Disponíveis para operações</small></div>
        <div className="epi-kpi epi-kpi--danger"><span>CAs vencidos</span><strong>{loading ? '—' : formatNumber(caExpired, 0)}</strong><small>Exigem regularização</small></div>
        <div className="epi-kpi epi-kpi--warning"><span>CAs em atenção</span><strong>{loading ? '—' : formatNumber(caAttention, 0)}</strong><small>Vencidos em até 30 dias ou sem validade</small></div>
      </div>

      {showForm && <section className="panel epi-form-panel">
        <div className="panel-heading"><div><h2>{editing ? 'Editar EPI' : 'Cadastrar novo EPI'}</h2><p>Preencha os dados técnicos e de conformidade do equipamento.</p></div><button className="icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X size={18} /></button></div>
        <form className="receipt-form" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-field"><label htmlFor="epi-code">Código *</label><input id="epi-code" value={form.codigo} onChange={(e) => change('codigo', e.target.value)} maxLength={50} required /></div>
            <div className="form-field form-field--wide"><label htmlFor="epi-name">Nome do equipamento *</label><input id="epi-name" value={form.nome} onChange={(e) => change('nome', e.target.value)} maxLength={160} required /></div>
            <div className="form-field"><label htmlFor="epi-category">Categoria</label><select id="epi-category" value={form.categoriaId} onChange={(e) => change('categoriaId', e.target.value)}><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></div>
            <div className="form-field"><label htmlFor="epi-maker">Fabricante</label><input id="epi-maker" value={form.fabricante} onChange={(e) => change('fabricante', e.target.value)} maxLength={120} /></div>
            <div className="form-field"><label htmlFor="epi-model">Modelo</label><input id="epi-model" value={form.modelo} onChange={(e) => change('modelo', e.target.value)} maxLength={120} /></div>
            <div className="form-field"><label htmlFor="epi-ca">Número do CA</label><input id="epi-ca" value={form.numeroCa} onChange={(e) => change('numeroCa', e.target.value)} maxLength={30} /></div>
            <div className="form-field"><label htmlFor="epi-ca-expiry">Validade do CA</label><input id="epi-ca-expiry" type="date" value={form.caValidade} onChange={(e) => change('caValidade', e.target.value)} /></div>
            <div className="form-field"><label htmlFor="epi-unit">Unidade de medida *</label><select id="epi-unit" value={form.unidadeMedida} onChange={(e) => change('unidadeMedida', e.target.value)} required>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></div>
            <div className="form-field"><label htmlFor="epi-min">Estoque mínimo *</label><input id="epi-min" type="number" min="0" step="0.001" value={form.estoqueMinimo} onChange={(e) => change('estoqueMinimo', e.target.value)} required /></div>
            <div className="form-field"><label htmlFor="epi-life">Vida útil (dias)</label><input id="epi-life" type="number" min="1" step="1" value={form.vidaUtilDias} onChange={(e) => change('vidaUtilDias', e.target.value)} /></div>
            <div className="form-field form-field--full"><label htmlFor="epi-description">Descrição técnica</label><textarea id="epi-description" rows={2} maxLength={4000} value={form.descricao} onChange={(e) => change('descricao', e.target.value)} /></div>
          </div>
          {form.numeroCa && <div className="epi-form-hint"><CalendarClock size={16} /> Informe a validade do CA conforme o certificado/documentação do fabricante. A data cadastrada será usada nos alertas de conformidade.</div>}
          <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar EPI'}</button></div>
        </form>
      </section>}

      <section className="panel data-panel">
        <div className="data-toolbar">
          <div className="data-toolbar__summary"><strong>{loading ? '—' : formatNumber(filtered.length, 0)}</strong><span>EPIs encontrados</span></div>
          <div className="data-toolbar__actions">
            <label className="search-field"><Search size={16} /><input aria-label="Pesquisar EPIs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código, nome ou CA" /></label>
            <select aria-label="Filtrar situação" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}><option value="ATIVOS">Ativos</option><option value="INATIVOS">Inativos</option><option value="TODOS">Todos</option></select>
            <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Atualizar</button>
          </div>
        </div>
        {loading ? <div className="loading-cell loading-pad">Carregando catálogo...</div> : filtered.length === 0 ? <EmptyState title="Nenhum EPI encontrado" description="Ajuste os filtros ou cadastre um novo equipamento." /> : (
          <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Código / EPI</th><th>CA</th><th>Validade do CA</th><th>Conformidade</th><th>Estoque mínimo</th><th>Situação</th>{canManage && <th>Ações</th>}</tr></thead>
            <tbody>{filtered.map((epi) => {
              const ca = caStatus(epi)
              return <tr key={epi.id}>
                <td><div className="epi-name-cell"><strong>{epi.nome}</strong><small>{epi.codigo}{epi.fabricante ? ` · ${epi.fabricante}` : ''}</small></div></td>
                <td>{epi.numeroCa || '—'}</td><td>{epi.caValidade ? formatDate(epi.caValidade) : '—'}</td>
                <td><span className={`epi-ca-status epi-ca-status--${ca.tone}`}>{ca.label}</span></td>
                <td>{formatNumber(epi.estoqueMinimo)} {epi.unidadeMedida}</td><td><StatusBadge value={epi.ativo ? 'ATIVO' : 'INATIVO'} /></td>
                {canManage && <td><div className="epi-row-actions"><button className="secondary-button" type="button" onClick={() => openEdit(epi)} disabled={!epi.ativo}><Edit3 size={14} /> Editar</button>{isAdmin && epi.ativo && <button className="text-link epi-deactivate" type="button" onClick={() => void deactivate(epi)}>Inativar</button>}</div></td>}
              </tr>
            })}</tbody>
          </table></div>
        )}
        <div className="data-panel__footer"><span>Dados da empresa selecionada</span><span>Cadastro integrado à API autenticada</span></div>
      </section>
    </div>
  )
}
