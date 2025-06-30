import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'
import { Hunk } from '../../../shared/parsers/types'
import { LineWithHighlight } from '../line-viewer/types'
import { SplitLinePair } from './types'

/**
 * Escapes HTML entities so the string can be rendered safely inside \n
 * `dangerouslySetInnerHTML` without executing scripts or breaking layout.
 *
 * @param str - The string to escape.
 * @returns   - The escaped string.
 */
export const escapeHtml = (str: string): string => {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * - Try to highlight the code using highlight.js
 * - If it fails, default to escaped HTML
 *
 * @param content  - The code snippet to highlight.
 * @param language - The language of the code snippet.
 * @returns        - The highlighted code snippet.
 */
export const highlightContent = (content: string, language: string): string => {
  const languageFmt = hljs.getLanguage(language)
  if (languageFmt) {
    try {
      return hljs.highlight(content, { language, ignoreIllegals: true }).value
    } catch {
      /* ignore – fallback to escaped */
    }
  }
  return escapeHtml(content)
}

/**
 * Build pairs of lines for a hunk.
 *
 * The algorithm tries to:
 * 1. Pair consecutive deletions and additions - so that they appear on the same visual row.
 * 2. Duplicate context lines on both sides.
 * 3. Span the hunk header across the full width.
 * 4. Ignore empty diff lines (only whitespace) to avoid rendering blank rows.
 *
 * @param hunk     - The hunk to build pairs for.
 * @param language - The language of the code snippet.
 * @returns        - The pairs of lines.
 */
export const buildSplitHunkPairs = (hunk: Hunk, language: string): SplitLinePair[] => {
  // Helper to build the @@ header line that spans the whole row.
  const headerLine: LineWithHighlight = {
    type: 'hunk',
    content: escapeHtml(hunk.content),
    highlightedContent: escapeHtml(hunk.content),
    lineNumberOld: null,
    lineNumberNew: null,
  }

  const rows: SplitLinePair[] = []

  const pushContext = (line: Hunk['changes'][number]) => {
    const highlighted = highlightContent(line.content, language)
    rows.push({
      left: {
        ...line,
        highlightedContent: highlighted,
      } as LineWithHighlight,
      right: {
        ...line,
        highlightedContent: highlighted,
      } as LineWithHighlight,
    })
  }

  const pushDelete = (line: Hunk['changes'][number]) => {
    const highlighted = highlightContent(line.content, language)
    rows.push({
      left: { ...line, highlightedContent: highlighted } as LineWithHighlight,
      right: null,
    })
  }

  const pushAdd = (line: Hunk['changes'][number]) => {
    const highlighted = highlightContent(line.content, language)
    const last = rows[rows.length - 1]
    if (last && last.left && last.right === null && last.left.type === 'delete') {
      // Pair this addition with the previous deletion
      last.right = { ...line, highlightedContent: highlighted } as LineWithHighlight
    } else {
      rows.push({
        left: null,
        right: { ...line, highlightedContent: highlighted } as LineWithHighlight,
      })
    }
  }

  hunk.changes.forEach((line) => {
    if (line.content.trim() === '') return // skip empty lines
    switch (line.type) {
      case 'context':
        pushContext(line)
        break
      case 'delete':
        pushDelete(line)
        break
      case 'add':
        pushAdd(line)
        break
      default:
        break
    }
  })

  // Prepend header row so it is rendered first.
  rows.unshift({ left: headerLine, right: headerLine })

  return rows
}
