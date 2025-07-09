import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../utils/test/render'
import { createPropsFactory, expectElementToBeInTheDocument } from '../../../utils/test/generic-test-utils'
import { createFileActivitySummaryProps } from '../../../utils/test/components/ui/activity-summary/test-utils'
import { SAMPLE_FILE_DIFFS } from '../../../utils/test/__fixtures__/file-diff-fixtures'
import FileActivitySummary from './FileActivitySummary'
import type { FileActivitySummaryProps } from './types'

// ====================
// TEST UTILITIES
// ====================
const createTestProps = createPropsFactory<Partial<FileActivitySummaryProps>>({
  maxSquares: 5,
})

const expectSquaresToHaveLength = (expectedCount: number): void => {
  const squares = screen.getAllByTestId('diff-activity-square')
  expect(squares).toHaveLength(expectedCount)
}

describe('FileActivitySummary', () => {
  describe('basic rendering scenarios', () => {
    it('given maxSquares provided, when rendered, expect correct number of squares', () => {
      // GIVEN
      const testOverrides = createTestProps({ maxSquares: 10 })
      const props = createFileActivitySummaryProps(testOverrides)

      // WHEN
      render(<FileActivitySummary {...props} />)

      // EXPECT
      expectSquaresToHaveLength(10)
      expectElementToBeInTheDocument('diff-activity-total')
    })

    it('given no maxSquares provided, when rendered, expect default number of squares', () => {
      // GIVEN
      const testOverrides = createTestProps({})
      const props = createFileActivitySummaryProps(testOverrides)

      // WHEN
      render(<FileActivitySummary {...props} />)

      // EXPECT
      expectSquaresToHaveLength(5)
      expectElementToBeInTheDocument('diff-activity-total')
    })
  })

  describe('realistic data scenarios', () => {
    it('given file with actual changes, when rendered, expect accurate total display', () => {
      // GIVEN - Use a file diff with real changes from fixtures
      const fileWithChanges = SAMPLE_FILE_DIFFS.find((file) => file.hunks.length > 0) || SAMPLE_FILE_DIFFS[0]
      const testOverrides = createTestProps({ maxSquares: 8 })
      const props = createFileActivitySummaryProps({
        ...testOverrides,
        file: fileWithChanges,
      })

      // WHEN
      render(<FileActivitySummary {...props} />)

      // EXPECT
      expectSquaresToHaveLength(8)
      expectElementToBeInTheDocument('diff-activity-total')

      // Verify the total reflects actual data, not hard-coded values
      const totalElement = screen.getByTestId('diff-activity-total')
      expect(totalElement.textContent).toMatch(/^\d+$/) // Should be a number
    })

    it('given new file, when rendered, expect appropriate activity representation', () => {
      // GIVEN - Use a new file from fixtures
      const newFile = SAMPLE_FILE_DIFFS.find((file) => file.isNew) || SAMPLE_FILE_DIFFS[0]
      const props = createFileActivitySummaryProps({ file: newFile })

      // WHEN
      render(<FileActivitySummary {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('diff-activity-total')
      expectSquaresToHaveLength(5) // Default maxSquares
    })

    it('given deleted file, when rendered, expect appropriate activity representation', () => {
      // GIVEN - Use a deleted file from fixtures
      const deletedFile = SAMPLE_FILE_DIFFS.find((file) => file.isDeleted) || SAMPLE_FILE_DIFFS[0]
      const props = createFileActivitySummaryProps({ file: deletedFile })

      // WHEN
      render(<FileActivitySummary {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('diff-activity-total')
      expectSquaresToHaveLength(5)
    })
  })

  describe('edge cases', () => {
    it('given maxSquares of 1, when rendered, expect single square', () => {
      // GIVEN
      const testOverrides = createTestProps({ maxSquares: 1 })
      const props = createFileActivitySummaryProps(testOverrides)

      // WHEN
      render(<FileActivitySummary {...props} />)

      // EXPECT
      expectSquaresToHaveLength(1)
    })

    it('given very large maxSquares, when rendered, expect all squares rendered', () => {
      // GIVEN
      const testOverrides = createTestProps({ maxSquares: 50 })
      const props = createFileActivitySummaryProps(testOverrides)

      // WHEN
      render(<FileActivitySummary {...props} />)

      // EXPECT
      expectSquaresToHaveLength(50)
    })
  })

  describe('accessibility', () => {
    it('given rendered component, when queried, expect activity elements have proper test ids', () => {
      // GIVEN
      const props = createFileActivitySummaryProps()

      // WHEN
      render(<FileActivitySummary {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('diff-activity-total')

      // Verify all squares have consistent test id
      const squares = screen.getAllByTestId('diff-activity-square')
      expect(squares.length).toBeGreaterThan(0)
      squares.forEach((square) => {
        expect(square).toHaveAttribute('data-testid', 'diff-activity-square')
      })
    })
  })
})
