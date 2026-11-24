import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  History,
  ArrowLeftRight,
  Box,
  Building2,
  ChevronDown,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RotateCcw,
  FileBarChart,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/app/auth-context'
import { initials } from '@/lib/utils'

const navigation = [
  { label: 'Visão geral', to: '/app', icon: LayoutDashboard, end: true },
  { label: 'Colaboradores', to: '/app/collaborators', icon: Users },
  { label: 'Setores', to: '/app/sectors', icon: Building2 },
  { label: 'Catálogo de EPIs', to: '/app/epis', icon: Package },
  { label: 'Categorias', to: '/app/categories', icon: Box },
  { label: 'Estoque', to: '/app/stock', icon: ClipboardCheck },
  { label: 'Entregas', to: '/app/deliveries', icon: Truck },
  { label: 'Devoluções', to: '/app/returns', icon: RotateCcw },
  { label: 'Fornecedores', to: '/app/suppliers', icon: ArrowLeftRight },
  { label: 'Relatórios', to: '/app/reports', icon: FileBarChart },
  { label: 'Auditoria', to: '/app/audit', icon: History, adminOnly: true },
]

const pageTitles: Record<string, string> = {
  '/app': 'Visão geral',
  '/app/collaborators': 'Colaboradores',
  '/app/sectors': 'Setores',
  '/app/epis': 'Catálogo de EPIs',
  '/app/categories': 'Categorias',
  '/app/stock': 'Estoque',
  '/app/deliveries': 'Entregas',
  '/app/returns': 'Devoluções',
  '/app/suppliers': 'Fornecedores',
  '/app/reports': 'Relatórios',
  '/app/audit': 'Auditoria',
  '/app/settings': 'Configurações',
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { session, logout } = useAuth()
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'EPI Manager'

  return (
    <div className="app-shell">
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><ShieldCheck size={22} strokeWidth={2.3} /></div>
          <div className="brand-copy"><strong>EPI<span>Manager</span></strong><small>GESTÃO DE SEGURANÇA</small></div>
          <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>

        <div className="sidebar-company">
          <div className="company-avatar"><Building2 size={15} /></div>
          <div className="company-copy"><span>EMPRESA ATIVA</span><strong title={session?.companyName}>{session?.companyName}</strong></div>
          <ChevronDown size={15} className="company-chevron" />
        </div>

        <div className="sidebar-section-label">MENU PRINCIPAL</div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navigation.filter((item) => !('adminOnly' in item) || !item.adminOnly || session?.companyProfile === 'ADMIN').map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/app/settings" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={() => setMobileOpen(false)}>
            <Settings size={18} strokeWidth={1.9} /><span>Configurações</span>
          </NavLink>
          <div className="sidebar-profile">
            <div className="profile-avatar">{initials(session?.user.name)}</div>
            <div className="profile-copy"><strong>{session?.user.name}</strong><span>{session?.companyProfile ?? 'Usuário'}</span></div>
            <button className="icon-button profile-logout" aria-label="Sair" title="Sair" onClick={logout}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <div className="breadcrumb"><span>Aplicação</span><span className="breadcrumb-divider">/</span><strong>{title}</strong></div>
          </div>
          <div className="topbar-right">
            <span className="api-status"><span className="api-status-dot" /> Sessão ativa</span>
            <div className="topbar-user">{initials(session?.user.name)}</div>
          </div>
        </header>
        <main className="main-content"><Outlet /></main>
        <footer className="app-footer">
          <span>EPI Manager <span className="footer-separator">•</span> Ambiente de desenvolvimento</span>
          <span><Activity size={13} /> Operação protegida por empresa</span>
        </footer>
      </div>
    </div>
  )
}
