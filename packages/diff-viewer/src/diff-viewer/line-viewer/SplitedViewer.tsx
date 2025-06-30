import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-context'
import type { DiffViewerConfig } from '../types'
import type { SplitLinePair } from './line-utils'
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
      table-layout: fixed;
    `,
  }
}

interface SplitLineViewerProps {
  /** Pre-built left/right line pairs ready for rendering */
  pairs: SplitLinePair[]
  /** Display options */
  config: DiffViewerConfig
}

// ADD: factor out duplicated table markup into a helper component
const SideTable: React.FC<{
  side: 'left' | 'right'
  pairs: SplitLinePair[]
  config: DiffViewerConfig
  styles: ReturnType<typeof useStyles>
}> = ({ side, pairs, config, styles }) => {
  const isLeft = side === 'left'
  return (
    <table css={styles.sideTable}>
      <colgroup>
        <col style={{ width: '50px' }} /> {/* Line number (old on left, new on right) */}
        <col style={{ width: '25px' }} /> {/* Prefix (-/+) */}
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
              type={line ? (line.type as any) : 'context'}
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
