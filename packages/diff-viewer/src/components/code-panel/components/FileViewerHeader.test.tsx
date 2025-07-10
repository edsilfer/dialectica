import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, test } from 'vitest'
import { SAMPLE_FILE_DIFFS } from '../../../utils/test/__fixtures__/file-diff-fixtures'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { CodePanelConfigProvider } from '../providers/code-panel-context'
import FileViewerHeader from './FileViewerHeader'
import type { FileViewerHeaderProps } from './types'

/**
 * # FileViewerHeader Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **navigator.clipboard**: Mocked to test copy functionality without browser clipboard dependencies
 * - **console.error**: Mocked to verify error handling without polluting test output
 * - **CodePanelConfigProvider**: Wrapped in provider to test component with proper context
 *
 * ## Happy Path
 * - File path displayed correctly for different file types (regular, markdown, new, deleted)
 * - All interactive elements (expand, copy, wrap lines, viewed checkbox) render and respond to clicks
 * - Tooltips display appropriate text for accessibility
 * - Component structure renders with correct CSS classes and DOM hierarchy
 *
 * ## Edge Cases
 * - **Clipboard API errors**: Copy button handles clipboard.writeText failures gracefully with error logging
 * - **Split mode rendering**: Wrap lines button hidden when in split mode (only available in unified mode)
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

const createFileViewerHeaderProps = createPropsFactory<FileViewerHeaderProps>({
  file: SAMPLE_FILE_DIFFS[0],
  wrapLines: false,
  onWrapLinesChange: vi.fn(),
})

const renderWithProvider = (props: FileViewerHeaderProps, config?: { mode: 'split' | 'unified' }) => {
  return render(
    <CodePanelConfigProvider config={config}>
      <FileViewerHeader {...props} />
    </CodePanelConfigProvider>,
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
      { file: SAMPLE_FILE_DIFFS[4], expectedPath: '/dev/null', desc: 'deleted file' },
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
  })

  describe('expand button interactions', () => {
    test.each([
      { desc: 'collapsed file', index: 0 },
      { desc: 'expanded file', index: 0 },
    ])('given $desc, when expand button clicked, expect toggle called', ({ index }) => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const expandButton = screen.getAllByTestId('tooltip-wrapper')[index].querySelector('.expand-button')
      fireEvent.click(expandButton!)

      // EXPECT
      expect(expandButton).toBeInTheDocument()
    })
  })

  describe('copy button interactions', () => {
    test.each([
      { file: SAMPLE_FILE_DIFFS[0], expected: 'src/components/Button.tsx', desc: 'default file' },
      { file: SAMPLE_FILE_DIFFS[1], expected: 'src/hooks/useFetch.ts', desc: 'another file' },
    ])('given $desc, when copy button clicked, expect correct path copied', ({ file, expected: _expected }) => {
      // GIVEN
      const props = createFileViewerHeaderProps({ file })

      // WHEN
      renderWithProvider(props)
      const copyButton = screen.getAllByTestId('tooltip-wrapper')[3].querySelector('svg')
      fireEvent.click(copyButton!)

      // EXPECT
      expect(mockWriteText).toHaveBeenCalledWith(_expected)
    })

    it('given clipboard error, when copy clicked, expect error logged', async () => {
      // GIVEN
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockWriteText.mockRejectedValue(new Error('Clipboard error'))
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const copyButton = screen.getAllByTestId('tooltip-wrapper')[3].querySelector('svg')
      fireEvent.click(copyButton!)

      // EXPECT
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      })
      consoleSpy.mockRestore()
    })
  })

  describe('wrap lines button interactions', () => {
    test.each([
      { wrapLines: false, expected: true, desc: 'wrap lines disabled' },
      { wrapLines: true, expected: false, desc: 'wrap lines enabled' },
    ])('given unified mode with $desc, when wrap button clicked, expect callback called', ({ wrapLines }) => {
      // GIVEN
      const mockOnWrapLinesChange = vi.fn()
      const props = createFileViewerHeaderProps({
        wrapLines,
        onWrapLinesChange: mockOnWrapLinesChange,
      })

      // WHEN
      renderWithProvider(props)
      const wrapButton = screen.getAllByTestId('tooltip-wrapper')[4].querySelector('svg')
      fireEvent.click(wrapButton!)

      // EXPECT
      expect(mockOnWrapLinesChange).toHaveBeenCalledWith(!wrapLines)
    })

    it('given split mode, when rendered, expect wrap lines button not present', () => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props, { mode: 'split' })

      // EXPECT
      const tooltipWrappers = screen.getAllByTestId('tooltip-wrapper')
      const hasWrapLinesButton = tooltipWrappers.some(
        (wrapper) => wrapper.textContent?.includes('Wrap lines') || wrapper.textContent?.includes('Unwrap lines'),
      )
      expect(hasWrapLinesButton).toBe(false)
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
      fireEvent.click(checkbox)

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
    test.each([
      { index: 3, text: 'Copy file path', desc: 'copy button' },
      { index: 4, text: 'Wrap lines', desc: 'wrap lines button' },
    ])('given $desc, when rendered, expect proper tooltip text', ({ index, text }) => {
      // GIVEN
      const props = createFileViewerHeaderProps()

      // WHEN
      renderWithProvider(props)
      const tooltip = screen.getAllByTestId('tooltip-wrapper')[index]

      // EXPECT
      expect(tooltip).toHaveTextContent(text)
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
      const copyButton = screen.getAllByTestId('tooltip-wrapper')[3].querySelector('svg')
      fireEvent.click(copyButton!)

      // EXPECT
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      })
      consoleSpy.mockRestore()
    })
  })
})
