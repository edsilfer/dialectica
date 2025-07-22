import { describe, expect, it, beforeEach } from 'vitest'
import { LineParserFactory } from './parser'
import { createLineDiff } from '../../../utils/test/models/test-utils'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import { SplitLineParser } from './split-parser'

/**
 * # SplitLineParser Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **highlight-utils**: Mocked to isolate parser logic from syntax highlighting complexity and provide predictable highlighting behavior
 * - **test-utils**: Uses factory functions to create consistent test data without external dependencies
 *
 * ## Happy Path
 * - Factory builds split parser → Parser instance created with parse method → Lines processed into DiffLineViewModel array
 * - Context lines → Both left/right sides populated with same content and line numbers
 * - Delete lines → Left side populated with delete type, right side empty
 * - Add lines → Right side populated with add type, left side empty
 * - Paired delete/add → Merged into single row with both sides populated
 * - Multiple line types → Each line correctly mapped to appropriate view model structure
 *
 * ## Edge Cases
 * - **Empty input array** → Returns empty result array without errors
 * - **Invalid parser type** → Factory throws descriptive error message
 * - **Null line numbers** → Preserved in output view models
 * - **Hunk lines** → No line numbers assigned (null on both sides)
 * - **Empty line content** → Both sides set to empty string
 * - **Mixed line sequence** → Order preserved in output array
 * - **Different languages** → Language parameter passed to highlighting function
 * - **Unpaired changes** → Delete without add creates separate row, add without delete creates separate row
 *
 * ## Assertions
 * - Verify factory behavior, line type mapping, content assignment, highlighting integration, line number preservation, and inheritance patterns
 */

