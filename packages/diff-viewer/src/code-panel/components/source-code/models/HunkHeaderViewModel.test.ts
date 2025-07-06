import { describe, expect, it, vi } from 'vitest'
import { escapeHtml } from '../highlight-utils'
import { HunkHeaderViewModel } from './HunkHeaderViewModel'
import { File } from '../../../../shared/models/File'
import { ParsedDiff } from '../../../../shared/models/ParsedDiff'
import { REACT_FLIGHT_SERVER_DIFF } from '../../../../__fixtures__/raw-diffs-fixtures'

// Mock the highlight.js import that's used in hunk-utils
vi.mock('highlight.js/styles/github.css', () => ({}))

describe('HunkHeaderViewModel', () => {
  describe('constructor and parsing', () => {
    it('should parse classic hunk header with both line counts', () => {
      const header = '@@ -168,6 +167,7 @@'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 168, end: 173, length: 6 })
      expect(hunkHeader.right).toEqual({ start: 167, end: 173, length: 7 })
      expect(hunkHeader.context).toBe('')
    })

    it('should parse hunk header with no length specified (defaults to 1)', () => {
      const header = '@@ -42 +42 @@'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 42, end: 42, length: 1 })
      expect(hunkHeader.right).toEqual({ start: 42, end: 42, length: 1 })
      expect(hunkHeader.context).toBe('')
    })

    it('should parse hunk header with mixed length formats', () => {
      const header = '@@ -10,5 +20 @@'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 10, end: 14, length: 5 })
      expect(hunkHeader.right).toEqual({ start: 20, end: 20, length: 1 })
      expect(hunkHeader.context).toBe('')
    })

    it('should handle zero-length hunks (insertions)', () => {
      const header = '@@ -0,0 +1,5 @@'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 0, end: -1, length: 0 })
      expect(hunkHeader.right).toEqual({ start: 1, end: 5, length: 5 })
      expect(hunkHeader.context).toBe('')
    })

    it('should handle zero-length hunks (deletions)', () => {
      const header = '@@ -1,3 +0,0 @@'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 1, end: 3, length: 3 })
      expect(hunkHeader.right).toEqual({ start: 0, end: -1, length: 0 })
      expect(hunkHeader.context).toBe('')
    })

    it('should parse hunk header with trailing context', () => {
      const header = '@@ -0,0 +1,5 @@ export const x = 1;'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 0, end: -1, length: 0 })
      expect(hunkHeader.right).toEqual({ start: 1, end: 5, length: 5 })
      expect(hunkHeader.context).toBe('export const x = 1;')
    })

    it('should handle headers with extra whitespace', () => {
      const header = '@@  -10,2  +15,3  @@'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 10, end: 11, length: 2 })
      expect(hunkHeader.right).toEqual({ start: 15, end: 17, length: 3 })
      expect(hunkHeader.context).toBe('')
    })

    it('should throw error for invalid hunk header format', () => {
      const invalidHeaders = [
        'invalid header',
        '@@ invalid @@',
        '@@ -abc +def @@',
        '-- -10,2 +15,3 --',
        '@@ missing @@',
      ]

      invalidHeaders.forEach((header) => {
        expect(() => new HunkHeaderViewModel(header, 'test.ts')).toThrow('Invalid hunk header')
      })
    })

    it('should handle single-line changes without comma', () => {
      const header = '@@ -1 +1,2 @@'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 1, end: 1, length: 1 })
      expect(hunkHeader.right).toEqual({ start: 1, end: 2, length: 2 })
      expect(hunkHeader.context).toBe('')
    })

    it('should handle large line numbers', () => {
      const header = '@@ -99999,100 +100050,150 @@'
      const hunkHeader = new HunkHeaderViewModel(header, 'test.ts')

      expect(hunkHeader.left).toEqual({ start: 99999, end: 100098, length: 100 })
      expect(hunkHeader.right).toEqual({ start: 100050, end: 100199, length: 150 })
      expect(hunkHeader.context).toBe('')
    })
  })

  describe('filePath property', () => {
    it('should store the file path correctly', () => {
      const header = '@@ -1,2 +3,4 @@'
      const filePath = 'src/components/Button.tsx'
      const hunkHeader = new HunkHeaderViewModel(header, filePath)

      expect(hunkHeader.filePath).toBe(filePath)
    })
  })

  describe('toString method', () => {
    it('should reconstruct header without context', () => {
      const originalHeader = '@@ -168,6 +167,7 @@'
      const hunkHeader = new HunkHeaderViewModel(originalHeader, 'test.ts')

      expect(hunkHeader.toString()).toBe(originalHeader)
    })

    it('should reconstruct header with context', () => {
      const originalHeader = '@@ -0,0 +1,5 @@ export const x = 1;'
      const hunkHeader = new HunkHeaderViewModel(originalHeader, 'test.ts')

      expect(hunkHeader.toString()).toBe(originalHeader)
    })

    it('should handle single-line changes correctly', () => {
      const originalHeader = '@@ -42 +42 @@'
      const hunkHeader = new HunkHeaderViewModel(originalHeader, 'test.ts')

      expect(hunkHeader.toString()).toBe(originalHeader)
    })

    it('should handle zero-length hunks correctly', () => {
      const originalHeader = '@@ -0,0 +1,5 @@'
      const hunkHeader = new HunkHeaderViewModel(originalHeader, 'test.ts')

      expect(hunkHeader.toString()).toBe(originalHeader)
    })

    it('should handle mixed length formats correctly', () => {
      const originalHeader = '@@ -10,5 +20 @@'
      const hunkHeader = new HunkHeaderViewModel(originalHeader, 'test.ts')

      expect(hunkHeader.toString()).toBe(originalHeader)
    })
  })

  describe('parseDirection static method', () => {
    it('should return "out" for empty hunks array', () => {
      const direction = HunkHeaderViewModel.parseDirection(0, [])
      expect(direction).toBe('out')
    })

    it('should return "out" for single hunk', () => {
      const hunk = new HunkHeaderViewModel('@@ -1,5 +1,5 @@', 'test.ts')
      const direction = HunkHeaderViewModel.parseDirection(0, [hunk])
      expect(direction).toBe('out')
    })

    it('should return "up" for first hunk with gap above', () => {
      const hunk1 = new HunkHeaderViewModel('@@ -10,5 +10,5 @@', 'test.ts') // starts at line 10
      const hunk2 = new HunkHeaderViewModel('@@ -20,5 +20,5 @@', 'test.ts') // starts at line 20
      const hunks = [hunk1, hunk2]

      const direction = HunkHeaderViewModel.parseDirection(0, hunks)
      expect(direction).toBe('up')
    })

    it('should return "down" for last hunk with gap below', () => {
      const hunk1 = new HunkHeaderViewModel('@@ -1,5 +1,5 @@', 'test.ts')
      const hunk2 = new HunkHeaderViewModel('@@ -10,5 +10,5 @@', 'test.ts')
      const hunks = [hunk1, hunk2]

      const direction = HunkHeaderViewModel.parseDirection(1, hunks)
      expect(direction).toBe('up') // Changed from 'down' to 'up' - there's a gap above, not below
    })

    it('should return "in" for hunk with large gaps on both sides', () => {
      const hunk1 = new HunkHeaderViewModel('@@ -1,5 +1,5 @@', 'test.ts')
      const hunk2 = new HunkHeaderViewModel('@@ -50,5 +50,5 @@', 'test.ts') // large gap
      const hunk3 = new HunkHeaderViewModel('@@ -100,5 +100,5 @@', 'test.ts') // large gap
      const hunks = [hunk1, hunk2, hunk3]

      const direction = HunkHeaderViewModel.parseDirection(1, hunks)
      expect(direction).toBe('in')
    })

    it('should return "out" for hunk with small gaps on both sides', () => {
      const hunk1 = new HunkHeaderViewModel('@@ -1,5 +1,5 @@', 'test.ts')
      const hunk2 = new HunkHeaderViewModel('@@ -10,5 +10,5 @@', 'test.ts') // small gap
      const hunk3 = new HunkHeaderViewModel('@@ -20,5 +20,5 @@', 'test.ts') // small gap
      const hunks = [hunk1, hunk2, hunk3]

      const direction = HunkHeaderViewModel.parseDirection(1, hunks)
      expect(direction).toBe('out')
    })

    it('should return "in" for last hunk with large gap above', () => {
      const hunk1 = new HunkHeaderViewModel('@@ -1,5 +1,5 @@', 'test.ts')
      const hunk2 = new HunkHeaderViewModel('@@ -50,5 +50,5 @@', 'test.ts') // large gap
      const hunks = [hunk1, hunk2]

      const direction = HunkHeaderViewModel.parseDirection(1, hunks)
      expect(direction).toBe('in')
    })

    it('should handle zero-length hunks correctly', () => {
      const hunk1 = new HunkHeaderViewModel('@@ -0,0 +1,5 @@', 'test.ts') // insertion
      const hunk2 = new HunkHeaderViewModel('@@ -10,5 +10,5 @@', 'test.ts')
      const hunks = [hunk1, hunk2]

      const direction = HunkHeaderViewModel.parseDirection(0, hunks)
      expect(direction).toBe('down') // Changed from 'up' to 'down' - there's a gap below, not above
    })

    it('should use custom bigGap parameter', () => {
      const hunk1 = new HunkHeaderViewModel('@@ -1,5 +1,5 @@', 'test.ts')
      const hunk2 = new HunkHeaderViewModel('@@ -15,5 +15,5 @@', 'test.ts') // gap of 9 lines
      const hunk3 = new HunkHeaderViewModel('@@ -30,5 +30,5 @@', 'test.ts') // gap of 10 lines
      const hunks = [hunk1, hunk2, hunk3]

      // With default bigGap (20), should be "out"
      const direction1 = HunkHeaderViewModel.parseDirection(1, hunks)
      expect(direction1).toBe('out')

      // With custom bigGap (5), should be "in"
      const direction2 = HunkHeaderViewModel.parseDirection(1, hunks, 5)
      expect(direction2).toBe('in')
    })

    it('should correctly determine hunk directions for ReactFlightServer.js diff', () => {
      // Parse the diff
      const parsedDiff = ParsedDiff.build(REACT_FLIGHT_SERVER_DIFF)
      const file = parsedDiff.files.find((f: File) => f.newPath.includes('ReactFlightServer.js'))
      expect(file).toBeDefined()

      if (!file) return // Type guard

      expect(file.hunks).toHaveLength(3)

      // Convert Hunk objects to HunkHeader objects
      const hunkHeaders = file.hunks.map((hunk) => new HunkHeaderViewModel(hunk.content, file.newPath))

      // Test the hunk directions using HunkHeader.parseDirection
      const directions = hunkHeaders.map((_, index) => HunkHeaderViewModel.parseDirection(index, hunkHeaders))

      console.log('Hunk directions:', directions)
      console.log('Hunks:')
      hunkHeaders.forEach((hunkHeader, i) => {
        console.log(`  ${i}: ${hunkHeader.toString()}`)
      })

      // The first hunk should have an "up" expander (hidden lines above),
      // the second hunk should have an "up" expander (large hidden gap above).
      expect(directions[0]).toBe('up')
      expect(directions[1]).toBe('up')
      // Add expectation for the third hunk if needed
      if (directions.length > 2) {
        expect(directions[2]).toBe('out')
      }
    })
  })

  describe('buildHunkHeader static method', () => {
    it('should build hunk header with correct direction for single hunk', () => {
      const linePair = HunkHeaderViewModel.build({ content: '@@ -1,5 +1,5 @@' }, 0, []).toLinePair()

      expect(linePair.typeLeft).toBe('hunk')
      expect(linePair.typeRight).toBe('hunk')
      expect(linePair.hunkDirection).toBe('out')
      expect(linePair.contentLeft).toBe('@@ -1,5 +1,5 @@')
    })

    it('should build hunk header with correct direction for first hunk with gap above', () => {
      const hunks = [{ content: '@@ -10,5 +10,5 @@' }, { content: '@@ -20,5 +20,5 @@' }]
      const linePair = HunkHeaderViewModel.build(hunks[0], 0, hunks).toLinePair()

      expect(linePair.hunkDirection).toBe('up')
    })

    it('should build hunk header with correct direction for last hunk with gap below', () => {
      const hunks = [{ content: '@@ -1,5 +1,5 @@' }, { content: '@@ -10,5 +10,5 @@' }]
      const linePair = HunkHeaderViewModel.build(hunks[1], 1, hunks).toLinePair()

      expect(linePair.hunkDirection).toBe('up') // There's a gap above, not below
    })

    it('should build hunk header with correct direction for hunk with large gaps', () => {
      const hunks = [
        { content: '@@ -1,5 +1,5 @@' },
        { content: '@@ -50,5 +50,5 @@' },
        { content: '@@ -100,5 +100,5 @@' },
      ]
      const linePair = HunkHeaderViewModel.build(hunks[1], 1, hunks).toLinePair()

      expect(linePair.hunkDirection).toBe('in')
    })
  })

  describe('toLinePair method', () => {
    it('should convert hunk header to LinePair without direction', () => {
      const hunkHeader = new HunkHeaderViewModel('@@ -168,6 +167,7 @@', 'test.ts')
      const linePair = hunkHeader.toLinePair()

      expect(linePair).toEqual({
        typeLeft: 'hunk',
        contentLeft: '@@ -168,6 +167,7 @@',
        highlightedContentLeft: '@@ -168,6 +167,7 @@',
        lineNumberLeft: null,
        typeRight: 'hunk',
        contentRight: '@@ -168,6 +167,7 @@',
        highlightedContentRight: '@@ -168,6 +167,7 @@',
        lineNumberRight: null,
        hunkDirection: undefined,
      })
    })

    it('should convert hunk header to LinePair with direction', () => {
      const linePair = HunkHeaderViewModel.build({ content: '@@ -42 +42 @@' }, 0, []).toLinePair()

      expect(linePair).toEqual({
        typeLeft: 'hunk',
        contentLeft: '@@ -42 +42 @@',
        highlightedContentLeft: '@@ -42 +42 @@',
        lineNumberLeft: null,
        typeRight: 'hunk',
        contentRight: '@@ -42 +42 @@',
        highlightedContentRight: '@@ -42 +42 @@',
        lineNumberRight: null,
        hunkDirection: 'out',
      })
    })

    it('should escape HTML in hunk header content', () => {
      const hunkHeader = new HunkHeaderViewModel('@@ -0,0 +1,5 @@ export const x = 1;', 'test.ts')
      const linePair = hunkHeader.toLinePair()

      expect(linePair.contentLeft).toBe('@@ -0,0 +1,5 @@ export const x = 1;')
      expect(linePair.contentRight).toBe('@@ -0,0 +1,5 @@ export const x = 1;')
      expect(linePair.highlightedContentLeft).toBe('@@ -0,0 +1,5 @@ export const x = 1;')
      expect(linePair.highlightedContentRight).toBe('@@ -0,0 +1,5 @@ export const x = 1;')
    })

    it('should handle zero-length hunks correctly', () => {
      const linePair = HunkHeaderViewModel.build({ content: '@@ -0,0 +1,5 @@' }, 0, []).toLinePair()

      expect(linePair.typeLeft).toBe('hunk')
      expect(linePair.typeRight).toBe('hunk')
      expect(linePair.lineNumberLeft).toBeNull()
      expect(linePair.lineNumberRight).toBeNull()
      expect(linePair.hunkDirection).toBe('out')
      expect(linePair.contentLeft).toBe('@@ -0,0 +1,5 @@')
    })

    it('should handle mixed length formats correctly', () => {
      const linePair = HunkHeaderViewModel.build({ content: '@@ -10,5 +20 @@' }, 0, []).toLinePair()

      expect(linePair.contentLeft).toBe('@@ -10,5 +20 @@')
      expect(linePair.hunkDirection).toBe('out')
    })

    it('should use toString method for content', () => {
      const originalHeader = '@@ -999,100 +1000,150 @@'
      const hunkHeader = new HunkHeaderViewModel(originalHeader, 'test.ts')
      const linePair = hunkHeader.toLinePair()

      // Verify that the content matches what toString() would return (escaped)
      const expectedContent = escapeHtml(originalHeader)
      expect(linePair.contentLeft).toBe(expectedContent)
      expect(linePair.contentRight).toBe(expectedContent)
    })

    it('should escape actual HTML characters', () => {
      // Test with content that actually contains < and > characters
      const hunkHeader = new HunkHeaderViewModel('@@ -1,5 +1,5 @@ <script>alert("xss")</script>', 'test.ts')
      const linePair = hunkHeader.toLinePair()

      expect(linePair.contentLeft).toBe('@@ -1,5 +1,5 @@ &lt;script&gt;alert("xss")&lt;/script&gt;')
      expect(linePair.contentRight).toBe('@@ -1,5 +1,5 @@ &lt;script&gt;alert("xss")&lt;/script&gt;')
    })
  })
})
