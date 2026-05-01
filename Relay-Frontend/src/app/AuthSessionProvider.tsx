// This file owns authenticated user state and provides session context for the rest of the app
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser } from '@/domain'
import { sessionService } from '@/services/sessionService'

type AuthSessionContextValue = {
  user: AuthUser | null
  setUser: (next: AuthUser) => void
  clearUser: () => void
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)
export { AuthSessionContext }

// Keep context and persistent session storage in sync so refreshes preserve the logged-in user
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => sessionService.getCurrentUser())

  // Every login/update writes both React state and persistent session storage
  const setUser = useCallback((next: AuthUser) => {
    sessionService.setCurrentUser(next)
    setUserState(next)
  }, [])

  // Logout must clear both memory and persistent storage
  const clearUser = useCallback(() => {
    sessionService.clearCurrentUser()
    setUserState(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      clearUser,
    }),
    [clearUser, setUser, user],
  )

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}
