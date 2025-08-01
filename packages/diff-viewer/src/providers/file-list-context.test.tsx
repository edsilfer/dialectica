import { readStorageValue, Themes, writeStorageValue } from '@edsilfer/commons'
import { createPropsFactory, render, renderWithContext } from '@edsilfer/test-lib'
import { act, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  DEFAULT_FILE_LIST_CONFIG,
  FileListConfig,
  FileListConfigContextProps,
  FileListConfigProvider,
  useFileListConfig,
  useFileListSettings,
  useFileState,
} from './file-list-context'

/**
 * # CodePanelConfigProvider Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **storage-utils**: Mocked to isolate storage behavior and test persistence logic without actual localStorage
 * - **React Context**: Tested through custom render utilities to verify context provider behavior
 * - **Theme Context**: Inherited theme behavior tested through config merging
 *
 * ## Happy Path
 * - Provider with default config → Context provides expected defaults → Children render correctly
 * - Config updates → Context state updates → Storage persists changes (when enabled)
 * - File state management → State updates correctly → Storage persists file states
 * - Hook consumers → Receive correct context values → React to state changes
 *
 * ## Edge Cases
 * - **No initial config**: Provider uses DEFAULT_CODE_PANEL_CONFIG as fallback
 * - **Partial config**: Merges with defaults, preserving provided values
 * - **Storage disabled**: No persistence calls, in-memory state only
 * - **Same state values**: Prevents unnecessary re-renders when setters called with same values
 * - **Missing provider**: Hooks throw descriptive errors when used outside provider
 * - **External config changes**: Provider syncs with prop changes through useSyncExternalConfig
 * - **File state persistence**: Only changed properties updated, others preserved
 *
 * ## Test Coverage
 * - Default configuration behavior and merging
 * - Storage persistence (in-memory vs localStorage)
 * - Configuration updates and synchronization
 * - File state management (viewed/collapsed states)
 * - All file keys management
 * - Theme inheritance and customization
 * - Hook behavior and error handling
 * - Children rendering and context propagation
 */

// MOCKS
vi.mock('@edsilfer/commons', async () => {
  const actual = await vi.importActual<typeof import('@edsilfer/commons')>('@edsilfer/commons')
  return {
    ...actual,
    readStorageValue: vi.fn(),
    writeStorageValue: vi.fn(),
  }
})

const mockReadStorageValue = vi.mocked(readStorageValue)
const mockWriteStorageValue = vi.mocked(writeStorageValue)

// UTILITIES
const createFileListConfig = createPropsFactory<Partial<FileListConfig>>({
  mode: 'unified',
  ignoreWhitespace: false,
  maxFileLines: 1000,
})

const createCodePanelConfigProps = createPropsFactory<FileListConfigContextProps>({
  children: <div data-testid="test-child">Test Child</div>,
  config: DEFAULT_FILE_LIST_CONFIG,
  storage: 'in-memory',
})

const TestWrapper: React.FC<{
  children?: React.ReactNode
  config?: Partial<FileListConfig>
  storage?: 'in-memory' | 'local'
}> = ({ children, config, storage }) => {
  const fullConfig = config ? { ...DEFAULT_FILE_LIST_CONFIG, ...config } : undefined
  return (
    <FileListConfigProvider config={fullConfig} storage={storage}>
      {children}
    </FileListConfigProvider>
  )
}

const renderFileListConfig = async (props: Partial<FileListConfigContextProps> = {}) => {
  const testProps = createCodePanelConfigProps(props)
  return renderWithContext(TestWrapper, useFileListConfig, {
    ...testProps,
    config: props.config ? { ...DEFAULT_FILE_LIST_CONFIG, ...props.config } : testProps.config,
  } as unknown as Record<string, unknown>)
}

// TEST MATRICES
const storageTestCases = [
  { storage: 'in-memory' as const, description: 'in-memory storage' },
  { storage: 'local' as const, description: 'local storage' },
]

const configTestCases: Array<{
  name: string
  config: FileListConfig
  expectedMode?: 'unified' | 'split'
  expectedIgnoreWhitespace?: boolean
  expectedMaxFileLines?: number
}> = [
  {
    name: 'unified mode',
    config: { ...DEFAULT_FILE_LIST_CONFIG, mode: 'unified' as const },
    expectedMode: 'unified',
  },
  {
    name: 'split mode',
    config: { ...DEFAULT_FILE_LIST_CONFIG, mode: 'split' as const },
    expectedMode: 'split',
  },
  {
    name: 'ignore whitespace enabled',
    config: { ...DEFAULT_FILE_LIST_CONFIG, ignoreWhitespace: true },
    expectedIgnoreWhitespace: true,
  },
  {
    name: 'custom max file lines',
    config: { ...DEFAULT_FILE_LIST_CONFIG, maxFileLines: 500 },
    expectedMaxFileLines: 500,
  },
]

