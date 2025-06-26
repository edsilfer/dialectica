import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'
import type { Hunk, DisplayConfig } from '../../types/diff'

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
 * Shared props for both UnifiedHunkViewer and SplitHunkViewer.
 */
export interface HunkViewerProps {
  /** The hunk to display */
  hunk: Hunk
  /** Display configuration options */
  config: DisplayConfig
  /** Detected language for syntax highlighting */
  language: string
}

// ADD: define LineWithHighlight and SplitLinePair along with builder utility
export type DiffLineType = 'add' | 'delete' | 'context' | 'hunk'

/**
 * Diff line augmented with a pre-computed syntax-highlighted HTML string.
 */
export interface LineWithHighlight {
  type: DiffLineType
  content: string
  highlightedContent: string
  lineNumberOld: number | null
  lineNumberNew: number | null
}

/**
 * Represents a single visual row in a split diff – the left and right halves.
 */
export interface SplitLinePair {
  left: LineWithHighlight | null
  right: LineWithHighlight | null
}

/**
 * Convert the changes inside a hunk into an array of left/right pairs that can be
 * consumed by the SplitHunkViewer component.
 *
 * The algorithm tries to pair consecutive deletions and additions so that they
 * appear on the same visual row. Context lines are duplicated on both sides
 * while the hunk header spans the full width.
 *
 * Empty diff lines (only whitespace) are ignored to avoid rendering blank rows.
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
