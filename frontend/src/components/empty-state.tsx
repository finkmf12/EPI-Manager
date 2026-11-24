import { Inbox } from 'lucide-react'

export function EmptyState({ title = 'Nenhum registro encontrado', description = 'Quando houver dados cadastrados para esta empresa, eles aparecerão aqui.' }: { title?: string; description?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><Inbox size={20} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
