import { createPropsFactory, render } from '@dialectica-org/test-lib'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SAMPLE_FILE_DIFFS } from '../../utils/test/__fixtures__/file-diff-fixtures'
import DirectoryActivitySummary from './DirectoryActivitySummary'
import type { DirectoryActivitySummaryProps } from './types'

// ====================
// TEST UTILITIES
// ====================
const createDirectoryActivitySummaryProps = createPropsFactory<DirectoryActivitySummaryProps>({
  files: SAMPLE_FILE_DIFFS,
})

describe('DirectoryActivitySummary', () => {
  it('renders the correct number of squares when maxSquares is provided', () => {
    const props = createDirectoryActivitySummaryProps({ maxSquares: 10 })
    render(<DirectoryActivitySummary {...props} />)
    const squares = screen.getAllByTestId('diff-activity-square')
    expect(squares).toHaveLength(10)
  })

  it('defaults maxSquares to 5 when prop is omitted', () => {
    const props = createDirectoryActivitySummaryProps()
    render(<DirectoryActivitySummary {...props} />)
    const squares = screen.getAllByTestId('diff-activity-square')
    expect(squares).toHaveLength(5)
  })

  it('displays the correct total number of changes across all files', () => {
    const props = createDirectoryActivitySummaryProps()
    render(<DirectoryActivitySummary {...props} />)
    const total = screen.getByTestId('diff-activity-total')
    // Note: The assertion value is hardcoded because it depends on the mock data from the fixture
    expect(total).toHaveTextContent('0')
  })
})
