// This file supports session service in the Relay handover workflow.
import type { AuthUser } from '../domain'

const SESSION_KEY = 'relay.currentUser'

export const sessionService = {
  // updates current user so teams can keep baton delivery on track.
  setCurrentUser(user: AuthUser) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  },
  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },
  // clears current user so teams can keep baton delivery on track.
  clearCurrentUser() {
    localStorage.removeItem(SESSION_KEY)
  },
}
