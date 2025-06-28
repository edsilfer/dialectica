import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-provider'
import type { DisplayConfig } from '../../types'
import type { SplitLinePair } from './types'
import DiffLine from './DiffLine'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: row;
      background-color: ${theme.colors.hunkViewerBg};
    `,

    sideTable: css`
      width: 50%;
      border-collapse: collapse;
      table-layout: auto;

      /* Ensure correct borders for the line-number column */
      /* Left panel (first table): show ONLY the right border */
      &:first-of-type td:first-of-type {
        border-left: none !important;
        border-right: 1px solid ${theme.colors.borderBg};
      }

      /* Right panel (second table): show BOTH left and right borders */
      &:not(:first-of-type) td:first-of-type {
        border-left: 1px solid ${theme.colors.borderBg};
        border-right: 1px solid ${theme.colors.borderBg};
      }
    `,
  }
}

interface SplitLineViewerProps {
  /** Pre-built left/right line pairs ready for rendering */
  pairs: SplitLinePair[]
  /** Display options */
  config: DisplayConfig
}

// ADD: factor out duplicated table markup into a helper component
const SideTable: React.FC<{
  side: 'left' | 'right'
  pairs: SplitLinePair[]
  config: DisplayConfig
  styles: ReturnType<typeof useStyles>
}> = ({ side, pairs, config, styles }) => {
  const isLeft = side === 'left'
  return (
    <table css={styles.sideTable}>
      <colgroup>
        {/* Columns without explicit widths so they expand to fit their widest cell */}
        <col /> {/* Line number (old on left, new on right) */}
        <col /> {/* Prefix (-/+) */}
        <col /> {/* Code */}
      </colgroup>
      <tbody>
        {pairs.map((pair, i) => {
          const line = isLeft ? pair.left : pair.right
          const isHeader = pair.left?.type === 'hunk' || pair.right?.type === 'hunk'

          return (
            <DiffLine
              key={`${side}-${i}`}
              leftNumber={isLeft && line ? line.lineNumberOld : null}
              rightNumber={!isLeft && line ? line.lineNumberNew : null}
              hideRightNumber={isLeft}
              hideLeftNumber={!isLeft}
              content={!isLeft && isHeader ? '' : line ? line.highlightedContent : ''}
              showNumber={!!config.showLineNumbers}
              type={line ? (line.type as any) : 'empty'}
              onAddButtonClick={() => console.log('Add comment clicked')}
            />
          )
        })}
      </tbody>
    </table>
  )
}

const SplitedViewer: React.FC<SplitLineViewerProps> = ({ pairs, config }) => {
  const styles = useStyles()

  return (
    <div css={styles.container}>
      {(['left', 'right'] as const).map((side) => (
        <SideTable key={side} side={side} pairs={pairs} config={config} styles={styles} />
      ))}
    </div>
  )
}

export default SplitedViewer