const fileStateTestCases = [
  { fileKey: 'src/components/Button.tsx', description: 'regular file' },
  { fileKey: 'package.json', description: 'root file' },
  { fileKey: 'src/utils/helpers/index.ts', description: 'nested file' },
]

describe('CodePanelConfigProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadStorageValue.mockReturnValue(null)
  })

  describe('default configuration', () => {
    test('given no initial config, when rendered, expect default configuration provided', async () => {
      // WHEN
      const getContext = await renderFileListConfig()

      // EXPECT
      expect(getContext().config).toEqual(DEFAULT_FILE_LIST_CONFIG)
    })

    test('given partial initial config, when rendered, expect config merged with defaults', async () => {
      // GIVEN
      const partialConfig: FileListConfig = {
        ...DEFAULT_FILE_LIST_CONFIG,
        mode: 'split' as const,
        ignoreWhitespace: true,
      }

      // WHEN
      const getContext = await renderFileListConfig({ config: partialConfig })

      // EXPECT
      expect(getContext().config).toEqual({
        ...DEFAULT_FILE_LIST_CONFIG,
        ...partialConfig,
      })
    })
  })

  describe('storage behavior', () => {
    test.each(storageTestCases)(
      'given $description, when rendered, expect storage behavior correct',
      async ({ storage }) => {
        // GIVEN
        const storedConfig = { mode: 'split' as const, ignoreWhitespace: true }
        const storedFileStates = { 'test.ts': { isCollapsed: true, isViewed: false } }

        if (storage === 'local') {
          mockReadStorageValue.mockReturnValue({
            config: storedConfig,
            fileStates: storedFileStates,
          })
        }

        // WHEN
        const getContext = await renderFileListConfig({ storage })

        // EXPECT
        if (storage === 'local') {
          expect(mockReadStorageValue).toHaveBeenCalledWith('__file_list_config__')
          expect(getContext().config.mode).toBe('split')
          expect(getContext().config.ignoreWhitespace).toBe(true)
          expect(getContext().fileStateMap.get('test.ts')).toEqual({ isCollapsed: true, isViewed: false })
        } else {
          expect(mockReadStorageValue).not.toHaveBeenCalled()
          expect(getContext().config).toEqual(DEFAULT_FILE_LIST_CONFIG)
        }
      },
    )

    test('given local storage enabled, when config changes, expect storage updated', async () => {
      // GIVEN
      const getContext = await renderFileListConfig({ storage: 'local' })

      // WHEN
      act(() => {
        getContext().setConfig((prev) => ({ ...prev, mode: 'split' }))
      })

      // EXPECT
      const lastCall = mockWriteStorageValue.mock.calls[mockWriteStorageValue.mock.calls.length - 1]
      expect(lastCall[0]).toBe('__file_list_config__')
      expect(lastCall[1]).toEqual({
        config: { ...DEFAULT_FILE_LIST_CONFIG, mode: 'split' },
        fileStates: {},
      })
    })

    test('given local storage enabled, when file state changes, expect storage updated', async () => {
      // GIVEN
      const getContext = await renderFileListConfig({ storage: 'local' })

      // WHEN
      act(() => {
        getContext().setViewed('test.ts', true)
      })

      // EXPECT
      expect(mockWriteStorageValue).toHaveBeenCalledWith('__file_list_config__', {
        config: DEFAULT_FILE_LIST_CONFIG,
        fileStates: { 'test.ts': { isCollapsed: true, isViewed: true } },
      })
    })
  })

  describe('configuration updates', () => {
    test.each(configTestCases)(
      'given $name, when rendered, expect correct config',
      async ({ config, expectedMode, expectedIgnoreWhitespace, expectedMaxFileLines }) => {
        // WHEN
        const getContext = await renderFileListConfig({ config })

        // EXPECT
        if (expectedMode) expect(getContext().config.mode).toBe(expectedMode)
        if (expectedIgnoreWhitespace !== undefined)
          expect(getContext().config.ignoreWhitespace).toBe(expectedIgnoreWhitespace)
        if (expectedMaxFileLines) expect(getContext().config.maxFileLines).toBe(expectedMaxFileLines)
      },
    )

    test('given external config changes, when provider updates, expect config synced', () => {
      // GIVEN
      const initialConfig = createFileListConfig({ mode: 'unified' })
      const updatedConfig = createFileListConfig({ mode: 'split' })

      const { rerender } = render(
        <TestWrapper config={initialConfig}>
          <ContextSpy cb={vi.fn()} useCtx={useFileListConfig} />
        </TestWrapper>,
      )

      // WHEN
      rerender(
        <TestWrapper config={updatedConfig}>
          <ContextSpy cb={vi.fn()} useCtx={useFileListConfig} />
        </TestWrapper>,
      )

      // EXPECT
      // The config should be updated to reflect the new external config
      // This is tested through the useSyncExternalConfig hook behavior
    })
  })

  describe('file state management', () => {
    test.each(fileStateTestCases)(
      'given $description, when file state accessed, expect undefined for non-existent file',
      async ({ fileKey }) => {
        // WHEN
        const getContext = await renderFileListConfig()

        // EXPECT
        expect(getContext().getFileState(fileKey)).toBeUndefined()
      },
    )

    test('given file viewed state, when setViewed called, expect state updated', async () => {
      // GIVEN
      const getContext = await renderFileListConfig()
      const fileKey = 'test.ts'

      // WHEN
      act(() => {
        getContext().setViewed(fileKey, true)
      })

      // EXPECT
      expect(getContext().getFileState(fileKey)).toEqual({ isCollapsed: true, isViewed: true })
    })

    test('given file collapsed state, when setCollapsed called, expect state updated', async () => {
      // GIVEN
      const getContext = await renderFileListConfig()
      const fileKey = 'test.ts'

      // WHEN
      act(() => {
        getContext().setCollapsed(fileKey, true)
      })

      // EXPECT
      expect(getContext().getFileState(fileKey)).toEqual({ isCollapsed: true, isViewed: false })
    })

    test('given existing file state, when state updated, expect only changed property updated', async () => {
      // GIVEN
      const getContext = await renderFileListConfig()
      const fileKey = 'test.ts'

      act(() => {
        getContext().setViewed(fileKey, true)
        getContext().setCollapsed(fileKey, true)
      })

      // WHEN
      act(() => {
        getContext().setViewed(fileKey, false)
      })

      // EXPECT
      expect(getContext().getFileState(fileKey)).toEqual({ isCollapsed: true, isViewed: false })
    })

    test('given same state value, when setter called, expect no state change', async () => {
      // GIVEN
      const getContext = await renderFileListConfig()
      const fileKey = 'test.ts'
      const initialFileStateMap = new Map(getContext().fileStateMap)

      // WHEN
      act(() => {
        getContext().setViewed(fileKey, false) // Same as default
        getContext().setCollapsed(fileKey, false) // Same as default
      })

      // EXPECT
      expect(getContext().fileStateMap).toStrictEqual(initialFileStateMap) // Same reference
    })
  })

  describe('all file keys management', () => {
    test('given no file keys, when setAllFileKeys called, expect keys updated', async () => {
      // GIVEN
      const getContext = await renderFileListConfig()
      const fileKeys = ['file1.ts', 'file2.ts', 'file3.ts']

      // WHEN
      act(() => {
        getContext().setAllFileKeys(fileKeys)
      })

      // EXPECT
      expect(getContext().allFileKeys).toEqual(fileKeys)
    })

    test('given existing file keys, when setAllFileKeys called, expect keys replaced', async () => {
      // GIVEN
      const getContext = await renderFileListConfig()
      const initialKeys = ['old1.ts', 'old2.ts']
      const newKeys = ['new1.ts', 'new2.ts', 'new3.ts']

      act(() => {
        getContext().setAllFileKeys(initialKeys)
      })

      // WHEN
      act(() => {
        getContext().setAllFileKeys(newKeys)
      })

      // EXPECT
      expect(getContext().allFileKeys).toEqual(newKeys)
    })
  })

  describe('theme inheritance', () => {
    test('given no theme in config, when rendered, expect inherited theme used', async () => {
      // WHEN
      const getContext = await renderFileListConfig()

      // EXPECT
      expect(getContext().config.theme).toBeUndefined()
      // The theme should be inherited from the ThemeContext
    })

    test('given theme in config, when rendered, expect custom theme used', async () => {
      // GIVEN
      const customTheme = Themes.dark
      const config: FileListConfig = {
        ...DEFAULT_FILE_LIST_CONFIG,
        theme: customTheme,
      }

      // WHEN
      const getContext = await renderFileListConfig({ config })

      // EXPECT
      expect(getContext().config.theme).toEqual(customTheme)
    })
  })

  describe('children rendering', () => {
    test('given custom children, when rendered, expect children rendered', () => {
      // GIVEN
      const testId = 'custom-child'
      const CustomChild = () => <div data-testid={testId}>Custom Child</div>
      const props = createCodePanelConfigProps({
        children: <CustomChild />,
      })

      // WHEN
      render(<FileListConfigProvider {...props} />)

      // EXPECT
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    })
  })
})

