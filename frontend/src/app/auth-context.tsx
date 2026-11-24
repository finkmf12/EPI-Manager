import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiRequest } from '@/api/client'
import type {
  CompanyMembership,
  CurrentCompanyResponse,
  LoginResponse,
  SelectCompanyResponse,
} from '@/api/types'

type UserSummary = { id: string; name: string; email: string }
type PendingSelection = {
  selectionToken: string
  user: UserSummary
  companies: CompanyMembership[]
  expiresInSeconds: number
}

type AppSession = {
  accessToken: string
  user: UserSummary
  companyId: string
  companyName: string
  companyProfile: string
  expiresInSeconds: number
}

type AuthContextValue = {
  session: AppSession | null
  pendingSelection: PendingSelection | null
  isAuthenticating: boolean
  login: (email: string, password: string) => Promise<void>
  selectCompany: (company: CompanyMembership) => Promise<void>
  cancelCompanySelection: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null)
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsAuthenticating(true)
    try {
      const result = await apiRequest<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setPendingSelection({
        selectionToken: result.selectionToken,
        user: result.user,
        companies: result.companies,
        expiresInSeconds: result.expiresInSeconds,
      })
    } finally {
      setIsAuthenticating(false)
    }
  }, [])

  const selectCompany = useCallback(async (company: CompanyMembership) => {
    if (!pendingSelection) throw new Error('Faça login antes de selecionar uma empresa.')
    setIsAuthenticating(true)
    try {
      const selected = await apiRequest<SelectCompanyResponse>(
        '/api/v1/auth/select-company',
        {
          method: 'POST',
          body: JSON.stringify({ companyId: company.companyId }),
        },
        pendingSelection.selectionToken,
      )
      const currentCompany = await apiRequest<CurrentCompanyResponse>(
        '/api/v1/companies/current',
        {},
        selected.accessToken,
      )
      setSession({
        accessToken: selected.accessToken,
        user: pendingSelection.user,
        companyId: selected.companyId,
        companyName: currentCompany.tradeName || currentCompany.legalName,
        companyProfile: selected.companyProfile,
        expiresInSeconds: selected.expiresInSeconds,
      })
      setPendingSelection(null)
    } finally {
      setIsAuthenticating(false)
    }
  }, [pendingSelection])

  const cancelCompanySelection = useCallback(() => setPendingSelection(null), [])
  const logout = useCallback(() => {
    setSession(null)
    setPendingSelection(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    pendingSelection,
    isAuthenticating,
    login,
    selectCompany,
    cancelCompanySelection,
    logout,
  }), [session, pendingSelection, isAuthenticating, login, selectCompany, cancelCompanySelection, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return value
}
