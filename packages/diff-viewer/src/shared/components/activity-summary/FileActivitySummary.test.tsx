import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test-utils/render'

import { FileDiff } from '../../parsers/types'
import FileActivitySummary from './FileActivitySummary'

export const MOCKED_FILE_DIFF: FileDiff = {
  oldPath: 'foo.ts',
  newPath: 'foo.ts',
  isRenamed: false,
  hunks: [
    {
      content: '@@ -1,3 +1,3 @@',
      oldStart: 1,
      oldLines: 3,
      newStart: 1,
      newLines: 3,
      changes: [
        { type: 'context', content: 'const a = 1;', lineNumberOld: 1, lineNumberNew: 1 },
        { type: 'delete', content: 'const b = 2;', lineNumberOld: 2, lineNumberNew: null },
        { type: 'add', content: 'const b = 3;', lineNumberOld: null, lineNumberNew: 2 },
        { type: 'add', content: 'const c = 4;', lineNumberOld: null, lineNumberNew: 3 },
      ],
    },
  ],
}

describe('FileActivitySummary', () => {
  it('renders the correct number of squares when maxSquares is provided', () => {
    render(<FileActivitySummary file={MOCKED_FILE_DIFF} maxSquares={10} />)
    const squares = screen.getAllByTestId('diff-activity-square')
    expect(squares).toHaveLength(10)
  })

  it('defaults maxSquares to 5 when prop is omitted', () => {
    render(<FileActivitySummary file={MOCKED_FILE_DIFF} />)
    const squares = screen.getAllByTestId('diff-activity-square')
    expect(squares).toHaveLength(5)
  })

  it('displays the correct total number of changes', () => {
    render(<FileActivitySummary file={MOCKED_FILE_DIFF} />)
    const total = screen.getByTestId('diff-activity-total')
    expect(total).toHaveTextContent('3')
  })
})
