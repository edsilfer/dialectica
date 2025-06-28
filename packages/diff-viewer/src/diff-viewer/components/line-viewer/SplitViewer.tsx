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
      {(['left', 'right'] as const).map((side) => (
        <SideTable
          key={side}
          side={side}
          pairs={pairs}
          config={config}
          tableStyle={styles.table}
          rowRef={(index) => registerRow(side, index)}
          view="split"
        />
      ))}
    </div>
  )
}

export default SplitedViewer
