import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthSessionProvider } from './app/AuthSessionProvider'
import { appRouter } from './app/router'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Relay app root element #root is missing from index.html.')
}

createRoot(rootEl).render(
  <StrictMode>
    <AuthSessionProvider>
      <RouterProvider router={appRouter} />
    </AuthSessionProvider>
  </StrictMode>,
)