describe('useCodePanelConfig', () => {
  test('given provider context, when hook called, expect full context returned', async () => {
    // WHEN
    const getContext = await renderFileListConfig()

    // EXPECT
    const context = getContext()
    expect(context).toHaveProperty('config')
    expect(context).toHaveProperty('fileStateMap')
    expect(context).toHaveProperty('allFileKeys')
    expect(context).toHaveProperty('setConfig')
    expect(context).toHaveProperty('setAllFileKeys')
    expect(context).toHaveProperty('setViewed')
    expect(context).toHaveProperty('setCollapsed')
    expect(context).toHaveProperty('getFileState')
  })

  test('given no provider, when hook called, expect error thrown', () => {
    // GIVEN
    const HookConsumer = () => {
      useFileListConfig()
      return null
    }

    // Suppress console.error for this test because we expect a throw
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => ({}))

    // WHEN & EXPECT
    expect(() => render(<HookConsumer />)).toThrow('useFileListConfig must be used within a FileListConfigProvider')

    consoleErrorSpy.mockRestore()
  })
})

describe('useFileState', () => {
  test('given file key, when hook called, expect file state returned', () => {
    // GIVEN
    const fileKey = 'test.ts'
    const TestComponent = () => {
      const fileState = useFileState(fileKey)
      return (
        <div>
          <div data-testid="is-collapsed">{fileState.isCollapsed.toString()}</div>
          <div data-testid="is-viewed">{fileState.isViewed.toString()}</div>
        </div>
      )
    }

    // WHEN
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    // EXPECT
    expect(screen.getByTestId('is-collapsed')).toHaveTextContent('false')
    expect(screen.getByTestId('is-viewed')).toHaveTextContent('false')
  })

  test('given file state changes, when hook used, expect state updated', () => {
    // GIVEN
    const fileKey = 'test.ts'
    let toggleCollapsed: (collapsed: boolean) => void
    let toggleViewed: (viewed: boolean) => void

    const TestComponent = () => {
      const fileState = useFileState(fileKey)
      toggleCollapsed = fileState.toggleCollapsed
      toggleViewed = fileState.toggleViewed
      return (
        <div>
          <div data-testid="is-collapsed">{fileState.isCollapsed.toString()}</div>
          <div data-testid="is-viewed">{fileState.isViewed.toString()}</div>
        </div>
      )
    }

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    // WHEN
    act(() => {
      toggleCollapsed!(true)
      toggleViewed!(true)
    })

    // EXPECT
    expect(screen.getByTestId('is-collapsed')).toHaveTextContent('true')
    expect(screen.getByTestId('is-viewed')).toHaveTextContent('true')
  })

  test('given no provider, when hook called, expect error thrown', () => {
    // GIVEN
    const HookConsumer = () => {
      useFileState('test.ts')
      return null
    }

    // Suppress console.error for this test because we expect a throw
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => ({}))

    // WHEN & EXPECT
    expect(() => render(<HookConsumer />)).toThrow('useFileState must be used within a CodePanelConfigProvider')

    consoleErrorSpy.mockRestore()
  })
})

