import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { isMockApiEnabled, warnIfMisconfigured } from './config'

async function enableDemoApi() {
  if (!isMockApiEnabled()) return

  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}

warnIfMisconfigured()

enableDemoApi().then(() => {
  const root = document.getElementById('root')
  if (!root) throw new Error('Application root element was not found')

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
