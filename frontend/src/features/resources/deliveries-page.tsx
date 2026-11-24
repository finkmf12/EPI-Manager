import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, RefreshCw, Truck, X } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Collaborator, Delivery, Epi, StockLot } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils'

type DraftLine = {
  key: string
  epiId: string
  loteId: string
  quantidade: string
  dataPrevistaSubstituicao: string
  observacao: string
}

function todayLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function newLine(): DraftLine {
  return { key: crypto.randomUUID(), epiId: '', loteId: '', quantidade: '1', dataPrevistaSubstituicao: '', observacao: '' }
}

export function DeliveriesPage() {
  const { session } = useAuth()
  const canManage = session?.companyProfile === 'ADMIN' || session?.companyProfile === 'ALMOXARIFE'
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [epis, setEpis] = useState<Epi[]>([])
  const [lots, setLots] = useState<StockLot[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [success, setSuccess] = useState('')
  const [collaboratorId, setCollaboratorId] = useState('')
  const [dataEntrega, setDataEntrega] = useState(todayLocal())
  const [observacao, setObservacao] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([newLine()])

  async function load() {
    if (!session) return
    setLoading(true)
    setError('')
    const result = await Promise.allSettled([
      apiRequest<Delivery[]>('/api/v1/deliveries?limit=100', {}, session.accessToken),
      apiRequest<Collaborator[]>('/api/v1/collaborators?status=ATIVO', {}, session.accessToken),
      apiRequest<Epi[]>('/api/v1/epis', {}, session.accessToken),
      apiRequest<StockLot[]>('/api/v1/stock/lots', {}, session.accessToken),
    ])
    const failures: string[] = []
    if (result[0].status === 'fulfilled') setDeliveries(result[0].value)
    else failures.push(result[0].reason instanceof Error ? result[0].reason.message : 'Falha ao consultar entregas.')
    if (result[1].status === 'fulfilled') setCollaborators(result[1].value)
    else failures.push(result[1].reason instanceof Error ? result[1].reason.message : 'Falha ao consultar colaboradores.')
    if (result[2].status === 'fulfilled') setEpis(result[2].value)
    else failures.push(result[2].reason instanceof Error ? result[2].reason.message : 'Falha ao consultar EPIs.')
    if (result[3].status === 'fulfilled') setLots(result[3].value)
    else failures.push(result[3].reason instanceof Error ? result[3].reason.message : 'Falha ao consultar lotes.')
    setError(failures.join(' '))
    setLoading(false)
  }

  useEffect(() => { void load() }, [session?.accessToken])

  const collaboratorNames = useMemo(() => new Map(collaborators.map((person) => [person.id, person.nome])), [collaborators])
  const epiNames = useMemo(() => new Map(epis.map((epi) => [epi.id, epi.nome])), [epis])
  const lotNames = useMemo(() => new Map(lots.map((lot) => [lot.id, lot.codigoLote])), [lots])

  function updateLine(key: string, field: keyof DraftLine, value: string) {
    setLines((current) => current.map((line) => line.key === key
      ? { ...line, [field]: value, ...(field === 'epiId' ? { loteId: '' } : {}) }
      : line))
  }

  async function createDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setFormError('')
    const validLines = lines.filter((line) => line.epiId && line.loteId && Number(line.quantidade) > 0)
    if (!collaboratorId || validLines.length === 0 || validLines.length !== lines.length) {
      setFormError('Selecione um colaborador e preencha EPI, lote e quantidade em todas as linhas.')
      return
    }
    const duplicateLot = new Set(validLines.map((line) => line.loteId)).size !== validLines.length
    if (duplicateLot) {
      setFormError('O mesmo lote não pode aparecer em duas linhas desta entrega. Consolide a quantidade em uma única linha.')
      return
    }
    setWorking(true)
    try {
      await apiRequest<Delivery>('/api/v1/deliveries', {
        method: 'POST',
        body: JSON.stringify({
          colaboradorId,
          dataEntrega: dataEntrega || null,
          observacao: observacao.trim() || null,
          itens: validLines.map((line) => ({
            epiId: line.epiId,
            loteId: line.loteId,
            quantidade: Number(line.quantidade),
            dataPrevistaSubstituicao: line.dataPrevistaSubstituicao || null,
            observacao: line.observacao.trim() || null,
          })),
        }),
      }, session.accessToken)
      setSuccess('Entrega criada como rascunho. O estoque só será baixado após a confirmação.')
      setShowForm(false)
      setCollaboratorId('')
      setDataEntrega(todayLocal())
      setObservacao('')
      setLines([newLine()])
      await load()
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Não foi possível criar a entrega.')
    } finally {
      setWorking(false)
    }
  }

  async function transition(id: string, action: 'confirm' | 'cancel') {
    if (!session) return
    const message = action === 'confirm'
      ? 'Confirmar esta entrega? O saldo dos lotes será baixado e a movimentação ficará registrada.'
      : 'Cancelar este rascunho de entrega?'
    if (!window.confirm(message)) return
    setWorking(true)
    setError('')
    setSuccess('')
    try {
      await apiRequest<Delivery>(`/api/v1/deliveries/${id}/${action}`, { method: 'POST' }, session.accessToken)
      setSuccess(action === 'confirm' ? 'Entrega confirmada e baixa de estoque realizada.' : 'Rascunho de entrega cancelado.')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível atualizar a entrega.')
    } finally {
      setWorking(false)
    }
  }

  const validLotsForEpi = (epiId: string) => {
    const today = todayLocal()
    return lots.filter((lot) => lot.epiId === epiId && Number(lot.quantidadeDisponivel) > 0 && (!lot.dataValidade || lot.dataValidade >= today))
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="DISTRIBUIÇÃO DE EQUIPAMENTOS"
        title="Entregas"
        description="Registre a entrega de EPIs por colaborador e confirme a baixa de estoque."
        action={canManage ? <button className="primary-button" type="button" onClick={() => { setShowForm(true); setFormError(''); setSuccess('') }}><Plus size={16} /> Nova entrega</button> : undefined}
      />
      {success && <div className="notice notice--success"><Truck size={17} /><span>{success}</span></div>}
      {error && <div className="notice notice--danger">{error}</div>}

      {showForm && canManage && (
        <section className="panel workflow-panel">
          <div className="panel-heading"><div><h2>Nova entrega em rascunho</h2><p>A confirmação valida o saldo, o lote e a validade antes de baixar o estoque.</p></div><button className="icon-button" type="button" aria-label="Fechar" onClick={() => setShowForm(false)}><X size={18} /></button></div>
          <form onSubmit={createDelivery}>
            <div className="form-grid workflow-head-fields">
              <div className="form-field form-field--wide"><label htmlFor="delivery-person">Colaborador *</label><select id="delivery-person" value={collaboratorId} onChange={(event) => setCollaboratorId(event.target.value)} required><option value="">Selecione um colaborador ativo</option>{collaborators.map((person) => <option key={person.id} value={person.id}>{person.matricula} — {person.nome}</option>)}</select></div>
              <div className="form-field"><label htmlFor="delivery-date">Data da entrega</label><input id="delivery-date" type="date" value={dataEntrega} onChange={(event) => setDataEntrega(event.target.value)} /></div>
              <div className="form-field form-field--full"><label htmlFor="delivery-notes">Observações</label><textarea id="delivery-notes" rows={2} value={observacao} onChange={(event) => setObservacao(event.target.value)} maxLength={2000} /></div>
            </div>
            <div className="workflow-items-heading"><h3>Itens da entrega</h3><button className="text-button" type="button" onClick={() => setLines((current) => [...current, newLine()])}><Plus size={14} /> Adicionar item</button></div>
            <div className="workflow-lines">
              {lines.map((line, index) => {
                const availableLots = validLotsForEpi(line.epiId).filter((lot) => lot.id === line.loteId || !lines.some((other) => other.key !== line.key && other.loteId === lot.id))
                const selectedLot = lots.find((lot) => lot.id === line.loteId)
                return (
                  <div className="workflow-line" key={line.key}>
                    <div className="workflow-line__number">{String(index + 1).padStart(2, '0')}</div>
                    <div className="form-field"><label>EPI *</label><select value={line.epiId} onChange={(event) => updateLine(line.key, 'epiId', event.target.value)} required><option value="">Selecione</option>{epis.filter((epi) => epi.ativo).map((epi) => <option key={epi.id} value={epi.id}>{epi.codigo} — {epi.nome}</option>)}</select></div>
                    <div className="form-field"><label>Lote disponível *</label><select value={line.loteId} onChange={(event) => updateLine(line.key, 'loteId', event.target.value)} required disabled={!line.epiId}><option value="">Selecione</option>{availableLots.map((lot) => <option key={lot.id} value={lot.id}>{lot.codigoLote} · saldo {formatNumber(lot.quantidadeDisponivel)}</option>)}</select>{line.epiId && availableLots.length === 0 && <small className="field-help field-help--warning">Sem lote não vencido com saldo.</small>}</div>
                    <div className="form-field"><label>Quantidade *</label><input type="number" min="0.001" max={selectedLot ? Number(selectedLot.quantidadeDisponivel) : undefined} step="0.001" value={line.quantidade} onChange={(event) => updateLine(line.key, 'quantidade', event.target.value)} required />{selectedLot && <small className="field-help">Disponível: {formatNumber(selectedLot.quantidadeDisponivel)}</small>}</div>
                    <div className="form-field"><label>Substituição prevista</label><input type="date" value={line.dataPrevistaSubstituicao} onChange={(event) => updateLine(line.key, 'dataPrevistaSubstituicao', event.target.value)} /></div>
                    <button className="icon-button workflow-line__remove" type="button" aria-label={`Remover item ${index + 1}`} disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}><X size={16} /></button>
                  </div>
                )
              })}
            </div>
            {formError && <div className="form-error" role="alert">{formError}</div>}
            <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={working || collaborators.length === 0 || epis.length === 0}>{working ? 'Salvando...' : 'Criar rascunho'}</button></div>
          </form>
        </section>
      )}

      <section className="panel data-panel">
        <div className="data-toolbar"><div className="data-toolbar__summary"><strong>{loading ? '—' : formatNumber(deliveries.length, 0)}</strong><span>entregas localizadas</span></div><div className="data-toolbar__actions"><button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Atualizar</button></div></div>
        {loading ? <div className="loading-cell loading-pad">Consultando entregas...</div> : deliveries.length === 0 ? <EmptyState title="Nenhuma entrega registrada" description="Crie uma entrega em rascunho para iniciar o histórico de distribuição de EPIs." /> : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Entrega</th><th>Colaborador</th><th>Data</th><th>Itens</th><th>Status</th><th>Ações</th></tr></thead><tbody>
            {deliveries.map((delivery) => <tr key={delivery.id}>
              <td className="cell-primary">{delivery.id.slice(0, 8).toUpperCase()}<small className="cell-subtext">{formatDateTime(delivery.createdAt)}</small></td>
              <td>{collaboratorNames.get(delivery.colaboradorId) || delivery.colaboradorId.slice(0, 8).toUpperCase()}</td>
              <td>{formatDate(delivery.dataEntrega)}</td>
              <td>{delivery.itens?.length ?? 0}</td>
              <td><StatusBadge value={delivery.status} /></td>
              <td><div className="table-actions">{canManage && delivery.status === 'RASCUNHO' && <><button className="table-action table-action--primary" type="button" disabled={working} onClick={() => void transition(delivery.id, 'confirm')}>Confirmar</button><button className="table-action" type="button" disabled={working} onClick={() => void transition(delivery.id, 'cancel')}>Cancelar</button></>}</div></td>
            </tr>)}
          </tbody></table></div>
        )}
        <div className="data-panel__footer"><span>Os itens só podem ser alterados enquanto a entrega está em rascunho.</span><span>Confirmação de estoque transacional no PostgreSQL</span></div>
      </section>
      <div className="workflow-footnote">EPIs inativos, com CA vencido, lote vencido ou saldo insuficiente serão rejeitados pelo banco na confirmação.</div>
    </div>
  )
}
