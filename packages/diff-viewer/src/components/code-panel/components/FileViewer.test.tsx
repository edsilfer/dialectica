import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, Mock } from 'vitest'
import { notification } from 'antd'
import { SAMPLE_FILE_DIFFS } from '../../../utils/test/__fixtures__/file-diff-fixtures'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import { CodePanelConfigProvider } from '../providers/code-panel-context'
import FileViewer from './FileViewer'
import type { FileViewerProps, FileViewerHeaderProps, UnifiedViewerProps, SplitViewerProps } from './types'
import { useFileState } from '../providers/code-panel-context'

/**
 * # FileViewer Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **antd notification**: Mocked to test error handling without UI side effects
 * - **FileViewerHeader**: Mocked to isolate header logic and test prop passing
 * - **SplitViewer**: Mocked to test split mode rendering and load more functionality
 * - **UnifiedViewer**: Mocked to test unified mode rendering and wrap lines functionality
 * - **useHunkListViewModel**: Mocked to provide predictable hunk data and dispatch actions
 * - **useFileState**: Mocked to test collapsed/expanded file states
 *
 * ## Happy Path
 * - File with valid diff data → Header renders with correct path → Appropriate viewer (split/unified) renders with lines
 * - Load more triggered → Range calculated → Callback executed → State updated with new lines
 * - Wrap lines toggled → State updated → Viewer receives updated wrap lines prop
 *
 * ## Edge Cases
 * - **New file (no old path)**: Header displays new path, viewer renders correctly
 * - **Deleted file (no new path)**: Header displays '/dev/null', viewer handles gracefully
 * - **Missing onLoadMoreLines callback**: No error thrown, graceful degradation
 * - **Load more returns null**: Dispatch not called, no state update
 * - **Load more fails**: Error notification shown, no state update
 * - **Collapsed file state**: Viewer receives visible=false, content hidden
 * - **Missing context provider**: Error thrown with descriptive message
 * - **Custom maxLinesToFetch**: Correct value passed to viewers
 * - **No ID provided**: Component renders without id attribute
 *
 * ## Assertions
 * - Verify correct viewer mode based on config (split vs unified)
 * - Test file path display for different file types (new, deleted, modified)
 * - Validate load more functionality with success and failure scenarios
 * - Check wrap lines state propagation to viewers
 * - Ensure file collapse state affects viewer visibility
 * - Verify error handling and user feedback
 */

// MOCKS
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd')
  return {
    ...antd,
    notification: {
      error: vi.fn(),
    },
  }
})

vi.mock('./FileViewerHeader', () => ({
  default: vi.fn(({ file, onWrapLinesChange, wrapLines }: FileViewerHeaderProps) => (
    <div data-testid="file-viewer-header">
      <span data-testid="file-path">{file.newPath}</span>
      <button data-testid="wrap-lines-toggle" onClick={() => onWrapLinesChange(!wrapLines)}>
        {wrapLines ? 'Unwrap' : 'Wrap'} Lines
      </button>
    </div>
  )),
}))

vi.mock('./SplitViewer', () => ({
  default: vi.fn(({ lines, onLoadMoreLines, loadMoreLinesCount }: SplitViewerProps) => (
    <div data-testid="split-viewer" data-lines-count={lines.length} data-load-count={loadMoreLinesCount}>
      {lines.map((line: DiffLineViewModel, index: number) => (
        <button key={index} data-testid={`load-more-${index}`} onClick={() => onLoadMoreLines?.(line, 'down')}>
          Load More
        </button>
      ))}
    </div>
  )),
}))

vi.mock('./UnifiedViewer', () => ({
  default: vi.fn(({ lines, wrapLines, visible, onLoadMoreLines, loadMoreLinesCount }: UnifiedViewerProps) => (
    <div
      data-testid="unified-viewer"
      data-lines-count={lines.length}
      data-load-count={loadMoreLinesCount}
      data-wrap-lines={wrapLines}
      data-visible={visible}
    >
      {lines.map((line: DiffLineViewModel, index: number) => (
        <button key={index} data-testid={`load-more-${index}`} onClick={() => onLoadMoreLines?.(line, 'down')}>
          Load More
        </button>
      ))}
    </div>
  )),
}))

