import hljs from 'highlight.js'

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
