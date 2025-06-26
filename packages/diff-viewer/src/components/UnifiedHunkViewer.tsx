import { css } from '@emotion/react'
import React, { useContext, useMemo, useState } from 'react'
import type { DiffLine, DisplayConfig, Hunk } from '../types/diff'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'
import { ThemeContext } from '../providers/theme-provider.js'
import AddButton from './AddButton.js'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  const baseLine = css`
    display: flex;
    align-items: center;
    line-height: ${theme.typography.codeLineHeight};
    color: ${theme.colors.textPrimary};
  `

  return {
    container: css`
      display: flex;
      flex-direction: column;
      background-color: ${theme.colors.hunkViewerBg};
    `,

    hunkHeader: [
      baseLine,
      css`
        background-color: ${theme.colors.lineHunkBg};
        line-height: 2rem;
      `,
    ],

    lineContainer: (type: DiffLine['type']) => {
      let backgroundColor = 'transparent'

      if (type === 'add') {
        backgroundColor = theme.colors.lineAddedBg
      } else if (type === 'delete') {
        backgroundColor = theme.colors.lineRemovedBg
      }

      return [
        baseLine,
        css`
          background-color: ${backgroundColor};
          cursor: default;
          position: relative;
        `,
      ]
    },

    lineNumberContainer: css`
      display: flex;
      flex-direction: row;
      min-width: 75px;
      justify-content: flex-end;
      gap: ${theme.spacing.sm};
      padding-left: ${theme.spacing.xs};
      padding-right: ${theme.spacing.md};
      border-right: 1px solid ${theme.colors.borderBg};
    `,

    codeContainer: css`
      padding-left: ${theme.spacing.xs};
      width: 100%;
      font-family: ${theme.typography.codeFontFamily};
      font-size: ${theme.typography.codeFontSize}px;
      white-space: pre-wrap;
    `,

    addButton: css`
      position: absolute;
      transform: translateX(-50%);
      left: 95px;
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
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)

  const getLinePrefix = (type: DiffLine['type']) => {
    switch (type) {
      case 'add':
        return ' + '
      case 'delete':
        return ' - '
      case 'context':
        // Keep the same spacing as the add/delete lines
        return '   '
      default:
        // Keep the same spacing as the add/delete lines
        return '   '
    }
  }

  const highlightedLines = useMemo(() => {
    return hunk.changes
      .filter((line) => line.content.trim() !== '')
      .map((line) => {
        const highlighted = hljs.getLanguage(language)
          ? hljs.highlight(line.content, { language, ignoreIllegals: true }).value
          : line.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')

        return { ...line, highlightedContent: highlighted }
      })
  }, [hunk.changes, language])

  return (
    <code css={styles.container}>
      <div css={styles.hunkHeader}>
        {config.showLineNumbers && <div css={styles.lineNumberContainer} />}
        <div css={styles.codeContainer}>{hunk.content}</div>
      </div>

      {highlightedLines.map((line, i) => {
        const isHovered = hoveredLine === i
        return (
          <div
            key={`${line.type}-${i}`}
            css={styles.lineContainer(line.type)}
            onMouseEnter={() => setHoveredLine(i)}
            onMouseLeave={() => setHoveredLine(null)}
          >
            {isHovered && (
              <AddButton
                css={styles.addButton}
                onClick={() => console.log('Add comment clicked')}
              />
            )}

            {config.showLineNumbers && (
              <div css={styles.lineNumberContainer}>
                {line.lineNumberOld && <span>{line.lineNumberOld}</span>}
                {line.lineNumberNew && <span>{line.lineNumberNew}</span>}
              </div>
            )}

            <div css={styles.codeContainer}>
              {getLinePrefix(line.type)}
              <span dangerouslySetInnerHTML={{ __html: line.highlightedContent }} />
            </div>
          </div>
        )
      })}
    </code>
  )
}

export default UnifiedHunkViewer
