import { DEFAULT_DIFF_VIEWER_CONFIG, DiffViewerConfigProvider, FileListConfig } from '@diff-viewer'
import { FileExplorerConfig } from '@file-explorer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { usePreferedTheme } from './hooks/use-prefered-theme'
import { SettingsProvider } from './hooks/use-settings'
import Home from './pages/Home'
import Landing from './pages/Welcome'

export const DEFAULT_FILE_EXPLORER_CONFIG: FileExplorerConfig = {
  startExpanded: true,
  nodeConnector: 'dashed',
  indentPx: 15,
  collapsePackages: true,
  showIcons: true,
  displayNodeDetails: true,
}

export const DEFAULT_FILE_LIST_CONFIG: FileListConfig = {
  mode: 'unified',
  // TODO: not implemented yet
  ignoreWhitespace: false,
  maxFileLines: 400,
  maxLinesToFetch: 10,
}

function Root() {
  const preferredTheme = usePreferedTheme()

  return (
    <SettingsProvider>
      <DiffViewerConfigProvider
        config={{ ...DEFAULT_DIFF_VIEWER_CONFIG, theme: preferredTheme }}
        scope="main"
        fileExplorerConfig={DEFAULT_FILE_EXPLORER_CONFIG}
        fileListConfig={DEFAULT_FILE_LIST_CONFIG}
        storage="local"
      >
        <BrowserRouter basename="/dialectica">
          <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </DiffViewerConfigProvider>
    </SettingsProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
