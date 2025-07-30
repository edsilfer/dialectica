import { describe, expect, it } from 'vitest'
import type { HunkDirection } from '../components/file-list/models/types'
import {
  createMockHunk,
  createMockLineDiff,
  createRawChunk as createMockRawChunk,
  createRawFile as createMockRawFile,
} from '../utils/test/models/test-utils'
import { FileDiff } from './FileDiff'
import { Hunk } from './Hunk'

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

    it('given binary file with GIT binary patch, expect isBinary true and bytes extracted', () => {
      // GIVEN
      const rawContent = `diff --git a/image.png b/image.png\nGIT binary patch\nliteral 1234\n...`
      const rawFile = createMockRawFile({
        from: 'image.png',
        to: 'image.png',
        chunks: [],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.isBinary).toBe(true)
      expect(result.bytes).toBe(1234)
    })

    it('given binary file with only "Binary files ... differ", expect isBinary true and bytes undefined', () => {
      // GIVEN
      const rawContent = 'diff --git a/foo.bin b/foo.bin\nBinary files a/foo.bin and b/foo.bin differ\n'
      const rawFile = createMockRawFile({
        from: 'foo.bin',
        to: 'foo.bin',
        chunks: [],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.isBinary).toBe(true)
      expect(result.bytes).toBeUndefined()
    })

    it('given text file with # File size: <n> bytes, expect bytes extracted', () => {
      // GIVEN
      const rawContent = 'diff --git a/foo.txt b/foo.txt\n# File size: 5678 bytes\n@@ ...'
      const rawFile = createMockRawFile({
        from: 'foo.txt',
        to: 'foo.txt',
        chunks: [createMockRawChunk()],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.isBinary).toBe(false)
      expect(result.bytes).toBe(5678)
    })

    it('given text file with no size info, expect bytes undefined', () => {
      // GIVEN
      const rawContent = 'diff --git a/foo.txt b/foo.txt\n@@ ...'
      const rawFile = createMockRawFile({
        from: 'foo.txt',
        to: 'foo.txt',
        chunks: [createMockRawChunk()],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.isBinary).toBe(false)
      expect(result.bytes).toBeUndefined()
    })

    it('given deleted binary file, expect isBinary true and isDeleted true', () => {
      // GIVEN
      const rawContent = 'diff --git a/foo.bin b/dev/null\nBinary files a/foo.bin and /dev/null differ\n'
      const rawFile = createMockRawFile({
        from: 'foo.bin',
        to: '/dev/null',
        chunks: [],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.isBinary).toBe(true)
      expect(result.isDeleted).toBe(true)
      expect(result.bytes).toBeUndefined()
    })

    it('given deleted PNG file, expect isBinary true and isDeleted true', () => {
      // GIVEN
      const rawContent = `diff --git a/frontend/public/logo192.png b/frontend/public/logo192.png
deleted file mode 100644
index 0969f46..0000000
Binary files a/frontend/public/logo192.png and /dev/null differ`
      const rawFile = createMockRawFile({
        from: 'frontend/public/logo192.png',
        to: '/dev/null',
        chunks: [],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.isBinary).toBe(true)
      expect(result.isDeleted).toBe(true)
      expect(result.bytes).toBeUndefined()
    })

    it('given exact user diff content for deleted PNG, expect isBinary true and isDeleted true', () => {
      // GIVEN: This is the exact diff content provided by the user
      const rawContent = `diff --git a/frontend/public/logo192.png b/frontend/public/logo192.png
deleted file mode 100644
index 0969f46..0000000
Binary files a/frontend/public/logo192.png and /dev/null differ`
      const rawFile = createMockRawFile({
        from: 'frontend/public/logo192.png',
        to: '/dev/null',
        chunks: [],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.isBinary).toBe(true)
      expect(result.isDeleted).toBe(true)
      expect(result.bytes).toBeUndefined()
    })

    it('given non-binary file, expect isBinary false', () => {
      // GIVEN
      const rawContent = 'diff --git a/foo.txt b/foo.txt\n@@ ...'
      const rawFile = createMockRawFile({
        from: 'foo.txt',
        to: 'foo.txt',
        chunks: [createMockRawChunk()],
      })

      // WHEN
      const result = FileDiff.build(rawContent, rawFile)

      // EXPECT
      expect(result.isBinary).toBe(false)
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
          isDeleted: false,
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
        isDeleted: false,
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
        isDeleted: false,
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
      expect(key).toBe('src/deleted.ts')
    })

    it('given regular file, when getting key, expect newPath returned', () => {
      // GIVEN
      const fileDiff = new FileDiff({
        oldPath: 'src/old.ts',
        newPath: 'src/new.ts',
        isRenamed: true,
        isDeleted: false,
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

  describe('static compare method', () => {
    it('given files in different directories, when comparing, expect alphabetical order', () => {
      // GIVEN
      const fileA = new FileDiff({
        oldPath: 'src/components/Button.tsx',
        newPath: 'src/components/Button.tsx',
        isRenamed: false,
        isDeleted: false,
        language: 'typescript',
        hunks: [],
        rawContent: 'test content',
      })
      const fileB = new FileDiff({
        oldPath: 'src/utils/helpers.ts',
        newPath: 'src/utils/helpers.ts',
        isRenamed: false,
        isDeleted: false,
        language: 'typescript',
        hunks: [],
        rawContent: 'test content',
      })

      // WHEN
      const result = FileDiff.compare(fileA, fileB)

      // EXPECT
      expect(result).toBeLessThan(0) // 'src/components/Button.tsx' comes before 'src/utils/helpers.ts'
    })

    it('given files in same directory, when comparing, expect alphabetical order', () => {
      // GIVEN
      const fileA = new FileDiff({
        oldPath: 'src/components/Button.tsx',
        newPath: 'src/components/Button.tsx',
        isRenamed: false,
        isDeleted: false,
        language: 'typescript',
        hunks: [],
        rawContent: 'test content',
      })
      const fileB = new FileDiff({
        oldPath: 'src/components/Header.tsx',
        newPath: 'src/components/Header.tsx',
        isRenamed: false,
        isDeleted: false,
        language: 'typescript',
        hunks: [],
        rawContent: 'test content',
      })

      // WHEN
      const result = FileDiff.compare(fileA, fileB)

      // EXPECT
      expect(result).toBeLessThan(0) // 'Button.tsx' comes before 'Header.tsx'
    })

    it('given file structure, when comparing, expect correct order', () => {
      // GIVEN
      const fileA = new FileDiff({
        oldPath: 'apps/demo/package.json',
        newPath: 'apps/demo/package.json',
        isRenamed: false,
        isDeleted: false,
        language: 'markdown',
        hunks: [],
        rawContent: 'test content',
      })
      const fileB = new FileDiff({
        oldPath: 'apps/demo/src/search-form/search-utils.ts',
        newPath: 'apps/demo/src/search-form/search-utils.ts',
        isRenamed: false,
        isDeleted: false,
        language: 'json',
        hunks: [],
        rawContent: 'test content',
      })
      const fileC = new FileDiff({
        oldPath: 'apps/demo/src/settings/modals/SettingsModal.tsx',
        newPath: 'apps/demo/src/settings/modals/SettingsModal.tsx',
        isRenamed: false,
        isDeleted: false,
        language: 'json',
        hunks: [],
        rawContent: 'test content',
      })
      const allFiles = [fileC, fileA, fileB]

      // WHEN
      const sortedFiles = allFiles.sort((a, b) => FileDiff.compare(a, b)).map((f) => f.key)

      // EXPECT
      expect(sortedFiles).toEqual([fileB.key, fileC.key, fileA.key])
    })
  })
})
