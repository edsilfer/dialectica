import { describe, expect, it } from 'vitest'
import type { DiffLineType } from '../../../models/LineDiff'
import type { Widget } from '../../diff-viewer/types'
import { DiffLineViewModel } from './DiffLineViewModel'
import { DiffRowViewModel } from './DiffRowViewModel'

/**
 * # DiffRowViewModel Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **DiffLineViewModel**: Mocked to isolate row logic from complex line processing and provide predictable input data
 * - **Widget**: Mocked to test widget filtering logic without external widget dependencies
 * - **DiffLineType**: Type imports mocked to test line type handling without enum complexity
 *
 * ## Happy Path
 * - Row created with valid line and widgets → Properties correctly extracted and exposed
 * - Split view with side parameter → All properties work consistently across left/right sides
 * - Unified view without side parameter → Defaults to left side content (unified view only populates left side)
 * - Widgets provided with matching line numbers and sides → Filtered correctly by position (top/bottom)
 *
 * ## Edge Cases
 * - **Edge Case 01:** Null content → Returns '&nbsp;' for display purposes
 * - **Edge Case 02:** Null line type → Falls back to 'context' type
 * - **Edge Case 03:** Null line numbers → Returns null and prevents widget filtering
 * - **Edge Case 04:** Empty widgets array → Returns empty arrays for top/bottom widgets
 * - **Edge Case 05:** Null widgets array → Gracefully handles null and returns empty arrays
 * - **Edge Case 06:** Widgets with mismatched line numbers → Excluded from filtered results
 * - **Edge Case 07:** Widgets with mismatched sides → Excluded from filtered results
 * - **Edge Case 08:** Widgets with different positions → Correctly separated into top/bottom arrays
 * - **Edge Case 09:** Unified view with null right side content → Uses left side content
 * - **Edge Case 10:** Unified view with null right side type → Uses left side type
 * - **Edge Case 11:** Unified view with null right side line number → Uses left side line number
 *
 * ## Assertions
 * - Verify method accessors return correct values for both split and unified views
 * - Verify unified view defaults to left side when no side parameter provided
 * - Verify widget filtering logic matches line numbers and sides correctly
 * - Verify null handling produces expected fallback values
 * - Verify integration scenarios with multiple widgets and sides
 */

// HELPERS
const createMockWidget = (overrides: Partial<Widget> = {}): Widget => ({
  content: 'Test Widget',
  line: 1,
  position: 'top',
  filepath: 'test.ts',
  side: 'left',
  ...overrides,
})

const createMockDiffLineViewModel = (overrides: Partial<DiffLineViewModel> = {}): DiffLineViewModel => {
  const defaultLine = new DiffLineViewModel(
    'context',
    'left content',
    '<highlighted>left content</highlighted>',
    1,
    'add',
    'right content',
    '<highlighted>right content</highlighted>',
    2,
  )
  return Object.assign(defaultLine, overrides)
}

const createDiffRowViewModel = (line: DiffLineViewModel, widgets: Widget[] = []): DiffRowViewModel =>
  new DiffRowViewModel(line, widgets)

