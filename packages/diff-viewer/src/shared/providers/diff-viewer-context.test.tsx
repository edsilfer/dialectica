import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { Themes } from '../themes'
import { DEFAULT_CODE_PANEL_CONFIG } from '../../code-panel/providers/code-panel-context'
import { DEFAULT_FILE_EXPLORER_CONFIG } from '../../file-explorer/provider/file-explorer-context'
import { DiffViewerConfigProvider, useDiffViewerConfig } from './diff-viewer-context'

function Consumer() {
  const { theme, codePanelConfig, fileExplorerConfig } = useDiffViewerConfig()

  return (
    <>
      <span data-testid="theme-name">{theme.name}</span>
      <span data-testid="code-panel-mode">{codePanelConfig.mode}</span>
      <span data-testid="file-explorer-indent">{fileExplorerConfig.indentPx}</span>
    </>
  )
}

describe('DiffViewerConfigProvider / useDiffViewerConfig', () => {
  it('provides default configs to its descendants', () => {
    render(
      <DiffViewerConfigProvider theme={Themes.light}>
        <Consumer />
      </DiffViewerConfigProvider>,
    )

    expect(screen.getByTestId('theme-name')).toHaveTextContent('light')
    expect(screen.getByTestId('code-panel-mode')).toHaveTextContent(DEFAULT_CODE_PANEL_CONFIG.mode)
    expect(screen.getByTestId('file-explorer-indent')).toHaveTextContent(
      DEFAULT_FILE_EXPLORER_CONFIG.indentPx.toString(),
    )
  })

  it('provides the supplied configs to its descendants', () => {
    const customCodePanelConfig = {
      ...DEFAULT_CODE_PANEL_CONFIG,
      mode: 'split' as const,
      highlightSyntax: true,
    } as const as Omit<typeof DEFAULT_CODE_PANEL_CONFIG, 'theme'>
    const customFileExplorerConfig = {
      ...DEFAULT_FILE_EXPLORER_CONFIG,
      showIcons: true,
      indentPx: 24,
    }

    render(
      <DiffViewerConfigProvider
        theme={Themes.dark}
        codePanelConfig={customCodePanelConfig}
        fileExplorerConfig={customFileExplorerConfig}
      >
        <Consumer />
      </DiffViewerConfigProvider>,
    )

    expect(screen.getByTestId('theme-name')).toHaveTextContent('dark')
    expect(screen.getByTestId('code-panel-mode')).toHaveTextContent('split')
    expect(screen.getByTestId('file-explorer-indent')).toHaveTextContent('24')
  })

  it('throws when the hook is used outside the provider', () => {
    const HookConsumer = () => {
      useDiffViewerConfig()
      return null
    }

    // Using a function to wrap the render call so we can assert on the thrown error
    expect(() => render(<HookConsumer />)).toThrow('useDiffViewerConfig must be used within a ConfigProvider')
  })
})
