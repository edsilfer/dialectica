import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React, { PropsWithChildren } from 'react'

import { Themes } from '../../../../../commons/src/themes'
import { DEFAULT_CODE_PANEL_CONFIG } from '../../code-panel/providers/code-panel-context'
import { DEFAULT_FILE_EXPLORER_CONFIG } from '../../file-explorer/providers/file-explorer-context'
import { renderWithContext } from '../../../../../commons/src/test/context-test-utils'
import { DiffViewerConfigProvider, useDiffViewerConfig } from './diff-viewer-context'
import type { DiffViewerConfigContextProps } from './types'

// Wrapper component to make DiffViewerConfigProvider compatible with renderWithContext
const DiffViewerConfigWrapper: React.FC<PropsWithChildren<Omit<DiffViewerConfigContextProps, 'children'>>> = ({
  children,
  ...props
}) => <DiffViewerConfigProvider {...props}>{children}</DiffViewerConfigProvider>

describe('DiffViewerConfigProvider / useDiffViewerConfig', () => {
  it('provides default configs to its descendants', async () => {
    // WHEN
    const getConfig = await renderWithContext(DiffViewerConfigWrapper, useDiffViewerConfig, { theme: Themes.light })

    // EXPECT
    const config = getConfig()
    expect(config.theme.name).toBe('light')
    expect(config.codePanelConfig?.mode).toBe(DEFAULT_CODE_PANEL_CONFIG.mode)
    expect(config.fileExplorerConfig?.indentPx).toBe(DEFAULT_FILE_EXPLORER_CONFIG.indentPx)
  })

  it('provides the supplied configs to its descendants', async () => {
    // GIVEN
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

    // WHEN
    const getConfig = await renderWithContext(DiffViewerConfigWrapper, useDiffViewerConfig, {
      theme: Themes.dark,
      codePanelConfig: customCodePanelConfig,
      fileExplorerConfig: customFileExplorerConfig,
    })

    // EXPECT
    const config = getConfig()
    expect(config.theme.name).toBe('dark')
    expect(config.codePanelConfig?.mode).toBe('split')
    expect(config.fileExplorerConfig?.indentPx).toBe(24)
  })

  it('throws when the hook is used outside the provider', () => {
    // GIVEN
    const HookConsumer = () => {
      useDiffViewerConfig()
      return null
    }

    // Suppress console.error for this test because we expect a throw
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => ({}))

    // WHEN & EXPECT
    expect(() => render(<HookConsumer />)).toThrow('useDiffViewerConfig must be used within a ConfigProvider')

    consoleErrorSpy.mockRestore()
  })
})
