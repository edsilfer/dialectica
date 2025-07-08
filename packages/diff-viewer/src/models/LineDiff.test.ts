import { describe, expect, it } from 'vitest'
import { LineDiff } from './LineDiff'
import type { DiffLineType } from './LineDiff'

function createRawLine(content: string, type: 'add' | 'del' | 'normal', oldLine?: number, newLine?: number) {
  return {
    content,
    type,
    oldLine,
    newLine,
  }
}

describe('LineDiff – constructor', () => {
  const testCases: Array<{
    description: string
    content: string
    type: DiffLineType
    lineNumberOld: number | null
    lineNumberNew: number | null
  }> = [
    {
      description: 'context line with both line numbers',
      content: 'function test() {',
      type: 'context',
      lineNumberOld: 10,
      lineNumberNew: 10,
    },
    {
      description: 'added line with only new line number',
      content: '  console.log("added")',
      type: 'add',
      lineNumberOld: null,
      lineNumberNew: 15,
    },
    {
      description: 'deleted line with only old line number',
      content: '  console.log("deleted")',
      type: 'delete',
      lineNumberOld: 8,
      lineNumberNew: null,
    },
    {
      description: 'empty line with no line numbers',
      content: '',
      type: 'empty',
      lineNumberOld: null,
      lineNumberNew: null,
    },
    {
      description: 'hunk header line',
      content: '@@ -1,4 +1,4 @@',
      type: 'hunk',
      lineNumberOld: null,
      lineNumberNew: null,
    },
  ]

  testCases.forEach(({ description, content, type, lineNumberOld, lineNumberNew }) => {
    it(`given ${description}, when created, expect correct properties`, () => {
      // WHEN
      const lineDiff = new LineDiff(content, type, lineNumberOld, lineNumberNew)

      // EXPECT
      expect(lineDiff.content).toBe(content)
      expect(lineDiff.type).toBe(type)
      expect(lineDiff.lineNumberOld).toBe(lineNumberOld)
      expect(lineDiff.lineNumberNew).toBe(lineNumberNew)
    })
  })

  it('given default parameters, when created, expect null line numbers', () => {
    // WHEN
    const lineDiff = new LineDiff('test content', 'context')

    // EXPECT
    expect(lineDiff.content).toBe('test content')
    expect(lineDiff.type).toBe('context')
    expect(lineDiff.lineNumberOld).toBe(null)
    expect(lineDiff.lineNumberNew).toBe(null)
  })
})

