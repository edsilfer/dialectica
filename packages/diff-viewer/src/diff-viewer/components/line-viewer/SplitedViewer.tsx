import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-provider'
import SideTable from './SideTable'
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

const SplitedViewer: React.FC<SplitLineViewerProps> = ({ pairs, config }) => {
  const styles = useStyles()
  const registerRow = useRowHeightSync(pairs.length)

  return (
    <div css={styles.container}>
      {(['left', 'right'] as const).map((side) => (
        <SideTable
          key={side}
          side={side}
          pairs={pairs}
          config={config}
          tableStyle={styles.sideTable}
          rowRef={(index) => registerRow(side, index)}
        />
      ))}
    </div>
  )
}

export default SplitedViewer
