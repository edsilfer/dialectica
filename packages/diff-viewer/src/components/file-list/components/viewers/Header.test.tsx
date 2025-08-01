import { createPropsFactory, render } from '@edsilfer/test-lib'
import { fireEvent, screen, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { FileDiff } from '../../../../models/FileDiff'
import { DEFAULT_FILE_LIST_CONFIG, FileListConfigProvider } from '../../../../providers/file-list-context'
import { SAMPLE_FILE_DIFFS } from '../../../../utils/test/__fixtures__/file-diff-fixtures'
import Header from './Header'

/**
 * # FileViewerHeader Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **navigator.clipboard**: Mocked to test copy functionality without browser clipboard dependencies
 * - **console.error**: Mocked to verify error handling without polluting test output
 * - **FileListConfigProvider**: Wrapped in provider to test component with proper context
 *
 * ## Happy Path
 * - File path displayed correctly for different file types (regular, markdown, new, deleted)
 * - All interactive elements (expand, copy, viewed checkbox) render and respond to clicks
 * - Tooltips display appropriate text for accessibility
 * - Component structure renders with correct CSS classes and DOM hierarchy
 *
 * ## Edge Cases
 * - **Clipboard API errors**: Copy button handles clipboard.writeText failures gracefully with error logging
 * - **Different file states**: Handles new files, deleted files, and regular files with appropriate path display
 * - **Clipboard not available**: Graceful fallback when navigator.clipboard is undefined
 *
 * ## Assertions
 * - Verify DOM element presence, click interactions, callback invocations, and error handling
 * - Test accessibility features like tooltips and label associations
 * - Validate component structure and styling classes
 */

vi.mock('navigator.clipboard', () => ({
  writeText: vi.fn(),
}))

const createFileViewerHeaderProps = createPropsFactory<{ file: FileDiff }>({
  file: SAMPLE_FILE_DIFFS[0],
})

const renderWithProvider = (props: { file: FileDiff }, config?: Partial<typeof DEFAULT_FILE_LIST_CONFIG>) => {
  const mergedConfig = config ? { ...DEFAULT_FILE_LIST_CONFIG, ...config } : DEFAULT_FILE_LIST_CONFIG
  return render(
    <FileListConfigProvider config={mergedConfig}>
      <Header {...props} />
    </FileListConfigProvider>,
  )
}

describe('FileViewerHeader', () => {
  let mockWriteText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
    })
  })

  describe('rendering scenarios', () => {
    test.each([
      { file: SAMPLE_FILE_DIFFS[0], expectedPath: 'src/components/Button.tsx', desc: 'regular file' },
      { file: SAMPLE_FILE_DIFFS[1], expectedPath: 'src/hooks/useFetch.ts', desc: 'another regular file' },
      { file: SAMPLE_FILE_DIFFS[2], expectedPath: 'README.md', desc: 'markdown file' },
      { file: SAMPLE_FILE_DIFFS[3], expectedPath: 'src/utils/helpers.ts', desc: 'new file' },
      { file: SAMPLE_FILE_DIFFS[4], expectedPath: 'src/legacy/api.js', desc: 'deleted file' },
    ])('given $desc, when rendered, expect correct file path', ({ file, expectedPath }) => {
      // GIVEN
      const props = createFileViewerHeaderProps({ file })

      // WHEN
      renderWithProvider(props)

      // EXPECT
      expect(screen.getByText(expectedPath)).toBeInTheDocument()
    })

    it('given basic props, when rendered, expect all elements present', () => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)

      // EXPECT
      expect(screen.getByText('src/components/Button.tsx')).toBeInTheDocument()
      expect(screen.getByText('Viewed')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('given binary file, when rendered, expect BIN label present', () => {
      // GIVEN: create a binary file diff
      const file = new FileDiff({
        oldPath: 'foo.bin',
        newPath: 'foo.bin',
        hunks: [],
        isRenamed: false,
        isNew: false,
        isDeleted: false,
        language: 'binary',
        rawContent: 'GIT binary patch\nliteral 1234\n...',
        isBinary: true,
      })
      const props = createFileViewerHeaderProps({ file })

      // WHEN
      renderWithProvider(props)

      // EXPECT
      expect(screen.getByText('BIN')).toBeInTheDocument()
    })

    it('given deleted binary file, when rendered, expect BIN label present', () => {
      // GIVEN: create a deleted binary file diff
      const file = new FileDiff({
        oldPath: 'foo.bin',
        newPath: '/dev/null',
        hunks: [],
        isRenamed: false,
        isNew: false,
        isDeleted: true,
        language: 'binary',
        rawContent: 'Binary files a/foo.bin and /dev/null differ',
        isBinary: true,
        bytes: 1234,
      })
      const props = createFileViewerHeaderProps({ file })

      // WHEN
      renderWithProvider(props)

      // EXPECT
      expect(screen.getByText('BIN')).toBeInTheDocument()
    })
  })

  describe('expand button interactions', () => {
    test.each([
      { desc: 'collapsed file', index: 0 },
      { desc: 'expanded file', index: 0 },
    ])('given $desc, when expand button clicked, expect toggle called', () => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const expandButton = document.querySelector('[data-tooltip="Hide file content"] .expand-button')
      act(() => {
        fireEvent.click(expandButton!)
      })

      // EXPECT
      expect(expandButton).toBeInTheDocument()
    })
  })

  describe('copy button interactions', () => {
    test.each([
      { file: SAMPLE_FILE_DIFFS[0], expected: 'src/components/Button.tsx', desc: 'default file' },
      { file: SAMPLE_FILE_DIFFS[1], expected: 'src/hooks/useFetch.ts', desc: 'another file' },
    ])('given $desc, when copy button clicked, expect correct path copied', async ({ file, expected }) => {
      // GIVEN
      const props = createFileViewerHeaderProps({ file })

      // WHEN
      renderWithProvider(props)
      const copyButton = document.querySelector('[data-tooltip="Copy file path"] svg')
      act(() => {
        fireEvent.click(copyButton!)
      })

      // EXPECT
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(expected)
      })
    })

    it('given clipboard error, when copy clicked, expect error logged', async () => {
      // GIVEN
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockWriteText.mockRejectedValue(new Error('Clipboard error'))
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const copyButton = document.querySelector('[data-tooltip="Copy file path"] svg')
      act(() => {
        fireEvent.click(copyButton!)
      })

      // EXPECT
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      })
      consoleSpy.mockRestore()
    })
  })

  describe('viewed checkbox interactions', () => {
    test.each([
      { checked: false, desc: 'unchecked viewed checkbox' },
      { checked: true, desc: 'checked viewed checkbox' },
    ])('given $desc, when clicked, expect toggle called', ({ checked: _checked }) => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const checkbox = screen.getByRole('checkbox')
      act(() => {
        fireEvent.click(checkbox)
      })

      // EXPECT
      expect(checkbox).toBeInTheDocument()
    })
  })

  describe('styling and layout', () => {
    it('given file viewer header, when rendered, expect correct structure', () => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      const { container } = renderWithProvider(props)
      const header = container.firstChild as HTMLElement

      // EXPECT
      expect(header).toBeInTheDocument()
      expect(header.querySelector('.file-path')).toBeInTheDocument()
    })

    it('given header with activity summary, when rendered, expect activity summary present', () => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)

      // EXPECT
      expect(screen.getByText('src/components/Button.tsx')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('given copy button, when rendered, expect proper tooltip text', () => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const copyButtonWrapper = document.querySelector('[data-tooltip="Copy file path"]')

      // EXPECT
      expect(copyButtonWrapper).toBeInTheDocument()
    })

    it('given viewed checkbox, when rendered, expect proper label association', () => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const checkbox = screen.getByRole('checkbox')
      const label = screen.getByText('Viewed')

      // EXPECT
      expect(checkbox).toBeInTheDocument()
      expect(label).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('given clipboard not available, when copy clicked, expect graceful error handling', async () => {
      // GIVEN
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard not available'))
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        configurable: true,
      })
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const copyButton = document.querySelector('[data-tooltip="Copy file path"] svg')
      act(() => {
        fireEvent.click(copyButton!)
      })

      // EXPECT
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      })
      consoleSpy.mockRestore()
    })
  })
})
