// This file defines app routes and lazy-loads major screens to minimise load times
import { Suspense, lazy, type ComponentType, type ReactElement } from 'react'
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { PageLayout } from '../components/app-shell/PageLayout'
import { RequireAuth, RequireRole } from './RouteGuards'
import { ROUTES } from './routes'

function lazyPage<T extends ComponentType>(loader: () => Promise<{ default: T }>) {
  return lazy(loader)
}

const loginPageLazy = lazyPage(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const dashboardViewLazy = lazyPage(() =>
  import('../features/dashboard/DashboardView').then((module) => ({ default: module.DashboardView })),
)
const batonBoardViewLazy = lazyPage(() =>
  import('../features/baton/BatonBoardView').then((module) => ({ default: module.BatonBoardView })),
)
const teamDetailPageLazy = lazyPage(() =>
  import('../pages/TeamDetailPage').then((module) => ({ default: module.TeamDetailPage })),
)
const taskDetailPageLazy = lazyPage(() =>
  import('../pages/TaskDetailPage').then((module) => ({ default: module.TaskDetailPage })),
)

const routeLoadingFallback = <p className="text-sm text-slate-500">Loading page...</p>

// Wraps each lazy screen so users always see a stable loading state
function withSuspense(component: ComponentType): ReactElement {
  const Component = component
  return (
    <Suspense fallback={routeLoadingFallback}>
      <Component />
    </Suspense>
  )
}

export const appRouter = createBrowserRouter([
  { path: '/', element: <Navigate to={ROUTES.login} replace /> },
  { path: ROUTES.login, element: withSuspense(loginPageLazy) },
  {
    element: <RequireAuth />,
    children: [
      {
        element: (
          <PageLayout>
            <Outlet />
          </PageLayout>
        ),
        children: [
          {
            element: <RequireRole allowed={['resilience_manager', 'team_lead']} />,
            children: [{ path: ROUTES.resilienceDashboard, element: withSuspense(dashboardViewLazy) }],
          },
          { path: ROUTES.batons, element: withSuspense(batonBoardViewLazy) },
          { path: '/teams/:id', element: withSuspense(teamDetailPageLazy) },
          { path: '/batons/:id', element: withSuspense(taskDetailPageLazy) },
          { path: '/dashboard', element: <Navigate to={ROUTES.resilienceDashboard} replace /> },
          { path: '/baton', element: <Navigate to={ROUTES.batons} replace /> },
          { path: '/team/:id', element: <Navigate to={ROUTES.resilienceDashboard} replace /> },
          { path: '/task/:id', element: <Navigate to={ROUTES.batons} replace /> },
        ],
      },
    ],
  },
])
