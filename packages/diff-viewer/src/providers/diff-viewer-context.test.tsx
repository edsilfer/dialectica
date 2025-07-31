import { Themes } from '@commons'
import { DEFAULT_FILE_EXPLORER_CONFIG } from '@file-explorer'
import { render, renderWithContext } from '@test-lib'
import React, { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_DIFF_VIEWER_CONFIG,
  DiffViewerConfigContextProps,
  DiffViewerConfigProvider,
  useDiffViewerConfig,
} from './diff-viewer-context'
import { DEFAULT_FILE_LIST_CONFIG } from './file-list-context'

// Wrapper component to make DiffViewerConfigProvider compatible with renderWithContext
const DiffViewerConfigWrapper: React.FC<PropsWithChildren<Omit<DiffViewerConfigContextProps, 'children'>>> = ({
  children,
  ...props
}) => <DiffViewerConfigProvider {...props}>{children}</DiffViewerConfigProvider>

describe('DiffViewerConfigProvider / useDiffViewerConfig', () => {
  it('provides default configs to its descendants', async () => {
    // WHEN
    const getConfig = await renderWithContext(DiffViewerConfigWrapper, useDiffViewerConfig, {
      config: { ...DEFAULT_DIFF_VIEWER_CONFIG, theme: Themes.light },
    })

    // EXPECT
    const config = getConfig()
    expect(config.config.theme.name).toBe('light')
    expect(config.fileListConfig?.mode).toBe(DEFAULT_FILE_LIST_CONFIG.mode)
    expect(config.fileExplorerConfig?.indentPx).toBe(DEFAULT_FILE_EXPLORER_CONFIG.indentPx)
  })

  it('provides the supplied configs to its descendants', async () => {
    // GIVEN
    const customFileListConfig = {
      ...DEFAULT_FILE_LIST_CONFIG,
      mode: 'split' as const,
      highlightSyntax: true,
    } as const as Omit<typeof DEFAULT_FILE_LIST_CONFIG, 'theme'>
    const customFileExplorerConfig = {
      ...DEFAULT_FILE_EXPLORER_CONFIG,
      showIcons: true,
      indentPx: 24,
    }

    // WHEN
    const getConfig = await renderWithContext(DiffViewerConfigWrapper, useDiffViewerConfig, {
      config: { ...DEFAULT_DIFF_VIEWER_CONFIG, theme: Themes.dark },
      fileListConfig: customFileListConfig,
      fileExplorerConfig: customFileExplorerConfig,
    })

    // EXPECT
    const config = getConfig()
    expect(config.config.theme.name).toBe('dark')
    expect(config.fileListConfig?.mode).toBe('split')
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
