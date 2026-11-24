import { Printer, X } from 'lucide-react'
import type { Collaborator, Delivery, Epi, StockLot } from '@/api/types'
import { formatDate, formatNumber } from '@/lib/utils'

type Props = {
  delivery: Delivery
  collaborator?: Collaborator
  epis: Epi[]
  lots: StockLot[]
  companyName?: string
  onClose: () => void
}

export function DeliveryReceipt({ delivery, collaborator, epis, lots, companyName, onClose }: Props) {
  const epiById = new Map(epis.map((epi) => [epi.id, epi]))
  const lotById = new Map(lots.map((lot) => [lot.id, lot]))
  const totalItems = delivery.itens.reduce((sum, item) => sum + Number(item.quantidade), 0)

  return (
    <div className="delivery-receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
      <div className="delivery-receipt-actions">
        <span>Pré-visualização do termo de entrega</span>
        <div>
          <button className="secondary-button" type="button" onClick={onClose}><X size={16} /> Fechar</button>
          <button className="primary-button" type="button" onClick={() => window.print()}><Printer size={16} /> Imprimir / Salvar PDF</button>
        </div>
      </div>
      <article className="delivery-receipt-sheet">
        <header className="delivery-receipt-header">
          <div>
            <span className="delivery-receipt-eyebrow">CONTROLE DE SEGURANÇA DO TRABALHO</span>
            <h1 id="receipt-title">Termo de entrega de EPI</h1>
            <p>Comprovante de fornecimento de Equipamentos de Proteção Individual</p>
          </div>
          <div className="delivery-receipt-number">
            <small>Nº DA ENTREGA</small>
            <strong>{delivery.id.slice(0, 8).toUpperCase()}</strong>
            <small>STATUS: {delivery.status}</small>
          </div>
        </header>

        <section className="receipt-section">
          <h2>Identificação da empresa</h2>
          <div className="receipt-info-grid receipt-info-grid--company">
            <div><small>Empresa</small><strong>{companyName || 'Empresa não informada'}</strong></div>
            <div><small>Data de emissão</small><strong>{formatDate(new Date().toISOString().slice(0, 10))}</strong></div>
          </div>
        </section>

        <section className="receipt-section">
          <h2>Identificação do colaborador</h2>
          <div className="receipt-info-grid">
            <div><small>Nome completo</small><strong>{collaborator?.nome || 'Colaborador não localizado'}</strong></div>
            <div><small>Matrícula</small><strong>{collaborator?.matricula || '—'}</strong></div>
            <div><small>Cargo</small><strong>{collaborator?.cargo || '—'}</strong></div>
            <div><small>Data da entrega</small><strong>{formatDate(delivery.dataEntrega)}</strong></div>
          </div>
        </section>

        <section className="receipt-section">
          <h2>Equipamentos entregues</h2>
          <div className="receipt-table-wrap">
            <table className="receipt-table">
              <thead><tr><th>Equipamento</th><th>CA</th><th>Lote</th><th>Quantidade</th><th>Substituição prevista</th></tr></thead>
              <tbody>
                {delivery.itens.map((item) => {
                  const epi = epiById.get(item.epiId)
                  const lot = lotById.get(item.loteId)
                  return (
                    <tr key={item.id}>
                      <td><strong>{epi?.nome || 'EPI não localizado'}</strong><small>{epi?.codigo || item.epiId.slice(0, 8).toUpperCase()}</small></td>
                      <td>{epi?.numeroCa || 'Não informado'}</td>
                      <td>{lot?.codigoLote || '—'}</td>
                      <td>{formatNumber(item.quantidade)} {epi?.unidadeMedida || ''}</td>
                      <td>{formatDate(item.dataPrevistaSubstituicao)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot><tr><td colSpan={3}>Total de unidades entregues</td><td colSpan={2}>{formatNumber(totalItems)}</td></tr></tfoot>
            </table>
          </div>
        </section>

        <section className="receipt-declaration">
          <h2>Declaração de recebimento e responsabilidade</h2>
          <p>Declaro que recebi os Equipamentos de Proteção Individual relacionados neste documento, em condições de uso, e fui orientado(a) quanto à sua utilização, conservação, guarda e finalidade. Comprometo-me a utilizar os equipamentos durante a execução das atividades que exigem proteção, comunicar qualquer dano ou irregularidade e solicitar a substituição quando necessário, conforme as orientações da empresa e as normas aplicáveis.</p>
          {delivery.observacao && <p><strong>Observações da entrega:</strong> {delivery.observacao}</p>}
        </section>

        <div className="receipt-signatures">
          <div><span></span><strong>{collaborator?.nome || 'Colaborador'}</strong><small>Assinatura do colaborador</small><small>Data: ____ / ____ / ______</small></div>
          <div><span></span><strong>Responsável pela entrega</strong><small>Nome e assinatura</small><small>Data: ____ / ____ / ______</small></div>
        </div>

        <footer className="delivery-receipt-footer">
          <span>Documento gerado pelo EPI Manager</span>
          <span>Entrega {delivery.id.toUpperCase()}</span>
        </footer>
      </article>
    </div>
  )
}
