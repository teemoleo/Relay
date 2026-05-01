// This file enforces authentication and role access before users enter protected screens
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { normalizeRole, type UserRole } from '@/roles'
import { useAuthSession } from '@/app/useAuthSession'
import { ROUTES } from '@/app/routes'

type RequireRoleProps = {
  allowed: UserRole[]
}

// Block protected pages for signed-out users and remember their target route for post-login redirect
export function RequireAuth() {
  const { user } = useAuthSession()
  const location = useLocation()
  if (user == null) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }
  return <Outlet />
}

// Allow only approved roles for the relevant screen
export function RequireRole({ allowed }: RequireRoleProps) {
  const { user } = useAuthSession()
  if (!allowed.includes(normalizeRole(user?.role))) {
    return <Navigate to={ROUTES.batons} replace />
  }
  return <Outlet />
}
