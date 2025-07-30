import { describe, expect, it, vi } from 'vitest'
import { createMockFileDiff, createMockHunk } from '../../../utils/test/models/test-utils'
import type { HunkDirection } from './types'
import { LineMetadata } from './LineMetadata'
import { HunkListViewModel } from './HunkListViewModel'
import type { DiffLine } from '../../../models/LineDiff'

/**
 * # HunkListViewModel Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **parser/parser**: Mocked to isolate view model logic from complex line parsing algorithms
 * - **LineParserFactory**: Mocked to provide predictable parser instances without external dependencies
 * - **FileDiff.withContext**: Mocked to test view model updates when file diff changes
 * - **Private hunkInfoCache**: Accessed via test instrumentation to verify internal state
 *
 * ## Happy Path
 * - Valid hunks with tracked lines → Correct load ranges calculated for all directions
 * - Tracked line with context changes → New HunkListViewModel instance returned with updated state
 *
 * ## Edge Cases
 * - **Untracked lines**: When loadLines called with unrelated line → Same instance returned (no-op)
 * - **Gap scenarios**: Complex hunk relationships with in_up/in_down/out directions → Correct range calculations
 * - **Boundary conditions**: Lines at start/middle/end of hunks → Proper range bounds
 * - **Missing hunk info**: Lines without cached hunk information → Graceful handling
 *
 * ## Assertions
 * - Verify load range calculations for all HunkDirection types (up, down, in_up, in_down, out)
 * - Confirm leftRange and rightRange are identical for split view mode
 * - Test instance identity preservation vs. creation of new instances
 * - Validate FileDiff.withContext method calls when appropriate
 */

// MOCK
vi.mock('../parser/parser', () => {
  class MockLineParser {
    parse(lines: unknown[]) {
      return lines.map((_, idx) => ({
        typeLeft: 'context' as const,
        contentLeft: `mock ${idx}`,
        highlightedContentLeft: `mock ${idx}`,
        lineNumberLeft: 1,
        typeRight: 'context' as const,
        contentRight: `mock ${idx}`,
        highlightedContentRight: `mock ${idx}`,
        lineNumberRight: 1,
      }))
    }
  }

  return {
    LineParser: MockLineParser,
    LineParserFactory: { build: vi.fn(() => new MockLineParser()) },
  }
})

// Helpers
const buildViewModel = (hunks: ReturnType<typeof createMockHunk>[] = [], maxLinesToFetch = 10) => {
  const fileDiff = createMockFileDiff({ hunks })
  return new HunkListViewModel(fileDiff, 'split', maxLinesToFetch)
}

const attachHunkInfo = (
  vm: HunkListViewModel,
  baseLine: LineMetadata,
  info: { prev?: ReturnType<typeof createMockHunk>; curr: ReturnType<typeof createMockHunk> },
) => {
  // Bypass private visibility for test instrumentation
  ;(vm as unknown as { hunkInfoCache: Map<LineMetadata, unknown> }).hunkInfoCache.set(baseLine, info)
}

describe('HunkListViewModel.getLoadRange', () => {
  const maxLines = 10
  const scenarios: Array<{
    desc: string
    direction: HunkDirection
    baseOld: number
    prevOld?: number
    prevLines?: number
    currOld?: number
    expectedLeft: { start: number; end: number }
  }> = [
    {
      desc: 'base line in middle with up direction',
      direction: 'up',
      baseOld: 50,
      expectedLeft: { start: 40, end: 49 },
    },
    {
      desc: 'base line in middle with down direction',
      direction: 'down',
      baseOld: 50,
      expectedLeft: { start: 51, end: 60 },
    },
    {
      desc: 'gap scenario with in_up direction',
      direction: 'in_up',
      baseOld: 20,
      expectedLeft: { start: 10, end: 19 },
    },
    {
      desc: 'gap scenario with in_down direction',
      direction: 'in_down',
      baseOld: 30,
      prevOld: 10,
      prevLines: 5,
      currOld: 30,
      expectedLeft: { start: 15, end: 24 },
    },
    {
      desc: 'gap scenario with out direction',
      direction: 'out',
      baseOld: 30,
      prevOld: 10,
      prevLines: 5,
      currOld: 30,
      expectedLeft: { start: 15, end: 29 },
    },
  ]

  scenarios.forEach(({ desc, direction, baseOld, prevOld, prevLines, currOld, expectedLeft }) => {
    it(`given ${desc} when getLoadRange called expect correct range returned`, () => {
      // MOCK

      // GIVEN
      const prevHunk =
        prevOld !== undefined
          ? createMockHunk({ oldStart: prevOld, oldLines: prevLines ?? 3, newStart: prevOld, newLines: prevLines ?? 3 })
          : undefined
      const currHunk = createMockHunk({
        oldStart: currOld ?? baseOld,
        oldLines: 3,
        newStart: currOld ?? baseOld,
        newLines: 3,
      })
      const vm = buildViewModel([prevHunk, currHunk].filter(Boolean) as ReturnType<typeof createMockHunk>[], maxLines)

      const baseLine = new LineMetadata('context', 'base', baseOld, 'context', 'base', baseOld, 'typescript')

      if (direction === 'in_down' || direction === 'out') {
        attachHunkInfo(vm, baseLine, { prev: prevHunk, curr: currHunk })
      }

      // WHEN
      const range = vm.getLoadRange(baseLine, direction)

      // EXPECT
      expect(range.leftRange).toEqual(expectedLeft)
      expect(range.rightRange).toEqual(expectedLeft)
    })
  })
})

