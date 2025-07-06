import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test-utils/render'

import { File } from '../../models/File'
import { Hunk } from '../../models/Hunk'
import { DiffLine } from '../../models/Line'
import FileActivitySummary from './FileActivitySummary'

function createDiffLine(
  content: string,
  type: 'context' | 'add' | 'delete',
  lineNumberOld: number | null = null,
  lineNumberNew: number | null = null,
): DiffLine {
  return {
    content,
    type,
    lineNumberOld,
    lineNumberNew,
  } as DiffLine
}

const MOCKED_CHANGES: DiffLine[] = [
  createDiffLine('const a = 1;', 'context', 1, 1),
  createDiffLine('const b = 2;', 'delete', 2, null),
  createDiffLine('const b = 3;', 'add', null, 2),
  createDiffLine('const c = 4;', 'add', null, 3),
]

export const MOCKED_FILE_DIFF: File = new File({
  oldPath: 'foo.ts',
  newPath: 'foo.ts',
  isRenamed: false,
  language: 'typescript',
  hunks: [new Hunk('@@ -1,3 +1,3 @@', 1, 3, 1, 3, MOCKED_CHANGES, 'foo.ts')],
  rawContent: '@@ -1,3 +1,3 @@\nconst a = 1;\n-const b = 2;\n+const b = 3;\n+const c = 4;',
})

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
