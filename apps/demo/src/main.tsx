import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { DiffViewerStateProvider } from './providers/config-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DiffViewerStateProvider>
      <App />
    </DiffViewerStateProvider>
  </React.StrictMode>,
)