describe('HunkListViewModel.loadLines', () => {
  it('given base line not tracked when loadLines called expect same instance returned', () => {
    // GIVEN
    const hunk = createMockHunk()
    const vm = buildViewModel([hunk] as ReturnType<typeof createMockHunk>[])
    const unrelatedLine = new LineMetadata('context', 'x', 1, 'context', 'x', 1, 'typescript')
    const result = { leftLines: new Map(), rightLines: new Map() }

    // WHEN
    const updated = vm.loadLines(unrelatedLine, result, 'up')

    // EXPECT
    expect(updated).toBe(vm)
  })

  it('given tracked line and FileDiff returns new instance when loadLines called expect new HunkListViewModel returned', () => {
    // GIVEN
    const prevHunk = createMockHunk({ oldStart: 1, oldLines: 3 })
    const currHunk = createMockHunk({ oldStart: 20, oldLines: 3 })
    const fileDiff = createMockFileDiff({ hunks: [prevHunk, currHunk] })
    const vm = new HunkListViewModel(fileDiff, 'split', 5)

    const trackedLine = new LineMetadata('context', 'y', 20, 'context', 'y', 20, 'typescript')
    attachHunkInfo(vm, trackedLine, { prev: prevHunk, curr: currHunk })

    const spy = vi.spyOn(fileDiff, 'withContext').mockReturnValue(createMockFileDiff({ hunks: [prevHunk, currHunk] }))

    const result = { leftLines: new Map(), rightLines: new Map() }

    // WHEN
    const updated = vm.loadLines(trackedLine, result, 'up')

    // EXPECT
    expect(spy).toHaveBeenCalled()
    expect(updated).not.toBe(vm)
  })
})

// NEW TESTS – Additional coverage for computeLinePairs & buildContextLines

describe('HunkListViewModel.computeLinePairs', () => {
  /**
   * Utility to build a hunk with given start line ensuring the hunk body is non-empty
   */
  const makeHunk = (oldStart: number): ReturnType<typeof createMockHunk> =>
    createMockHunk({ oldStart, newStart: oldStart, oldLines: 3, newLines: 3 })

  it('creates header pairs with correct hunkDirection values and adds a footer', () => {
    // GIVEN – Three hunks with different relations (start-of-file, small-gap, large-gap)
    const hunkA = makeHunk(10) // relation: start-of-file  -> direction "up"
    const hunkB = makeHunk(18) // gap = 5                 -> direction "out"
    const hunkC = makeHunk(40) // gap > 10               -> direction "in"

    const vm = buildViewModel([hunkA, hunkB, hunkC])

    // WHEN
    const pairs = vm.linePairs // triggers computeLinePairs lazily

    // THEN – One header per hunk (up/out/in) plus a footer (down)
    const directions = pairs.filter((p: LineMetadata) => p.hunkDirection).map((p: LineMetadata) => p.hunkDirection)

    expect(directions).toEqual(['up', 'out', 'in', 'down'])

    // Footer should reference the line *after* the last hunk ends
    const footer = pairs.find((p: LineMetadata) => p.hunkDirection === 'down')!
    expect(footer.lineNumberLeft).toBe(hunkC.oldStart + hunkC.oldLines)
    expect(footer.lineNumberRight).toBe(hunkC.newStart + hunkC.newLines)
  })
})

describe('HunkListViewModel.buildContextLines & searchRightLine', () => {
  it('matches identical lines, finds nearby lines, and includes unmatched right-only lines', () => {
    // GIVEN
    const vm = buildViewModel()

    /*
     * leftLines: 10 => "foo", 20 => "bar"
     * rightLines: 12 => "foo" (offset match), 20 => "bar" (exact match), 30 => "baz" (right-only)
     */
    const leftLines = new Map<number, string>([
      [10, 'foo'],
      [20, 'bar'],
    ])
    const rightLines = new Map<number, string>([
      [12, 'foo'], // should be matched to 10 (below)
      [20, 'bar'], // exact match
      [30, 'baz'], // unmatched – right-only
    ])

    // WHEN
    const contextLines = (
      vm as unknown as {
        buildContextLines: (leftLines: Map<number, string>, rightLines: Map<number, string>) => DiffLine[]
      }
    ).buildContextLines(leftLines, rightLines)

    // THEN – 3 output lines expected
    expect(contextLines).toHaveLength(3)

    const line10 = contextLines.find((l: DiffLine) => l.lineNumberOld === 10)!
    expect(line10.lineNumberNew).toBe(12) // matched via searchRightLine (below)

    const line20 = contextLines.find((l: DiffLine) => l.lineNumberOld === 20)!
    expect(line20.lineNumberNew).toBe(20) // exact match

    const rightOnly = contextLines.find((l: DiffLine) => l.lineNumberNew === 30)!
    expect(rightOnly.lineNumberOld).toBeNull() // left side missing
  })
})
