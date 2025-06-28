import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-provider'
import DiffLine from './DiffLine'
import useRowHeightSync from './hooks/use-row-height-sync'
import type { SplitLineViewerProps } from './types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: row;
      background-color: ${theme.colors.hunkViewerBg};
    `,

    table: css`
      width: 50%;
      border-collapse: collapse;
      table-layout: auto;
    `,
  }
}

const SplitedViewer: React.FC<SplitLineViewerProps> = ({ pairs, config }) => {
  const styles = useStyles()
  const registerRow = useRowHeightSync(pairs.length)

  return (
    <div css={styles.container}>
      {(['left', 'right'] as const).map((side) => {
        const isLeft = side === 'left'

        return (
          <table key={side} css={styles.table}>
            <colgroup>
              <col />
              <col />
              <col />
            </colgroup>
            <tbody>
              {pairs.map((pair, i) => {
                const line = isLeft ? pair.left : pair.right
                const isHeader = pair.left?.type === 'hunk' || pair.right?.type === 'hunk'

                return (
                  <DiffLine
                    ref={registerRow(side, i)}
                    key={`${side}-${i}`}
                    leftNumber={isLeft && line ? line.lineNumberOld : null}
                    rightNumber={!isLeft && line ? line.lineNumberNew : null}
                    hideRightNumber={isLeft}
                    hideLeftNumber={!isLeft}
                    content={!isLeft && isHeader ? '' : line ? line.highlightedContent : ''}
                    showNumber={!!config.showLineNumbers}
                    type={line ? (line.type as any) : 'empty'}
                    onAddButtonClick={() => console.log('Add comment clicked')}
                    view="split"
                  />
                )
              })}
            </tbody>
          </table>
        )
      })}
    </div>
  )
}

export default SplitedViewer
