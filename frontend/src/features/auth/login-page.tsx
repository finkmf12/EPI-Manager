import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/app/auth-context'
import { ApiError } from '@/api/client'
import type { CompanyMembership } from '@/api/types'

export function LoginPage() {
  const {
    pendingSelection,
    isAuthenticating,
    login,
    selectCompany,
    cancelCompanySelection,
  } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível autenticar.')
    }
  }

  async function chooseCompany(company: CompanyMembership) {
    setError('')
    try {
      await selectCompany(company)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : caught instanceof Error ? caught.message : 'Não foi possível selecionar a empresa.')
    }
  }

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-visual__brand">
          <div className="brand-mark brand-mark--large"><ShieldCheck size={26} /></div>
          <div><strong>EPI<span>Manager</span></strong><small>GESTÃO DE SEGURANÇA</small></div>
        </div>
        <div className="login-visual__message">
          <span className="login-kicker">CONTROLE • CONFORMIDADE • PROTEÇÃO</span>
          <h1>Segurança no trabalho começa com <em>gestão.</em></h1>
          <p>Centralize o controle de EPIs, estoque e entregas em uma plataforma organizada e rastreável.</p>
          <div className="login-points">
            <div><CheckCircle2 size={17} /><span>Histórico de entregas por colaborador</span></div>
            <div><CheckCircle2 size={17} /><span>Controle de lotes, validade e CA</span></div>
            <div><CheckCircle2 size={17} /><span>Acesso isolado por empresa e perfil</span></div>
          </div>
        </div>
        <div className="login-visual__footer"><span>PLATAFORMA DE GESTÃO DE EPIs</span><span>© 2026 EPI Manager</span></div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><div className="brand-mark"><ShieldCheck size={22} /></div><strong>EPI<span>Manager</span></strong></div>
          {!pendingSelection ? (
            <>
              <div className="form-heading">
                <span className="form-eyebrow">ACESSO À PLATAFORMA</span>
                <h2>Bem-vindo de volta</h2>
                <p>Entre com suas credenciais para acessar o ambiente da sua empresa.</p>
              </div>
              <form className="login-form" onSubmit={submit}>
                <label htmlFor="email">E-mail</label>
                <div className="input-wrap"><span>@</span><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu.email@empresa.com.br" autoComplete="username" required maxLength={254} /></div>
                <label htmlFor="password">Senha</label>
                <div className="input-wrap"><LockKeyhole size={17} /><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" autoComplete="current-password" required maxLength={72} /></div>
                {error && <div className="form-error" role="alert">{error}</div>}
                <button className="primary-button login-submit" type="submit" disabled={isAuthenticating}>
                  {isAuthenticating ? 'Autenticando...' : 'Entrar na plataforma'} <ArrowRight size={17} />
                </button>
              </form>
              <div className="login-help"><ShieldCheck size={16} /><span>Conexão protegida e autenticação segura.</span></div>
              <p className="registration-note">Precisa de acesso? Solicite a criação da conta ao administrador da sua empresa.</p>
            </>
          ) : (
            <>
              <div className="form-heading">
                <span className="form-eyebrow">SELEÇÃO DE AMBIENTE</span>
                <h2>Escolha sua empresa</h2>
                <p>Olá, {pendingSelection.user.name}. Selecione a empresa que deseja acessar nesta sessão.</p>
              </div>
              <div className="company-choice-list">
                {pendingSelection.companies.map((company) => (
                  <button
                    key={company.companyId}
                    className="company-choice"
                    type="button"
                    disabled={isAuthenticating}
                    onClick={() => void chooseCompany(company)}
                  >
                    <span className="company-choice__icon"><Building2 size={19} /></span>
                    <span className="company-choice__copy"><strong>{company.displayName || company.tradeName || company.legalName}</strong><small>{company.profile.replaceAll('_', ' ')}</small></span>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
              {pendingSelection.companies.length === 0 && <div className="form-error">Esta conta não possui vínculos ativos com empresas.</div>}
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="back-button" type="button" onClick={cancelCompanySelection} disabled={isAuthenticating}><ArrowLeft size={16} /> Voltar ao login</button>
              <div className="login-help"><ShieldCheck size={16} /><span>O acesso será restrito à empresa selecionada.</span></div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
