import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test-utils/render'
import DirectoryActivitySummary from './DirectoryActivitySummary'

import { MOCKED_FILE_DIFF } from './FileActivitySummary.test'

const MOCKED_FILES = [
  MOCKED_FILE_DIFF,
  {
    ...MOCKED_FILE_DIFF,
    oldPath: 'bar.ts',
    newPath: 'bar.ts',
  },
  {
    ...MOCKED_FILE_DIFF,
    oldPath: 'baz.ts',
    newPath: 'baz.ts',
  },
]

describe('DirectoryActivitySummary', () => {
  it('renders the correct number of squares when maxSquares is provided', () => {
    render(<DirectoryActivitySummary files={MOCKED_FILES} maxSquares={10} />)
    const squares = screen.getAllByTestId('diff-activity-square')
    expect(squares).toHaveLength(10)
  })

  it('defaults maxSquares to 5 when prop is omitted', () => {
    render(<DirectoryActivitySummary files={MOCKED_FILES} />)
    const squares = screen.getAllByTestId('diff-activity-square')
    expect(squares).toHaveLength(5)
  })
})
