import { css } from '@emotion/react'
import React, { useCallback, useContext } from 'react'
import AddButton from '../../../shared/components/buttons/AddButton'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { useCodePanelConfig } from '../../providers/code-panel-context'
import { DiffLineType, SplitLinePair } from './types'
import {
  COLUMN,
  getBgColor,
  getNumberBgColor,
  makeCellBase,
  makePrefixCellBase,
  makeSticky,
  containerStyle,
  rowStyle,
  addButtonStyle,
} from './style-utils'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  const BG = getBgColor(theme)
  const NUMBER_BG = getNumberBgColor(theme)

  const cellBase = makeCellBase(theme)
  const sticky = makeSticky

  return {
    container: containerStyle(theme),
    table: css`
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    `,
    row: rowStyle(theme),

    numberCell: (lineType: DiffLineType, offset: number, side: 'left' | 'right') => [
      cellBase,
      sticky(offset),
      css`
        width: ${COLUMN.number}px;
        text-align: center;
        user-select: none;
        background: ${NUMBER_BG[lineType]};
        ${side === 'right' && lineType !== 'hunk' ? `border-left: 1px solid ${theme.colors.border};` : ''};
      `,
    ],

    preffixWrapper: css`
      position: relative;
      height: 100%;
    `,

    prefixCell: (lineType: DiffLineType, offset: number) => makePrefixCellBase(theme, offset, BG[lineType]),

    codeCell: (lineType: DiffLineType, wrapLines: boolean) => [
      cellBase,
      css`
        white-space: ${wrapLines ? 'pre-wrap' : 'pre'};
        background: ${BG[lineType]};
      `,
    ],

    addButton: addButtonStyle,
  }
}

const SplitViewer: React.FC<{ pairs: SplitLinePair[] }> = ({ pairs }) => {
  const { config } = useCodePanelConfig()
  const styles = useStyles()

  const renderNumber = useCallback(
    (type: DiffLineType, no: number | null) => (no !== null ? <span>{no}</span> : null),
    [],
  )

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

  const isHunkHeader = (l: DiffLineType, r: DiffLineType) => l === 'hunk' || r === 'hunk'

  return (
    <div css={styles.container} data-diff-container>
      <table css={styles.table}>
        <colgroup>
          {config.showLineNumbers && <col style={{ width: COLUMN.number }} />}
          <col style={{ width: COLUMN.prefix }} />
          <col />
          {config.showLineNumbers && <col style={{ width: COLUMN.number }} />}
          <col style={{ width: COLUMN.prefix }} />
          <col />
        </colgroup>

        <tbody>
          {pairs.map(({ left, right }, idx) => {
            const leftType = left?.type ?? 'empty'
            const rightType = right?.type ?? 'empty'

            const offset = {
              leftNumber: 0,
              leftPrefix: config.showLineNumbers ? COLUMN.number : 0,
              rightNumber:
                (config.showLineNumbers ? COLUMN.number : 0) +
                COLUMN.prefix +
                (config.showLineNumbers ? COLUMN.number : 0),
              rightPrefix:
                (config.showLineNumbers ? COLUMN.number : 0) +
                COLUMN.prefix +
                (config.showLineNumbers ? COLUMN.number : 0) +
                COLUMN.prefix,
            }

            return (
              <tr key={idx} css={styles.row}>
                {/* LEFT SIDE */}
                {config.showLineNumbers && (
                  <td css={styles.numberCell(leftType, offset.leftNumber, 'left')} className="split-viewer-left-row">
                    {renderNumber(leftType, left?.lineNumberOld ?? null)}
                  </td>
                )}

                <td css={styles.prefixCell(leftType, offset.leftPrefix)} className="split-viewer-left-row">
                  {left && renderPrefix(leftType, () => console.log('Add comment clicked (left)'))}
                </td>

                <td css={styles.codeCell(leftType, true)} className="split-viewer-left-row">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: left?.highlightedContent ?? '&nbsp;',
                    }}
                  />
                </td>

                {/* RIGHT SIDE */}
                {config.showLineNumbers && (
                  <td
                    css={styles.numberCell(rightType, offset.rightNumber, 'right')}
                    className="split-viewer-right-row"
                  >
                    {renderNumber(rightType, right?.lineNumberNew ?? null)}
                  </td>
                )}

                <td css={styles.prefixCell(rightType, offset.rightPrefix)} className="split-viewer-right-row">
                  {right &&
                    !isHunkHeader(leftType, rightType) &&
                    renderPrefix(rightType, () => console.log('Add comment clicked (right)'))}
                </td>

                <td css={styles.codeCell(rightType, true)} className="split-viewer-right-row">
                  <span
                    dangerouslySetInnerHTML={{
                      __html:
                        !isHunkHeader(leftType, rightType) && right
                          ? right.highlightedContent
                          : isHunkHeader(leftType, rightType)
                            ? ''
                            : '&nbsp;',
                    }}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SplitViewer
