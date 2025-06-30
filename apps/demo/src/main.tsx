import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Themes } from '@diff-viewer'
import { DiffViewerConfigProvider } from '@diff-viewer'

function Root() {
  return (
    <DiffViewerConfigProvider theme={Themes.light}>
      <App />
    </DiffViewerConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
