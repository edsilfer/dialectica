import { describe, it, expect } from 'vitest'
import { DiffParserAdapter } from './DiffParserAdapter'
import type { ParsedDiff } from '../types/diff'
import {
  SAMPLE_DIFF,
  DELETION_DIFF,
  MIXED_DIFF,
  RENAME_DIFF,
  MULTI_FILE_DIFF,
  MULTI_HUNK_DIFF,
} from './__fixtures__/sample-diffs'

describe('DiffParserAdapter', () => {
  const adapter = new DiffParserAdapter()

  it('given a simple added file diff when parsed expect correct parsing', () => {
    // GIVEN
    const parsed: ParsedDiff = adapter.parse(SAMPLE_DIFF)

    // WHEN
    const file = parsed.files[0]

    // EXPECT
    expect(parsed.files).toHaveLength(1)
    expect(file.oldPath).toBe('foo.ts')
    expect(file.newPath).toBe('foo.ts')
    expect(file.isRenamed).toBe(false)
    expect(file.hunks).toHaveLength(1)

    const hunk = file.hunks[0]
    expect(hunk.content).toBe('@@ -0,0 +1,3 @@')
    expect(hunk.changes).toHaveLength(3)

    const [line1, line2, line3] = hunk.changes

    expect(line1.type).toBe('add')
    expect(line1.content).toBe('const x = 1')
    expect(line1.lineNumberOld).toBeNull()
    expect(line1.lineNumberNew).toBe(1)

    expect(line2.type).toBe('add')
    expect(line2.content).toBe('const y = 2')
    expect(line2.lineNumberOld).toBeNull()
    expect(line2.lineNumberNew).toBe(2)

    expect(line3.type).toBe('add')
    expect(line3.content).toBe('const z = 3')
    expect(line3.lineNumberOld).toBeNull()
    expect(line3.lineNumberNew).toBe(3)
  })

  it('given a file with deletions when parsed expect correct parsing', () => {
    // GIVEN
    const parsed: ParsedDiff = adapter.parse(DELETION_DIFF)

    // WHEN
    const file = parsed.files[0]

    // EXPECT
    expect(parsed.files).toHaveLength(1)
    expect(file.oldPath).toBe('example.js')
    expect(file.newPath).toBe('example.js')
    expect(file.isRenamed).toBe(false)
    expect(file.hunks).toHaveLength(1)

    const hunk = file.hunks[0]
    expect(hunk.changes).toHaveLength(6)

    const [context, del1, , , add, context2] = hunk.changes

    expect(context.type).toBe('context')
    expect(context.content).toBe('function hello() {')

    expect(del1.type).toBe('delete')
    expect(del1.content).toBe("  console.log('old line 1')")
    expect(del1.lineNumberOld).toBe(2)
    expect(del1.lineNumberNew).toBeNull()

    expect(add.type).toBe('add')
    expect(add.content).toBe("  console.log('new implementation')")
    expect(add.lineNumberOld).toBeNull()
    expect(add.lineNumberNew).toBe(2)

    expect(context2.type).toBe('context')
    expect(context2.content).toBe('}')
  })

  it('given a file with mixed additions, deletions, and context when parsed expect correct parsing', () => {
    // GIVEN
    const parsed: ParsedDiff = adapter.parse(MIXED_DIFF)

    // WHEN
    const file = parsed.files[0]

    // EXPECT
    expect(parsed.files).toHaveLength(1)
    expect(file.hunks).toHaveLength(1)
    const hunk = file.hunks[0]

    // Check that we have context, deletions, and additions
    const hasContext = hunk.changes.some((change) => change.type === 'context')
    const hasAdditions = hunk.changes.some((change) => change.type === 'add')
    const hasDeletions = hunk.changes.some((change) => change.type === 'delete')

    expect(hasContext).toBe(true)
    expect(hasAdditions).toBe(true)
    expect(hasDeletions).toBe(true)
  })

  it('given a renamed file when parsed expect correct parsing', () => {
    // GIVEN
    const parsed: ParsedDiff = adapter.parse(RENAME_DIFF)

    // WHEN
    const file = parsed.files[0]

    // EXPECT
    expect(parsed.files).toHaveLength(1)
    expect(file.oldPath).toBe('old-name.js')
    expect(file.newPath).toBe('new-name.js')
    expect(file.isRenamed).toBe(true)
  })

  it('given multiple files in a single diff when parsed expect correct parsing', () => {
    // GIVEN
    const parsed: ParsedDiff = adapter.parse(MULTI_FILE_DIFF)

    // WHEN
    const [file1, file2] = parsed.files

    // EXPECT
    expect(parsed.files).toHaveLength(2)

    expect(file1.oldPath).toBe('file1.ts')
    expect(file1.newPath).toBe('file1.ts')
    expect(file1.hunks).toHaveLength(1)
    expect(file1.hunks[0].changes).toHaveLength(2)
    expect(file1.hunks[0].changes.every((change) => change.type === 'add')).toBe(true)

    expect(file2.oldPath).toBe('file2.ts')
    expect(file2.newPath).toBe('file2.ts')
    expect(file2.hunks).toHaveLength(1)
    expect(file2.hunks[0].changes).toHaveLength(2)
    expect(file2.hunks[0].changes[0].type).toBe('context')
    expect(file2.hunks[0].changes[1].type).toBe('add')
  })

  it('given a diff with multiple hunks when parsed expect correct parsing', () => {
    // GIVEN
    const parsed: ParsedDiff = adapter.parse(MULTI_HUNK_DIFF)

    // WHEN
    const file = parsed.files[0]

    // EXPECT
    expect(parsed.files).toHaveLength(1)
    expect(file.hunks).toHaveLength(2)

    const [hunk1, hunk2] = file.hunks

    expect(hunk1.content).toBe('@@ -1,3 +1,3 @@')
    expect(hunk1.changes).toHaveLength(4)
    expect(hunk1.changes[0].type).toBe('context') // function first() {
    expect(hunk1.changes[1].type).toBe('delete') // old return
    expect(hunk1.changes[2].type).toBe('add') // new return
    expect(hunk1.changes[3].type).toBe('context') // }

    expect(hunk2.content).toBe('@@ -10,3 +10,3 @@')
    expect(hunk2.changes).toHaveLength(4)
    expect(hunk2.changes[0].type).toBe('context') // function second() {
    expect(hunk2.changes[1].type).toBe('delete') // old return
    expect(hunk2.changes[2].type).toBe('add') // new return
    expect(hunk2.changes[3].type).toBe('context') // }
  })
})
