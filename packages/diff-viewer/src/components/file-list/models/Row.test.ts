import { describe, expect, it } from 'vitest'
import { LineMetadata } from './LineMetadata'
import { Row } from './Row'

/**
 * # DiffRowViewModel Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **DiffLineViewModel**: Uses createMockDiffLineViewModel to provide consistent test data
 * - **Widget**: Mocked to isolate view model logic from widget rendering
 *
 * ## Happy Path
 * - Valid content on both sides → Correct content returned for each side
 * - Unified view (no side parameter) → Left content returned (unified view pattern)
 * - Language and line type access → Correct values returned from underlying line
 * - Widget filtering → Correct widgets returned for top/bottom positions
 *
 * ## Edge Cases
 * - **Null content**: Returns undefined instead of '&nbsp;' for display purposes
 * - **Empty content**: Handles empty strings correctly
 * - **Missing line numbers**: Returns null for missing line numbers
 * - **No widgets**: Returns empty arrays when no widgets present
 *
 * ## Assertions
 * - Verify content retrieval for left/right sides and unified view
 * - Test language and line type access methods
 * - Validate widget filtering logic for different positions
 * - Confirm proper handling of null/undefined values
 */

// HELPERS
const createMockDiffLineViewModel = (overrides: Partial<LineMetadata> = {}): LineMetadata => {
  const defaultLine = new LineMetadata('context', 'left content', 1, 'add', 'right content', 2, 'typescript')
  return Object.assign(defaultLine, overrides)
}

const createDiffRowViewModel = (line: LineMetadata): Row => {
  return new Row(line, [])
}

describe('DiffRowViewModel', () => {
  describe('content property', () => {
    const testCases = [
      {
        side: 'left' as const,
        content: 'left content',
        nullContent: null,
        expected: 'left content',
        expectedNull: undefined,
      },
      {
        side: 'right' as const,
        content: 'right content',
        nullContent: null,
        expected: 'right content',
        expectedNull: undefined,
      },
    ]

    testCases.forEach(({ side, content, nullContent, expected, expectedNull }) => {
      it(`returns ${expected} when ${side} side has content`, () => {
        const line = createMockDiffLineViewModel({
          [`content${side.charAt(0).toUpperCase() + side.slice(1)}`]: content,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getContent(side)).toBe(expected)
      })

      it(`returns ${expectedNull} when ${side} side content is null`, () => {
        const line = createMockDiffLineViewModel({
          [`content${side.charAt(0).toUpperCase() + side.slice(1)}`]: nullContent,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getContent(side)).toBe(expectedNull)
      })
    })

    describe('unified view (no side parameter)', () => {
      it('returns left content when no side specified', () => {
        const line = createMockDiffLineViewModel({
          contentLeft: 'left content',
          contentRight: 'right content',
        })
        const row = createDiffRowViewModel(line)
        expect(row.getContent()).toBe('left content')
      })

      it('returns undefined when left content is null in unified view', () => {
        const line = createMockDiffLineViewModel({
          contentLeft: null,
          contentRight: 'right content',
        })
        const row = createDiffRowViewModel(line)
        expect(row.getContent()).toBeUndefined()
      })
    })
  })

  describe('language property', () => {
    it('returns the language from the underlying line', () => {
      const line = createMockDiffLineViewModel({ language: 'javascript' })
      const row = createDiffRowViewModel(line)
      expect(row.getLanguage()).toBe('javascript')
    })
  })

  describe('line type property', () => {
    it('returns the correct line type for left side', () => {
      const line = createMockDiffLineViewModel({ typeLeft: 'delete' })
      const row = createDiffRowViewModel(line)
      expect(row.getLineType('left')).toBe('delete')
    })

    it('returns the correct line type for right side', () => {
      const line = createMockDiffLineViewModel({ typeRight: 'add' })
      const row = createDiffRowViewModel(line)
      expect(row.getLineType('right')).toBe('add')
    })

    it('returns context as default when type is null', () => {
      const line = createMockDiffLineViewModel({ typeLeft: null, typeRight: null })
      const row = createDiffRowViewModel(line)
      expect(row.getLineType('left')).toBe('context')
      expect(row.getLineType('right')).toBe('context')
    })

    it('returns left type for unified view (no side parameter)', () => {
      const line = createMockDiffLineViewModel({ typeLeft: 'context' })
      const row = createDiffRowViewModel(line)
      expect(row.getLineType()).toBe('context')
    })
  })

  describe('line number property', () => {
    it('returns the correct line number for left side', () => {
      const line = createMockDiffLineViewModel({ lineNumberLeft: 5 })
      const row = createDiffRowViewModel(line)
      expect(row.getLineNumber('left')).toBe(5)
    })

    it('returns the correct line number for right side', () => {
      const line = createMockDiffLineViewModel({ lineNumberRight: 10 })
      const row = createDiffRowViewModel(line)
      expect(row.getLineNumber('right')).toBe(10)
    })

    it('returns null when line number is null', () => {
      const line = createMockDiffLineViewModel({ lineNumberLeft: null, lineNumberRight: null })
      const row = createDiffRowViewModel(line)
      expect(row.getLineNumber('left')).toBeNull()
      expect(row.getLineNumber('right')).toBeNull()
    })

    it('returns left line number for unified view (no side parameter)', () => {
      const line = createMockDiffLineViewModel({ lineNumberLeft: 3 })
      const row = createDiffRowViewModel(line)
      expect(row.getLineNumber()).toBe(3)
    })
  })

  describe('widgets', () => {
    it('returns empty arrays when no widgets present', () => {
      const line = createMockDiffLineViewModel()
      const row = new Row(line, [])
      expect(row.topWidgets).toEqual([])
      expect(row.bottomWidgets).toEqual([])
    })

    it('filters widgets by position and line number', () => {
      const line = createMockDiffLineViewModel({ lineNumberLeft: 5, lineNumberRight: 6 })
      const widgets = [
        { content: 'Top Left', line: 5, position: 'top' as const, filepath: 'test.ts', side: 'left' as const },
        { content: 'Bottom Right', line: 6, position: 'bottom' as const, filepath: 'test.ts', side: 'right' as const },
        { content: 'Top Right', line: 6, position: 'top' as const, filepath: 'test.ts', side: 'right' as const },
      ]
      const row = new Row(line, widgets)

      expect(row.topWidgets).toHaveLength(2)
      expect(row.bottomWidgets).toHaveLength(1)
    })
  })

  describe('raw line access', () => {
    it('returns the underlying line instance', () => {
      const line = createMockDiffLineViewModel()
      const row = createDiffRowViewModel(line)
      expect(row.rawLine).toBe(line)
    })
  })
})
