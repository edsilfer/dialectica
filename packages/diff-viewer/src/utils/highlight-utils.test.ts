import { describe, it, expect, vi } from 'vitest'

vi.mock('highlight.js/styles/github.css', () => ({}))

import { escapeHtml, highlightContent } from './highlight-utils'

describe('highlight-utils', () => {
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
})
