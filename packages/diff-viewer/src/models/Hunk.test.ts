import { describe, expect, it } from 'vitest'
import { Hunk } from './Hunk'
import { DiffLine } from './LineDiff'
import {
  createLineDiff,
  SIMPLE_CHANGES,
  HEADER_CHANGES,
  HEADER_ONLY_CHANGES,
  SHUFFLED_CHANGES,
} from '../utils/test/models/test-utils'

describe('Hunk – happy path', () => {
  it('given simple hunk, when created, expect correct header', () => {
    // GIVEN
    const oldStart = 1
    const oldLines = 2
    const newStart = 1
    const newLines = 2
    const changes = SIMPLE_CHANGES

    // WHEN
    const hunk = new Hunk(oldStart, oldLines, newStart, newLines, changes, '')

    // EXPECT
    expect(hunk.oldStart).toBe(1)
    expect(hunk.oldLines).toBe(2)
    expect(hunk.newStart).toBe(1)
    expect(hunk.newLines).toBe(2)
    expect(hunk.header).toBe('@@ -1,2 +1,2 @@ +added line')
    expect(hunk.contentLines).toEqual([hunk.header, '+added line', ' unchanged line'])
  })

  it('given shuffled changes, when created, expect correct content', () => {
    // GIVEN
    const oldStart = 1
    const oldLines = 2
    const newStart = 1
    const newLines = 2
    const changes = SHUFFLED_CHANGES

    // WHEN
    const hunk = new Hunk(oldStart, oldLines, newStart, newLines, changes, '')

    // EXPECT
    expect(hunk.contentLines[1]).toBe(' line 2')
    expect(hunk.contentLines[2]).toBe(' line 1')
  })
})

describe('Hunk – pre-existing diff header edge cases', () => {
  it('given existing header, when created, expect recalculated header', () => {
    // GIVEN
    const oldStart = 58
    const oldLines = 2
    const newStart = 58
    const newLines = 2
    const changes = HEADER_CHANGES

    // WHEN
    const hunk = new Hunk(oldStart, oldLines, newStart, newLines, changes, '')

    // EXPECT
    expect(hunk.header).toBe('@@ -58,2 +58,2 @@ import type {')
    expect(hunk.contentLines).toEqual([hunk.header, '   FulfilledThenable,', '   RejectedThenable,'])
  })

  it('given header-only hunk, when created, expect zero ranges', () => {
    // GIVEN
    const oldStart = 100
    const oldLines = 0
    const newStart = 100
    const newLines = 0
    const changes = HEADER_ONLY_CHANGES

    // WHEN
    const hunk = new Hunk(oldStart, oldLines, newStart, newLines, changes, '')

    // EXPECT
    expect(hunk.header).toBe('@@ -100,0 +100,0 @@ lone header')
    expect(hunk.contentLines).toEqual([hunk.header])
  })
})

describe('Hunk – additional properties', () => {
  it('given file path, when created, expect preserved file path', () => {
    // GIVEN
    const filePath = 'src/components/MyComponent.tsx'
    const changes = [createLineDiff('+new line', 'add', null, 1)]

    // WHEN
    const hunk = new Hunk(1, 1, 1, 1, changes, filePath)

    // EXPECT
    expect(hunk.filePath).toBe(filePath)
  })

  it('given no changes, when created, expect empty header', () => {
    // GIVEN
    const changes: DiffLine[] = []

    // WHEN
    const hunk = new Hunk(1, 0, 1, 0, changes, '')

    // EXPECT
    expect(hunk.header).toBe('')
    expect(hunk.contentLines).toEqual([''])
  })

  it('given context line at start of file, when created, expect no header', () => {
    // GIVEN
    const changes = [createLineDiff(' unchanged line', 'context', 1, 1)]

    // WHEN
    const hunk = new Hunk(1, 1, 1, 1, changes, '')

    // EXPECT
    expect(hunk.header).toBe('')
    expect(hunk.contentLines).toEqual(['', ' unchanged line'])
  })
})
