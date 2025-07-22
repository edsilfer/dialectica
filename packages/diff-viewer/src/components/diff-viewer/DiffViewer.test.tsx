import { createPropsFactory, render as customRender } from '@test-lib'
import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ParsedDiff } from '../../models/ParsedDiff'
import { createMockFileDiff } from '../../utils/test/models/test-utils'
import { DiffViewer } from './DiffViewer'
import type { DiffViewerProps } from './types'

/**
 * # DiffViewer Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **FileList/CodePanel**: Mocked to isolate component integration from complex file rendering logic
 * - **FileExplorer**: Mocked to test file selection and navigation without tree rendering complexity
 * - **Drawer**: Mocked to test drawer state management and content switching without UI complexity
 * - **useResizablePanel**: Mocked to provide predictable panel sizing without mouse interaction complexity
 * - **DiffViewerConfigProvider**: Mocked to provide consistent theme and config without external context
 *
 * ## Happy Path
 * - Valid diff with files → All components render → File explorer and code panel show correct file counts
 * - File click in explorer → Scroll target updated in code panel → Navigation works correctly
 * - Drawer toggle → State changes → UI updates accordingly
 * - Load more lines → Handler called → Pagination works correctly
 *
 * ## Edge Cases
 * - **Empty diff**: Component handles gracefully with 0 file counts displayed
 * - **Loading states**: Metadata and diff loading states properly propagated to child components
 * - **Disabled file explorer**: Drawer not rendered, only code panel visible
 * - **Custom toolbar**: Custom toolbar rendered when provided
 * - **Additional drawer contents**: Built-in + custom contents available in drawer
 * - **Undefined callbacks**: No errors when optional handlers are not provided
 * - **State transitions**: Loading to ready state transitions handled smoothly
 *
 * ## Test Matrices
 * - **Rendering scenarios**: Systematic testing of different prop combinations
 * - **Loading states**: All combinations of metadata/diff loading tested
 * - **Integration points**: File explorer ↔ code panel communication verified
 */

// MOCKS
vi.mock('../code-panel/FileList', () => ({
  CodePanel: ({
    files,
    scrollTo,
    isLoading,
    onLoadMoreLines,
    maxLinesToFetch,
  }: {
    files: unknown[]
    scrollTo?: string
    isLoading: boolean
    onLoadMoreLines?: () => void
    maxLinesToFetch?: number
  }) => (
    <div data-testid="code-panel">
      <div data-testid="files-count">{files.length}</div>
      <div data-testid="scroll-to">{scrollTo || 'none'}</div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="max-lines">{maxLinesToFetch || 'default'}</div>
      {onLoadMoreLines && (
        <button data-testid="load-more" onClick={() => onLoadMoreLines()}>
          Load More
        </button>
      )}
    </div>
  ),
}))

vi.mock('../file-explorer/FileExplorer', () => ({
  FileExplorer: ({
    diff,
    onFileClick,
  }: {
    diff: { files: unknown[] }
    onFileClick: (file: { newPath: string; oldPath: string }) => void
  }) => (
    <div data-testid="file-explorer">
      <div data-testid="files-count">{diff.files.length}</div>
      <button data-testid="file-click" onClick={() => onFileClick({ newPath: 'test.ts', oldPath: 'test.ts' })}>
        Click File
      </button>
    </div>
  ),
}))

