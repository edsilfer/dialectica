import { describe, it, expect, vi } from 'vitest'

vi.mock('highlight.js/styles/github.css', () => ({}))

import { escapeHtml, highlightContent, buildSplitHunkPairs } from './line-utils'
import type { Hunk } from '../../types'

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
    const pairs = buildSplitHunkPairs(SAMPLE_HUNK, language)

    it('should prepend a header row', () => {
      expect(pairs[0].left?.type).toBe('hunk')
      expect(pairs[0].left?.content).toBe(SAMPLE_HUNK.content)
      expect(pairs[0].right).toStrictEqual(pairs[0].left)
    })

    it('should duplicate context lines on both sides', () => {
      // The first context line is after the header, so index 1
      const contextRow = pairs[1]
      expect(contextRow.left?.type).toBe('context')
      expect(contextRow.right?.type).toBe('context')
      expect(contextRow.left?.content).toBe('function foo() {')
      expect(contextRow.right?.content).toBe('function foo() {')
    })

    it('should pair deletions with subsequent additions', () => {
      // Row after the first context is the paired delete/add
      const diffRow = pairs.find((r) => r.left?.type === 'delete' && r.right?.type === 'add')
      expect(diffRow).toBeDefined()
      expect(diffRow!.left!.content.trim()).toBe('console.log("old")')
      expect(diffRow!.right!.content.trim()).toBe('console.log("new")')
    })

    it('should include trailing context lines duplicated', () => {
      const lastRow = pairs[pairs.length - 1]
      expect(lastRow.left?.type).toBe('context')
      expect(lastRow.right?.type).toBe('context')
      expect(lastRow.left?.content).toBe('}')
    })

    it('should have the expected total number of rows', () => {
      // Header + 3 visual rows (context, delete/add, context)
      expect(pairs).toHaveLength(4)
    })
  })
})
