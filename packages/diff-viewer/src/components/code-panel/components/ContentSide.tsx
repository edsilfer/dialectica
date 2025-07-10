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

interface ContentSideProps {
  /** The side of the content to render. */
  side: 'left' | 'right'
  /** The line to render. */
  line: DiffLineViewModel
  /** The overlay groups to render. */
  overlayGroups: Record<number, React.ReactNode[]>
  /** The function to load more lines. */
  onLoadMoreLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
}

const ContentSide: React.FC<ContentSideProps> = ({ side, line, overlayGroups, onLoadMoreLines }) => {
  const theme = useContext(ThemeContext)
  const styles = useMemo(() => getViewerStyles(theme), [theme])
  const lineType: DiffLineType = side === 'left' ? (line.typeLeft ?? 'empty') : (line.typeRight ?? 'empty')
  const lineNumber = side === 'left' ? line.lineNumberLeft : line.lineNumberRight
  const content = side === 'left' ? line.highlightedContentLeft : line.highlightedContentRight
  const numberCellStyle = side === 'left' ? styles.leftNumberCell[lineType] : styles.rightNumberCell[lineType]
  const sideClass = side === 'left' ? 'split-viewer-left-row' : 'split-viewer-right-row'
  const numberCellExtraStyle =
    side === 'left' ? { userSelect: 'none' as const, pointerEvents: 'none' as const } : undefined

  return (
    <>
      <td css={numberCellStyle} className={sideClass} style={numberCellExtraStyle}>
        {lineType === 'hunk' ? (
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

      <td css={styles.codeCell[lineType]} className={sideClass}>
        <span css={styles.lineType} style={{ userSelect: 'none' }}>
          {PREFIX[lineType]}
        </span>
        <span
          dangerouslySetInnerHTML={{
            __html: content ?? '&nbsp;',
          }}
        />
        <div css={styles.overlay} className="diff-view-overlay">
          {overlayGroups[1]}
        </div>
      </td>
    </>
  )
}

export default ContentSide
