import { describe, expect, it } from 'vitest'
import {
  DELETION_DIFF,
  MIXED_DIFF,
  MULTI_FILE_DIFF,
  RENAME_DIFF,
  SAMPLE_DIFF,
} from '../utils/test/__fixtures__/raw-diffs-fixtures'
import { FileDiff } from './FileDiff'
import { ParsedDiff } from './ParsedDiff'

describe('ParsedDiff', () => {
  describe('Constructor', () => {
    it('given valid parameters, when creating instance, expect properties set correctly', () => {
      // GIVEN
      const rawContent = 'mock-diff-content'
      const files = [
        new FileDiff({
          oldPath: 'old.ts',
          newPath: 'new.ts',
          isRenamed: false,
          isNew: false,
          isDeleted: false,
          language: 'typescript',
          hunks: [],
          rawContent: 'mock-content',
        }),
      ]

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
      // GIVEN
      const rawContent = SAMPLE_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.rawContent).toBe(rawContent)
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('foo.ts')
      expect(result.files[0].newPath).toBe('foo.ts')
      expect(result.files[0].isNew).toBe(false) // This is a modification, not a new file
    })

    it('given multi-file diff, when building, expect correct file-specific content', () => {
      // GIVEN
      const rawContent = MULTI_FILE_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.files).toHaveLength(2)
      expect(result.files[0].newPath).toBe('file1.ts')
      expect(result.files[1].newPath).toBe('file2.ts')

      // Verify that each file has its own specific rawContent, not the entire diff
      expect(result.files[0].rawContent).toContain('file1.ts')
      expect(result.files[0].rawContent).not.toContain('file2.ts')
      expect(result.files[1].rawContent).toContain('file2.ts')
      expect(result.files[1].rawContent).not.toContain('file1.ts')

      // Verify the rawContent lengths are different (not the entire diff)
      expect(result.files[0].rawContent.split('\n').length).toBeLessThan(rawContent.split('\n').length)
      expect(result.files[1].rawContent.split('\n').length).toBeLessThan(rawContent.split('\n').length)

      // Verify specific line counts for each file
      const file1Lines = result.files[0].rawContent.split('\n').length
      const file2Lines = result.files[1].rawContent.split('\n').length
      const totalLines = rawContent.split('\n').length

      // Each file should have fewer lines than the total
      expect(file1Lines).toBeLessThan(totalLines)
      expect(file2Lines).toBeLessThan(totalLines)
      // The sum should be approximately equal to total (allowing for some overlap in headers)
      expect(file1Lines + file2Lines).toBeGreaterThanOrEqual(totalLines - 2)
    })

    it('given deletion diff, when building, expect file with deletions parsed', () => {
      // GIVEN
      const rawContent = DELETION_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('example.js')
      expect(result.files[0].newPath).toBe('example.js')
    })

    it('given rename diff, when building, expect renamed file parsed', () => {
      // GIVEN
      const rawContent = RENAME_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('old-name.js')
      expect(result.files[0].newPath).toBe('new-name.js')
      expect(result.files[0].isRenamed).toBe(true)
    })

    it('given mixed changes diff, when building, expect file with mixed changes parsed', () => {
      // GIVEN
      const rawContent = MIXED_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('utils.ts')
      expect(result.files[0].newPath).toBe('utils.ts')
    })

    it('given mixed changes diff, when building, expect raw file data parsed correctly', () => {
      // GIVEN
      const rawContent = MIXED_DIFF

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.files).toHaveLength(1)
      const file = result.files[0]

      // Verify file metadata
      expect(file.oldPath).toBe('utils.ts')
      expect(file.newPath).toBe('utils.ts')
      expect(file.isRenamed).toBe(false)
      expect(file.isNew).toBe(false)
      expect(file.isDeleted).toBe(false)
      expect(file.language).toBe('typescript')

      // Verify raw content parsing
      expect(file.rawContent).toContain('index abc123..def456 100644')
      expect(file.rawContent).toContain('--- a/utils.ts')
      expect(file.rawContent).toContain('+++ b/utils.ts')
      expect(file.rawContent).toContain('@@ -1,7 +1,8 @@')
      expect(file.rawContent).toContain('export function calculate(a: number, b: number) {')
      expect(file.rawContent).toContain('-  const sum = a + b')
      expect(file.rawContent).toContain("-  console.log('calculating')")
      expect(file.rawContent).toContain('+  // Updated implementation')
      expect(file.rawContent).toContain('+  const result = a + b')
      expect(file.rawContent).toContain("+  console.log('calculating result')")
      expect(file.rawContent).toContain('-  return sum')
      expect(file.rawContent).toContain('+  return result')
      expect(file.rawContent).toContain('}')

      // Verify hunk parsing
      expect(file.hunks).toHaveLength(1)
      const hunk = file.hunks[0]
      expect(hunk.changes).toHaveLength(10) // 10 lines in the hunk

      // Verify specific line changes
      const changes = hunk.changes
      expect(changes[0].content).toBe('export function calculate(a: number, b: number) {')
      expect(changes[0].type).toBe('context')
      expect(changes[1].content).toBe('  const sum = a + b')
      expect(changes[1].type).toBe('delete')
      expect(changes[2].content).toBe("  console.log('calculating')")
      expect(changes[2].type).toBe('delete')
      expect(changes[3].content).toBe('  // Updated implementation')
      expect(changes[3].type).toBe('add')
      expect(changes[4].content).toBe('  const result = a + b')
      expect(changes[4].type).toBe('add')
      expect(changes[5].content).toBe("  console.log('calculating result')")
      expect(changes[5].type).toBe('add')
      expect(changes[6].content).toBe(' ')
      expect(changes[6].type).toBe('context')
      expect(changes[7].content).toBe('  return sum')
      expect(changes[7].type).toBe('delete')
      expect(changes[8].content).toBe('  return result')
      expect(changes[8].type).toBe('add')
      expect(changes[9].content).toBe('}')
      expect(changes[9].type).toBe('context')
    })

    it('given empty diff content, when building, expect empty files array', () => {
      // GIVEN
      const rawContent = ''

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.rawContent).toBe('')
      expect(result.files).toEqual([])
    })

    it('given invalid diff content, when building, expect empty files array', () => {
      // GIVEN
      const rawContent = 'invalid-diff-content'

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.files).toEqual([])
    })

    it('given simple diff, when building ParsedDiff, expect correct files array', () => {
      // GIVEN
      const rawContent = `diff --git a/file1.txt b/file1.txt
index 1234567..abcdefg 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,3 @@
 line1
-line2
+line2 modified
 line3`

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('file1.txt')
      expect(result.files[0].newPath).toBe('file1.txt')
      expect(result.files[0].isDeleted).toBe(false)
    })

    it('given deleted binary file diff, when building ParsedDiff, expect binary detection works', () => {
      // GIVEN
      const rawContent = `diff --git a/frontend/public/logo192.png b/frontend/public/logo192.png
deleted file mode 100644
index 0969f46..0000000
Binary files a/frontend/public/logo192.png and /dev/null differ`

      // WHEN
      const result = ParsedDiff.build(rawContent)

      // EXPECT
      expect(result.files).toHaveLength(1)
      expect(result.files[0].oldPath).toBe('frontend/public/logo192.png')
      expect(result.files[0].newPath).toBe('/dev/null')
      expect(result.files[0].isDeleted).toBe(true)
      expect(result.files[0].isBinary).toBe(true)
    })
  })
})
