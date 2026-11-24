import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowDownToLine, ClipboardList, Package, Plus, RefreshCw, X } from 'lucide-react'
import { apiRequest } from '@/api/client'
import type { Epi, StockBalance, StockLot, StockMovement, StockReceiptResponse, Supplier } from '@/api/types'
import { useAuth } from '@/app/auth-context'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/lib/utils'

type Tab = 'balances' | 'lots' | 'movements'

export function StockPage() {
  const { session } = useAuth()
  const [tab, setTab] = useState<Tab>('balances')
  const [balances, setBalances] = useState<StockBalance[]>([])
  const [lots, setLots] = useState<StockLot[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [epis, setEpis] = useState<Epi[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [receiptMessage, setReceiptMessage] = useState('')
  const [receiptError, setReceiptError] = useState('')
  const [form, setForm] = useState({ epiId: '', fornecedorId: '', codigoLote: '', dataFabricacao: '', dataValidade: '', quantidade: '', custoUnitario: '', observacao: '' })

  async function load() {
    if (!session) return
    setLoading(true)
    setError('')
    const requests = await Promise.allSettled([
      apiRequest<StockBalance[]>('/api/v1/stock/balances', {}, session.accessToken),
      apiRequest<StockLot[]>('/api/v1/stock/lots', {}, session.accessToken),
      apiRequest<StockMovement[]>('/api/v1/stock/movements?limit=100', {}, session.accessToken),
      apiRequest<Epi[]>('/api/v1/epis', {}, session.accessToken),
      apiRequest<Supplier[]>('/api/v1/suppliers', {}, session.accessToken),
    ])
    const failures: string[] = []
    if (requests[0].status === 'fulfilled') setBalances(requests[0].value)
    else failures.push(requests[0].reason instanceof Error ? requests[0].reason.message : 'Falha ao consultar saldos.')
    if (requests[1].status === 'fulfilled') setLots(requests[1].value)
    else failures.push(requests[1].reason instanceof Error ? requests[1].reason.message : 'Falha ao consultar lotes.')
    if (requests[2].status === 'fulfilled') setMovements(requests[2].value)
    else failures.push(requests[2].reason instanceof Error ? requests[2].reason.message : 'Falha ao consultar movimentos.')
    if (requests[3].status === 'fulfilled') setEpis(requests[3].value)
    else failures.push(requests[3].reason instanceof Error ? requests[3].reason.message : 'Falha ao consultar EPIs.')
    if (requests[4].status === 'fulfilled') setSuppliers(requests[4].value)
    else failures.push(requests[4].reason instanceof Error ? requests[4].reason.message : 'Falha ao consultar fornecedores.')
    setError(failures.join(' '))
    setLoading(false)
  }

  useEffect(() => { void load() }, [session?.accessToken])

  function updateForm(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setSubmitting(true)
    setReceiptError('')
    setReceiptMessage('')
    try {
      const payload = {
        epiId: form.epiId,
        fornecedorId: form.fornecedorId || null,
        codigoLote: form.codigoLote.trim(),
        dataFabricacao: form.dataFabricacao || null,
        dataValidade: form.dataValidade || null,
        quantidade: Number(form.quantidade),
        custoUnitario: form.custoUnitario ? Number(form.custoUnitario) : null,
        observacao: form.observacao.trim() || null,
      }
      const result = await apiRequest<StockReceiptResponse>('/api/v1/stock/receipts', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.accessToken)
      setReceiptMessage(`Recebimento registrado. Lote ${result.codigoLote} com saldo ${formatNumber(result.saldoDisponivel)}.`)
      setForm({ epiId: '', fornecedorId: '', codigoLote: '', dataFabricacao: '', dataValidade: '', quantidade: '', custoUnitario: '', observacao: '' })
      setShowReceipt(false)
      await load()
    } catch (caught) {
      setReceiptError(caught instanceof Error ? caught.message : 'Não foi possível registrar o recebimento.')
    } finally {
      setSubmitting(false)
    }
  }

  const availableTotal = balances.reduce((sum, balance) => sum + Number(balance.saldoDisponivel || 0), 0)
  const expiredTotal = balances.reduce((sum, balance) => sum + Number(balance.saldoVencido || 0), 0)
  const belowMinimum = balances.filter((balance) => balance.abaixoDoMinimo).length

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="CONTROLE DE MATERIAIS"
        title="Estoque"
        description="Acompanhe saldos, lotes e o histórico imutável de movimentações."
        action={<button className="primary-button" type="button" onClick={() => { setShowReceipt(true); setReceiptError(''); setReceiptMessage('') }}><Plus size={16} /> Registrar recebimento</button>}
      />

      {receiptMessage && <div className="notice notice--success"><ArrowDownToLine size={17} /><span>{receiptMessage}</span></div>}
      {error && <div className="notice notice--warning"><AlertTriangle size={17} /><span>{error}</span></div>}

      <div className="stock-summary-grid">
        <div className="stock-summary-card"><span className="stock-summary-icon"><Package size={18} /></span><span className="stock-summary-label">Saldo disponível</span><strong>{loading ? '—' : formatNumber(availableTotal)}</strong><small>Somatório dos saldos não vencidos</small></div>
        <div className="stock-summary-card"><span className="stock-summary-icon stock-summary-icon--amber"><AlertTriangle size={18} /></span><span className="stock-summary-label">Saldo vencido</span><strong>{loading ? '—' : formatNumber(expiredTotal)}</strong><small>Não disponível para novas entregas</small></div>
        <div className="stock-summary-card"><span className="stock-summary-icon stock-summary-icon--slate"><ClipboardList size={18} /></span><span className="stock-summary-label">EPIs abaixo do mínimo</span><strong>{loading ? '—' : formatNumber(belowMinimum, 0)}</strong><small>Itens que exigem reposição</small></div>
      </div>

      {showReceipt && (
        <section className="panel receipt-panel">
          <div className="panel-heading"><div><h2>Novo recebimento</h2><p>O lote e o movimento de entrada serão registrados na mesma transação.</p></div><button className="icon-button" type="button" aria-label="Fechar formulário" onClick={() => setShowReceipt(false)}><X size={18} /></button></div>
          <form className="receipt-form" onSubmit={submitReceipt}>
            <div className="form-grid">
              <div className="form-field form-field--wide"><label htmlFor="receipt-epi">EPI *</label><select id="receipt-epi" value={form.epiId} onChange={(event) => updateForm('epiId', event.target.value)} required><option value="">Selecione um EPI</option>{epis.filter((epi) => epi.ativo).map((epi) => <option key={epi.id} value={epi.id}>{epi.codigo} — {epi.nome}</option>)}</select></div>
              <div className="form-field"><label htmlFor="receipt-supplier">Fornecedor</label><select id="receipt-supplier" value={form.fornecedorId} onChange={(event) => updateForm('fornecedorId', event.target.value)}><option value="">Não informado</option>{suppliers.filter((supplier) => supplier.ativo).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.nomeFantasia || supplier.razaoSocial}</option>)}</select></div>
              <div className="form-field"><label htmlFor="receipt-lot">Código do lote *</label><input id="receipt-lot" value={form.codigoLote} onChange={(event) => updateForm('codigoLote', event.target.value)} maxLength={80} required /></div>
              <div className="form-field"><label htmlFor="receipt-quantity">Quantidade *</label><input id="receipt-quantity" type="number" step="0.001" min="0.001" value={form.quantidade} onChange={(event) => updateForm('quantidade', event.target.value)} required /></div>
              <div className="form-field"><label htmlFor="receipt-cost">Custo unitário (R$)</label><input id="receipt-cost" type="number" step="0.0001" min="0" value={form.custoUnitario} onChange={(event) => updateForm('custoUnitario', event.target.value)} /></div>
              <div className="form-field"><label htmlFor="receipt-manufacture">Data de fabricação</label><input id="receipt-manufacture" type="date" value={form.dataFabricacao} onChange={(event) => updateForm('dataFabricacao', event.target.value)} /></div>
              <div className="form-field"><label htmlFor="receipt-expiry">Validade física do lote</label><input id="receipt-expiry" type="date" value={form.dataValidade} onChange={(event) => updateForm('dataValidade', event.target.value)} /></div>
              <div className="form-field form-field--full"><label htmlFor="receipt-notes">Observações</label><textarea id="receipt-notes" rows={2} value={form.observacao} onChange={(event) => updateForm('observacao', event.target.value)} maxLength={2000} /></div>
            </div>
            {receiptError && <div className="form-error" role="alert">{receiptError}</div>}
            <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setShowReceipt(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={submitting || epis.length === 0}>{submitting ? 'Registrando...' : 'Confirmar recebimento'}</button></div>
          </form>
        </section>
      )}

      <section className="panel data-panel">
        <div className="stock-tabs" role="tablist" aria-label="Visões do estoque">
          <button className={tab === 'balances' ? 'stock-tab stock-tab--active' : 'stock-tab'} type="button" role="tab" aria-selected={tab === 'balances'} onClick={() => setTab('balances')}>Saldos por EPI</button>
          <button className={tab === 'lots' ? 'stock-tab stock-tab--active' : 'stock-tab'} type="button" role="tab" aria-selected={tab === 'lots'} onClick={() => setTab('lots')}>Lotes</button>
          <button className={tab === 'movements' ? 'stock-tab stock-tab--active' : 'stock-tab'} type="button" role="tab" aria-selected={tab === 'movements'} onClick={() => setTab('movements')}>Movimentações</button>
          <button className="tab-refresh" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Atualizar</button>
        </div>
        {loading ? <div className="loading-cell loading-pad">Carregando dados de estoque...</div> : tab === 'balances' ? (
          balances.length === 0 ? <EmptyState title="Estoque ainda sem movimentações" description="Registre o primeiro recebimento para iniciar o controle de saldos." /> :
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Código</th><th>EPI</th><th>Saldo disponível</th><th>Saldo vencido</th><th>Mínimo</th><th>Reposição</th></tr></thead><tbody>
            {balances.map((item) => <tr key={item.epiId}><td className="cell-primary">{item.codigo}</td><td>{item.nome}<small className="cell-subtext">{item.unidadeMedida}</small></td><td>{formatNumber(item.saldoDisponivel)}</td><td>{formatNumber(item.saldoVencido)}</td><td>{formatNumber(item.estoqueMinimo)}</td><td>{item.abaixoDoMinimo ? <StatusBadge value="ABAIXO DO MINIMO" /> : <StatusBadge value="ATIVO" />}</td></tr>)}
          </tbody></table></div>
        ) : tab === 'lots' ? (
          lots.length === 0 ? <EmptyState title="Nenhum lote cadastrado" description="Os lotes serão listados após o primeiro recebimento de estoque." /> :
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Lote</th><th>EPI</th><th>Fornecedor</th><th>Validade</th><th>Quantidade</th><th>Custo unitário</th></tr></thead><tbody>
            {lots.map((lot) => <tr key={lot.id}><td className="cell-primary">{lot.codigoLote}</td><td>{lot.epiCodigo}<small className="cell-subtext">{lot.epiNome}</small></td><td>{lot.fornecedorNome || '—'}</td><td>{formatDate(lot.dataValidade)}{lot.dataValidade && lot.dataValidade < new Date().toISOString().slice(0, 10) ? <small className="cell-subtext text-danger">Vencido</small> : null}</td><td>{formatNumber(lot.quantidadeDisponivel)} / {formatNumber(lot.quantidadeInicial)}</td><td>{formatCurrency(lot.custoUnitario)}</td></tr>)}
          </tbody></table></div>
        ) : (
          movements.length === 0 ? <EmptyState title="Nenhuma movimentação registrada" description="Entradas, saídas e devoluções aparecerão no histórico após serem confirmadas." /> :
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Data</th><th>Tipo</th><th>EPI</th><th>Lote</th><th>Quantidade</th><th>Origem</th></tr></thead><tbody>
            {movements.map((movement) => <tr key={movement.id}><td>{formatDateTime(movement.createdAt)}</td><td><StatusBadge value={movement.tipo} /></td><td>{movement.epiCodigo}<small className="cell-subtext">{movement.epiNome}</small></td><td>{movement.codigoLote}</td><td>{formatNumber(movement.quantidade)}</td><td>{movement.origemTipo || '—'}</td></tr>)}
          </tbody></table></div>
        )}
        <div className="data-panel__footer"><span>O histórico de movimentações é imutável.</span><span>Valores consultados diretamente na API</span></div>
      </section>
    </div>
  )
}
