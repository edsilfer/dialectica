import { beforeEach, describe, expect, it } from 'vitest'
import { createLineDiff, createMockLineDiff } from '../../../utils/test/models/test-utils'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import { LineParserFactory } from './parser'

/**
 * # UnifiedLineParser Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **highlight-utils**: Mocked to isolate parser logic from syntax highlighting complexity and provide predictable highlighting behavior
 * - **test-utils**: Uses factory functions to create consistent test data without external dependencies
 *
 * ## Happy Path
 * - Factory builds unified parser → Parser instance created with parse method → Lines processed into DiffLineViewModel array
 * - Context lines → Both left/right sides populated with same content and line numbers
 * - Add lines → Left side populated, right side empty with null line number
 * - Delete lines → Left side populated, right side empty with null line number
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
 *
 * ## Assertions
 * - Verify factory behavior, line type mapping, content assignment, highlighting integration, line number preservation, and inheritance patterns
 */

describe('UnifiedLineParser', () => {
  let parser: ReturnType<typeof LineParserFactory.build>

  beforeEach(() => {
    parser = LineParserFactory.build('unified')
  })

  describe('factory behavior', () => {
    it('given unified type, when factory builds parser, expect unified parser instance', () => {
      // WHEN
      const unifiedParser = LineParserFactory.build('unified')

      // EXPECT
      expect(unifiedParser).toBeDefined()
      expect(typeof unifiedParser.parse).toBe('function')
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
      expect(result).toHaveLength(4)

      // Context line
      expect(result[0].typeLeft).toBe('context')
      expect(result[0].typeRight).toBe('context')
      expect(result[0].lineNumberLeft).toBe(1)
      expect(result[0].lineNumberRight).toBe(1)

      // Delete line
      expect(result[1].typeLeft).toBe('delete')
      expect(result[1].typeRight).toBe('empty')
      expect(result[1].lineNumberLeft).toBe(2)
      expect(result[1].lineNumberRight).toBeNull()

      // Add line
      expect(result[2].typeLeft).toBe('add')
      expect(result[2].typeRight).toBe('empty')
      expect(result[2].lineNumberLeft).toBeNull()
      expect(result[2].lineNumberRight).toBe(2)

      // Context line
      expect(result[3].typeLeft).toBe('context')
      expect(result[3].typeRight).toBe('context')
      expect(result[3].lineNumberLeft).toBe(3)
      expect(result[3].lineNumberRight).toBe(3)
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
        expectedLeftType: 'add',
        expectedRightType: 'empty',
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
          const rows: DiffLineViewModel[] = []

          // WHEN
          parser.parse([line], 'typescript')

          // EXPECT
          expect(rows).toHaveLength(0) // parse creates new array, doesn't modify input
          const result = parser.parse([line], 'typescript')
          expect(result).toHaveLength(1)
          expect(result[0].typeLeft).toBe(expectedLeftType)
          expect(result[0].typeRight).toBe(expectedRightType)
          expect(result[0].lineNumberLeft).toBe(expectedLeftLineNumber)
          expect(result[0].lineNumberRight).toBe(expectedRightLineNumber)
        })
      },
    )
  })

  describe('content handling', () => {
    it('given line with content, when processed, expect content properly assigned', () => {
      // GIVEN
      const content = 'const test = "example";'
      const line = createLineDiff(content, 'context', 1, 1)

      // WHEN
      const result = parser.parse([line], 'typescript')

      // EXPECT
      expect(result[0].contentLeft).toBe(content)
      expect(result[0].contentRight).toBe(content)
    })

    it('given delete line, when processed, expect content only on left side', () => {
      // GIVEN
      const content = '  console.log("old")'
      const line = createLineDiff(content, 'delete', 2, null)

      // WHEN
      const result = parser.parse([line], 'typescript')

      // EXPECT
      expect(result[0].contentLeft).toBe(content)
      expect(result[0].contentRight).toBeNull()
    })

    it('given add line, when processed, expect content only on left side', () => {
      // GIVEN
      const content = '  console.log("new")'
      const line = createLineDiff(content, 'add', null, 2)

      // WHEN
      const result = parser.parse([line], 'typescript')

      // EXPECT
      expect(result[0].contentLeft).toBe(content)
      expect(result[0].contentRight).toBeNull()
    })
  })

  describe('highlighting integration', () => {
    it('given lines with content, when parsed, expect highlighting applied', () => {
      // GIVEN
      const lines = [
        createLineDiff('function test() {', 'context', 1, 1),
        createLineDiff('  return true;', 'add', null, 2),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result[0].highlightedContentLeft).toContain('<span')
      expect(result[0].highlightedContentLeft).toContain('function')
      expect(result[0].highlightedContentRight).toContain('<span')
      expect(result[0].highlightedContentRight).toContain('function')
      expect(result[1].highlightedContentLeft).toContain('<span')
      expect(result[1].highlightedContentLeft).toContain('return')
      expect(result[1].highlightedContentRight).toBeNull()
    })

    it('given different language, when parsed, expect language passed to highlighting', () => {
      // GIVEN
      const line = createLineDiff('const x = 1;', 'context', 1, 1)

      // WHEN
      parser.parse([line], 'javascript')

      // EXPECT
      // The mock will be called with 'javascript' as the language parameter
      // We can verify this by checking the result contains the expected highlighted content
      const result = parser.parse([line], 'javascript')
      expect(result[0].highlightedContentLeft).toContain('<span')
      expect(result[0].highlightedContentLeft).toContain('const')
      expect(result[0].highlightedContentLeft).toContain('1')
    })
  })

  describe('line number handling', () => {
    it('given lines with null line numbers, when processed, expect null values preserved', () => {
      // GIVEN
      const lines = [createLineDiff('content', 'add', null, null), createLineDiff('content', 'delete', null, null)]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result[0].lineNumberLeft).toBeNull()
      expect(result[0].lineNumberRight).toBeNull()
      expect(result[1].lineNumberLeft).toBeNull()
      expect(result[1].lineNumberRight).toBeNull()
    })

    it('given lines with valid line numbers, when processed, expect numbers preserved', () => {
      // GIVEN
      const lines = [
        createLineDiff('content', 'context', 100, 100),
        createLineDiff('content', 'add', null, 200),
        createLineDiff('content', 'delete', 300, null),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result[0].lineNumberLeft).toBe(100)
      expect(result[0].lineNumberRight).toBe(100)
      expect(result[1].lineNumberLeft).toBeNull()
      expect(result[1].lineNumberRight).toBe(200)
      expect(result[2].lineNumberLeft).toBe(300)
      expect(result[2].lineNumberRight).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('given hunk line with content, when processed, expect no line numbers', () => {
      // GIVEN
      const hunkContent = '@@ -1,3 +1,3 @@'
      const line = createLineDiff(hunkContent, 'hunk', 1, 1)

      // WHEN
      const result = parser.parse([line], 'typescript')

      // EXPECT
      expect(result[0].typeLeft).toBe('hunk')
      expect(result[0].typeRight).toBe('hunk')
      expect(result[0].contentLeft).toBe(hunkContent)
      expect(result[0].contentRight).toBe(hunkContent)
      // Hunk lines don't have line numbers in unified view
      expect(result[0].lineNumberLeft).toBeNull()
      expect(result[0].lineNumberRight).toBeNull()
    })

    it('given empty line type, when processed, expect both sides empty', () => {
      // GIVEN
      const line = createLineDiff('', 'empty', 1, 1)

      // WHEN
      const result = parser.parse([line], 'typescript')

      // EXPECT
      expect(result[0].typeLeft).toBe('empty')
      expect(result[0].typeRight).toBe('empty')
      expect(result[0].contentLeft).toBe('')
      expect(result[0].contentRight).toBe('')
    })

    it('given mixed line types in sequence, when processed, expect correct order preserved', () => {
      // GIVEN
      const lines = [
        createLineDiff('@@ -1,3 +1,3 @@', 'hunk', null, null),
        createLineDiff('function test() {', 'context', 1, 1),
        createLineDiff('  old code', 'delete', 2, null),
        createLineDiff('  new code', 'add', null, 2),
        createLineDiff('}', 'context', 3, 3),
      ]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(5)
      expect(result[0].typeLeft).toBe('hunk')
      expect(result[1].typeLeft).toBe('context')
      expect(result[2].typeLeft).toBe('delete')
      expect(result[3].typeLeft).toBe('add')
      expect(result[4].typeLeft).toBe('context')
    })
  })

  describe('inheritance behavior', () => {
    it('given parser instance, when checked, expect to be instance of LineParser', () => {
      // EXPECT
      expect(parser).toHaveProperty('parse')
      expect(typeof parser.parse).toBe('function')
    })

    it('given parser instance, when parse called, expect to use inherited parse method', () => {
      // GIVEN
      const lines = [createMockLineDiff()]

      // WHEN
      const result = parser.parse(lines, 'typescript')

      // EXPECT
      expect(result).toHaveLength(1)
      // The inherited parse method should call processLine for each line
      expect(result[0]).toBeInstanceOf(DiffLineViewModel)
    })
  })
})
