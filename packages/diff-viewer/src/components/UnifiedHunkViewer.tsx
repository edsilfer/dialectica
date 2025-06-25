import { css } from '@emotion/react'
import { theme } from 'antd'
import React, { useMemo, useState } from 'react'
import type { DiffLine, DisplayConfig, Hunk } from '../types/diff'
import { green, red } from '@ant-design/colors'
import { PlusOutlined } from '@ant-design/icons'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github.css'

const useStyles = () => {
  const { token } = theme.useToken()

  const baseLine = css`
    display: flex;
    align-items: center;
    line-height: 1.6;
  `

  return {
    container: css`
      display: flex;
      flex-direction: column;
    `,

    hunkHeader: [
      baseLine,
      css`
        background-color: ${token.colorFillQuaternary};
        line-height: 2rem;
      `,
    ],

    lineContainer: (type: DiffLine['type']) => {
      let backgroundColor = 'transparent'

      if (type === 'add') {
        backgroundColor = green[1]
      } else if (type === 'delete') {
        backgroundColor = red[1]
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
      gap: ${token.paddingSM}px;
      padding: 0 ${token.paddingXS}px;
      border-right: 1px solid ${token.colorBorder};
    `,

    codeContainer: css`
      padding-left: ${token.paddingXS}px;
      width: 100%;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: ${token.fontSizeSM}px;
      white-space: pre-wrap;
    `,

    addComment: css`
      position: absolute;
      left: 91px;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      background-color: ${token.colorPrimary};
      color: white;
      border: none;
      border-radius: ${token.borderRadiusSM}px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
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
        return ' '
      default:
        return ' '
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
              <button css={styles.addComment}>
                <PlusOutlined />
              </button>
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
