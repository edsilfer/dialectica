import React from 'react'
import DiffLine from './DiffLine'
import type { SideTableProps } from './types'

// Renders a table with the given pairs of lines
const SideTable: React.FC<SideTableProps> = ({ side, pairs, config, tableStyle, rowRef, view }) => {
  const isLeft = side === 'left'

  return (
    <table css={tableStyle}>
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
              ref={rowRef(i)}
              key={`${side}-${i}`}
              leftNumber={isLeft && line ? line.lineNumberOld : null}
              rightNumber={!isLeft && line ? line.lineNumberNew : null}
              hideRightNumber={isLeft}
              hideLeftNumber={!isLeft}
              content={!isLeft && isHeader ? '' : line ? line.highlightedContent : ''}
              showNumber={!!config.showLineNumbers}
              type={line ? (line.type as any) : 'empty'}
              onAddButtonClick={() => console.log('Add comment clicked')}
              view={view}
            />
          )
        })}
      </tbody>
    </table>
  )
}

export default SideTable
