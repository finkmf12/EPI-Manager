import { cn } from '@/lib/utils'

const positive = new Set(['ATIVO', 'ATIVA', 'CONFIRMADA', 'REUTILIZAVEL', 'DISPONIVEL'])
const warning = new Set(['RASCUNHO', 'ATENCAO', 'ABAIXO DO MINIMO', 'PENDENTE', 'AFASTADO'])
const negative = new Set(['INATIVO', 'INATIVA', 'CANCELADA', 'VENCIDO', 'DANIFICADO', 'DESCARTE', 'BLOQUEADO'])

export function StatusBadge({ value }: { value: string | boolean | null | undefined }) {
  const label = typeof value === 'boolean' ? (value ? 'Ativo' : 'Inativo') : (value || '—')
  const key = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const tone = positive.has(key) ? 'success' : warning.has(key) ? 'warning' : negative.has(key) ? 'danger' : 'neutral'
  return <span className={cn('status-badge', `status-badge--${tone}`)}>{label.toString().replaceAll('_', ' ')}</span>
}
