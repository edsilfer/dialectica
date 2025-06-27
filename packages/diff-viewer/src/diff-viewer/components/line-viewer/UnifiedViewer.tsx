import { css } from '@emotion/react'
import React, { useContext } from 'react'
import type { DisplayConfig } from '../../types'
import type { LineWithHighlight } from './line-utils'
import DiffLine from './DiffLine'
import { ThemeContext } from '../../../shared/providers/theme-provider'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: table;
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      background-color: ${theme.colors.hunkViewerBg};
    `,
  }
}

interface UnifiedViewerProps {
  /** Flattened list of diff lines (already highlighted) */
  lines: LineWithHighlight[]
  /** Display options */
  config: DisplayConfig
}

const UnifiedViewer: React.FC<UnifiedViewerProps> = ({ lines, config }) => {
  const styles = useStyles()

  return (
    <table css={styles.container}>
      <colgroup>
        <col style={{ width: '50px' }} /> {/* Left line number */}
        <col style={{ width: '50px' }} /> {/* Right line number */}
        <col style={{ width: '25px' }} /> {/* Prefix (+/-) */}
        <col /> {/* Code */}
      </colgroup>
      <tbody>
        {lines.map((line, i) => (
          <DiffLine
            key={i === 0 ? 'hunk-header' : `${line.type}-${i}`}
            leftNumber={line.lineNumberOld}
            rightNumber={line.lineNumberNew}
            content={line.highlightedContent}
            showNumber={!!config.showLineNumbers}
            type={line.type}
            onAddButtonClick={() => console.log('Add comment clicked')}
          />
        ))}
      </tbody>
    </table>
  )
}

export default UnifiedViewer
