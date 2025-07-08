import { describe, expect, it } from 'vitest'
import type { RawFile, RawChunk } from 'diffparser'
import { FileDiff } from './FileDiff'
import { Hunk } from './Hunk'
import { LineDiff } from './LineDiff'
import type { HunkDirection } from '../components/code-panel/components/hunk-list/types'

const createMockRawFile = (overrides: Partial<RawFile> = {}): RawFile => ({
  from: 'src/test.ts',
  to: 'src/test.ts',
  chunks: [],
  deletions: 0,
  additions: 0,
  ...overrides,
})

const createMockRawChunk = (overrides: Partial<RawChunk> = {}): RawChunk => ({
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

const createMockLineDiff = (overrides: Partial<LineDiff> = {}): LineDiff => ({
  content: 'test line',
  type: 'context',
  lineNumberOld: 1,
  lineNumberNew: 1,
  ...overrides,
})

const createMockHunk = (
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

describe('FileDiff', () => {
  describe('static build method', () => {
    it('given regular file edit, when building FileDiff, expect correct properties set', () => {
      // GIVEN
      const rawContent = 'diff --git a/test.ts b/test.ts'
      const rawFile = createMockRawFile({
        from: 'src/components/Button.tsx',
        to: 'src/components/Button.tsx',
        chunks: [createMockRawChunk()],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.oldPath).toBe('src/components/Button.tsx')
      expect(result.newPath).toBe('src/components/Button.tsx')
      expect(result.isRenamed).toBe(false)
      expect(result.isNew).toBe(false)
      expect(result.isDeleted).toBe(false)
      expect(result.language).toBe('typescript')
      expect(result.rawContent).toBe(rawContent)
      expect(result.hunks).toHaveLength(1)
    })

    it('given new file creation, when building FileDiff, expect isNew flag set', () => {
      // GIVEN
      const rawContent = 'diff --git a/dev/null b/new.ts'
      const rawFile = createMockRawFile({
        from: '/dev/null',
        to: 'src/utils/new.ts',
        chunks: [createMockRawChunk()],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.oldPath).toBe('/dev/null')
      expect(result.newPath).toBe('src/utils/new.ts')
      expect(result.isRenamed).toBe(true)
      expect(result.isNew).toBe(true)
      expect(result.isDeleted).toBe(false)
      expect(result.language).toBe('typescript')
    })

    it('given file deletion, when building FileDiff, expect isDeleted flag set', () => {
      // GIVEN
      const rawContent = 'diff --git a/old.ts b/dev/null'
      const rawFile = createMockRawFile({
        from: 'src/legacy/old.ts',
        to: '/dev/null',
        chunks: [createMockRawChunk()],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.oldPath).toBe('src/legacy/old.ts')
      expect(result.newPath).toBe('/dev/null')
      expect(result.isRenamed).toBe(true)
      expect(result.isNew).toBe(false)
      expect(result.isDeleted).toBe(true)
      expect(result.language).toBe('typescript')
    })

    it('given file rename, when building FileDiff, expect isRenamed flag set', () => {
      // GIVEN
      const rawContent = 'diff --git a/old.ts b/new.ts'
      const rawFile = createMockRawFile({
        from: 'src/oldName.tsx',
        to: 'src/newName.tsx',
        chunks: [createMockRawChunk()],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.oldPath).toBe('src/oldName.tsx')
      expect(result.newPath).toBe('src/newName.tsx')
      expect(result.isRenamed).toBe(true)
      expect(result.isNew).toBe(false)
      expect(result.isDeleted).toBe(false)
      expect(result.language).toBe('typescript')
    })

    it('given file with multiple chunks, when building FileDiff, expect all hunks created', () => {
      // GIVEN
      const rawContent = 'diff with multiple hunks'
      const rawFile = createMockRawFile({
        chunks: [createMockRawChunk(), createMockRawChunk(), createMockRawChunk()],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.hunks).toHaveLength(3)
    })
  })

  describe('withContext method', () => {
    const testCases: Array<{
      direction: HunkDirection
      description: string
      expectMerge?: boolean
    }> = [
      { direction: 'up', description: 'up direction adds context to current hunk' },
      { direction: 'down', description: 'down direction adds context to current hunk' },
      { direction: 'in_up', description: 'in_up direction adds context to current hunk' },
      { direction: 'in_down', description: 'in_down direction adds context to previous hunk' },
      { direction: 'out', description: 'out direction merges hunks with context', expectMerge: true },
    ]

    testCases.forEach(({ direction, description, expectMerge }) => {
      it(`given ${direction} direction, when adding context, expect ${description}`, () => {
        // GIVEN
        const hunk1 = createMockHunk({ oldStart: 1 })
        const hunk2 = createMockHunk({ oldStart: 10 })
        const fileDiff = new FileDiff({
          oldPath: 'test.ts',
          newPath: 'test.ts',
          isRenamed: false,
          language: 'typescript',
          hunks: [hunk1, hunk2],
          rawContent: 'test content',
        })
        const contextLines = [createMockLineDiff({ content: 'context line' })]

        // For 'in_down' we need prev hunk, for merge we need both, otherwise just curr
        let hunkData: { prev?: Hunk; curr: Hunk }
        if (direction === 'in_down') {
          hunkData = { prev: hunk1, curr: hunk2 }
        } else if (expectMerge) {
          hunkData = { prev: hunk1, curr: hunk2 }
        } else {
          hunkData = { curr: hunk2 }
        }

        // WHEN
        const result = fileDiff.withContext(contextLines, hunkData, direction)

        // EXPECT
        expect(result).not.toBe(fileDiff)
        expect(result).toBeInstanceOf(FileDiff)
        if (expectMerge) {
          expect(result.hunks).toHaveLength(1)
        } else {
          expect(result.hunks).toHaveLength(2)
        }
      })
    })

    it('given in direction, when adding context, expect no changes made', () => {
      // GIVEN
      const hunk = createMockHunk()
      const fileDiff = new FileDiff({
        oldPath: 'test.ts',
        newPath: 'test.ts',
        isRenamed: false,
        language: 'typescript',
        hunks: [hunk],
        rawContent: 'test content',
      })
      const contextLines = [createMockLineDiff()]
      const hunkData = { curr: hunk }

      // WHEN
      const result = fileDiff.withContext(contextLines, hunkData, 'in')

      // EXPECT
      expect(result).toBe(fileDiff)
    })
  })

  describe('edge cases', () => {
    it('given empty hunk data, when adding context, expect no changes made', () => {
      // GIVEN
      const fileDiff = new FileDiff({
        oldPath: 'test.ts',
        newPath: 'test.ts',
        isRenamed: false,
        language: 'typescript',
        hunks: [],
        rawContent: 'test content',
      })
      const contextLines = [createMockLineDiff()]
      const hunkData = {} as { prev?: Hunk; curr: Hunk }

      // WHEN
      const result = fileDiff.withContext(contextLines, hunkData, 'up')

      // EXPECT
      expect(result).toBe(fileDiff)
    })

    it('given deleted file, when getting key, expect newPath returned', () => {
      // GIVEN
      const fileDiff = new FileDiff({
        oldPath: 'src/deleted.ts',
        newPath: '/dev/null',
        isRenamed: true,
        isDeleted: true,
        language: 'typescript',
        hunks: [],
        rawContent: 'test content',
      })

      // WHEN
      const key = fileDiff.key

      // EXPECT
      expect(key).toBe('/dev/null')
    })

    it('given regular file, when getting key, expect newPath returned', () => {
      // GIVEN
      const fileDiff = new FileDiff({
        oldPath: 'src/old.ts',
        newPath: 'src/new.ts',
        isRenamed: true,
        language: 'typescript',
        hunks: [],
        rawContent: 'test content',
      })

      // WHEN
      const key = fileDiff.key

      // EXPECT
      expect(key).toBe('src/new.ts')
    })
  })
})
