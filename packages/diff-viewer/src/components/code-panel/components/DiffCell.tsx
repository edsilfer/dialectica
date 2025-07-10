import React, { useContext, useMemo } from 'react'
import { DiffLineType } from '../../../models/LineDiff'
import { ThemeContext } from '../../../themes/providers/theme-context'
import LoadMoreButton from '../../ui/buttons/LoadMoreButton'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import { getViewerStyles } from './shared-styles'
import { HunkDirection } from './types'

const PREFIX: Record<DiffLineType, string> = {
  add: '+',
  delete: '-',
  context: ' ',
  hunk: ' ',
  empty: ' ',
}

interface DiffCellProps {
  /** The line data to render */
  line: DiffLineViewModel
  /** The side to render ('left' | 'right' | 'unified') */
  side: 'left' | 'right' | 'unified'
  /** The line type for styling */
  lineType: DiffLineType
  /** Whether this is a hunk row */
  isHunk: boolean
  /** Overlay groups to render */
  overlayGroups: Record<number, React.ReactNode[]>
  /** CSS class name for the cells */
  className?: string
  /** Additional styles for number cell */
  numberCellStyle?: React.CSSProperties
  /** Function to load more lines */
  onLoadMoreLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
  /** Whether to render as unified view (includes both number cells) */
  unified?: boolean
}

const DiffCell: React.FC<DiffCellProps> = ({
  line,
  side,
  lineType,
  isHunk,
  overlayGroups,
  className,
  numberCellStyle,
  onLoadMoreLines,
  unified = false,
}) => {
  const theme = useContext(ThemeContext)
  const styles = useMemo(() => getViewerStyles(theme), [theme])
  const lineNumber = side === 'left' ? line.lineNumberLeft : line.lineNumberRight
  const content =
    side === 'left' ? (line.highlightedContentLeft ?? '&nbsp;') : (line.highlightedContentRight ?? '&nbsp;')
  const numberCellCss = side === 'left' ? styles.leftNumberCell[lineType] : styles.rightNumberCell[lineType]

  if (unified && isHunk) {
    // Special case for unified hunk rows
    return (
      <>
        <td colSpan={2} css={numberCellCss} className={className}>
          <LoadMoreButton
            direction={line.hunkDirection ?? 'out'}
            onClick={(_, direction) => onLoadMoreLines?.(line, direction)}
          />
        </td>
        <td css={styles.codeCell[lineType]} className={className}>
          <span css={styles.lineType}>{PREFIX[lineType]}</span>
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </td>
      </>
    )
  }

  if (unified) {
    // Unified view with separate left and right number cells
    return (
      <>
        <td css={styles.leftNumberCell[lineType]} className={className}>
          {line.lineNumberLeft}
          <div css={styles.overlay} className="diff-view-overlay">
            {overlayGroups[0]}
          </div>
        </td>
        <td css={styles.rightNumberCell[lineType]} className={className}>
          {line.lineNumberRight}
          <div css={styles.overlay} className="diff-view-overlay">
            {overlayGroups[1]}
          </div>
        </td>
        <td css={styles.codeCell[lineType]} className={className}>
          <span css={styles.lineType}>{PREFIX[lineType]}</span>
          <span dangerouslySetInnerHTML={{ __html: content }} />
          <div css={styles.overlay} className="diff-view-overlay">
            {overlayGroups[2]}
          </div>
        </td>
      </>
    )
  }

  // Split view - render single side
  return (
    <>
      <td css={numberCellCss} className={className} style={numberCellStyle}>
        {isHunk ? (
          <LoadMoreButton
            direction={line.hunkDirection ?? 'out'}
            onClick={(_, direction) => onLoadMoreLines?.(line, direction)}
          />
        ) : (
          lineNumber
        )}
        <div css={styles.overlay} className="diff-view-overlay">
          {overlayGroups[0]}
        </div>
      </td>
      <td css={styles.codeCell[lineType]} className={className}>
        <span css={styles.lineType} style={{ userSelect: 'none' }}>
          {PREFIX[lineType]}
        </span>
        <span dangerouslySetInnerHTML={{ __html: content }} />
        <div css={styles.overlay} className="diff-view-overlay">
          {overlayGroups[1]}
        </div>
      </td>
    </>
  )
}

export default DiffCell