describe('LineDiff – build method', () => {
  describe('line type conversion', () => {
    const typeTestCases: Array<{
      description: string
      rawType: 'add' | 'del' | 'normal'
      expectedType: DiffLineType
    }> = [
      {
        description: 'add type',
        rawType: 'add',
        expectedType: 'add',
      },
      {
        description: 'del type',
        rawType: 'del',
        expectedType: 'delete',
      },
      {
        description: 'normal type',
        rawType: 'normal',
        expectedType: 'context',
      },
    ]

    typeTestCases.forEach(({ description, rawType, expectedType }) => {
      it(`given ${description}, when built, expect correct type mapping`, () => {
        // GIVEN
        const rawLine = createRawLine(`${rawType[0]}test content`, rawType, 5, 5)

        // WHEN
        const lineDiff = LineDiff.build(rawLine)

        // EXPECT
        expect(lineDiff.type).toBe(expectedType)
      })
    })
  })

  describe('content processing', () => {
    const contentTestCases: Array<{
      description: string
      rawContent: string
      expectedContent: string
    }> = [
      {
        description: 'addition prefix',
        rawContent: '+console.log("added")',
        expectedContent: 'console.log("added")',
      },
      {
        description: 'deletion prefix',
        rawContent: '-console.log("deleted")',
        expectedContent: 'console.log("deleted")',
      },
      {
        description: 'context prefix',
        rawContent: ' console.log("context")',
        expectedContent: 'console.log("context")',
      },
      {
        description: 'empty content with prefix',
        rawContent: ' ',
        expectedContent: '',
      },
      {
        description: 'multiple spaces prefix',
        rawContent: '   spaced content',
        expectedContent: '  spaced content',
      },
    ]

    contentTestCases.forEach(({ description, rawContent, expectedContent }) => {
      it(`given ${description}, when built, expect prefix stripped`, () => {
        // GIVEN
        const rawLine = createRawLine(rawContent, 'normal', 1, 1)

        // WHEN
        const lineDiff = LineDiff.build(rawLine)

        // EXPECT
        expect(lineDiff.content).toBe(expectedContent)
      })
    })
  })

  describe('line number handling', () => {
    it('given add line with new line number, when built, expect correct line numbers', () => {
      // GIVEN
      const rawLine = createRawLine('+new line', 'add', undefined, 42)

      // WHEN
      const lineDiff = LineDiff.build(rawLine)

      // EXPECT
      expect(lineDiff.lineNumberOld).toBe(null)
      expect(lineDiff.lineNumberNew).toBe(42)
    })

    it('given delete line with old line number, when built, expect correct line numbers', () => {
      // GIVEN
      const rawLine = createRawLine('-deleted line', 'del', 25, undefined)

      // WHEN
      const lineDiff = LineDiff.build(rawLine)

      // EXPECT
      expect(lineDiff.lineNumberOld).toBe(25)
      expect(lineDiff.lineNumberNew).toBe(null)
    })

    it('given context line with both line numbers, when built, expect correct line numbers', () => {
      // GIVEN
      const rawLine = createRawLine(' context line', 'normal', 10, 15)

      // WHEN
      const lineDiff = LineDiff.build(rawLine)

      // EXPECT
      expect(lineDiff.lineNumberOld).toBe(10)
      expect(lineDiff.lineNumberNew).toBe(15)
    })

    it('given line with undefined numbers, when built, expect null values', () => {
      // GIVEN
      const rawLine = createRawLine(' test', 'normal', undefined, undefined)

      // WHEN
      const lineDiff = LineDiff.build(rawLine)

      // EXPECT
      expect(lineDiff.lineNumberOld).toBe(null)
      expect(lineDiff.lineNumberNew).toBe(null)
    })
  })

  describe('error handling', () => {
    it('given unknown line type, when built, expect error thrown', () => {
      // GIVEN
      const rawLine = {
        content: '+test content',
        type: 'unknown' as 'add' | 'del' | 'normal',
        oldLine: 1,
        newLine: 1,
      }

      // WHEN & EXPECT
      expect(() => LineDiff.build(rawLine)).toThrow('Unknown line type encountered')
    })
  })

  describe('comprehensive scenarios', () => {
    it('given complex addition, when built, expect complete line diff', () => {
      // GIVEN
      const rawLine = createRawLine('+  return "hello world"', 'add', undefined, 100)

      // WHEN
      const lineDiff = LineDiff.build(rawLine)

      // EXPECT
      expect(lineDiff.content).toBe('  return "hello world"')
      expect(lineDiff.type).toBe('add')
      expect(lineDiff.lineNumberOld).toBe(null)
      expect(lineDiff.lineNumberNew).toBe(100)
    })

    it('given complex deletion, when built, expect complete line diff', () => {
      // GIVEN
      const rawLine = createRawLine('-  const oldValue = 42;', 'del', 50, undefined)

      // WHEN
      const lineDiff = LineDiff.build(rawLine)

      // EXPECT
      expect(lineDiff.content).toBe('  const oldValue = 42;')
      expect(lineDiff.type).toBe('delete')
      expect(lineDiff.lineNumberOld).toBe(50)
      expect(lineDiff.lineNumberNew).toBe(null)
    })

    it('given complex context, when built, expect complete line diff', () => {
      // GIVEN
      const rawLine = createRawLine(' function calculateSum(a, b) {', 'normal', 75, 80)

      // WHEN
      const lineDiff = LineDiff.build(rawLine)

      // EXPECT
      expect(lineDiff.content).toBe('function calculateSum(a, b) {')
      expect(lineDiff.type).toBe('context')
      expect(lineDiff.lineNumberOld).toBe(75)
      expect(lineDiff.lineNumberNew).toBe(80)
    })
  })
})
