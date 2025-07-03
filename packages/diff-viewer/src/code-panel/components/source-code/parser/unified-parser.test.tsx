import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('highlight.js/styles/github.css', () => ({}))

import { LinePair } from '../../file-viewer/types'
import { UnifiedParser } from './unified-parser'
import {
  SAMPLE_FILE_DIFF,
  SAMPLE_HUNK,
  UNPAIRED_FILE,
  ADD_ONLY_FILE,
  MULTI_HUNK_FILE,
  SECOND_HUNK,
  EMPTY_FILE,
  CONTEXT_FILE,
  ADD_ONLY_EDGE_FILE,
  DELETE_ONLY_FILE,
} from '../../../../__fixtures__/parser-fixtures'

describe('UnifiedParser', () => {
  let parser: UnifiedParser

  beforeEach(() => {
    parser = new UnifiedParser()
  })

  describe('parse', () => {
    it('should parse a FileDiff and return LinePair array', () => {
      const result = parser.parse(SAMPLE_FILE_DIFF)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include hunk header as first row', () => {
      const result = parser.parse(SAMPLE_FILE_DIFF)

      expect(result[0].typeLeft).toBe('hunk')
      expect(result[0].contentLeft).toBe(SAMPLE_HUNK.content)
      expect(result[0].typeRight).toBe('hunk')
      expect(result[0].contentRight).toBe(SAMPLE_HUNK.content)
    })

    it('should process context lines correctly', () => {
      const result = parser.parse(SAMPLE_FILE_DIFF)

      // Find context lines (should be duplicated on both sides)
      const contextLines = result.filter((row: LinePair) => row.typeLeft === 'context' && row.typeRight === 'context')

      expect(contextLines).toHaveLength(2)

      const firstContext = contextLines[0]
      expect(firstContext.contentLeft).toBe('function foo() {')
      expect(firstContext.contentRight).toBe('function foo() {')
      expect(firstContext.lineNumberLeft).toBe(1)
      expect(firstContext.lineNumberRight).toBe(1)

      const secondContext = contextLines[1]
      expect(secondContext.contentLeft).toBe('}')
      expect(secondContext.contentRight).toBe('}')
      expect(secondContext.lineNumberLeft).toBe(3)
      expect(secondContext.lineNumberRight).toBe(3)
    })

    it('should process delete lines correctly', () => {
      const result = parser.parse(SAMPLE_FILE_DIFF)

      // Find delete lines (should be on left side only)
      const deleteLines = result.filter((row: LinePair) => row.typeLeft === 'delete' && row.typeRight === 'empty')

      expect(deleteLines).toHaveLength(1)

      const deleteLine = deleteLines[0]
      expect(deleteLine.contentLeft).toBe('  console.log("old")')
      expect(deleteLine.contentRight).toBeNull()
      expect(deleteLine.lineNumberLeft).toBe(2)
      expect(deleteLine.lineNumberRight).toBeNull()
    })

    it('should process add lines correctly', () => {
      const result = parser.parse(SAMPLE_FILE_DIFF)

      // Find add lines (should be on right side only)
      const addLines = result.filter((row: LinePair) => row.typeLeft === 'add' && row.typeRight === 'empty')

      expect(addLines).toHaveLength(1)

      const addLine = addLines[0]
      expect(addLine.contentLeft).toBe('  console.log("new")')
      expect(addLine.contentRight).toBeNull()
      expect(addLine.lineNumberLeft).toBeNull()
      expect(addLine.lineNumberRight).toBe(2)
    })

    it('should include synthetic expander for last hunk', () => {
      const result = parser.parse(SAMPLE_FILE_DIFF)

      const lastRow = result[result.length - 1]
      expect(lastRow.typeLeft).toBe('hunk')
      expect(lastRow.typeRight).toBe('hunk')
      expect(lastRow.hunkDirection).toBe('down')
    })

    it('should have the expected total number of rows', () => {
      const result = parser.parse(SAMPLE_FILE_DIFF)

      // Header + 4 change rows (context, delete, add, context) + synthetic expander
      expect(result).toHaveLength(6)
    })
  })

  describe('unpaired changes', () => {
    it('should handle unpaired delete lines', () => {
      const result = parser.parse(UNPAIRED_FILE)

      // Find the unpaired delete row
      const deleteRow = result.find((row: LinePair) => row.typeLeft === 'delete' && row.typeRight === 'empty')
      expect(deleteRow).toBeDefined()

      expect(deleteRow!.contentLeft).toBe('  return false')
      expect(deleteRow!.contentRight).toBeNull()
      expect(deleteRow!.lineNumberLeft).toBe(2)
      expect(deleteRow!.lineNumberRight).toBeNull()
    })

    it('should have correct total rows for unpaired changes', () => {
      const result = parser.parse(UNPAIRED_FILE)

      // Header + 3 change rows (context, delete, context) + synthetic expander
      expect(result).toHaveLength(5)
    })

    it('should handle unpaired add lines', () => {
      const result = parser.parse(ADD_ONLY_FILE)

      // Find the unpaired add row
      const addRow = result.find((row: LinePair) => row.typeLeft === 'add' && row.typeRight === 'empty')
      expect(addRow).toBeDefined()

      expect(addRow!.contentLeft).toBe('  return true')
      expect(addRow!.contentRight).toBeNull()
      expect(addRow!.lineNumberLeft).toBeNull()
      expect(addRow!.lineNumberRight).toBe(2)
    })
  })

  describe('multiple hunks', () => {
    it('should process multiple hunks correctly', () => {
      const result = parser.parse(MULTI_HUNK_FILE)

      // Should have headers for both hunks
      const hunkHeaders = result.filter((row: LinePair) => row.typeLeft === 'hunk' && row.contentLeft?.includes('@@'))
      expect(hunkHeaders).toHaveLength(2)
      expect(hunkHeaders[0].contentLeft).toBe(SAMPLE_HUNK.content)
      expect(hunkHeaders[1].contentLeft).toBe(SECOND_HUNK.content)

      // Should have correct hunk directions
      expect(hunkHeaders).toHaveLength(2)

      // First hunk should have 'down' direction (gap below)
      expect(hunkHeaders[0].hunkDirection).toBe('down')
      // Second hunk should have 'up' direction (gap above)
      expect(hunkHeaders[1].hunkDirection).toBe('up')

      // Should have synthetic expander at the end
      const expanders = result.filter((row: LinePair) => row.hunkDirection === 'down')
      expect(expanders).toHaveLength(2) // First hunk + synthetic expander

      // The synthetic expander should be the last row
      const syntheticExpander = result[result.length - 1]
      expect(syntheticExpander.hunkDirection).toBe('down')
      expect(syntheticExpander.contentLeft).toBe('') // Empty content for synthetic expander
    })

    it('should have correct total rows for multiple hunks', () => {
      const result = parser.parse(MULTI_HUNK_FILE)

      // 2 headers + 8 change rows (4 per hunk) + 1 synthetic expander
      expect(result).toHaveLength(11)
    })
  })

  describe('edge cases', () => {
    it('should handle empty hunks', () => {
      const result = parser.parse(EMPTY_FILE)

      // Should have header + synthetic expander
      expect(result).toHaveLength(2)
      expect(result[0].typeLeft).toBe('hunk')
      expect(result[1].hunkDirection).toBe('down')
    })

    it('should handle hunks with only context lines', () => {
      const result = parser.parse(CONTEXT_FILE)

      // Header + 3 context lines + synthetic expander
      expect(result).toHaveLength(5)

      const contextLines = result.filter((row: LinePair) => row.typeLeft === 'context')
      expect(contextLines).toHaveLength(3)
    })

    it('should handle hunks with only additions', () => {
      const result = parser.parse(ADD_ONLY_EDGE_FILE)

      // Header + 3 add lines + synthetic expander
      expect(result).toHaveLength(5)

      const addLines = result.filter((row: LinePair) => row.typeLeft === 'add')
      expect(addLines).toHaveLength(3)
    })

    it('should handle hunks with only deletions', () => {
      const result = parser.parse(DELETE_ONLY_FILE)

      // Header + 3 delete lines + synthetic expander
      expect(result).toHaveLength(5)

      const deleteLines = result.filter((row: LinePair) => row.typeLeft === 'delete')
      expect(deleteLines).toHaveLength(3)
    })
  })
})
