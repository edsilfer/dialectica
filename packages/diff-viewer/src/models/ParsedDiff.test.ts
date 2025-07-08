import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RawFile } from 'diffparser'
import diffparser from 'diffparser'
import { FileDiff } from './FileDiff'
import { ParsedDiff } from './ParsedDiff'
import {
  SAMPLE_DIFF,
  DELETION_DIFF,
  MULTI_FILE_DIFF,
  MIXED_DIFF,
  RENAME_DIFF,
} from '../test/__fixtures__/raw-diffs-fixtures'

// MOCKS
vi.mock('diffparser', () => ({
  default: vi.fn(),
}))

vi.mock('./FileDiff', () => ({
  FileDiff: {
    build: vi.fn(),
  },
}))

const createMockRawFile = (from: string, to: string): RawFile => ({
  from,
  to,
  chunks: [],
  deletions: 0,
  additions: 0,
})

const createMockFileDiff = (oldPath: string, newPath: string): FileDiff =>
  ({
    oldPath,
    newPath,
    isRenamed: oldPath !== newPath,
    isNew: oldPath === '/dev/null',
    isDeleted: newPath === '/dev/null',
    language: 'typescript',
    hunks: [],
    rawContent: 'mock-content',
    key: newPath || oldPath,
    withContext: vi.fn().mockReturnThis(),
  }) as unknown as FileDiff

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ParsedDiff', () => {
  describe('Constructor', () => {
    it('given valid parameters, when creating instance, expect properties set correctly', () => {
      // GIVEN
      const rawContent = 'mock-diff-content'
      const files = [createMockFileDiff('old.ts', 'new.ts')]

      // WHEN
      const parsedDiff = new ParsedDiff(rawContent, files)

      // EXPECT
      expect(parsedDiff.rawContent).toBe(rawContent)
      expect(parsedDiff.files).toBe(files)
    })

    it('given empty files array, when creating instance, expect empty files array', () => {
      // GIVEN
      const rawContent = 'empty-diff'
      const files: FileDiff[] = []

      // WHEN
      const parsedDiff = new ParsedDiff(rawContent, files)

      // EXPECT
      expect(parsedDiff.rawContent).toBe(rawContent)
      expect(parsedDiff.files).toEqual([])
    })
  })

  describe('Static build method', () => {
    it('given simple addition diff, when building, expect single file parsed', () => {
      // MOCK
      const mockRawFile = createMockRawFile('/dev/null', 'foo.ts')
      const mockFileDiff = createMockFileDiff('/dev/null', 'foo.ts')
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue([mockRawFile])
      vi.mocked(FileDiff).build.mockReturnValue(mockFileDiff)

      // GIVEN
      const rawContent = SAMPLE_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(vi.mocked(FileDiff).build).toHaveBeenCalledWith(rawContent, mockRawFile)
      expect(result.rawContent).toBe(rawContent)
      expect(result.files).toEqual([mockFileDiff])
    })

    it('given multi-file diff, when building, expect multiple files parsed', () => {
      // MOCK
      const mockRawFiles = [createMockRawFile('/dev/null', 'file1.ts'), createMockRawFile('file2.ts', 'file2.ts')]
      const mockFileDiffs = [createMockFileDiff('/dev/null', 'file1.ts'), createMockFileDiff('file2.ts', 'file2.ts')]
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue(mockRawFiles)
      vi.mocked(FileDiff).build.mockReturnValueOnce(mockFileDiffs[0]).mockReturnValueOnce(mockFileDiffs[1])

      // GIVEN
      const rawContent = MULTI_FILE_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(vi.mocked(FileDiff).build).toHaveBeenCalledTimes(2)
      expect(vi.mocked(FileDiff).build).toHaveBeenNthCalledWith(1, rawContent, mockRawFiles[0])
      expect(vi.mocked(FileDiff).build).toHaveBeenNthCalledWith(2, rawContent, mockRawFiles[1])
      expect(result.files).toEqual(mockFileDiffs)
    })

    it('given deletion diff, when building, expect file with deletions parsed', () => {
      // MOCK
      const mockRawFile = createMockRawFile('example.js', 'example.js')
      const mockFileDiff = createMockFileDiff('example.js', 'example.js')
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue([mockRawFile])
      vi.mocked(FileDiff).build.mockReturnValue(mockFileDiff)

      // GIVEN
      const rawContent = DELETION_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.files).toHaveLength(1)
    })

    it('given rename diff, when building, expect renamed file parsed', () => {
      // MOCK
      const mockRawFile = createMockRawFile('old-name.js', 'new-name.js')
      const mockFileDiff = createMockFileDiff('old-name.js', 'new-name.js')
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue([mockRawFile])
      vi.mocked(FileDiff).build.mockReturnValue(mockFileDiff)

      // GIVEN
      const rawContent = RENAME_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(vi.mocked(FileDiff).build).toHaveBeenCalledWith(rawContent, mockRawFile)
      expect(result.files).toEqual([mockFileDiff])
    })

    it('given mixed changes diff, when building, expect file with mixed changes parsed', () => {
      // MOCK
      const mockRawFile = createMockRawFile('utils.ts', 'utils.ts')
      const mockFileDiff = createMockFileDiff('utils.ts', 'utils.ts')
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue([mockRawFile])
      vi.mocked(FileDiff).build.mockReturnValue(mockFileDiff)

      // GIVEN
      const rawContent = MIXED_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.files).toHaveLength(1)
    })

    it('given empty diff content, when building, expect empty files array', () => {
      // MOCK
      const mockDiffparser = vi.mocked(diffparser)
      mockDiffparser.mockReturnValue([])

      // GIVEN
      const rawContent = ''

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.rawContent).toBe('')
      expect(result.files).toEqual([])
    })

    it('given diffparser returns empty array, when building, expect no FileDiff.build calls', () => {
      // MOCK
      const mockDiffparser = vi.mocked(diffparser)
      mockDiffparser.mockReturnValue([])

      // GIVEN
      const rawContent = 'invalid-diff-content'

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(vi.mocked(FileDiff).build).not.toHaveBeenCalled()
      expect(result.files).toEqual([])
    })
  })
})
