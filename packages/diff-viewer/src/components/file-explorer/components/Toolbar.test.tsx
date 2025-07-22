import { vi } from 'vitest'

// Mock the file explorer context before any imports
vi.mock('../providers/fstree-context', () => ({
  useFileExplorerContext: vi.fn(),
}))

import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { createPropsFactory, expectElementToBeInTheDocument } from '../../../../../commons/src/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { SAMPLE_FILE_DIFFS } from '../../../utils/test/__fixtures__/file-diff-fixtures'
import { useFileExplorerContext } from '../providers/fstree-context'
import { ExplorerBar } from './Toolbar'
import type { FSTreeContextState } from '../providers/types'

const mockUseFileExplorerContext = vi.mocked(useFileExplorerContext)

const createExplorerBarProps = createPropsFactory({
  onExpandAll: vi.fn(),
  onCollapseAll: vi.fn(),
})

const createMockContextValue = createPropsFactory<Partial<FSTreeContextState>>({
  searchQuery: '',
  setSearchQuery: vi.fn(),
  filteredFiles: SAMPLE_FILE_DIFFS,
})

describe('ExplorerBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('search input functionality', () => {
    it('given empty search query, when component renders, expect search input with placeholder', () => {
      // GIVEN
      const contextValue = createMockContextValue({ searchQuery: '' })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(screen.getByPlaceholderText('Filter / Search Files')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Filter / Search Files')).toHaveValue('')
    })

    it('given existing search query, when component renders, expect input to show query value', () => {
      // GIVEN
      const searchQuery = 'Button.tsx'
      const contextValue = createMockContextValue({ searchQuery })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(screen.getByDisplayValue(searchQuery)).toBeInTheDocument()
    })

    it('given search input, when user types, expect setSearchQuery to be called', () => {
      // GIVEN
      const setSearchQuery = vi.fn()
      const contextValue = createMockContextValue({ setSearchQuery })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)
      const searchInput = screen.getByPlaceholderText('Filter / Search Files')
      fireEvent.change(searchInput, { target: { value: 'test-query' } })

      // EXPECT
      expect(setSearchQuery).toHaveBeenCalledWith('test-query')
    })

    it('given search input with text, when clear button clicked, expect setSearchQuery called with empty string', () => {
      // GIVEN
      const setSearchQuery = vi.fn()
      const contextValue = createMockContextValue({
        searchQuery: 'existing-search',
        setSearchQuery,
      })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)
      const clearButton = screen.getByRole('button', { name: /clear/i })
      fireEvent.click(clearButton)

      // EXPECT
      expect(setSearchQuery).toHaveBeenCalledWith('')
    })
  })

  describe('search results summary', () => {
    it('given no search query, when component renders, expect no search summary displayed', () => {
      // GIVEN
      const contextValue = createMockContextValue({ searchQuery: '' })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(screen.queryByText(/file/)).not.toBeInTheDocument()
      expect(screen.queryByText(/found/)).not.toBeInTheDocument()
    })

    it('given search query with single result, when component renders, expect singular file message', () => {
      // GIVEN
      const singleFile = [SAMPLE_FILE_DIFFS[0]]
      const contextValue = createMockContextValue({
        searchQuery: 'Button.tsx',
        filteredFiles: singleFile,
      })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(screen.getByText('1 file found')).toBeInTheDocument()
    })

    it('given search query with multiple results, when component renders, expect plural files message', () => {
      // GIVEN
      const multipleFiles = SAMPLE_FILE_DIFFS.slice(0, 3)
      const contextValue = createMockContextValue({
        searchQuery: 'tsx',
        filteredFiles: multipleFiles,
      })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(screen.getByText('3 files found')).toBeInTheDocument()
    })

    it('given search query with no results, when component renders, expect no matches message', () => {
      // GIVEN
      const contextValue = createMockContextValue({
        searchQuery: 'nonexistent',
        filteredFiles: [],
      })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(screen.getByText('No matches for this query')).toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('given expand all button, when clicked, expect onExpandAll to be called', () => {
      // GIVEN
      const onExpandAll = vi.fn()
      const contextValue = createMockContextValue()
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps({ onExpandAll })

      // WHEN
      render(<ExplorerBar {...props} />)
      fireEvent.click(screen.getByTestId('expand-all-btn'))

      // EXPECT
      expect(onExpandAll).toHaveBeenCalledOnce()
    })

    it('given collapse all button, when clicked, expect onCollapseAll to be called', () => {
      // GIVEN
      const onCollapseAll = vi.fn()
      const contextValue = createMockContextValue()
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps({ onCollapseAll })

      // WHEN
      render(<ExplorerBar {...props} />)
      fireEvent.click(screen.getByTestId('collapse-all-btn'))

      // EXPECT
      expect(onCollapseAll).toHaveBeenCalledOnce()
    })

    it('given action buttons, when rendered, expect both buttons to be small size', () => {
      // GIVEN
      const contextValue = createMockContextValue()
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('expand-all-btn')
      expectElementToBeInTheDocument('collapse-all-btn')
      expect(screen.getByTestId('expand-all-btn')).toHaveClass('ant-btn-sm')
      expect(screen.getByTestId('collapse-all-btn')).toHaveClass('ant-btn-sm')
    })
  })

  describe('component integration', () => {
    it('given complete component setup, when rendered, expect all elements present', () => {
      // GIVEN
      const contextValue = createMockContextValue({
        searchQuery: 'test',
        filteredFiles: SAMPLE_FILE_DIFFS.slice(0, 2),
      })
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(screen.getByPlaceholderText('Filter / Search Files')).toBeInTheDocument()
      expect(screen.getByText('2 files found')).toBeInTheDocument()
      expectElementToBeInTheDocument('expand-all-btn')
      expectElementToBeInTheDocument('collapse-all-btn')
    })

    it('given optional callback props not provided, when buttons clicked, expect no errors thrown', () => {
      // GIVEN
      const contextValue = createMockContextValue()
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps({
        onExpandAll: undefined,
        onCollapseAll: undefined,
      })

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(() => {
        fireEvent.click(screen.getByTestId('expand-all-btn'))
        fireEvent.click(screen.getByTestId('collapse-all-btn'))
      }).not.toThrow()
    })
  })

  describe('accessibility and styling', () => {
    it('given search input, when rendered, expect proper accessibility attributes', () => {
      // GIVEN
      const contextValue = createMockContextValue()
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      const searchInput = screen.getByPlaceholderText('Filter / Search Files')
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('given buttons, when rendered, expect proper button roles and labels', () => {
      // GIVEN
      const contextValue = createMockContextValue()
      mockUseFileExplorerContext.mockReturnValue(contextValue as FSTreeContextState)
      const props = createExplorerBarProps()

      // WHEN
      render(<ExplorerBar {...props} />)

      // EXPECT
      expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Collapse All' })).toBeInTheDocument()
    })
  })
})
