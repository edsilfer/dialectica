import type { RawFile } from 'diffparser'
import diffparser from 'diffparser'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DELETION_DIFF,
  MIXED_DIFF,
  MULTI_FILE_DIFF,
  RENAME_DIFF,
  SAMPLE_DIFF,
} from '../utils/test/__fixtures__/raw-diffs-fixtures'
import { FileDiff } from './FileDiff'
import { ParsedDiff } from './ParsedDiff'

// MOCKS
vi.mock('diffparser', () => ({
  default: vi.fn(),
}))

// Import test utilities for creating mock instances
import { createMockFileDiff, createRawFile } from '../utils/test/models/test-utils'

const createMockRawFile = (from: string, to: string): RawFile => createRawFile({ from, to })

describe('ParsedDiff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('given valid parameters, when creating instance, expect properties set correctly', () => {
      // GIVEN
      const rawContent = 'mock-diff-content'
      const files = [createMockFileDiff({ oldPath: 'old.ts', newPath: 'new.ts' })]

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
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue([mockRawFile])

      // GIVEN
      const rawContent = SAMPLE_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.rawContent).toBe(rawContent)
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('/dev/null')
      expect(result.files[0].newPath).toBe('foo.ts')
      expect(result.files[0].isNew).toBe(true)
    })

    it('given multi-file diff, when building, expect multiple files parsed', () => {
      // MOCK
      const mockRawFiles = [createMockRawFile('/dev/null', 'file1.ts'), createMockRawFile('file2.ts', 'file2.ts')]
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue(mockRawFiles)

      // GIVEN
      const rawContent = MULTI_FILE_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.files).toHaveLength(2)
      expect(result.files[0].newPath).toBe('file1.ts')
      expect(result.files[0].isNew).toBe(true)
      expect(result.files[1].newPath).toBe('file2.ts')
      expect(result.files[1].isNew).toBe(false)
    })

    it('given deletion diff, when building, expect file with deletions parsed', () => {
      // MOCK
      const mockRawFile = createMockRawFile('example.js', 'example.js')
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue([mockRawFile])

      // GIVEN
      const rawContent = DELETION_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('example.js')
      expect(result.files[0].newPath).toBe('example.js')
    })

    it('given rename diff, when building, expect renamed file parsed', () => {
      // MOCK
      const mockRawFile = createMockRawFile('old-name.js', 'new-name.js')
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue([mockRawFile])

      // GIVEN
      const rawContent = RENAME_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('old-name.js')
      expect(result.files[0].newPath).toBe('new-name.js')
      expect(result.files[0].isRenamed).toBe(true)
    })

    it('given mixed changes diff, when building, expect file with mixed changes parsed', () => {
      // MOCK
      const mockRawFile = createMockRawFile('utils.ts', 'utils.ts')
      const mockDiffparser = vi.mocked(diffparser)

      mockDiffparser.mockReturnValue([mockRawFile])

      // GIVEN
      const rawContent = MIXED_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('utils.ts')
      expect(result.files[0].newPath).toBe('utils.ts')
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

    it('given diffparser returns empty array, when building, expect empty files array', () => {
      // MOCK
      const mockDiffparser = vi.mocked(diffparser)
      mockDiffparser.mockReturnValue([])

      // GIVEN
      const rawContent = 'invalid-diff-content'

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(mockDiffparser).toHaveBeenCalledWith(rawContent)
      expect(result.files).toEqual([])
    })
  })
})
