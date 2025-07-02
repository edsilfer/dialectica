import { css } from '@emotion/react'
import React, { useCallback, useContext, useMemo } from 'react'
import AddButton from '../../../shared/components/buttons/AddButton'
import LoadMoreLines from '../../../shared/icons/LoadMoreLines'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { useCodePanelConfig } from '../../providers/code-panel-context'
import {
  addButtonStyle,
  COLUMN,
  containerStyle,
  getBgColor,
  getNumberBgColor,
  makeCellBase,
  makePrefixCellBase,
  makeSticky,
  rowStyle,
} from './style-utils'
import { DiffLineType, UnifiedViewerProps } from './types'

const useStyles = (wrapLines: boolean) => {
  const theme = useContext(ThemeContext)
  const BG = getBgColor(theme)
  const NUMBER_BG = getNumberBgColor(theme)
  const cellBase = makeCellBase(theme)

  return useMemo(
    () => ({
      container: containerStyle(theme),

      table: css`
        width: 100%;
        border-collapse: collapse;
        table-layout: ${wrapLines ? 'auto' : 'fixed'};
      `,

      row: rowStyle(theme),
      addButton: addButtonStyle,

      numberCell: (offset: number, type: DiffLineType) => [
        cellBase,
        makeSticky(offset),
        css`
          width: ${COLUMN.number}px;
          text-align: center;
          user-select: none;
          background: ${NUMBER_BG[type]};
        `,
      ],

      preffixWrapper: css`
        position: relative;
        height: 100%;
      `,

      prefixCell: (offset: number, type: DiffLineType) => makePrefixCellBase(theme, offset, BG[type]),

      codeCell: (type: DiffLineType) => [
        cellBase,
        css`
          white-space: ${wrapLines ? 'pre-wrap' : 'pre'};
          background: ${BG[type]};
        `,
      ],
    }),
    [BG, NUMBER_BG, theme, wrapLines, cellBase],
  )
}

const UnifiedViewer: React.FC<UnifiedViewerProps> = (props) => {
  const { lines, wrapLines: initialWrapLines = true } = props
  const { config } = useCodePanelConfig()
  const styles = useStyles(initialWrapLines)

  const rightNumberOffset = config.showLineNumbers ? COLUMN.number : 0
  const prefixOffset = config.showLineNumbers ? COLUMN.number * 2 : 0

  const renderNumber = useCallback((no: number | null) => (no !== null ? <span>{no}</span> : null), [])

  const renderPrefix = useCallback(
    (type: DiffLineType, onAdd: () => void) => (
      <div css={styles.preffixWrapper}>
        {type !== 'hunk' && <AddButton css={styles.addButton} className="add-comment-btn" onClick={onAdd} />}
        {type === 'add' && '+'}
        {type === 'delete' && '-'}
      </div>
    ),
    [styles.addButton, styles.preffixWrapper],
  )

  return (
    <div css={styles.container} data-diff-container>
      <table css={styles.table}>
        <colgroup>
          {config.showLineNumbers && <col style={{ width: COLUMN.number }} />}
          {config.showLineNumbers && <col style={{ width: COLUMN.number }} />}
          <col style={{ width: COLUMN.prefix }} />
          <col />
        </colgroup>

        <tbody>
          {lines.map((line, idx) => {
            return (
              <tr key={idx === 0 ? 'hunk-header' : `${line.type}-${idx}`} css={styles.row}>
                {config.showLineNumbers && (
                  <td css={styles.numberCell(0, line.type)}>
                    {line.type === 'hunk' ? (
                      <LoadMoreLines size={24} direction="bi-directional" />
                    ) : (
                      renderNumber(line.lineNumberOld)
                    )}
                  </td>
                )}

                {config.showLineNumbers && (
                  <td css={styles.numberCell(rightNumberOffset, line.type)}>{renderNumber(line.lineNumberNew)}</td>
                )}

                <td css={styles.prefixCell(prefixOffset, line.type)}>
                  {renderPrefix(line.type, () => console.log('Add comment clicked'))}
                </td>

                <td css={styles.codeCell(line.type)}>
                  <span dangerouslySetInnerHTML={{ __html: line.highlightedContent || '&nbsp;' }} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default UnifiedViewer
