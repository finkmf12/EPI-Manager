import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { AppLayout } from '@/layouts/app-layout'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { ResourcePage } from '@/features/resources/resource-page'
import { SettingsPage } from '@/features/resources/settings-page'
import { StockPage } from '@/features/stock/stock-page'
import { DeliveriesPage } from '@/features/resources/deliveries-page'
import { ReturnsPage } from '@/features/resources/returns-page'

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
        <Route path="collaborators" element={<ResourcePage resourceKey="collaborators" />} />
        <Route path="sectors" element={<ResourcePage resourceKey="sectors" />} />
        <Route path="epis" element={<ResourcePage resourceKey="epis" />} />
        <Route path="categories" element={<ResourcePage resourceKey="categories" />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="suppliers" element={<ResourcePage resourceKey="suppliers" />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
