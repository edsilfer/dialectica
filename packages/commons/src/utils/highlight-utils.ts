import hljs from 'highlight.js'

const CACHE_SIZE_LIMIT = 5000
/** Memoised `language|content` → highlighted HTML. */
const highlightCache = new Map<string, string>()
/** Memoised result of `hljs.getLanguage(...)`. */
const languageSupportedCache = new Map<string, boolean>()

export interface HighlightMatch {
  /** The start index of the match. */
  start: number
  /** The length of the match. */
  length: number
}

/**
 * Escapes angle brackets to prevent XSS when `dangerouslySetInnerHTML` is used.
 *
 * @param str - The string to escape.
 * @returns     The escaped string.
 */
const escapeHtml = (str: string): string => str.replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Checks if a language is supported by highlight.js with caching.
 *
 * @param lang - The language to check.
 * @returns      Whether the language is supported.
 */
const isLanguageSupported = (lang: string): boolean => {
  if (!languageSupportedCache.has(lang)) {
    languageSupportedCache.set(lang, !!hljs.getLanguage(lang))
  }
  return languageSupportedCache.get(lang)!
}

/**
 * Returns HTML‑highlighted code or safely escaped HTML when highlighting fails.
 *
 * @param content   - Raw source code to highlight.
 * @param language  - Explicit language of the snippet.
 * @param matches   - Contiguous ranges to visually mark.
 * @param style     - The style to apply to the highlighted matches.
 * @returns         The highlighted HTML.
 */
export const highlight = (content: string, language: string, matches?: HighlightMatch[], style?: string): string => {
  const _style = style ?? 'background-color: #ff0; font-weight: bold;'
  const html = getHighlightedHtml(content, language)
  return !matches?.length ? html : highlightMatches(html, matches, _style)
}

const getHighlightedHtml = (content: string, language: string): string => {
  const cacheKey = `${language}||${content}`
  if (highlightCache.has(cacheKey)) return highlightCache.get(cacheKey)!
  const html = isLanguageSupported(language) ? safeHighlight(content, language) : escapeHtml(content)
  highlightCache.set(cacheKey, html)
  if (highlightCache.size > CACHE_SIZE_LIMIT) highlightCache.clear()
  return html
}

const safeHighlight = (content: string, language: string): string => {
  try {
    return hljs.highlight(content, { language, ignoreIllegals: true }).value
  } catch {
    return escapeHtml(content)
  }
}

// Walks the highlighted HTML and wraps the requested ranges inside <span>
const highlightMatches = (html: string, matches: HighlightMatch[], style: string): string => {
  const dummy = document.createElement('div')
  dummy.innerHTML = html

  /* Build a flat list of text nodes with absolute offsets. */
  const nodes: { node: Text; start: number; end: number }[] = []
  let offset = 0

  const collectTextNodes = (n: Node): void => {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = n.textContent ?? ''
      nodes.push({ node: n as Text, start: offset, end: offset + text.length })
      offset += text.length
      return
    }
    for (const child of Array.from(n.childNodes)) collectTextNodes(child)
  }

  collectTextNodes(dummy)

  /* For each match, locate overlapping text nodes and wrap them. */
  matches.forEach(({ start, length }) => {
    let remaining = length
    for (const { node, start: nodeStart, end: nodeEnd } of nodes) {
      if (nodeEnd <= start || nodeStart >= start + remaining) continue

      const text = node.textContent
      if (!text) continue

      const relStart = Math.max(start - nodeStart, 0)
      const relEnd = Math.min(start + remaining - nodeStart, text.length)
      const before = text.slice(0, relStart)
      const match = text.slice(relStart, relEnd)
      const after = text.slice(relEnd)

      const span = document.createElement('span')
      span.setAttribute('style', style)
      span.textContent = match

      const fragment = document.createDocumentFragment()
      if (before) fragment.append(before)
      fragment.append(span)
      if (after) fragment.append(after)

      node.parentNode!.replaceChild(fragment, node)

      remaining -= relEnd - relStart
      if (remaining <= 0) break
    }
  })

  return dummy.innerHTML
}
