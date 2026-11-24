import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { AppLayout } from '@/layouts/app-layout'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { SettingsPage } from '@/features/resources/settings-page'
import { StockPage } from '@/features/stock/stock-page'
import { DeliveriesPage } from '@/features/resources/deliveries-page'
import { ReturnsPage } from '@/features/resources/returns-page'
import { ReportsPage } from '@/features/reports/reports-page'
import { AuditPage } from '@/features/audit/audit-page'
import { NotificationsPage } from '@/features/notifications/notifications-page'
import { EpisPage } from '@/features/resources/epis-page'
import { CollaboratorsPage } from '@/features/resources/collaborators-page'
import { SectorsPage } from '@/features/resources/sectors-page'
import { SuppliersPage } from '@/features/resources/suppliers-page'
import { CategoriesPage } from '@/features/resources/categories-page'

function ProtectedLayout() {
  const { session } = useAuth()
  return session ? <AppLayout /> : <Navigate to="/login" replace />
}

function HomeRedirect() {
  const { session } = useAuth()
  return <Navigate to={session ? '/app' : '/login'} replace />
}

export function App() {
  const { session } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={session ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route path="/register" element={session ? <Navigate to="/app" replace /> : <RegisterPage />} />
      <Route path="/app" element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="collaborators" element={<CollaboratorsPage />} />
        <Route path="sectors" element={<SectorsPage />} />
        <Route path="epis" element={<EpisPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
