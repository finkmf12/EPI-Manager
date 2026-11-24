import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, RefreshCw, RotateCcw, X } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Delivery, Epi, EpiReturn } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils'

type ReturnCondition = 'REUTILIZAVEL' | 'DANIFICADO' | 'DESCARTE'
type DraftLine = { key: string; itemEntregaId: string; quantidade: string; condicao: ReturnCondition; observacao: string }

function todayLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function newLine(): DraftLine {
  return { key: crypto.randomUUID(), itemEntregaId: '', quantidade: '1', condicao: 'REUTILIZAVEL', observacao: '' }
}

export function ReturnsPage() {
  const { session } = useAuth()
  const canManage = session?.companyProfile === 'ADMIN' || session?.companyProfile === 'ALMOXARIFE'
  const [returns, setReturns] = useState<EpiReturn[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [epis, setEpis] = useState<Epi[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [entregaId, setEntregaId] = useState('')
  const [dataDevolucao, setDataDevolucao] = useState(todayLocal())
  const [observacao, setObservacao] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([newLine()])

  async function load() {
    if (!session) return
    setLoading(true)
    setError('')
    const result = await Promise.allSettled([
      apiRequest<EpiReturn[]>('/api/v1/returns?limit=100', {}, session.accessToken),
      apiRequest<Delivery[]>('/api/v1/deliveries?limit=100', {}, session.accessToken),
      apiRequest<Epi[]>('/api/v1/epis', {}, session.accessToken),
    ])
    const failures: string[] = []
    if (result[0].status === 'fulfilled') setReturns(result[0].value)
    else failures.push(result[0].reason instanceof Error ? result[0].reason.message : 'Falha ao consultar devoluções.')
    if (result[1].status === 'fulfilled') setDeliveries(result[1].value)
    else failures.push(result[1].reason instanceof Error ? result[1].reason.message : 'Falha ao consultar entregas.')
    if (result[2].status === 'fulfilled') setEpis(result[2].value)
    else failures.push(result[2].reason instanceof Error ? result[2].reason.message : 'Falha ao consultar EPIs.')
    setError(failures.join(' '))
    setLoading(false)
  }

  useEffect(() => { void load() }, [session?.accessToken])

  const confirmedDeliveries = useMemo(() => deliveries.filter((delivery) => delivery.status === 'CONFIRMADA'), [deliveries])
  const selectedDelivery = useMemo(() => deliveries.find((delivery) => delivery.id === entregaId), [deliveries, entregaId])
  const deliveryMap = useMemo(() => new Map(deliveries.map((delivery) => [delivery.id, delivery])), [deliveries])
  const epiNames = useMemo(() => new Map(epis.map((epi) => [epi.id, epi.nome])), [epis])

  function returnedForItem(itemEntregaId: string) {
    return returns
      .filter((record) => record.entregaId === entregaId && ['RASCUNHO', 'CONFIRMADA'].includes(record.status))
      .flatMap((record) => record.itens ?? [])
      .filter((item) => item.itemEntregaId === itemEntregaId)
      .reduce((sum, item) => sum + Number(item.quantidade), 0)
  }

  function remainingForItem(itemEntregaId: string) {
    const item = selectedDelivery?.itens.find((line) => line.id === itemEntregaId)
    if (!item) return 0
    return Math.max(0, Number(item.quantidade) - returnedForItem(itemEntregaId))
  }

  function updateLine(key: string, field: keyof DraftLine, value: string) {
    setLines((current) => current.map((line) => line.key === key ? { ...line, [field]: value } : line))
  }

  function openForm() {
    setShowForm(true)
    setFormError('')
    setSuccess('')
    setEntregaId('')
    setDataDevolucao(todayLocal())
    setObservacao('')
    setLines([newLine()])
  }

  async function createReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setFormError('')
    const validLines = lines.filter((line) => line.itemEntregaId && Number(line.quantidade) > 0)
    if (!entregaId || validLines.length === 0 || validLines.length !== lines.length) {
      setFormError('Selecione uma entrega confirmada e preencha item e quantidade em todas as linhas.')
      return
    }
    const duplicateItem = new Set(validLines.map((line) => line.itemEntregaId)).size !== validLines.length
    if (duplicateItem) {
      setFormError('Cada item da entrega deve aparecer uma única vez neste registro de devolução.')
      return
    }
    for (const line of validLines) {
      if (Number(line.quantidade) > remainingForItem(line.itemEntregaId)) {
        setFormError('A quantidade informada ultrapassa o saldo ainda não devolvido de um dos itens.')
        return
      }
    }
    setWorking(true)
    try {
      await apiRequest<EpiReturn>('/api/v1/returns', {
        method: 'POST',
        body: JSON.stringify({
          entregaId,
          dataDevolucao: dataDevolucao || null,
          observacao: observacao.trim() || null,
          itens: validLines.map((line) => ({
            itemEntregaId: line.itemEntregaId,
            quantidade: Number(line.quantidade),
            condicao: line.condicao,
            observacao: line.observacao.trim() || null,
          })),
        }),
      }, session.accessToken)
      setSuccess('Devolução criada como rascunho. Confirme o registro após conferir as condições dos equipamentos.')
      setShowForm(false)
      await load()
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Não foi possível criar a devolução.')
    } finally {
      setWorking(false)
    }
  }

  async function transition(id: string, action: 'confirm' | 'cancel') {
    if (!session) return
    const message = action === 'confirm'
      ? 'Confirmar esta devolução? Apenas os EPIs classificados como reutilizáveis retornarão ao estoque.'
      : 'Cancelar este rascunho de devolução?'
    if (!window.confirm(message)) return
    setWorking(true)
    setError('')
    setSuccess('')
    try {
      await apiRequest<EpiReturn>(`/api/v1/returns/${id}/${action}`, { method: 'POST' }, session.accessToken)
      setSuccess(action === 'confirm' ? 'Devolução confirmada; apenas itens reutilizáveis retornaram ao estoque.' : 'Rascunho de devolução cancelado.')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível atualizar a devolução.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="RETORNO DE EQUIPAMENTOS"
        title="Devoluções"
        description="Registre o retorno de EPIs e classifique cada item conforme sua condição física."
        action={canManage ? <button className="primary-button" type="button" onClick={openForm}><Plus size={16} /> Nova devolução</button> : undefined}
      />
      {success && <div className="notice notice--success"><RotateCcw size={17} /><span>{success}</span></div>}
      {error && <div className="notice notice--danger">{error}</div>}

      {showForm && canManage && (
        <section className="panel workflow-panel">
          <div className="panel-heading"><div><h2>Nova devolução em rascunho</h2><p>Selecione somente itens de uma entrega confirmada. O saldo de devolução é recalculado antes do envio.</p></div><button className="icon-button" type="button" aria-label="Fechar" onClick={() => setShowForm(false)}><X size={18} /></button></div>
          <form onSubmit={createReturn}>
            <div className="form-grid workflow-head-fields">
              <div className="form-field form-field--wide"><label htmlFor="return-delivery">Entrega confirmada *</label><select id="return-delivery" value={entregaId} onChange={(event) => { setEntregaId(event.target.value); setLines([newLine()]) }} required><option value="">Selecione uma entrega</option>{confirmedDeliveries.map((delivery) => <option key={delivery.id} value={delivery.id}>{delivery.id.slice(0, 8).toUpperCase()} · {formatDate(delivery.dataEntrega)} · {delivery.itens.length} item(ns)</option>)}</select></div>
              <div className="form-field"><label htmlFor="return-date">Data da devolução</label><input id="return-date" type="date" value={dataDevolucao} onChange={(event) => setDataDevolucao(event.target.value)} /></div>
              <div className="form-field form-field--full"><label htmlFor="return-notes">Observações</label><textarea id="return-notes" rows={2} value={observacao} onChange={(event) => setObservacao(event.target.value)} maxLength={2000} /></div>
            </div>
            <div className="workflow-items-heading"><h3>Itens devolvidos</h3><button className="text-button" type="button" disabled={!selectedDelivery} onClick={() => setLines((current) => [...current, newLine()])}><Plus size={14} /> Adicionar item</button></div>
            {!selectedDelivery && <div className="inline-hint">Selecione uma entrega para consultar seus itens e os saldos ainda não devolvidos.</div>}
            {selectedDelivery && selectedDelivery.itens.length === 0 && <div className="inline-hint">A entrega selecionada não possui itens cadastrados.</div>}
            <div className="workflow-lines">
              {selectedDelivery && lines.map((line, index) => {
                const alreadySelected = new Set(lines.filter((other) => other.key !== line.key).map((other) => other.itemEntregaId))
                const choices = selectedDelivery.itens.filter((item) => !alreadySelected.has(item.id) && (item.id === line.itemEntregaId || remainingForItem(item.id) > 0))
                const maximum = line.itemEntregaId ? remainingForItem(line.itemEntregaId) : 0
                return (
                  <div className="workflow-line workflow-line--return" key={line.key}>
                    <div className="workflow-line__number">{String(index + 1).padStart(2, '0')}</div>
                    <div className="form-field workflow-line__item"><label>Item da entrega *</label><select value={line.itemEntregaId} onChange={(event) => updateLine(line.key, 'itemEntregaId', event.target.value)} required><option value="">Selecione</option>{choices.map((item) => <option key={item.id} value={item.id}>{selectedDelivery.itens.indexOf(item) + 1}. {epiNames.get(item.epiId) || item.epiId.slice(0, 8).toUpperCase()} · entregue {formatNumber(item.quantidade)} · restante {formatNumber(remainingForItem(item.id))}</option>)}</select></div>
                    <div className="form-field"><label>Quantidade *</label><input type="number" min="0.001" max={maximum || undefined} step="0.001" value={line.quantidade} onChange={(event) => updateLine(line.key, 'quantidade', event.target.value)} required /><small className="field-help">Restante: {formatNumber(maximum)}</small></div>
                    <div className="form-field"><label>Condição *</label><select value={line.condicao} onChange={(event) => updateLine(line.key, 'condicao', event.target.value as ReturnCondition)}><option value="REUTILIZAVEL">Reutilizável</option><option value="DANIFICADO">Danificado</option><option value="DESCARTE">Descarte</option></select></div>
                    <button className="icon-button workflow-line__remove" type="button" aria-label={`Remover item ${index + 1}`} disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}><X size={16} /></button>
                  </div>
                )
              })}
            </div>
            {formError && <div className="form-error" role="alert">{formError}</div>}
            <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={working || !selectedDelivery}>{working ? 'Salvando...' : 'Criar rascunho'}</button></div>
          </form>
        </section>
      )}

      <section className="panel data-panel">
        <div className="data-toolbar"><div className="data-toolbar__summary"><strong>{loading ? '—' : formatNumber(returns.length, 0)}</strong><span>devoluções localizadas</span></div><div className="data-toolbar__actions"><button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Atualizar</button></div></div>
        {loading ? <div className="loading-cell loading-pad">Consultando devoluções...</div> : returns.length === 0 ? <EmptyState title="Nenhuma devolução registrada" description="Os retornos dos EPIs aparecerão aqui após serem vinculados a uma entrega confirmada." /> : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Devolução</th><th>Entrega</th><th>Data</th><th>Itens</th><th>Status</th><th>Ações</th></tr></thead><tbody>
            {returns.map((record) => {
              const delivery = deliveryMap.get(record.entregaId)
              return <tr key={record.id}>
                <td className="cell-primary">{record.id.slice(0, 8).toUpperCase()}<small className="cell-subtext">{formatDateTime(record.createdAt)}</small></td>
                <td>{record.entregaId.slice(0, 8).toUpperCase()}</td>
                <td>{formatDate(record.dataDevolucao)}</td>
                <td>{record.itens?.length ?? 0}</td>
                <td><StatusBadge value={record.status} /></td>
                <td><div className="table-actions">{canManage && record.status === 'RASCUNHO' && <><button className="table-action table-action--primary" type="button" disabled={working} onClick={() => void transition(record.id, 'confirm')}>Confirmar</button><button className="table-action" type="button" disabled={working} onClick={() => void transition(record.id, 'cancel')}>Cancelar</button></>}</div><small className="cell-subtext">{delivery ? `${delivery.itens.length} itens na entrega` : ''}</small></td>
              </tr>
            })}
          </tbody></table></div>
        )}
        <div className="data-panel__footer"><span>Rascunhos reservam quantidade devolvida até confirmação ou cancelamento.</span><span>Somente itens reutilizáveis retornam ao estoque</span></div>
      </section>
      <div className="workflow-footnote">A API e o PostgreSQL revalidam as quantidades no momento da gravação, mesmo que outra devolução tenha sido registrada em paralelo.</div>
    </div>
  )
}
