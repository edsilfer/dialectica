import { DiffViewerConfigProvider, FileListConfig, Themes } from '@diff-viewer'
import { FileExplorerConfig } from '@file-explorer'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SettingsProvider } from './hooks/use-settings'
import Home from './pages/Home'
import Landing from './pages/Welcome'

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
  const [preferredTheme, setPreferredTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? Themes.dark : Themes.light,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setPreferredTheme(e.matches ? Themes.dark : Themes.light)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <SettingsProvider>
      <DiffViewerConfigProvider
        theme={preferredTheme}
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
