import { describe, expect, it, vi } from 'vitest'
import { DiffLine } from '../../../../shared/parsers/types'
import { DiffLineType } from '../../file-viewer/types'
import { HunkDirection } from '../models/HunkHeaderViewModel'
import { LinePairBuilder } from './commons'

vi.mock('../highlight-utils', () => ({
  highlightContent: vi.fn((content: string) => `<highlighted>${content}</highlighted>`),
}))

describe('LinePairBuilder', () => {
  describe('build', () => {
    const mockChange: DiffLine = {
      type: 'context',
      content: 'function test() {',
      lineNumberOld: 1,
      lineNumberNew: 1,
    }

    it('should build a LinePair with basic properties', () => {
      const input = {
        typeLeft: 'context' as DiffLineType,
        typeRight: 'context' as DiffLineType,
        contentLeft: 'function test() {',
        contentRight: 'function test() {',
        lineNumberLeft: 1,
        lineNumberRight: 1,
      }

      const result = LinePairBuilder.build(mockChange, 'javascript', input)

      expect(result).toEqual({
        typeLeft: 'context',
        contentLeft: 'function test() {',
        highlightedContentLeft: '<highlighted>function test() {</highlighted>',
        lineNumberLeft: 1,
        typeRight: 'context',
        contentRight: 'function test() {',
        highlightedContentRight: '<highlighted>function test() {</highlighted>',
        lineNumberRight: 1,
        hunkDirection: undefined,
      })
    })

    it('should handle null content values', () => {
      const input = {
        typeLeft: 'delete' as DiffLineType,
        typeRight: 'add' as DiffLineType,
        contentLeft: null,
        contentRight: 'new line',
        lineNumberLeft: 5,
        lineNumberRight: 5,
      }

      const result = LinePairBuilder.build(mockChange, 'typescript', input)

      expect(result).toEqual({
        typeLeft: 'delete',
        contentLeft: null,
        highlightedContentLeft: null,
        lineNumberLeft: 5,
        typeRight: 'add',
        contentRight: 'new line',
        highlightedContentRight: '<highlighted>function test() {</highlighted>',
        lineNumberRight: 5,
        hunkDirection: undefined,
      })
    })

    it('should use provided highlighted content when available', () => {
      const input = {
        typeLeft: 'context' as DiffLineType,
        typeRight: 'context' as DiffLineType,
        contentLeft: 'function test() {',
        contentRight: 'function test() {',
        highlightedContentLeft: '<custom-highlighted>function test() {</custom-highlighted>',
        highlightedContentRight: '<custom-highlighted>function test() {</custom-highlighted>',
        lineNumberLeft: 1,
        lineNumberRight: 1,
      }

      const result = LinePairBuilder.build(mockChange, 'javascript', input)

      expect(result.highlightedContentLeft).toBe('<custom-highlighted>function test() {</custom-highlighted>')
      expect(result.highlightedContentRight).toBe('<custom-highlighted>function test() {</custom-highlighted>')
    })

    it('should handle empty string content', () => {
      const input = {
        typeLeft: 'empty' as DiffLineType,
        typeRight: 'empty' as DiffLineType,
        contentLeft: '',
        contentRight: '',
        lineNumberLeft: null,
        lineNumberRight: null,
      }

      const result = LinePairBuilder.build(mockChange, 'javascript', input)

      expect(result).toEqual({
        typeLeft: 'empty',
        contentLeft: '',
        highlightedContentLeft: null,
        lineNumberLeft: null,
        typeRight: 'empty',
        contentRight: '',
        highlightedContentRight: null,
        lineNumberRight: null,
        hunkDirection: undefined,
      })
    })

    it('should handle different line types', () => {
      const testCases: Array<{
        typeLeft: DiffLineType
        typeRight: DiffLineType
        expectedLeft: DiffLineType
        expectedRight: DiffLineType
      }> = [
        { typeLeft: 'add', typeRight: 'add', expectedLeft: 'add', expectedRight: 'add' },
        { typeLeft: 'delete', typeRight: 'delete', expectedLeft: 'delete', expectedRight: 'delete' },
        { typeLeft: 'context', typeRight: 'context', expectedLeft: 'context', expectedRight: 'context' },
        { typeLeft: 'hunk', typeRight: 'hunk', expectedLeft: 'hunk', expectedRight: 'hunk' },
        { typeLeft: 'empty', typeRight: 'empty', expectedLeft: 'empty', expectedRight: 'empty' },
      ]

      testCases.forEach(({ typeLeft, typeRight, expectedLeft, expectedRight }) => {
        const input = {
          typeLeft,
          typeRight,
          contentLeft: 'test content',
          contentRight: 'test content',
          lineNumberLeft: 1,
          lineNumberRight: 1,
        }

        const result = LinePairBuilder.build(mockChange, 'javascript', input)

        expect(result.typeLeft).toBe(expectedLeft)
        expect(result.typeRight).toBe(expectedRight)
      })
    })

    it('should handle different programming languages', () => {
      const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'html', 'css']

      languages.forEach((language) => {
        const input = {
          typeLeft: 'context' as DiffLineType,
          typeRight: 'context' as DiffLineType,
          contentLeft: 'test content',
          contentRight: 'test content',
          lineNumberLeft: 1,
          lineNumberRight: 1,
        }

        const result = LinePairBuilder.build(mockChange, language, input)

        expect(result.highlightedContentLeft).toBe('<highlighted>function test() {</highlighted>')
        expect(result.highlightedContentRight).toBe('<highlighted>function test() {</highlighted>')
      })
    })

    it('should preserve hunkDirection when provided', () => {
      const input = {
        typeLeft: 'hunk' as DiffLineType,
        typeRight: 'hunk' as DiffLineType,
        contentLeft: '@@ -1,2 +1,2 @@',
        contentRight: '@@ -1,2 +1,2 @@',
        lineNumberLeft: null,
        lineNumberRight: null,
        hunkDirection: 'up' as HunkDirection,
      }

      const result = LinePairBuilder.build(mockChange, 'javascript', input)

      expect(result.hunkDirection).toBe('up')
    })

    it('should handle mixed content scenarios', () => {
      const input = {
        typeLeft: 'delete' as DiffLineType,
        typeRight: 'add' as DiffLineType,
        contentLeft: 'old line',
        contentRight: 'new line',
        lineNumberLeft: 10,
        lineNumberRight: 10,
      }

      const result = LinePairBuilder.build(mockChange, 'javascript', input)

      expect(result.typeLeft).toBe('delete')
      expect(result.typeRight).toBe('add')
      expect(result.contentLeft).toBe('old line')
      expect(result.contentRight).toBe('new line')
      expect(result.lineNumberLeft).toBe(10)
      expect(result.lineNumberRight).toBe(10)
      expect(result.highlightedContentLeft).toBe('<highlighted>function test() {</highlighted>')
      expect(result.highlightedContentRight).toBe('<highlighted>function test() {</highlighted>')
    })
  })

  describe('buildPlaceholder', () => {
    it('should build a placeholder for "up" direction', () => {
      const result = LinePairBuilder.placeholder('up')

      expect(result).toEqual({
        typeLeft: 'hunk',
        contentLeft: '',
        highlightedContentLeft: '',
        lineNumberLeft: null,
        typeRight: 'hunk',
        contentRight: '',
        highlightedContentRight: '',
        lineNumberRight: null,
        hunkDirection: 'up',
      })
    })

    it('should build a placeholder for "down" direction', () => {
      const result = LinePairBuilder.placeholder('down')

      expect(result).toEqual({
        typeLeft: 'hunk',
        contentLeft: '',
        highlightedContentLeft: '',
        lineNumberLeft: null,
        typeRight: 'hunk',
        contentRight: '',
        highlightedContentRight: '',
        lineNumberRight: null,
        hunkDirection: 'down',
      })
    })

    it('should build a placeholder for "in" direction', () => {
      const result = LinePairBuilder.placeholder('in')

      expect(result).toEqual({
        typeLeft: 'hunk',
        contentLeft: '',
        highlightedContentLeft: '',
        lineNumberLeft: null,
        typeRight: 'hunk',
        contentRight: '',
        highlightedContentRight: '',
        lineNumberRight: null,
        hunkDirection: 'in',
      })
    })

    it('should build a placeholder for "out" direction', () => {
      const result = LinePairBuilder.placeholder('out')

      expect(result).toEqual({
        typeLeft: 'hunk',
        contentLeft: '',
        highlightedContentLeft: '',
        lineNumberLeft: null,
        typeRight: 'hunk',
        contentRight: '',
        highlightedContentRight: '',
        lineNumberRight: null,
        hunkDirection: 'out',
      })
    })

    it('should always return the same structure regardless of direction', () => {
      const directions: HunkDirection[] = ['up', 'down', 'in', 'out']

      directions.forEach((direction) => {
        const result = LinePairBuilder.placeholder(direction)

        expect(result.typeLeft).toBe('hunk')
        expect(result.typeRight).toBe('hunk')
        expect(result.contentLeft).toBe('')
        expect(result.contentRight).toBe('')
        expect(result.highlightedContentLeft).toBe('')
        expect(result.highlightedContentRight).toBe('')
        expect(result.lineNumberLeft).toBe(null)
        expect(result.lineNumberRight).toBe(null)
        expect(result.hunkDirection).toBe(direction)
      })
    })
  })
})
