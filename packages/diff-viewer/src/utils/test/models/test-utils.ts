import type { RawChunk, RawFile } from 'diffparser'
import { FileDiff } from '../../../models/FileDiff'
import { Hunk } from '../../../models/Hunk'
import type { DiffLineType } from '../../../models/LineDiff'
import { LineDiff } from '../../../models/LineDiff'

/**
 * Creates a mock RawFile with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock RawFile with default values and optional overrides
 */
export const createRawFile = (overrides: Partial<RawFile> = {}): RawFile => ({
  from: 'src/test.ts',
  to: 'src/test.ts',
  chunks: [],
  deletions: 0,
  additions: 0,
  ...overrides,
})

/**
 * Creates a mock RawChunk with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock RawChunk with default values and optional overrides
 */
export const createRawChunk = (overrides: Partial<RawChunk> = {}): RawChunk => ({
  content: '@@ -1,3 +1,3 @@',
  changes: [
    { content: ' function foo() {', type: 'normal', oldLine: 1, newLine: 1 },
    { content: '-  console.log("old")', type: 'del', oldLine: 2, newLine: undefined },
    { content: '+  console.log("new")', type: 'add', oldLine: undefined, newLine: 2 },
    { content: ' }', type: 'normal', oldLine: 3, newLine: 3 },
  ],
  oldStart: 1,
  oldLines: 3,
  newStart: 1,
  newLines: 3,
  ...overrides,
})

/**
 * Creates a mock RawLine with default values and optional overrides
 *
 * @param content - The content of the line
 * @param type    - The type of the line
 * @param oldLine - The old line number
 * @param newLine - The new line number
 * @returns           A mock RawLine with default values and optional overrides
 */
export const createRawLine = (content: string, type: 'add' | 'del' | 'normal', oldLine?: number, newLine?: number) => ({
  content,
  type,
  oldLine,
  newLine,
})

/**
 * Creates a mock LineDiff with default values and optional overrides
 *
 * @param content - The content of the line
 * @param type    - The type of the line
 * @param oldLine - The old line number
 * @param newLine - The new line number
 * @returns           A mock LineDiff with default values and optional overrides
 */
export const createLineDiff = (
  content: string,
  type: 'context' | 'add' | 'delete' | 'empty' | 'hunk',
  lineNumberOld: number | null = null,
  lineNumberNew: number | null = null,
): LineDiff =>
  ({
    content,
    type,
    lineNumberOld,
    lineNumberNew,
  }) as LineDiff

/**
 * Creates a mock LineDiff with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock LineDiff with default values and optional overrides
 */
export const createMockLineDiff = (overrides: Partial<LineDiff> = {}): LineDiff => ({
  content: 'test line',
  type: 'context',
  lineNumberOld: 1,
  lineNumberNew: 1,
  ...overrides,
})

/**
 * Creates a mock Hunk with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock Hunk with default values and optional overrides
 */
export const createMockHunk = (
  overrides: Partial<{
    oldStart: number
    oldLines: number
    newStart: number
    newLines: number
    changes: LineDiff[]
    filePath: string
  }> = {},
): Hunk =>
  new Hunk(
    overrides.oldStart ?? 1,
    overrides.oldLines ?? 3,
    overrides.newStart ?? 1,
    overrides.newLines ?? 3,
    overrides.changes ?? [],
    overrides.filePath ?? 'test.ts',
  )

/**
 * Creates a mock FileDiff with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock FileDiff with default values and optional overrides
 */
export const createMockFileDiff = (
  overrides: Partial<{
    oldPath: string
    newPath: string
    isRenamed: boolean
    isNew: boolean
    isDeleted: boolean
    language: string
    hunks: Hunk[]
    rawContent: string
  }> = {},
): FileDiff => {
  const defaultProps = {
    oldPath: 'src/test.ts',
    newPath: 'src/test.ts',
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
    hunks: [],
    rawContent: 'mock-content',
    ...overrides,
  }

  // Handle special cases for new/deleted files
  if (defaultProps.isNew) {
    defaultProps.oldPath = '/dev/null'
    defaultProps.isRenamed = true
  }
  if (defaultProps.isDeleted) {
    defaultProps.newPath = '/dev/null'
    defaultProps.isRenamed = true
  }

  return new FileDiff(defaultProps)
}

// Sample data with different line types
export const SIMPLE_CHANGES: LineDiff[] = [
  createLineDiff('+added line', 'add', null, 1),
  createLineDiff(' unchanged line', 'context', 2, 2),
]

// Sample data with header changes
export const HEADER_CHANGES: LineDiff[] = [
  createLineDiff('@@ -58,11 +58,10 @@ import type {', 'context', 58, 58),
  createLineDiff('   FulfilledThenable,', 'context', 59, 59),
  createLineDiff('   RejectedThenable,', 'context', 60, 60),
]

// Sample data with only header changes
export const HEADER_ONLY_CHANGES: LineDiff[] = [createLineDiff('@@ -100,2 +100,2 @@ lone header', 'context', 100, 100)]

// Sample data with shuffled changes
export const SHUFFLED_CHANGES: LineDiff[] = [
  createLineDiff(' line 2', 'context', 2, 2),
  createLineDiff(' line 1', 'context', 1, 1),
]

/**
 * Test cases for different line types
 */
export const LINE_TYPE_TEST_CASES: Array<{
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

/**
 * Test cases for different content processing scenarios
 */
export const CONTENT_PROCESSING_TEST_CASES: Array<{
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