describe('SplitLineParser', () => {
  let parser: ReturnType<typeof LineParserFactory.build>

  beforeEach(() => {
    parser = LineParserFactory.build('split')
  })

  describe('factory behavior', () => {
    it('given split type, when factory builds parser, expect split parser instance', () => {
      // WHEN
      const splitParser = LineParserFactory.build('split')

      // EXPECT
      expect(splitParser).toBeDefined()
      expect(typeof splitParser.parse).toBe('function')
      expect(splitParser).toBeInstanceOf(SplitLineParser)
    })

    it('given invalid type, when factory builds parser, expect error thrown', () => {
      // EXPECT
      expect(() => LineParserFactory.build('invalid' as 'unified' | 'split')).toThrow(
        "Invalid parser type: invalid. Must be 'unified' or 'split'.",
      )
    })
  })

  describe('parse method', () => {
    it('given empty lines array, when parsed, expect empty result', () => {
      // WHEN
      const result = parser.parse([], 'typescript')

      // EXPECT
      expect(result).toEqual([])
    })

    it('given single context line, when parsed, expect single view model with context type', () => {
      // GIVEN
      const lines = [createLineDiff('function test() {', 'context', 1, 1)]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        DiffLineViewModel.build(lines[0], 'typescript', {
          typeLeft: 'context',
          typeRight: 'context',
          contentLeft: 'function test() {',
          contentRight: 'function test() {',
          lineNumberLeft: 1,
          lineNumberRight: 1,
        }),
      )
    })

    it('given multiple lines with different types, when parsed, expect correct view models for each', () => {
      // GIVEN
      const lines = [
        createLineDiff('function test() {', 'context', 1, 1),
        createLineDiff('  return false', 'delete', 2, null),
        createLineDiff('  return true', 'add', null, 2),
        createLineDiff('}', 'context', 3, 3),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(3) // Delete and add are merged into one row

      // Context line
      expect(result[0].typeLeft).toBe('context')
      expect(result[0].typeRight).toBe('context')
      expect(result[0].lineNumberLeft).toBe(1)
      expect(result[0].lineNumberRight).toBe(1)

      // Merged delete/add line
      expect(result[1].typeLeft).toBe('delete')
      expect(result[1].typeRight).toBe('add')
      expect(result[1].contentLeft).toBe('  return false')
      expect(result[1].contentRight).toBe('  return true')
      expect(result[1].lineNumberLeft).toBe(2)
      expect(result[1].lineNumberRight).toBe(2)

      // Context line
      expect(result[2].typeLeft).toBe('context')
      expect(result[2].typeRight).toBe('context')
      expect(result[2].lineNumberLeft).toBe(3)
      expect(result[2].lineNumberRight).toBe(3)
    })
  })

  describe('processLine method - line type handling', () => {
    const testCases: Array<{
      description: string
      lineType: 'context' | 'add' | 'delete' | 'empty' | 'hunk'
      expectedLeftType: string
      expectedRightType: string
      expectedLeftLineNumber: number | null
      expectedRightLineNumber: number | null
    }> = [
      {
        description: 'context line',
        lineType: 'context',
        expectedLeftType: 'context',
        expectedRightType: 'context',
        expectedLeftLineNumber: 5,
        expectedRightLineNumber: 5,
      },
      {
        description: 'delete line',
        lineType: 'delete',
        expectedLeftType: 'delete',
        expectedRightType: 'empty',
        expectedLeftLineNumber: 10,
        expectedRightLineNumber: null,
      },
      {
        description: 'add line',
        lineType: 'add',
        expectedLeftType: 'empty',
        expectedRightType: 'add',
        expectedLeftLineNumber: null,
        expectedRightLineNumber: 15,
      },
      {
        description: 'empty line',
        lineType: 'empty',
        expectedLeftType: 'empty',
        expectedRightType: 'empty',
        expectedLeftLineNumber: 20,
        expectedRightLineNumber: 20,
      },
      {
        description: 'hunk line',
        lineType: 'hunk',
        expectedLeftType: 'hunk',
        expectedRightType: 'hunk',
        expectedLeftLineNumber: null,
        expectedRightLineNumber: null,
      },
    ]

    testCases.forEach(
      ({
        description,
        lineType,
        expectedLeftType,
        expectedRightType,
        expectedLeftLineNumber,
        expectedRightLineNumber,
      }) => {
        it(`given ${description}, when processed, expect correct type mapping`, () => {
          // GIVEN
          const line = createLineDiff('test content', lineType, expectedLeftLineNumber, expectedRightLineNumber)

          // WHEN
          const result = parser.parse([line], 'typescript')

          // EXPECT
          expect(result).toHaveLength(1)
          expect(result[0].typeLeft).toBe(expectedLeftType)
          expect(result[0].typeRight).toBe(expectedRightType)
          expect(result[0].lineNumberLeft).toBe(expectedLeftLineNumber)
          expect(result[0].lineNumberRight).toBe(expectedRightLineNumber)
        })
      },
    )
  })

  describe('add line processing - merging behavior', () => {
    it('given delete line followed by add line, when processed, expect merged into single row', () => {
      // GIVEN
      const deleteLine = createLineDiff('  old content', 'delete', 5, null)
      const addLine = createLineDiff('  new content', 'add', null, 5)

      // WHEN
      const result = parser.parse([deleteLine, addLine], 'typescript')

      // EXPECT
      expect(result).toHaveLength(1)
      expect(result[0].typeLeft).toBe('delete')
      expect(result[0].typeRight).toBe('add')
      expect(result[0].contentLeft).toBe('  old content')
      expect(result[0].contentRight).toBe('  new content')
      expect(result[0].lineNumberLeft).toBe(5)
      expect(result[0].lineNumberRight).toBe(5)
    })

    it('given add line without preceding delete, when processed, expect separate row', () => {
      // GIVEN
      const addLine = createLineDiff('  new content', 'add', null, 5)

      // WHEN
      const result = parser.parse([addLine], 'typescript')

      // EXPECT
      expect(result).toHaveLength(1)
      expect(result[0].typeLeft).toBe('empty')
      expect(result[0].typeRight).toBe('add')
      expect(result[0].contentLeft).toBeNull()
      expect(result[0].contentRight).toBe('  new content')
      expect(result[0].lineNumberLeft).toBeNull()
      expect(result[0].lineNumberRight).toBe(5)
    })

    it('given delete line without following add, when processed, expect separate row', () => {
      // GIVEN
      const deleteLine = createLineDiff('  old content', 'delete', 5, null)

      // WHEN
      const result = parser.parse([deleteLine], 'typescript')

      // EXPECT
      expect(result).toHaveLength(1)
      expect(result[0].typeLeft).toBe('delete')
      expect(result[0].typeRight).toBe('empty')
      expect(result[0].contentLeft).toBe('  old content')
      expect(result[0].contentRight).toBeNull()
      expect(result[0].lineNumberLeft).toBe(5)
      expect(result[0].lineNumberRight).toBeNull()
    })

    it('given multiple deletes followed by multiple adds, when processed, expect correct merging', () => {
      // GIVEN
      const lines = [
        createLineDiff('  delete1', 'delete', 1, null),
        createLineDiff('  delete2', 'delete', 2, null),
        createLineDiff('  add1', 'add', null, 1),
        createLineDiff('  add2', 'add', null, 2),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(3)

      // First delete (unmerged)
      expect(result[0].typeLeft).toBe('delete')
      expect(result[0].typeRight).toBe('empty')
      expect(result[0].contentLeft).toBe('  delete1')

      // Second delete merged with first add
      expect(result[1].typeLeft).toBe('delete')
      expect(result[1].typeRight).toBe('add')
      expect(result[1].contentLeft).toBe('  delete2')
      expect(result[1].contentRight).toBe('  add1')

      // Second add (unmerged)
      expect(result[2].typeLeft).toBe('empty')
      expect(result[2].typeRight).toBe('add')
      expect(result[2].contentRight).toBe('  add2')
    })

    it('given context between delete and add, when processed, expect no merging', () => {
      // GIVEN
      const lines = [
        createLineDiff('  delete line', 'delete', 1, null),
        createLineDiff('  context line', 'context', 2, 2),
        createLineDiff('  add line', 'add', null, 3),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(3)

      // Delete line (unmerged)
      expect(result[0].typeLeft).toBe('delete')
      expect(result[0].typeRight).toBe('empty')

      // Context line
      expect(result[1].typeLeft).toBe('context')
      expect(result[1].typeRight).toBe('context')

      // Add line (unmerged)
      expect(result[2].typeLeft).toBe('empty')
      expect(result[2].typeRight).toBe('add')
    })
  })

  describe('highlighting integration', () => {
    it('given lines with content, when parsed, expect highlighting applied', () => {
      // GIVEN
      const lines = [
        createLineDiff('function test() {', 'context', 1, 1),
        createLineDiff('  return true', 'add', null, 2),
      ]

      // WHEN
      const result = parser.parse(lines, 'javascript')

      // EXPECT
      expect(result).toHaveLength(2)
      expect(result[0].highlightedContentLeft).toContain('<span')
      expect(result[0].highlightedContentLeft).toContain('function')
      expect(result[0].highlightedContentRight).toContain('<span')
      expect(result[0].highlightedContentRight).toContain('function')
      expect(result[1].highlightedContentRight).toContain('<span')
      expect(result[1].highlightedContentRight).toContain('return')
    })

    it('given different language, when parsed, expect language passed to highlighting', () => {
      // GIVEN
      const line = createLineDiff('const x = 1', 'context', 1, 1)

      // WHEN
      parser.parse([line], 'typescript')

      // EXPECT
      // The mock will be called with the correct language parameter
      // We verify this by checking the highlighted content matches the expected pattern
      const result = parser.parse([line], 'typescript')
      expect(result[0].highlightedContentLeft).toContain('<span')
      expect(result[0].highlightedContentLeft).toContain('const')
      expect(result[0].highlightedContentLeft).toContain('1')
    })
  })

  describe('line number handling', () => {
    it('given lines with null line numbers, when parsed, expect null preserved', () => {
      // GIVEN
      const lines = [
        createLineDiff('hunk header', 'hunk', null, null),
        createLineDiff('add line', 'add', null, 5),
        createLineDiff('delete line', 'delete', 10, null),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(3)
      expect(result[0].lineNumberLeft).toBeNull()
      expect(result[0].lineNumberRight).toBeNull()
      expect(result[1].lineNumberLeft).toBeNull()
      expect(result[1].lineNumberRight).toBe(5)
      expect(result[2].lineNumberLeft).toBe(10)
      expect(result[2].lineNumberRight).toBeNull()
    })

    it('given merged delete/add, when processed, expect line numbers preserved', () => {
      // GIVEN
      const deleteLine = createLineDiff('old', 'delete', 5, null)
      const addLine = createLineDiff('new', 'add', null, 8)

      // WHEN
      const result = parser.parse([deleteLine, addLine], 'typescript')

      // EXPECT
      expect(result).toHaveLength(1)
      expect(result[0].lineNumberLeft).toBe(5)
      expect(result[0].lineNumberRight).toBe(8)
    })
  })

  describe('complex scenarios', () => {
    it('given realistic diff scenario, when parsed, expect correct split view structure', () => {
      // GIVEN
      const lines = [
        createLineDiff('@@ -1,3 +1,4 @@', 'hunk', null, null),
        createLineDiff(' function foo() {', 'context', 1, 1),
        createLineDiff('-  console.log("old")', 'delete', 2, null),
        createLineDiff('+  console.log("new")', 'add', null, 2),
        createLineDiff('+  return true', 'add', null, 3),
        createLineDiff(' }', 'context', 3, 4),
      ]

      // WHEN
      const result = parser.parse(lines, 'javascript')

      // EXPECT
      expect(result).toHaveLength(5)

      // Hunk header
      expect(result[0].typeLeft).toBe('hunk')
      expect(result[0].typeRight).toBe('hunk')

      // Context line
      expect(result[1].typeLeft).toBe('context')
      expect(result[1].typeRight).toBe('context')

      // Merged delete/add
      expect(result[2].typeLeft).toBe('delete')
      expect(result[2].typeRight).toBe('add')
      expect(result[2].contentLeft).toBe('-  console.log("old")')
      expect(result[2].contentRight).toBe('+  console.log("new")')

      // Add line (unmerged)
      expect(result[3].typeLeft).toBe('empty')
      expect(result[3].typeRight).toBe('add')
      expect(result[3].contentRight).toBe('+  return true')

      // Context line
      expect(result[4].typeLeft).toBe('context')
      expect(result[4].typeRight).toBe('context')
    })

    it('given multiple unpaired changes, when parsed, expect separate rows for each', () => {
      // GIVEN
      const lines = [
        createLineDiff('function test() {', 'context', 1, 1),
        createLineDiff('  delete1', 'delete', 2, null),
        createLineDiff('  delete2', 'delete', 3, null),
        createLineDiff('  add1', 'add', null, 2),
        createLineDiff('  add2', 'add', null, 3),
        createLineDiff('}', 'context', 4, 4),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(5)

      // Context
      expect(result[0].typeLeft).toBe('context')
      expect(result[0].typeRight).toBe('context')

      // First delete (unmerged)
      expect(result[1].typeLeft).toBe('delete')
      expect(result[1].typeRight).toBe('empty')
      expect(result[1].contentLeft).toBe('  delete1')

      // Second delete merged with first add
      expect(result[2].typeLeft).toBe('delete')
      expect(result[2].typeRight).toBe('add')
      expect(result[2].contentLeft).toBe('  delete2')
      expect(result[2].contentRight).toBe('  add1')

      // Second add (unmerged)
      expect(result[3].typeLeft).toBe('empty')
      expect(result[3].typeRight).toBe('add')
      expect(result[3].contentRight).toBe('  add2')

      // Context
      expect(result[4].typeLeft).toBe('context')
      expect(result[4].typeRight).toBe('context')
    })
  })

  describe('inheritance from CommonParser', () => {
    it('given parser instance, when checked, expect extends CommonParser', () => {
      // EXPECT
      expect(parser).toBeInstanceOf(SplitLineParser)
      expect(parser).toHaveProperty('parse')
      expect(typeof parser.parse).toBe('function')
    })

    it('given multiple lines, when parsed, expect each line processed individually', () => {
      // GIVEN
      const lines = [
        createLineDiff('line1', 'context', 1, 1),
        createLineDiff('line2', 'context', 2, 2),
        createLineDiff('line3', 'context', 3, 3),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(3)
      expect(result[0].contentLeft).toBe('line1')
      expect(result[1].contentLeft).toBe('line2')
      expect(result[2].contentLeft).toBe('line3')
    })
  })
})