describe('DiffRowViewModel', () => {
  describe('content property', () => {
    const testCases = [
      {
        side: 'left' as const,
        content: '<highlighted>left content</highlighted>',
        nullContent: null,
        expected: '<highlighted>left content</highlighted>',
        expectedNull: '&nbsp;',
      },
      {
        side: 'right' as const,
        content: '<highlighted>right content</highlighted>',
        nullContent: null,
        expected: '<highlighted>right content</highlighted>',
        expectedNull: '&nbsp;',
      },
    ]

    testCases.forEach(({ side, content, nullContent, expected, expectedNull }) => {
      it(`returns ${expected} when ${side} side has content`, () => {
        const line = createMockDiffLineViewModel({
          [`highlightedContent${side.charAt(0).toUpperCase() + side.slice(1)}`]: content,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getContent(side)).toBe(expected)
      })

      it(`returns ${expectedNull} when ${side} side content is null`, () => {
        const line = createMockDiffLineViewModel({
          [`highlightedContent${side.charAt(0).toUpperCase() + side.slice(1)}`]: nullContent,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getContent(side)).toBe(expectedNull)
      })
    })

    describe('unified view (no side parameter)', () => {
      it('returns left content when no side specified', () => {
        const line = createMockDiffLineViewModel({
          highlightedContentLeft: '<highlighted>left content</highlighted>',
          highlightedContentRight: '<highlighted>right content</highlighted>',
        })
        const row = createDiffRowViewModel(line)
        expect(row.getContent()).toBe('<highlighted>left content</highlighted>')
      })

      it('returns &nbsp; when left content is null in unified view', () => {
        const line = createMockDiffLineViewModel({
          highlightedContentLeft: null,
          highlightedContentRight: '<highlighted>right content</highlighted>',
        })
        const row = createDiffRowViewModel(line)
        expect(row.getContent()).toBe('&nbsp;')
      })
    })
  })

  describe('lineType property', () => {
    const testCases = [
      {
        side: 'left' as const,
        type: 'delete' as DiffLineType,
        nullType: null,
        expected: 'delete',
        expectedNull: 'context',
      },
      {
        side: 'right' as const,
        type: 'add' as DiffLineType,
        nullType: null,
        expected: 'add',
        expectedNull: 'context',
      },
    ]

    testCases.forEach(({ side, type, nullType, expected, expectedNull }) => {
      it(`returns ${expected} when ${side} side has type`, () => {
        const line = createMockDiffLineViewModel({
          [`type${side.charAt(0).toUpperCase() + side.slice(1)}`]: type,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getLineType(side)).toBe(expected)
      })

      it(`returns ${expectedNull} when ${side} side type is null`, () => {
        const line = createMockDiffLineViewModel({
          [`type${side.charAt(0).toUpperCase() + side.slice(1)}`]: nullType,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getLineType(side)).toBe(expectedNull)
      })
    })

    describe('unified view (no side parameter)', () => {
      it('returns left type when no side specified', () => {
        const line = createMockDiffLineViewModel({
          typeLeft: 'delete',
          typeRight: 'add',
        })
        const row = createDiffRowViewModel(line)
        expect(row.getLineType()).toBe('delete')
      })

      it('returns context when left type is null in unified view', () => {
        const line = createMockDiffLineViewModel({
          typeLeft: null,
          typeRight: 'add',
        })
        const row = createDiffRowViewModel(line)
        expect(row.getLineType()).toBe('context')
      })
    })
  })

  describe('lineNumber property', () => {
    const testCases = [
      {
        side: 'left' as const,
        lineNumber: 42,
        nullLineNumber: null,
        expected: 42,
        expectedNull: null,
      },
      {
        side: 'right' as const,
        lineNumber: 99,
        nullLineNumber: null,
        expected: 99,
        expectedNull: null,
      },
    ]

    testCases.forEach(({ side, lineNumber, nullLineNumber, expected, expectedNull }) => {
      it(`returns ${expected} when ${side} side has line number`, () => {
        const line = createMockDiffLineViewModel({
          [`lineNumber${side.charAt(0).toUpperCase() + side.slice(1)}`]: lineNumber,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getLineNumber(side)).toBe(expected)
      })

      it(`returns ${expectedNull} when ${side} side line number is null`, () => {
        const line = createMockDiffLineViewModel({
          [`lineNumber${side.charAt(0).toUpperCase() + side.slice(1)}`]: nullLineNumber,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getLineNumber(side)).toBe(expectedNull)
      })
    })

    describe('unified view (no side parameter)', () => {
      it('returns left line number when no side specified', () => {
        const line = createMockDiffLineViewModel({
          lineNumberLeft: 42,
          lineNumberRight: 99,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getLineNumber()).toBe(42)
      })

      it('returns null when left line number is null in unified view', () => {
        const line = createMockDiffLineViewModel({
          lineNumberLeft: null,
          lineNumberRight: 99,
        })
        const row = createDiffRowViewModel(line)
        expect(row.getLineNumber()).toBe(null)
      })
    })
  })

  describe('rawLine property', () => {
    it('returns the original line instance', () => {
      const line = createMockDiffLineViewModel()
      const row = createDiffRowViewModel(line)
      expect(row.rawLine).toBe(line)
    })
  })

  describe('widget filtering', () => {
    const positions = ['top', 'bottom'] as const

    positions.forEach((position) => {
      describe(`${position}Widgets property`, () => {
        it(`returns widgets with ${position} position and matching line number`, () => {
          const line = createMockDiffLineViewModel({ lineNumberLeft: 5, lineNumberRight: 7 })
          const matchingWidget = createMockWidget({ line: 5, position, side: 'left' })
          const otherWidget = createMockWidget({
            line: 5,
            position: position === 'top' ? 'bottom' : 'top',
            side: 'left',
          })
          const row = createDiffRowViewModel(line, [matchingWidget, otherWidget])

          const result = row[`${position}Widgets`]
          expect(result).toEqual([matchingWidget])
        })

        it(`returns empty array when widgets have ${position} position but mismatched line number`, () => {
          const line = createMockDiffLineViewModel({ lineNumberLeft: 5 })
          const widget = createMockWidget({ line: 10, position, side: 'left' })
          const row = createDiffRowViewModel(line, [widget])

          const result = row[`${position}Widgets`]
          expect(result).toEqual([])
        })

        it(`returns empty array when widgets have ${position} position but mismatched side`, () => {
          const line = createMockDiffLineViewModel({ lineNumberLeft: 5 })
          const widget = createMockWidget({ line: 5, position, side: 'right' })
          const row = createDiffRowViewModel(line, [widget])

          const result = row[`${position}Widgets`]
          expect(result).toEqual([])
        })

        it('returns empty array when no widgets provided', () => {
          const line = createMockDiffLineViewModel()
          const row = createDiffRowViewModel(line, [])

          const result = row[`${position}Widgets`]
          expect(result).toEqual([])
        })

        it('returns empty array when widgets array is null', () => {
          const line = createMockDiffLineViewModel()
          const row = createDiffRowViewModel(line, null as unknown as Widget[])

          const result = row[`${position}Widgets`]
          expect(result).toEqual([])
        })
      })
    })

    describe('widget filtering integration', () => {
      it('correctly filters widgets based on line numbers and sides', () => {
        const line = createMockDiffLineViewModel({ lineNumberLeft: 10, lineNumberRight: 12 })
        const leftTopWidget = createMockWidget({ line: 10, position: 'top', side: 'left' })
        const leftBottomWidget = createMockWidget({ line: 10, position: 'bottom', side: 'left' })
        const rightTopWidget = createMockWidget({ line: 12, position: 'top', side: 'right' })
        const rightBottomWidget = createMockWidget({ line: 12, position: 'bottom', side: 'right' })
        const mismatchedWidget = createMockWidget({ line: 99, position: 'top', side: 'left' })

        const allWidgets = [leftTopWidget, leftBottomWidget, rightTopWidget, rightBottomWidget, mismatchedWidget]

        const leftRow = createDiffRowViewModel(line, allWidgets)
        const rightRow = createDiffRowViewModel(line, allWidgets)

        // Both rows return the same widgets since they have the same line numbers
        expect(leftRow.topWidgets).toEqual([leftTopWidget, rightTopWidget])
        expect(leftRow.bottomWidgets).toEqual([leftBottomWidget, rightBottomWidget])
        expect(rightRow.topWidgets).toEqual([leftTopWidget, rightTopWidget])
        expect(rightRow.bottomWidgets).toEqual([leftBottomWidget, rightBottomWidget])
      })

      it('returns empty arrays when line numbers are null', () => {
        const line = createMockDiffLineViewModel({ lineNumberLeft: null, lineNumberRight: null })
        const widget = createMockWidget({ line: 1, side: 'left' })
        const row = createDiffRowViewModel(line, [widget])

        expect(row.topWidgets).toEqual([])
        expect(row.bottomWidgets).toEqual([])
      })

      it('handles unified view with null right line number correctly', () => {
        const line = createMockDiffLineViewModel({ lineNumberLeft: 10, lineNumberRight: null })
        const leftWidget = createMockWidget({ line: 10, position: 'top', side: 'left' })
        const rightWidget = createMockWidget({ line: 12, position: 'top', side: 'right' })
        const row = createDiffRowViewModel(line, [leftWidget, rightWidget])

        // Only left widget should match since right line number is null
        expect(row.topWidgets).toEqual([leftWidget])
        expect(row.bottomWidgets).toEqual([])
      })
    })
  })
})