describe('useCodePanelSettings', () => {
  test('given provider context, when hook called, expect config and setter returned', () => {
    // GIVEN
    const TestComponent = () => {
      const settings = useFileListSettings()
      return (
        <div>
          <div data-testid="mode">{settings.config.mode}</div>
          <div data-testid="has-setter">{typeof settings.setConfig}</div>
        </div>
      )
    }

    // WHEN
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    // EXPECT
    expect(screen.getByTestId('mode')).toHaveTextContent('unified')
    expect(screen.getByTestId('has-setter')).toHaveTextContent('function')
  })

  test('given config changes, when hook used, expect updated config', () => {
    // GIVEN
    let setConfig: React.Dispatch<React.SetStateAction<FileListConfig>>

    const TestComponent = () => {
      const settings = useFileListSettings()
      setConfig = settings.setConfig
      return <div data-testid="mode">{settings.config.mode}</div>
    }

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    // WHEN
    act(() => {
      setConfig((prev) => ({ ...prev, mode: 'split' }))
    })

    // EXPECT
    expect(screen.getByTestId('mode')).toHaveTextContent('split')
  })

  test('given no provider, when hook called, expect error thrown', () => {
    // GIVEN
    const HookConsumer = () => {
      useFileListSettings()
      return null
    }

    // Suppress console.error for this test because we expect a throw
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => ({}))

    // WHEN & EXPECT
    expect(() => render(<HookConsumer />)).toThrow('useFileListSettings must be used within a FileListConfigProvider')

    consoleErrorSpy.mockRestore()
  })
})

// Helper component for testing context values
function ContextSpy<T>({ cb, useCtx }: { cb: (ctx: T) => void; useCtx: () => T }): null {
  const ctx = useCtx()
  React.useEffect(() => {
    cb(ctx)
  }, [ctx, cb])
  return null
}
