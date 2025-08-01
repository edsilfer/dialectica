import { Themes } from '@edsilfer/commons'
import { createPropsFactory, render, renderWithContext } from '@edsilfer/test-lib'
import { act, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { FileExplorerConfig } from './fstree-context'
import {
  DEFAULT_FILE_EXPLORER_CONFIG,
  FileExplorerConfigProvider,
  useFileExplorerConfig,
} from './file-explorer-context'

// MOCKS
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// UTILITIES
const createFileExplorerConfig = createPropsFactory<Partial<FileExplorerConfig>>({
  startExpanded: true,
  nodeConnector: 'solid',
  indentPx: 16,
  collapsePackages: true,
  showIcons: false,
  displayNodeDetails: false,
})

const TestWrapper: React.FC<{
  children?: React.ReactNode
  config?: Partial<FileExplorerConfig>
  storage?: 'in-memory' | 'local'
}> = ({ children, config, storage }) => {
  const fullConfig = config ? { ...DEFAULT_FILE_EXPLORER_CONFIG, ...config } : undefined
  return (
    <FileExplorerConfigProvider config={fullConfig} storage={storage}>
      {children}
    </FileExplorerConfigProvider>
  )
}

const renderFileExplorerConfig = (
  props: { config?: Partial<FileExplorerConfig>; storage?: 'in-memory' | 'local' } = {},
) => {
  return renderWithContext(TestWrapper, useFileExplorerConfig, { children: null, ...props })
}

beforeEach(() => {
  vi.clearAllMocks()

  // Mock localStorage on window object
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
})

describe('FileExplorerConfigProvider', () => {
  describe('default configuration', () => {
    test('given no initial config, when rendered, expect default configuration provided', async () => {
      // WHEN
      const getContext = await renderFileExplorerConfig()

      // EXPECT
      expect(getContext().config).toEqual(DEFAULT_FILE_EXPLORER_CONFIG)
    })

    test('given partial initial config, when rendered, expect config merged with defaults', async () => {
      // GIVEN
      const partialConfig = createFileExplorerConfig({
        startExpanded: false,
        showIcons: true,
      })

      // WHEN
      const getContext = await renderFileExplorerConfig({ config: partialConfig })

      // EXPECT
      expect(getContext().config).toEqual({
        ...DEFAULT_FILE_EXPLORER_CONFIG,
        ...partialConfig,
      })
    })
  })

  describe('localStorage persistence', () => {
    const testCases = [
      {
        description: 'valid stored config',
        storedValue: JSON.stringify({ startExpanded: false, showIcons: true }),
        expectedStoredConfig: { startExpanded: false, showIcons: true },
      },
      {
        description: 'invalid JSON stored config',
        storedValue: 'invalid-json',
        expectedStoredConfig: null,
      },
      {
        description: 'null stored config',
        storedValue: null,
        expectedStoredConfig: null,
      },
    ]

    test.each(testCases)(
      'given storage is local and $description, when rendered, expect correct config hydration',
      async ({ storedValue, expectedStoredConfig }) => {
        // GIVEN
        mockLocalStorage.getItem.mockReturnValue(storedValue)
        const initialConfig = createFileExplorerConfig({ indentPx: 20 })

        // WHEN
        const getContext = await renderFileExplorerConfig({
          storage: 'local',
          config: initialConfig,
        })

        // EXPECT
        const expectedConfig = expectedStoredConfig ? { ...initialConfig, ...expectedStoredConfig } : initialConfig
        expect(getContext().config).toEqual(expectedConfig)
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('__file_explorer_config__')
      },
    )

    test('given storage is local and config changes, when updated, expect localStorage to be updated', async () => {
      // GIVEN
      const getContext = await renderFileExplorerConfig({ storage: 'local' })

      // WHEN
      const newConfig = { ...DEFAULT_FILE_EXPLORER_CONFIG, ...createFileExplorerConfig({ showIcons: true }) }
      act(() => {
        getContext().setConfig(newConfig)
      })

      // EXPECT
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('__file_explorer_config__', JSON.stringify(newConfig))
    })

    test('given storage is local and localStorage.setItem throws, when config updated, expect error handled gracefully', async () => {
      // GIVEN
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded')
      })
      const getContext = await renderFileExplorerConfig({ storage: 'local' })

      // WHEN & EXPECT
      expect(() => {
        act(() => {
          getContext().setConfig({ ...DEFAULT_FILE_EXPLORER_CONFIG, ...createFileExplorerConfig({ showIcons: true }) })
        })
      }).not.toThrow()
    })

    test('given storage is in-memory, when rendered, expect no localStorage interaction', async () => {
      // WHEN
      await renderFileExplorerConfig({ storage: 'in-memory' })

      // EXPECT
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled()
    })

    test('given storage is in-memory and config changes, when updated, expect no localStorage persistence', async () => {
      // GIVEN
      const getContext = await renderFileExplorerConfig({ storage: 'in-memory' })

      // WHEN
      act(() => {
        getContext().setConfig({ ...DEFAULT_FILE_EXPLORER_CONFIG, ...createFileExplorerConfig({ showIcons: true }) })
      })

      // EXPECT
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('server-side rendering safety', () => {
    test('given localStorage is unavailable, when rendered with local storage, expect fallback to default config', async () => {
      // GIVEN
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage is not available')
      })

      // WHEN
      const getContext = await renderFileExplorerConfig({ storage: 'local' })

      // EXPECT
      expect(getContext().config).toEqual(DEFAULT_FILE_EXPLORER_CONFIG)
    })
  })

  describe('theme integration', () => {
    test('given no explicit theme in config, when rendered, expect component renders without errors', () => {
      // WHEN & EXPECT
      expect(() => {
        render(
          <FileExplorerConfigProvider>
            <div data-testid="theme-check" />
          </FileExplorerConfigProvider>,
        )
      }).not.toThrow()

      // Verify the component rendered
      expect(screen.getByTestId('theme-check')).toBeInTheDocument()
    })

    test('given explicit theme in config, when rendered, expect component renders without errors', () => {
      // GIVEN
      const configWithTheme: FileExplorerConfig = {
        ...DEFAULT_FILE_EXPLORER_CONFIG,
        theme: Themes.dracula,
      }

      // WHEN & EXPECT
      expect(() => {
        render(
          <FileExplorerConfigProvider config={configWithTheme}>
            <div data-testid="theme-check" />
          </FileExplorerConfigProvider>,
        )
      }).not.toThrow()

      // Verify the component rendered
      expect(screen.getByTestId('theme-check')).toBeInTheDocument()
    })

    test('given different theme in config, when rendered, expect component renders without errors', () => {
      // GIVEN
      const configWithTheme: FileExplorerConfig = {
        ...DEFAULT_FILE_EXPLORER_CONFIG,
        theme: Themes.dark,
      }

      // WHEN & EXPECT
      expect(() => {
        render(
          <FileExplorerConfigProvider config={configWithTheme}>
            <div data-testid="theme-check" />
          </FileExplorerConfigProvider>,
        )
      }).not.toThrow()

      // Verify the component rendered
      expect(screen.getByTestId('theme-check')).toBeInTheDocument()
    })
  })

  describe('configuration updates', () => {
    test('given setConfig called with new configuration, when updated, expect config state updated', async () => {
      // GIVEN
      const getContext = await renderFileExplorerConfig()
      const newConfig = {
        ...DEFAULT_FILE_EXPLORER_CONFIG,
        ...createFileExplorerConfig({ indentPx: 24, showIcons: true }),
      }

      // WHEN
      act(() => {
        getContext().setConfig(newConfig)
      })

      // EXPECT
      expect(getContext().config).toEqual(newConfig)
    })

    test('given setConfig called with function updater, when updated, expect config updated correctly', async () => {
      // GIVEN
      const getContext = await renderFileExplorerConfig()

      // WHEN
      act(() => {
        getContext().setConfig((prev) => ({ ...prev, showIcons: !prev.showIcons }))
      })

      // EXPECT
      expect(getContext().config.showIcons).toBe(false)
    })
  })
})

describe('useFileExplorerConfig', () => {
  test('given hook used outside provider, when called, expect error thrown', () => {
    // GIVEN
    const Consumer = () => {
      useFileExplorerConfig()
      return null
    }

    // WHEN & EXPECT
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => ({}))
    expect(() => render(<Consumer />)).toThrow(/useConfig must be used within a ConfigProvider/)
    consoleErrorSpy.mockRestore()
  })

  test('given hook used within provider, when called, expect config state returned', async () => {
    // GIVEN
    const getContext = await renderFileExplorerConfig()

    // WHEN & EXPECT
    expect(getContext().config).toEqual(DEFAULT_FILE_EXPLORER_CONFIG)
    expect(typeof getContext().setConfig).toBe('function')
  })
})
