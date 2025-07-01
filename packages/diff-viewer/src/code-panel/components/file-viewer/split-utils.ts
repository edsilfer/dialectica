import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'

import { Hunk } from '../../../shared/parsers/types'
import { LineWithHighlight } from '../line-viewer/types'
import { SplitLinePair } from './types'

/**
 * Escapes HTML entities so the string can be rendered safely when inserted via
 * `dangerouslySetInnerHTML`, preventing XSS and layout breaks.
 */
export const escapeHtml = (str: string): string => str.replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * PERFORMANCE NOTE
 * --------------
 * Highlighting each line with highlight.js is expensive and can be triggered
 * tens-of-thousands of times for large diffs. To keep runtime and memory under
 * control we cache results locally (so the cache is garbage-collected when the
 * component tree unmounts) and clear it once it grows above ~5k entries – a
 * safe upper bound for most real-world use-cases.
 */

/** Memoised cache of `language|content` → highlighted HTML. */
const highlightCache = new Map<string, string>()

/** Memoised result of `hljs.getLanguage(...)` look-ups. */
const languageSupportedCache = new Map<string, boolean>()

/** Lazily evaluates whether a language is supported by highlight.js. */
const isLanguageSupported = (lang: string): boolean => {
  let supported = languageSupportedCache.get(lang)
  if (supported === undefined) {
    supported = !!hljs.getLanguage(lang)
    languageSupportedCache.set(lang, supported)
  }
  return supported
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
  const cacheKey = `${language}||${content}`
  if (highlightCache.has(cacheKey)) return highlightCache.get(cacheKey) as string

  /**
   * Try to highlight. In case of failure (e.g. illegal syntax) or unsupported
   * language we fall back to a safely escaped string.
   */
  const highlighted = isLanguageSupported(language)
    ? (() => {
        try {
          return hljs.highlight(content, { language, ignoreIllegals: true }).value
        } catch {
          return escapeHtml(content)
        }
      })()
    : escapeHtml(content)

  highlightCache.set(cacheKey, highlighted)

  // Prevent unbounded memory growth.
  if (highlightCache.size > 5000) highlightCache.clear()

  return highlighted
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
  /** Helper to enrich a diff line with its highlighted representation. */
  const toHighlightedLine = (line: Hunk['changes'][number]): LineWithHighlight => ({
    ...line,
    highlightedContent: highlightContent(line.content, language),
  })

  /** Hunk header spans the full row in split view. */
  const header: LineWithHighlight = {
    type: 'hunk',
    content: escapeHtml(hunk.content),
    highlightedContent: escapeHtml(hunk.content),
    lineNumberOld: null,
    lineNumberNew: null,
  }

  const rows: SplitLinePair[] = []

  const pushContext = (line: Hunk['changes'][number]) => {
    const hl = toHighlightedLine(line)
    rows.push({ left: hl, right: hl })
  }

  const pushDelete = (line: Hunk['changes'][number]) => {
    rows.push({ left: toHighlightedLine(line), right: null })
  }

  const pushAdd = (line: Hunk['changes'][number]) => {
    const last = rows.at(-1)
    if (last?.left && !last.right && last.left.type === 'delete') {
      // Pair this addition with the previous deletion.
      last.right = toHighlightedLine(line)
    } else {
      rows.push({ left: null, right: toHighlightedLine(line) })
    }
  }

  hunk.changes.forEach((line) => {
    if (!line.content.trim()) return // skip pure-whitespace lines
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
    }
  })

  // Header must be the first rendered row.
  rows.unshift({ left: header, right: header })

  return rows
}
