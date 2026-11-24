import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Building2, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import type { RegisterCompanyRequest } from '@/api/types'

export function RegisterPage() {
  const navigate = useNavigate()
  const { registerCompany, isAuthenticating } = useAuth()
  const [form, setForm] = useState<RegisterCompanyRequest>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    emailContato: '',
    telefone: '',
    nomeAdministrador: '',
    emailAdministrador: '',
    senhaAdministrador: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  function update<K extends keyof RegisterCompanyRequest>(key: K, value: RegisterCompanyRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (form.senhaAdministrador !== confirmPassword) {
      setError('As senhas informadas não coincidem.')
      return
    }
    if (new TextEncoder().encode(form.senhaAdministrador).length > 72) {
      setError('A senha deve ter no máximo 72 bytes. Evite caracteres especiais de vários bytes.')
      return
    }

    const request: RegisterCompanyRequest = {
      razaoSocial: form.razaoSocial.trim(),
      nomeFantasia: form.nomeFantasia?.trim() || undefined,
      cnpj: form.cnpj.trim(),
      emailContato: form.emailContato?.trim() || undefined,
      telefone: form.telefone?.trim() || undefined,
      nomeAdministrador: form.nomeAdministrador.trim(),
      emailAdministrador: form.emailAdministrador.trim(),
      senhaAdministrador: form.senhaAdministrador,
    }

    try {
      await registerCompany(request)
      navigate('/app', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível cadastrar a empresa.')
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
          <span className="login-kicker">COMECE A ORGANIZAR SUA OPERAÇÃO</span>
          <h1>Gestão de EPIs com <em>controle e rastreabilidade.</em></h1>
          <p>Cadastre sua empresa e crie o primeiro acesso administrativo para configurar colaboradores, equipamentos e estoque.</p>
          <div className="login-points">
            <div><Building2 size={17} /><span>Ambiente exclusivo para sua empresa</span></div>
            <div><ShieldCheck size={17} /><span>Primeiro usuário com perfil administrador</span></div>
            <div><ShieldCheck size={17} /><span>Dados protegidos por isolamento entre empresas</span></div>
          </div>
        </div>
        <div className="login-visual__footer"><span>PLATAFORMA DE GESTÃO DE EPIs</span><span>© 2026 EPI Manager</span></div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap" style={{ width: 'min(100%, 560px)' }}>
          <div className="login-mobile-brand"><div className="brand-mark"><ShieldCheck size={22} /></div><strong>EPI<span>Manager</span></strong></div>
          <div className="form-heading">
            <span className="form-eyebrow">NOVO AMBIENTE</span>
            <h2>Cadastrar empresa</h2>
            <p>Informe os dados da organização e crie o usuário que será o primeiro administrador.</p>
          </div>

          <form className="login-form" onSubmit={submit}>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label htmlFor="razaoSocial">Razão social *</label>
                <input id="razaoSocial" value={form.razaoSocial} onChange={(event) => update('razaoSocial', event.target.value)} required maxLength={180} autoComplete="organization" />
              </div>
              <div className="form-field">
                <label htmlFor="nomeFantasia">Nome fantasia</label>
                <input id="nomeFantasia" value={form.nomeFantasia} onChange={(event) => update('nomeFantasia', event.target.value)} maxLength={180} />
              </div>
              <div className="form-field">
                <label htmlFor="cnpj">CNPJ *</label>
                <input id="cnpj" value={form.cnpj} onChange={(event) => update('cnpj', event.target.value)} required maxLength={18} placeholder="00.000.000/0000-00" inputMode="text" />
              </div>
              <div className="form-field">
                <label htmlFor="emailContato">E-mail da empresa</label>
                <input id="emailContato" type="email" value={form.emailContato} onChange={(event) => update('emailContato', event.target.value)} maxLength={254} />
              </div>
              <div className="form-field">
                <label htmlFor="telefone">Telefone</label>
                <input id="telefone" type="tel" value={form.telefone} onChange={(event) => update('telefone', event.target.value)} maxLength={30} />
              </div>
              <div className="form-field form-field--full">
                <label htmlFor="nomeAdministrador">Nome do administrador *</label>
                <input id="nomeAdministrador" value={form.nomeAdministrador} onChange={(event) => update('nomeAdministrador', event.target.value)} required maxLength={150} autoComplete="name" />
              </div>
              <div className="form-field form-field--wide">
                <label htmlFor="emailAdministrador">E-mail de acesso *</label>
                <input id="emailAdministrador" type="email" value={form.emailAdministrador} onChange={(event) => update('emailAdministrador', event.target.value)} required maxLength={254} autoComplete="email" />
              </div>
              <div className="form-field">
                <label htmlFor="senhaAdministrador">Senha *</label>
                <input id="senhaAdministrador" type="password" value={form.senhaAdministrador} onChange={(event) => update('senhaAdministrador', event.target.value)} required minLength={12} maxLength={72} autoComplete="new-password" />
              </div>
              <div className="form-field form-field--wide">
                <label htmlFor="confirmPassword">Confirmar senha *</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} maxLength={72} autoComplete="new-password" />
              </div>
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button login-submit" type="submit" disabled={isAuthenticating}>
              {isAuthenticating ? 'Cadastrando empresa...' : 'Cadastrar e acessar'} <ArrowRight size={17} />
            </button>
          </form>

          <div className="login-help"><ShieldCheck size={16} /><span>O cadastro cria a empresa e seu primeiro usuário ADMIN.</span></div>
          <p className="registration-note"><Link className="text-link" to="/login"><ArrowLeft size={13} /> Voltar para o login</Link></p>
        </div>
      </section>
    </div>
  )
}