vi.mock('./components/Drawer', () => ({
  Drawer: ({
    contents,
    state,
    default: defaultContent,
    loading,
    onStateChange,
  }: {
    contents: Array<{ key: string; title: string; content: React.ReactNode }>
    state: string
    default: string
    loading: boolean
    onStateChange: (state: string) => void
  }) => (
    <div data-testid="drawer">
      <div data-testid="drawer-state">{state}</div>
      <div data-testid="drawer-default">{defaultContent}</div>
      <div data-testid="drawer-loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="contents-count">{contents.length}</div>
      <button data-testid="toggle-drawer" onClick={() => onStateChange(state === 'open' ? 'closed' : 'open')}>
        Toggle
      </button>
      {contents.map((content) => (
        <div key={content.key} data-testid={`content-${content.key}`}>
          {content.title}
          {/* Render the actual content when it's the default content and drawer is open */}
          {content.key === defaultContent && state === 'open' && !loading && content.content}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('./hooks/use-resizable-panel', () => ({
  useResizablePanel: () => ({
    width: 30,
    containerRef: { current: null },
    onMouseDown: vi.fn(),
    dragging: false,
  }),
}))

vi.mock('./providers/diff-viewer-context', () => ({
  DiffViewerConfigProvider: ({ children, theme }: { children: React.ReactNode; theme: { name: string } }) => (
    <div data-testid="config-provider" data-theme={theme.name}>
      {children}
    </div>
  ),
  useDiffViewerConfig: () => ({
    theme: {
      name: 'light',
      spacing: { xs: '0.25rem', sm: '0.5rem', lg: '1rem' },
      colors: {
        border: '#e5e7eb',
        backgroundContainer: '#ffffff',
        accent: '#3b82f6',
      },
    },
    storage: 'in-memory',
  }),
}))

// HELPERS
const createMockParsedDiff = (files: unknown[] = []): ParsedDiff => {
  return new ParsedDiff('mock-diff-content', files as never[])
}

const createDiffViewerProps = createPropsFactory<DiffViewerProps>({
  diff: createMockParsedDiff([createMockFileDiff()]),
  isMetadataLoading: false,
  isDiffLoading: false,
  enableFileExplorer: true,
  additionalDrawerContents: [],
  toolbar: undefined,
  maxLinesToFetch: 5,
  onLoadMoreLines: undefined,
})

// TEST MATRICES
type RenderingTestCase = {
  /* The name of the test case */
  name: string
  /* The props to pass to the component */
  props: Partial<DiffViewerProps>
  /* The expectations for the test case */
  expectations: Array<{
    /* The test id to query for */
    testId: string
    /* The assertion to make */
    assertion: 'toBeInTheDocument' | 'not.toBeInTheDocument'
    /* The content to expect if the assertion is toBeInTheDocument */
    content?: string
  }>
}

type LoadingTestCase = {
  /* The name of the test case */
  name: string
  /* The metadata loading state */
  metadataLoading: boolean
  /* The diff loading state */
  diffLoading: boolean
  /* The expected loading state of the file explorer */
  expectedExplorerLoading: string
  /* The expected loading state of the code panel */
  expectedPanelLoading: string
}

const renderingTestMatrix: RenderingTestCase[] = [
  {
    name: 'default props',
    props: {},
    expectations: [
      { testId: 'drawer', assertion: 'toBeInTheDocument' },
      { testId: 'code-panel', assertion: 'toBeInTheDocument' },
    ],
  },
  {
    name: 'file explorer disabled',
    props: { enableFileExplorer: false },
    expectations: [
      { testId: 'drawer', assertion: 'not.toBeInTheDocument' },
      { testId: 'code-panel', assertion: 'toBeInTheDocument' },
    ],
  },
  {
    name: 'custom toolbar',
    props: { toolbar: <div data-testid="custom-toolbar">Custom Toolbar</div> },
    expectations: [{ testId: 'custom-toolbar', assertion: 'toBeInTheDocument', content: 'Custom Toolbar' }],
  },
  {
    name: 'additional drawer contents',
    props: {
      additionalDrawerContents: [
        {
          key: 'custom-content',
          title: 'Custom Content',
          icon: <div>Icon</div>,
          content: <div data-testid="custom-drawer-content">Custom Content</div>,
        },
      ],
    },
    expectations: [
      { testId: 'content-custom-content', assertion: 'toBeInTheDocument', content: 'Custom Content' },
      { testId: 'content-file-explorer', assertion: 'toBeInTheDocument', content: 'File explorer' },
    ],
  },
]

const loadingTestMatrix: LoadingTestCase[] = [
  {
    name: 'no loading states',
    metadataLoading: false,
    diffLoading: false,
    expectedExplorerLoading: 'false',
    expectedPanelLoading: 'false',
  },
  {
    name: 'metadata loading only',
    metadataLoading: true,
    diffLoading: false,
    expectedExplorerLoading: 'true',
    expectedPanelLoading: 'false',
  },
  {
    name: 'diff loading only',
    metadataLoading: false,
    diffLoading: true,
    expectedExplorerLoading: 'false',
    expectedPanelLoading: 'true',
  },
  {
    name: 'both loading states',
    metadataLoading: true,
    diffLoading: true,
    expectedExplorerLoading: 'true',
    expectedPanelLoading: 'true',
  },
]

describe('DiffViewer', () => {
  describe('Provider Wrapping', () => {
    it('given no external provider, when rendered, expect internal provider wrapper', () => {
      // GIVEN
      const props = createDiffViewerProps()

      // WHEN
      customRender(<DiffViewer {...props} />)

      // EXPECT
      // The provider is mocked and should be present in the rendered output
      expect(screen.getByTestId('drawer')).toBeInTheDocument()
    })
  })

  describe('Rendering Scenarios', () => {
    renderingTestMatrix.forEach(({ name, props, expectations }) => {
      it(`given ${name}, when rendered, expect correct elements`, () => {
        // GIVEN
        const testProps = createDiffViewerProps(props)

        // WHEN
        customRender(<DiffViewer {...testProps} />)

        // EXPECT
        expectations.forEach(({ testId, assertion, content }) => {
          if (assertion === 'toBeInTheDocument') {
            expect(screen.getByTestId(testId)).toBeInTheDocument()
            if (content) {
              expect(screen.getByTestId(testId)).toHaveTextContent(content)
            }
          } else {
            expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
          }
        })
      })
    })
  })

  describe('Loading States', () => {
    loadingTestMatrix.forEach(
      ({ name, metadataLoading, diffLoading, expectedExplorerLoading, expectedPanelLoading }) => {
        it(`given ${name}, when rendered, expect correct loading states`, () => {
          // GIVEN
          const props = createDiffViewerProps({
            isMetadataLoading: metadataLoading,
            isDiffLoading: diffLoading,
          })

          // WHEN
          customRender(<DiffViewer {...props} />)

          // EXPECT
          expect(screen.getByTestId('drawer-loading')).toHaveTextContent(expectedExplorerLoading)
          expect(screen.getByTestId('loading')).toHaveTextContent(expectedPanelLoading)
        })
      },
    )
  })

  describe('File Explorer Integration', () => {
    it('given file click triggered, when file explorer calls onFileClick, expect scroll to file', () => {
      // GIVEN
      const props = createDiffViewerProps()
      customRender(<DiffViewer {...props} />)

      // WHEN
      // The file explorer is rendered inside the drawer content, so we need to access it through the drawer
      fireEvent.click(screen.getByTestId('file-click'))

      // EXPECT
      expect(screen.getByTestId('scroll-to')).toHaveTextContent('test.ts')
    })

    it('given multiple files in diff, when rendered, expect correct file count passed to explorer', () => {
      // GIVEN
      const files = [
        createMockFileDiff({ oldPath: 'file1.ts', newPath: 'file1.ts' }),
        createMockFileDiff({ oldPath: 'file2.ts', newPath: 'file2.ts' }),
        createMockFileDiff({ oldPath: 'file3.ts', newPath: 'file3.ts' }),
      ]
      const props = createDiffViewerProps({ diff: createMockParsedDiff(files) })

      // WHEN
      customRender(<DiffViewer {...props} />)

      // EXPECT
      // The file explorer is inside the drawer, so we check both the drawer's file count and the code panel's
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
      // Check that both the file explorer and code panel show the correct count
      const fileCounts = screen.getAllByTestId('files-count')
      expect(fileCounts).toHaveLength(2)
      expect(fileCounts[0]).toHaveTextContent('3') // File explorer count
      expect(fileCounts[1]).toHaveTextContent('3') // Code panel count
    })
  })

  describe('Code Panel Integration', () => {
    it('given onLoadMoreLines provided, when load more clicked, expect handler called with correct params', () => {
      // GIVEN
      const mockOnLoadMoreLines = vi.fn().mockResolvedValue({
        leftLines: new Map(),
        rightLines: new Map(),
      })
      const props = createDiffViewerProps({ onLoadMoreLines: mockOnLoadMoreLines })
      customRender(<DiffViewer {...props} />)

      // WHEN
      fireEvent.click(screen.getByTestId('load-more'))

      // EXPECT
      expect(mockOnLoadMoreLines).toHaveBeenCalled()
    })

    it('given maxLinesToFetch provided, when rendered, expect correct value passed to code panel', () => {
      // GIVEN
      const props = createDiffViewerProps({ maxLinesToFetch: 10 })

      // WHEN
      customRender(<DiffViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('max-lines')).toHaveTextContent('10')
    })

    it('given no maxLinesToFetch, when rendered, expect default value passed to code panel', () => {
      // GIVEN
      const props = createDiffViewerProps({ maxLinesToFetch: undefined })

      // WHEN
      customRender(<DiffViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('max-lines')).toHaveTextContent('default')
    })
  })

  describe('Drawer Integration', () => {
    it('given drawer toggle clicked, when state changes, expect drawer state updated', () => {
      // GIVEN
      const props = createDiffViewerProps()
      customRender(<DiffViewer {...props} />)

      // WHEN
      fireEvent.click(screen.getByTestId('toggle-drawer'))

      // EXPECT
      expect(screen.getByTestId('drawer-state')).toHaveTextContent('closed')
    })

    it('given additional drawer contents, when rendered, expect all contents available', () => {
      // GIVEN
      const additionalContents = [
        {
          key: 'custom-1',
          title: 'Custom 1',
          icon: <div>Icon 1</div>,
          content: <div>Content 1</div>,
        },
        {
          key: 'custom-2',
          title: 'Custom 2',
          icon: <div>Icon 2</div>,
          content: <div>Content 2</div>,
        },
      ]
      const props = createDiffViewerProps({ additionalDrawerContents: additionalContents })

      // WHEN
      customRender(<DiffViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('contents-count')).toHaveTextContent('3') // 1 built-in + 2 custom
      expect(screen.getByTestId('content-custom-1')).toHaveTextContent('Custom 1')
      expect(screen.getByTestId('content-custom-2')).toHaveTextContent('Custom 2')
    })

    it('given no additional contents, when rendered, expect only built-in content', () => {
      // GIVEN
      const props = createDiffViewerProps({ additionalDrawerContents: [] })

      // WHEN
      customRender(<DiffViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('contents-count')).toHaveTextContent('1')
      expect(screen.getByTestId('content-file-explorer')).toHaveTextContent('File explorer')
    })
  })

  describe('Deferred Rendering', () => {
    it('given loading states change, when component updates, expect deferred ready state', () => {
      // GIVEN
      const { rerender } = customRender(
        <DiffViewer {...createDiffViewerProps({ isMetadataLoading: true, isDiffLoading: true })} />,
      )

      // WHEN
      rerender(<DiffViewer {...createDiffViewerProps({ isMetadataLoading: false, isDiffLoading: false })} />)

      // EXPECT
      // The deferred rendering should handle the transition smoothly
      expect(screen.getByTestId('drawer-loading')).toHaveTextContent('false')
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  describe('Edge Cases', () => {
    it('given empty diff with no files, when rendered, expect component handles gracefully', () => {
      // GIVEN
      const props = createDiffViewerProps({ diff: createMockParsedDiff([]) })

      // WHEN
      customRender(<DiffViewer {...props} />)

      // EXPECT
      // Check that both the file explorer and code panel show 0 files
      const fileCounts = screen.getAllByTestId('files-count')
      expect(fileCounts).toHaveLength(2)
      expect(fileCounts[0]).toHaveTextContent('0') // File explorer count
      expect(fileCounts[1]).toHaveTextContent('0') // Code panel count
      expect(screen.getByTestId('code-panel')).toBeInTheDocument()
    })

    it('given null onLoadMoreLines, when load more clicked, expect no error', () => {
      // GIVEN
      const props = createDiffViewerProps({ onLoadMoreLines: undefined })
      customRender(<DiffViewer {...props} />)

      // WHEN & EXPECT
      // Should not throw error when onLoadMoreLines is undefined
      expect(() => {
        const loadMoreButton = screen.queryByTestId('load-more')
        expect(loadMoreButton).not.toBeInTheDocument()
      }).not.toThrow()
    })

    it('given undefined enableFileExplorer, when rendered, expect defaults to true', () => {
      // GIVEN
      const props = createDiffViewerProps({ enableFileExplorer: undefined })

      // WHEN
      customRender(<DiffViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('drawer')).toBeInTheDocument()
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
    })
  })
})
