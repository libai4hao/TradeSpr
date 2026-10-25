import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App'
import './index.css'

declare global {
  interface Window {
    __BASENAME__?: string
  }
}

const basename = window.__BASENAME__ || '/'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h2>页面出错了</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)