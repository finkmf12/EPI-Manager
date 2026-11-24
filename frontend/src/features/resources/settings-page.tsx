import { CheckCircle2, KeyRound, Network, ShieldCheck } from 'lucide-react'
import { API_BASE_URL } from '@/api/client'
import { useAuth } from '@/app/auth-context'
import { PageHeader } from '@/components/page-header'

export function SettingsPage() {
  const { session } = useAuth()
  return (
    <div className="page-stack">
      <PageHeader eyebrow="AMBIENTE E ACESSO" title="Configurações" description="Consulte os dados da sessão e os parâmetros de conexão desta aplicação." />
      <div className="settings-grid">
        <section className="panel settings-card">
          <div className="settings-card__heading"><span className="settings-icon"><Network size={19} /></span><div><h2>Conexão com a API</h2><p>Endereço configurado para o serviço Spring Boot.</p></div></div>
          <div className="settings-row"><span>URL base</span><strong className="settings-code">{API_BASE_URL}</strong></div>
          <div className="settings-row"><span>Transporte</span><strong>REST / JSON</strong></div>
          <div className="settings-row"><span>Credenciais no navegador</span><strong className="text-success">Sem chaves do banco</strong></div>
        </section>
        <section className="panel settings-card">
          <div className="settings-card__heading"><span className="settings-icon settings-icon--green"><ShieldCheck size={19} /></span><div><h2>Sessão autenticada</h2><p>Identidade e escopo atuais da aplicação.</p></div></div>
          <div className="settings-row"><span>Usuário</span><strong>{session?.user.name}</strong></div>
          <div className="settings-row"><span>E-mail</span><strong>{session?.user.email}</strong></div>
          <div className="settings-row"><span>Empresa</span><strong>{session?.companyName}</strong></div>
          <div className="settings-row"><span>Perfil</span><strong>{session?.companyProfile}</strong></div>
        </section>
        <section className="panel settings-card settings-card--wide">
          <div className="settings-card__heading"><span className="settings-icon"><KeyRound size={19} /></span><div><h2>Proteção de credenciais</h2><p>Práticas de segurança aplicadas no front-end.</p></div></div>
          <div className="security-check"><CheckCircle2 size={17} /><span>Token de acesso mantido somente em memória e descartado ao sair ou atualizar a página.</span></div>
          <div className="security-check"><CheckCircle2 size={17} /><span>Nenhuma chave `service_role`, senha PostgreSQL ou segredo JWT é incluído no pacote do navegador.</span></div>
          <div className="security-check"><CheckCircle2 size={17} /><span>As consultas são enviadas à API Spring Boot; o navegador não acessa o schema privado do Supabase.</span></div>
          <p className="settings-footnote">A sessão será encerrada ao recarregar a página até a implementação de um fluxo de renovação seguro de token.</p>
        </section>
      </div>
    </div>
  )
}
