import { describe, expect, it } from 'vitest'
import { Hunk, ExpandDirection } from './Hunk'
import { DiffLine } from './Line'

function createDiffLine(
  content: string,
  type: 'context' | 'add' | 'delete',
  lineNumberOld: number | null = null,
  lineNumberNew: number | null = null,
): DiffLine {
  return {
    content,
    type,
    lineNumberOld,
    lineNumberNew,
  } as DiffLine
}

const SIMPLE_CHANGES: DiffLine[] = [
  createDiffLine('+added line', 'add', null, 1),
  createDiffLine(' unchanged line', 'context', 2, 2),
]

const HEADER_CHANGES: DiffLine[] = [
  createDiffLine('@@ -58,11 +58,10 @@ import type {', 'context', 58, 58),
  createDiffLine('   FulfilledThenable,', 'context', 59, 59),
  createDiffLine('   RejectedThenable,', 'context', 60, 60),
]

const HEADER_ONLY_CHANGES: DiffLine[] = [createDiffLine('@@ -100,2 +100,2 @@ lone header', 'context', 100, 100)]

const SHUFFLED_CHANGES: DiffLine[] = [
  createDiffLine(' line 2', 'context', 2, 2),
  createDiffLine(' line 1', 'context', 1, 1),
]

describe('Hunk – happy path', () => {
  it('given simple hunk, when created, expect correct header', () => {
    // GIVEN
    const content = '+added line'
    const oldStart = 1
    const oldLines = 2
    const newStart = 1
    const newLines = 2
    const changes = SIMPLE_CHANGES
    const expandDirection: ExpandDirection = 'up'

    // WHEN
    const hunk = new Hunk(content, oldStart, oldLines, newStart, newLines, changes, '', expandDirection)

    // EXPECT
    expect(hunk.oldStart).toBe(1)
    expect(hunk.oldLines).toBe(2)
    expect(hunk.newStart).toBe(1)
    expect(hunk.newLines).toBe(2)
    expect(hunk.expandDirection).toEqual(expandDirection)
    expect(hunk.header).toBe('@@ -1,2 +1,2 @@ +added line')
    expect(hunk.contentLines).toEqual([hunk.header, '+added line', ' unchanged line'])
  })

  it('given shuffled changes, when created, expect correct content', () => {
    // GIVEN
    const content = ' line 1'
    const oldStart = 1
    const oldLines = 2
    const newStart = 1
    const newLines = 2
    const changes = SHUFFLED_CHANGES
    const expandDirection: ExpandDirection = 'in'

    // WHEN
    const hunk = new Hunk(content, oldStart, oldLines, newStart, newLines, changes, '', expandDirection)

    // EXPECT
    expect(hunk.contentLines[1]).toBe(' line 2')
    expect(hunk.contentLines[2]).toBe(' line 1')
  })
})

describe('Hunk – pre-existing diff header edge cases', () => {
  it('given existing header, when created, expect recalculated header', () => {
    // GIVEN
    const content = '@@ -58,11 +58,10 @@ import type {'
    const oldStart = 58
    const oldLines = 2
    const newStart = 58
    const newLines = 2
    const changes = HEADER_CHANGES
    const expandDirection: ExpandDirection = 'in'

    // WHEN
    const hunk = new Hunk(content, oldStart, oldLines, newStart, newLines, changes, '', expandDirection)

    // EXPECT
    expect(hunk.header).toBe('@@ -58,2 +58,2 @@ import type {')
    expect(hunk.contentLines).toEqual([hunk.header, '   FulfilledThenable,', '   RejectedThenable,'])
  })

  it('given header-only hunk, when created, expect zero ranges', () => {
    // GIVEN
    const content = '@@ -100,2 +100,2 @@ lone header'
    const oldStart = 100
    const oldLines = 0
    const newStart = 100
    const newLines = 0
    const changes = HEADER_ONLY_CHANGES
    const expandDirection: ExpandDirection = 'in'

    // WHEN
    const hunk = new Hunk(content, oldStart, oldLines, newStart, newLines, changes, '', expandDirection)

    // EXPECT
    expect(hunk.header).toBe('@@ -100,0 +100,0 @@ lone header')
    expect(hunk.contentLines).toEqual([hunk.header])
  })
})

describe('Hunk – expandDirection passthrough', () => {
  it('given expand direction, when created, expect preserved direction', () => {
    // GIVEN
    const direction: ExpandDirection = 'up'
    const content = '+x'
    const oldStart = 1
    const oldLines = 1
    const newStart = 1
    const newLines = 1
    const changes = [createDiffLine('+x', 'add', null, 1)]

    // WHEN
    const hunk = new Hunk(content, oldStart, oldLines, newStart, newLines, changes, '', direction)

    // EXPECT
    expect(hunk.expandDirection).toBe(direction)
  })
})

describe('Hunk – additional properties', () => {
  it('given file path, when created, expect preserved file path', () => {
    // GIVEN
    const filePath = 'src/components/MyComponent.tsx'
    const content = '+new line'
    const changes = [createDiffLine('+new line', 'add', null, 1)]

    // WHEN
    const hunk = new Hunk(content, 1, 1, 1, 1, changes, filePath, 'out')

    // EXPECT
    expect(hunk.filePath).toBe(filePath)
  })

  it('given no changes, when created, expect empty header', () => {
    // GIVEN
    const content = 'empty'
    const changes: DiffLine[] = []

    // WHEN
    const hunk = new Hunk(content, 1, 0, 1, 0, changes, '', 'in')

    // EXPECT
    expect(hunk.header).toBe('')
    expect(hunk.contentLines).toEqual([''])
  })

  it('given context line at start of file, when created, expect no header', () => {
    // GIVEN
    const content = ' unchanged line'
    const changes = [createDiffLine(' unchanged line', 'context', 1, 1)]

    // WHEN
    const hunk = new Hunk(content, 1, 1, 1, 1, changes, '', 'in')

    // EXPECT
    expect(hunk.header).toBe('')
    expect(hunk.contentLines).toEqual(['', ' unchanged line'])
  })
})
