import { css } from '@emotion/react'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'
import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../providers/theme-provider.js'
import type { DisplayConfig, Hunk } from '../../types/diff'
import HunkLine from './HunkLine'

/**
 * - When highlighting can parse the content, it will be returned as is.
 * - Otherwise, it will be escaped to prevent XSS and broken rendering.
 */
const escapeHtml = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;')

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      background-color: ${theme.colors.hunkViewerBg};
    `,
  }
}

interface UnifiedHunkViewerProps {
  /** The hunk to display */
  hunk: Hunk
  /** The display configuration options */
  config: DisplayConfig
  /** The language of the file */
  language: string
}

const UnifiedHunkViewer: React.FC<UnifiedHunkViewerProps> = ({ hunk, config, language }) => {
  const styles = useStyles()

  const allLines = useMemo(() => {
    const headerLine = {
      type: 'hunk' as const,
      content: escapeHtml(hunk.content),
      lineNumberOld: null,
      lineNumberNew: null,
      highlightedContent: escapeHtml(hunk.content),
    }

    const contentLines = hunk.changes
      .filter((line) => line.content.trim() !== '')
      .map((line) => {
        const languageFmt = hljs.getLanguage(language)
        if (languageFmt) {
          const config = { language, ignoreIllegals: true }
          const highlighted = hljs.highlight(line.content, config).value
          return { ...line, highlightedContent: highlighted }
        } else {
          const highlighted = escapeHtml(line.content)
          return { ...line, highlightedContent: highlighted }
        }
      })

    return [headerLine, ...contentLines]
  }, [hunk.changes, hunk.content, language])

  return (
    <code css={styles.container}>
      {allLines.map((line, i) => (
        <HunkLine
          key={i === 0 ? 'hunk-header' : `${line.type}-${i}`}
          letfNumber={line.lineNumberOld}
          rightNumber={line.lineNumberNew}
          content={line.highlightedContent}
          showNumber={!!config.showLineNumbers}
          type={line.type}
        />
      ))}
    </code>
  )
}

export default UnifiedHunkViewer
