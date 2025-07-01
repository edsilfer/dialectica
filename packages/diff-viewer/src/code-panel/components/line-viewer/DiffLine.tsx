import { css } from '@emotion/react'
import React, { useContext, forwardRef } from 'react'
import AddButton from '../../../shared/components/buttons/AddButton'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { DiffLineProps, DiffLineType } from './types'
import LoadMoreLines from '../../../shared/icons/LoadMoreLines'

const useStyles = (lineType: DiffLineType, wrapLines: boolean) => {
  const theme = useContext(ThemeContext)

  const LINE_TYPE_TO_COLOR = {
    add: theme.colors.hunkViewerLineAddedBg,
    delete: theme.colors.hunkViewerLineRemovedBg,
    context: 'transparent',
    hunk: theme.colors.hunkViewerLineHunkBg,
    empty: theme.colors.hunkViewerLineEmptyBg,
  }

  const LINE_TYPE_TO_NUMBER_BG_COLOR = {
    add: theme.colors.hunkViewerLineNumberAddedBg,
    delete: theme.colors.hunkViewerLineNumberRemovedBg,
    context: theme.colors.hunkViewerLineNumberContextBg,
    hunk: theme.colors.hunkViewerLineNumberHunkBg,
    empty: theme.colors.hunkViewerLineNumberEmptyBg,
  }

  const sharedCellHeight = css`
    vertical-align: middle;
    height: ${theme.typography.codeLineHeight}rem;
    line-height: ${theme.typography.codeLineHeight}rem;
  `

  return {
    container: [
      css`
        display: table-row;
        color: ${theme.colors.textPrimary};
        cursor: default;
        position: relative;
        background-color: ${LINE_TYPE_TO_COLOR[lineType]};
        border-radius: ${theme.spacing.xs};
        width: 100%;

        &:hover .add-comment-btn {
          opacity: 1;
          pointer-events: auto;
        }

        /* Ensure empty lines extend to full width */
        ${lineType === 'empty' &&
        css`
          & > td {
            background-color: ${LINE_TYPE_TO_COLOR[lineType]};
          }
        `}
      `,
    ],

    getNumberContainer: (left: number) => [
      css`
        ${sharedCellHeight};
        text-align: center;
        font-family: ${theme.typography.codeFontFamily};
        font-size: ${theme.typography.codeFontSize}px;
        padding: 0 ${theme.spacing.sm};
        user-select: none;
        background-color: ${LINE_TYPE_TO_NUMBER_BG_COLOR[lineType]};
        position: sticky;
        z-index: 3;
        left: ${left}px;
      `,
    ],

    getPrefixContainer: (left: number) => [
      css`
        ${sharedCellHeight};
        position: relative;
        user-select: none;
        font-size: 0.85rem;
        text-align: center;
        font-family: ${theme.typography.codeFontFamily};
        padding: 0 ${theme.spacing.sm};
        background-color: ${LINE_TYPE_TO_COLOR[lineType]};
        position: sticky;
        z-index: 3;
        left: ${left}px;
      `,
    ],

    codeContainer: css`
      ${sharedCellHeight};
      padding: 0 ${theme.spacing.sm};
      font-family: ${theme.typography.codeFontFamily};
      font-size: ${theme.typography.codeFontSize}px;
      white-space: ${wrapLines ? 'pre-wrap' : 'pre'};
      cursor: text;
      width: 100%;

      & > span {
        display: block;
        height: 100%;
        line-height: inherit;
        vertical-align: middle;
        ${!wrapLines ? 'max-width: 100%;' : ''}
      }
    `,

    addButton: css`
      position: absolute;
      top: 50%;
      left: 0;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease-in-out;
      z-index: 1;
    `,
  }
}

const RawDiffLine = forwardRef<HTMLTableRowElement, DiffLineProps>(function DiffLine(props, ref) {
  const styles = useStyles(props.type, props.wrapLines ?? true)
  const rightOffset = props.stickyOffsets?.rightNumber ?? 0
  const prefixOffset = props.stickyOffsets?.prefix ?? 0

  return (
    <tr ref={ref} css={styles.container}>
      {!props.hideLeftNumber && (
        <td css={styles.getNumberContainer(0)}>
          {props.type === 'hunk' && (props.view === 'unified' || props.hideRightNumber) ? (
            <LoadMoreLines size={24} direction="bi-directional" />
          ) : props.leftNumber !== null ? (
            <span>{props.leftNumber}</span>
          ) : null}
        </td>
      )}

      {!props.hideRightNumber && (
        <td css={styles.getNumberContainer(rightOffset)}>
          {props.rightNumber !== null ? <span>{props.rightNumber}</span> : null}
        </td>
      )}

      <td css={styles.getPrefixContainer(prefixOffset)}>
        {props.type !== 'hunk' && (
          <AddButton css={styles.addButton} className="add-comment-btn" onClick={props.onAddButtonClick} />
        )}
        {props.type === 'add' && '+'}
        {props.type === 'delete' && '-'}
      </td>

      <td css={styles.codeContainer}>
        <span dangerouslySetInnerHTML={{ __html: props.content || '&nbsp;' }} />
      </td>
    </tr>
  )
})

const areEqual = (prev: DiffLineProps, next: DiffLineProps) => {
  // A very cheap shallow comparison – the vast majority of props are
  // primitives or stable references. If nothing changed, skip re-render.
  return (
    prev.content === next.content &&
    prev.leftNumber === next.leftNumber &&
    prev.rightNumber === next.rightNumber &&
    prev.type === next.type &&
    prev.wrapLines === next.wrapLines &&
    prev.view === next.view &&
    prev.showNumber === next.showNumber &&
    prev.hideLeftNumber === next.hideLeftNumber &&
    prev.hideRightNumber === next.hideRightNumber &&
    prev.stickyOffsets?.prefix === next.stickyOffsets?.prefix &&
    prev.stickyOffsets?.rightNumber === next.stickyOffsets?.rightNumber
  )
}

export default React.memo(RawDiffLine, areEqual)
