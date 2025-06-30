import { CodePanelConfig, DiffViewerConfigProvider, FileExplorerConfig, Themes } from '@diff-viewer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const DEFAULT_FILE_EXPLORER_CONFIG: FileExplorerConfig = {
  startExpanded: true,
  nodeConnector: 'dashed',
  indentPx: 15,
  collapsePackages: true,
  showIcons: false,
  displayNodeDetails: false,
}

const DEFAULT_CODE_PANEL_CONFIG: CodePanelConfig = {
  mode: 'unified',
  highlightSyntax: false,
  showLineNumbers: true,
  ignoreWhitespace: false,
}

function Root() {
  return (
    <DiffViewerConfigProvider
      theme={Themes.light}
      fileExplorerConfig={DEFAULT_FILE_EXPLORER_CONFIG}
      codePanelConfig={DEFAULT_CODE_PANEL_CONFIG}
      storage="local"
    >
      <App />
    </DiffViewerConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
