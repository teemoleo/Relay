// Focused hook for reading auth session context without repeating null checks in every screen
import { useContext } from 'react'
import { AuthSessionContext } from './AuthSessionProvider'

// Guard ensures auth data is only used inside the app's session provider
export function useAuthSession() {
  const ctx = useContext(AuthSessionContext)
  if (ctx == null) {
    throw new Error('useAuthSession must be used within AuthSessionProvider.')
  }
  return ctx
}