const { useHunkListViewModel } = vi.hoisted(() => ({
  useHunkListViewModel: vi.fn(),
}))

vi.mock('../hooks/use-hunk-list-view-model', () => ({
  useHunkListViewModel,
}))

vi.mock('../providers/code-panel-context', async () => {
  const actual = await vi.importActual('../providers/code-panel-context')
  return {
    ...actual,
    useFileState: vi.fn().mockReturnValue({ isCollapsed: false }),
  }
})

const makeFileViewerProps = createPropsFactory<FileViewerProps>({
  file: SAMPLE_FILE_DIFFS[0],
  maxLinesToFetch: 10,
  onLoadMoreLines: vi.fn(),
  id: 'test-file-viewer',
})

const renderWithProvider = (props: FileViewerProps, config?: { mode: 'split' | 'unified' }) => {
  return render(
    <CodePanelConfigProvider config={config}>
      <FileViewer {...props} />
    </CodePanelConfigProvider>,
  )
}

describe('FileViewer', () => {
  let mockDispatch: ReturnType<typeof vi.fn>
  let mockHunkList: {
    linePairs: DiffLineViewModel[]
    getLoadRange: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockDispatch = vi.fn()
    mockHunkList = {
      linePairs: [
        new DiffLineViewModel(
          'hunk',
          '@@ -1,3 +1,4 @@',
          '@@ -1,3 +1,4 @@',
          null,
          'hunk',
          '@@ -1,3 +1,4 @@',
          '@@ -1,3 +1,4 @@',
          null,
          'out',
        ),
        new DiffLineViewModel(
          'context',
          'function test() {',
          'function test() {',
          1,
          'context',
          'function test() {',
          'function test() {',
          1,
        ),
        new DiffLineViewModel('delete', '  return false;', '  return false;', 2, null, null, null, null),
        new DiffLineViewModel('add', null, null, null, 'add', '  return true;', '  return true;', 2),
      ],
      getLoadRange: vi.fn().mockReturnValue({
        leftRange: { start: 1, end: 5 },
        rightRange: { start: 1, end: 5 },
      }),
    }
    useHunkListViewModel.mockReturnValue({
      hunkList: mockHunkList,
      dispatch: mockDispatch,
    })
    ;(useFileState as Mock).mockReturnValue({ isCollapsed: false })
  })

  describe('rendering scenarios', () => {
    it.each([
      { file: SAMPLE_FILE_DIFFS[0], expectedPath: 'src/components/Button.tsx', desc: 'regular file' },
      { file: SAMPLE_FILE_DIFFS[1], expectedPath: 'src/hooks/useFetch.ts', desc: 'another regular file' },
      { file: SAMPLE_FILE_DIFFS[3], expectedPath: 'src/utils/helpers.ts', desc: 'new file' },
      { file: SAMPLE_FILE_DIFFS[4], expectedPath: '/dev/null', desc: 'deleted file' },
    ])(
      'given $desc, when rendered, expect correct file path displayed',
      ({ file, expectedPath }: { file: (typeof SAMPLE_FILE_DIFFS)[0]; expectedPath: string; desc: string }) => {
        // GIVEN
        const props = makeFileViewerProps({ file })

        // WHEN
        renderWithProvider(props)

        // EXPECT
        expect(screen.getByTestId('file-path')).toHaveTextContent(expectedPath)
      },
    )

    it('given basic props, when rendered, expect all components present', () => {
      // GIVEN
      const props = makeFileViewerProps()

      // WHEN
      renderWithProvider(props)

      // EXPECT
      expect(screen.getByTestId('file-viewer-header')).toBeInTheDocument()
      expect(screen.getByTestId('unified-viewer')).toBeInTheDocument()
      expect(screen.queryByTestId('split-viewer')).not.toBeInTheDocument()
    })

    it('given split mode config, when rendered, expect split viewer used', () => {
      // GIVEN
      const props = makeFileViewerProps()

      // WHEN
      renderWithProvider(props, { mode: 'split' })

      // EXPECT
      expect(screen.getByTestId('split-viewer')).toBeInTheDocument()
      expect(screen.queryByTestId('unified-viewer')).not.toBeInTheDocument()
    })

    it('given unified mode config, when rendered, expect unified viewer used', () => {
      // GIVEN
      const props = makeFileViewerProps()

      // WHEN
      renderWithProvider(props, { mode: 'unified' })

      // EXPECT
      expect(screen.getByTestId('unified-viewer')).toBeInTheDocument()
      expect(screen.queryByTestId('split-viewer')).not.toBeInTheDocument()
    })
  })

  describe('wrap lines functionality', () => {
    it('given initial state, when wrap lines toggled, expect state updated', () => {
      // GIVEN
      const props = makeFileViewerProps()

      // WHEN
      renderWithProvider(props)
      const wrapButton = screen.getByTestId('wrap-lines-toggle')
      fireEvent.click(wrapButton)

      // EXPECT
      expect(screen.getByTestId('wrap-lines-toggle')).toHaveTextContent('Wrap Lines')
    })

    it('given wrap lines enabled, when unified viewer rendered, expect wrap lines passed', () => {
      // GIVEN
      const props = makeFileViewerProps()

      // WHEN
      renderWithProvider(props, { mode: 'unified' })
      const wrapButton = screen.getByTestId('wrap-lines-toggle')
      fireEvent.click(wrapButton)

      // EXPECT
      const unifiedViewer = screen.getByTestId('unified-viewer')
      expect(unifiedViewer).toHaveAttribute('data-wrap-lines', 'false')
    })
  })

  describe('load more lines functionality', () => {
    it('given load more triggered, when onLoadMoreLines provided, expect callback called', () => {
      // GIVEN
      const mockOnLoadMoreLines = vi.fn().mockResolvedValue({ lines: [] })
      const props = makeFileViewerProps({ onLoadMoreLines: mockOnLoadMoreLines })

      // WHEN
      renderWithProvider(props)
      const loadMoreButton = screen.getByTestId('load-more-0')
      fireEvent.click(loadMoreButton)

      // EXPECT
      expect(mockHunkList.getLoadRange).toHaveBeenCalled()
      expect(mockOnLoadMoreLines).toHaveBeenCalledWith({
        fileKey: SAMPLE_FILE_DIFFS[0].key,
        leftRange: { start: 1, end: 5 },
        rightRange: { start: 1, end: 5 },
      })
    })

    it('given load more triggered, when result returned, expect dispatch called', async () => {
      // GIVEN
      const mockResult = {
        lines: [new DiffLineViewModel('context', 'new line', 'new line', 5, 'context', 'new line', 'new line', 5)],
      }
      const mockOnLoadMoreLines = vi.fn().mockResolvedValue(mockResult)
      const props = makeFileViewerProps({ onLoadMoreLines: mockOnLoadMoreLines })

      // WHEN
      renderWithProvider(props)
      const loadMoreButton = screen.getByTestId('load-more-0')
      fireEvent.click(loadMoreButton)

      // EXPECT
      await vi.waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'lines_loaded',
          payload: {
            line: mockHunkList.linePairs[0],
            result: mockResult,
            direction: 'down',
          },
        })
      })
    })

    it('given load more triggered, when no result returned, expect dispatch not called', async () => {
      // GIVEN
      const mockOnLoadMoreLines = vi.fn().mockResolvedValue(null)
      const props = makeFileViewerProps({ onLoadMoreLines: mockOnLoadMoreLines })

      // WHEN
      renderWithProvider(props)
      const loadMoreButton = screen.getByTestId('load-more-0')
      fireEvent.click(loadMoreButton)

      // EXPECT
      await vi.waitFor(() => {
        expect(mockDispatch).not.toHaveBeenCalled()
      })
    })

    it('given load more triggered, when onLoadMoreLines not provided, expect no error', () => {
      // GIVEN
      const props = makeFileViewerProps({ onLoadMoreLines: undefined })

      // WHEN
      renderWithProvider(props)
      const loadMoreButton = screen.getByTestId('load-more-0')

      // EXPECT
      expect(() => fireEvent.click(loadMoreButton)).not.toThrow()
    })
  })

  describe('max lines to fetch', () => {
    it('given custom maxLinesToFetch, when rendered, expect passed to viewers', () => {
      // GIVEN
      const props = makeFileViewerProps({ maxLinesToFetch: 25 })

      // WHEN
      renderWithProvider(props, { mode: 'split' })

      // EXPECT
      const splitViewer = screen.getByTestId('split-viewer')
      expect(splitViewer).toHaveAttribute('data-load-count', '25')
    })

    it('given no maxLinesToFetch, when rendered, expect default used', () => {
      // GIVEN
      const props = makeFileViewerProps({ maxLinesToFetch: undefined })

      // WHEN
      renderWithProvider(props, { mode: 'unified' })

      // EXPECT
      const unifiedViewer = screen.getByTestId('unified-viewer')
      expect(unifiedViewer).toHaveAttribute('data-load-count', '10')
    })
  })

  describe('file state integration', () => {
    it('given collapsed file, when rendered, expect body hidden', () => {
      // GIVEN
      ;(useFileState as Mock).mockReturnValue({ isCollapsed: true })
      const props = makeFileViewerProps()
      // WHEN
      renderWithProvider(props)
      // EXPECT
      const unifiedViewer = screen.getByTestId('unified-viewer')
      expect(unifiedViewer).toHaveAttribute('data-visible', 'false')
    })
    it('given expanded file, when rendered, expect body visible', () => {
      // GIVEN
      ;(useFileState as Mock).mockReturnValue({ isCollapsed: false })
      const props = makeFileViewerProps()
      // WHEN
      renderWithProvider(props)
      // EXPECT
      const unifiedViewer = screen.getByTestId('unified-viewer')
      expect(unifiedViewer).toHaveAttribute('data-visible', 'true')
    })
  })

  describe('component ID', () => {
    it('given custom ID, when rendered, expect ID applied', () => {
      // GIVEN
      const props = makeFileViewerProps({ id: 'custom-file-viewer' })

      // WHEN
      const { container } = renderWithProvider(props)

      // EXPECT
      expect(container.firstChild).toHaveAttribute('id', 'custom-file-viewer')
    })

    it('given no ID, when rendered, expect no ID attribute', () => {
      // GIVEN
      const props = makeFileViewerProps({ id: undefined })

      // WHEN
      const { container } = renderWithProvider(props)

      // EXPECT
      expect(container.firstChild).not.toHaveAttribute('id')
    })
  })

  describe('error handling', () => {
    it('given missing context, when rendered, expect error thrown', () => {
      // GIVEN
      const props = makeFileViewerProps()

      // WHEN & EXPECT
      expect(() => render(<FileViewer {...props} />)).toThrow('FileViewer must be inside CodePanelConfigProvider')
    })

    it('given load more error, when triggered, expect error handled gracefully', async () => {
      // GIVEN
      const mockOnLoadMoreLines = vi.fn().mockRejectedValue(new Error('Network error'))
      const props = makeFileViewerProps({ onLoadMoreLines: mockOnLoadMoreLines })

      // WHEN
      renderWithProvider(props)
      const loadMoreButton = screen.getByTestId('load-more-0')
      fireEvent.click(loadMoreButton)

      // EXPECT
      await vi.waitFor(() => {
        expect(notification.error).toHaveBeenCalled()
      })
    })
  })

  describe('performance optimization', () => {
    it('given unified viewer, when file collapsed, expect visible prop false', () => {
      // GIVEN
      ;(useFileState as Mock).mockReturnValue({ isCollapsed: true })
      const props = makeFileViewerProps()
      // WHEN
      renderWithProvider(props, { mode: 'unified' })
      // EXPECT
      const unifiedViewer = screen.getByTestId('unified-viewer')
      expect(unifiedViewer).toHaveAttribute('data-visible', 'false')
    })
  })
})
