import { describe, it, expect, vi } from 'vitest'

vi.mock('highlight.js/styles/github.css', () => ({}))

import { parseSplitLines } from './line-utils'
import { escapeHtml, highlightContent } from './highlight-utils'
import { Hunk } from '../../../shared/parsers/types'

const SAMPLE_HUNK: Hunk = {
  content: '@@ -1,4 +1,4 @@',
  oldStart: 1,
  oldLines: 4,
  newStart: 1,
  newLines: 4,
  changes: [
    {
      type: 'context',
      content: 'function foo() {',
      lineNumberOld: 1,
      lineNumberNew: 1,
    },
    {
      type: 'delete',
      content: '  console.log("old")',
      lineNumberOld: 2,
      lineNumberNew: null,
    },
    {
      type: 'add',
      content: '  console.log("new")',
      lineNumberOld: null,
      lineNumberNew: 2,
    },
    {
      type: 'context',
      content: '}',
      lineNumberOld: 3,
      lineNumberNew: 3,
    },
  ],
}

describe('line-utils', () => {
  describe('escapeHtml', () => {
    it('should escape HTML entities correctly', () => {
      const unsafe = '<script>alert("xss")</script>'
      const escaped = escapeHtml(unsafe)
      expect(escaped).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
    })
  })

  describe('highlightContent', () => {
    it('should highlight supported languages (returns html with span tags)', () => {
      const code = 'const x = 1'
      const highlighted = highlightContent(code, 'typescript')
      expect(highlighted).toContain('<span')
    })

    it('should fall back to escaped html for unsupported languages', () => {
      const code = '1 < 2'
      const highlighted = highlightContent(code, 'unknown_lang')
      expect(highlighted).toBe('1 &lt; 2')
    })
  })

  describe('buildSplitHunkPairs', () => {
    const language = 'javascript'
    const rows = parseSplitLines(SAMPLE_HUNK, language)

    it('should prepend a header row', () => {
      expect(rows[0].typeLeft).toBe('hunk')
      expect(rows[0].contentLeft).toBe(SAMPLE_HUNK.content)
      expect(rows[0].typeRight).toBe('hunk')
      expect(rows[0].contentRight).toBe(SAMPLE_HUNK.content)
    })

    it('should duplicate context lines on both sides', () => {
      // The first context line is after the header, so index 1
      const contextRow = rows[1]
      expect(contextRow.typeLeft).toBe('context')
      expect(contextRow.typeRight).toBe('context')
      expect(contextRow.contentLeft).toBe('function foo() {')
      expect(contextRow.contentRight).toBe('function foo() {')
    })

    it('should pair deletions with subsequent additions', () => {
      // Row after the first context is the paired delete/add
      const diffRow = rows.find((r) => r.typeLeft === 'delete' && r.typeRight === 'add')
      expect(diffRow).toBeDefined()
      expect(diffRow!.contentLeft!.trim()).toBe('console.log("old")')
      expect(diffRow!.contentRight!.trim()).toBe('console.log("new")')
    })

    it('should include trailing context lines duplicated', () => {
      const lastRow = rows[rows.length - 1]
      expect(lastRow.typeLeft).toBe('context')
      expect(lastRow.typeRight).toBe('context')
      expect(lastRow.contentLeft).toBe('}')
    })

    it('should have the expected total number of rows', () => {
      // Header + 3 visual rows (context, delete/add, context)
      expect(rows).toHaveLength(4)
    })
  })
})
