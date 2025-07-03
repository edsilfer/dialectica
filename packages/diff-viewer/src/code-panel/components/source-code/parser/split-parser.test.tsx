import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('highlight.js/styles/github.css', () => ({}))

import { LinePair } from '../../file-viewer/types'
import { SplitParser } from './split-parser'
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

describe('SplitParser', () => {
  let parser: SplitParser

  beforeEach(() => {
    parser = new SplitParser()
  })

  describe('parse', () => {
    it('should parse a FileDiff and return LinePair array', () => {
      const result: LinePair[] = parser.parse(SAMPLE_FILE_DIFF)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should include hunk header as first row', () => {
      const result: LinePair[] = parser.parse(SAMPLE_FILE_DIFF)

      expect(result[0].typeLeft).toBe('hunk')
      expect(result[0].contentLeft).toBe(SAMPLE_HUNK.content)
      expect(result[0].typeRight).toBe('hunk')
      expect(result[0].contentRight).toBe(SAMPLE_HUNK.content)
    })

    it('should process context lines correctly', () => {
      const result: LinePair[] = parser.parse(SAMPLE_FILE_DIFF)

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

    it('should pair delete and add lines in the same visual row', () => {
      const result: LinePair[] = parser.parse(SAMPLE_FILE_DIFF)

      // Find the paired delete/add row
      const pairedRow = result.find((row: LinePair) => row.typeLeft === 'delete' && row.typeRight === 'add')
      expect(pairedRow).toBeDefined()

      expect(pairedRow!.contentLeft).toBe('  console.log("old")')
      expect(pairedRow!.contentRight).toBe('  console.log("new")')
      expect(pairedRow!.lineNumberLeft).toBe(2)
      expect(pairedRow!.lineNumberRight).toBe(2)
    })

    it('should include synthetic expander for last hunk', () => {
      const result: LinePair[] = parser.parse(SAMPLE_FILE_DIFF)

      const lastRow = result[result.length - 1]
      expect(lastRow.typeLeft).toBe('hunk')
      expect(lastRow.typeRight).toBe('hunk')
      expect(lastRow.hunkDirection).toBe('down')
    })

    it('should have the expected total number of rows', () => {
      const result: LinePair[] = parser.parse(SAMPLE_FILE_DIFF)

      // Header + 3 visual rows (context, delete/add, context) + synthetic expander
      expect(result).toHaveLength(5)
    })
  })

  describe('unpaired changes', () => {
    it('should handle unpaired delete lines', () => {
      const result: LinePair[] = parser.parse(UNPAIRED_FILE)

      // Find the unpaired delete row
      const deleteRow = result.find((row: LinePair) => row.typeLeft === 'delete' && row.typeRight === 'empty')
      expect(deleteRow).toBeDefined()

      expect(deleteRow!.contentLeft).toBe('  return false')
      expect(deleteRow!.contentRight).toBeNull()
      expect(deleteRow!.lineNumberLeft).toBe(2)
      expect(deleteRow!.lineNumberRight).toBeNull()
    })

    it('should have correct total rows for unpaired changes', () => {
      const result: LinePair[] = parser.parse(UNPAIRED_FILE)

      // Header + 3 visual rows (context, delete, context) + synthetic expander
      expect(result).toHaveLength(5)
    })

    it('should handle unpaired add lines', () => {
      const result: LinePair[] = parser.parse(ADD_ONLY_FILE)

      // Find the unpaired add row
      const addRow = result.find((row: LinePair) => row.typeLeft === 'empty' && row.typeRight === 'add')
      expect(addRow).toBeDefined()

      expect(addRow!.contentLeft).toBeNull()
      expect(addRow!.contentRight).toBe('  return true')
      expect(addRow!.lineNumberLeft).toBeNull()
      expect(addRow!.lineNumberRight).toBe(2)
    })
  })

  describe('multiple hunks', () => {
    it('should process multiple hunks correctly', () => {
      const result: LinePair[] = parser.parse(MULTI_HUNK_FILE)

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
      const result: LinePair[] = parser.parse(MULTI_HUNK_FILE)

      // 2 headers + 6 change rows (3 per hunk) + 1 synthetic expander
      expect(result).toHaveLength(9)
    })
  })

  describe('edge cases', () => {
    it('should handle empty hunks', () => {
      const result: LinePair[] = parser.parse(EMPTY_FILE)

      // Should have header + synthetic expander
      expect(result).toHaveLength(2)
      expect(result[0].typeLeft).toBe('hunk')
      expect(result[1].hunkDirection).toBe('down')
    })

    it('should handle hunks with only context lines', () => {
      const result: LinePair[] = parser.parse(CONTEXT_FILE)

      // Header + 3 context lines + synthetic expander
      expect(result).toHaveLength(5)

      const contextLines = result.filter((row: LinePair) => row.typeLeft === 'context')
      expect(contextLines).toHaveLength(3)
    })

    it('should handle hunks with only additions', () => {
      const result: LinePair[] = parser.parse(ADD_ONLY_EDGE_FILE)

      // Header + 3 add lines + synthetic expander
      expect(result).toHaveLength(5)

      const addLines = result.filter((row: LinePair) => row.typeRight === 'add')
      expect(addLines).toHaveLength(3)
    })

    it('should handle hunks with only deletions', () => {
      const result: LinePair[] = parser.parse(DELETE_ONLY_FILE)

      // Header + 3 delete lines + synthetic expander
      expect(result).toHaveLength(5)

      const deleteLines = result.filter((row: LinePair) => row.typeLeft === 'delete')
      expect(deleteLines).toHaveLength(3)
    })
  })
})
