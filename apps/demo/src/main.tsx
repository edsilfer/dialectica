import { DiffViewerConfigProvider, FileListConfig, Themes } from '@diff-viewer'
import { FileExplorerConfig } from '@file-explorer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/Landing'
import { SettingsProvider } from './hooks/use-settings'

export const DEFAULT_FILE_EXPLORER_CONFIG: FileExplorerConfig = {
  startExpanded: true,
  nodeConnector: 'dashed',
  indentPx: 15,
  collapsePackages: true,
  showIcons: false,
  displayNodeDetails: false,
}

export const DEFAULT_FILE_LIST_CONFIG: FileListConfig = {
  mode: 'unified',
  ignoreWhitespace: false,
  maxFileLines: 400,
  maxLinesToFetch: 10,
}

function Root() {
  return (
    <SettingsProvider>
      <DiffViewerConfigProvider
        theme={Themes.light}
        fileExplorerConfig={DEFAULT_FILE_EXPLORER_CONFIG}
        fileListConfig={DEFAULT_FILE_LIST_CONFIG}
        storage="local"
      >
        <App />
      </DiffViewerConfigProvider>
    </SettingsProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
