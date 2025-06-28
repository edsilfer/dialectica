import { css } from '@emotion/react'
import React, { useContext, forwardRef } from 'react'
import AddButton from '../../../shared/components/AddButton'
import { ThemeContext } from '../../../shared/providers/theme-provider'
import { DiffLineProps, DiffLineType } from './types'

const useStyles = (lineType: DiffLineType) => {
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

    numberContainer: (viewer: 'split' | 'unified' | undefined, side: 'left' | 'right') => css`
      ${sharedCellHeight};
      text-align: center;
      font-family: ${theme.typography.codeFontFamily};
      font-size: ${theme.typography.codeFontSize}px;
      padding: 0 ${theme.spacing.sm};
      background-color: ${LINE_TYPE_TO_NUMBER_BG_COLOR[lineType]};
      user-select: none;
      ${viewer === 'split' && side === 'right' && !['hunk', 'empty'].includes(lineType)
        ? `border-left: 1px solid ${theme.colors.borderBg}`
        : ''};
    `,

    prefixContainer: css`
      ${sharedCellHeight};
      position: relative;
      user-select: none;
      font-size: 0.85rem;
      text-align: center;
      font-family: ${theme.typography.codeFontFamily};
      padding: 0 ${theme.spacing.sm};
    `,

    codeContainer: css`
      ${sharedCellHeight};
      padding: 0 ${theme.spacing.sm};
      font-family: ${theme.typography.codeFontFamily};
      font-size: ${theme.typography.codeFontSize}px;
      white-space: pre-wrap;
      cursor: text;
      width: 100%;

      & > span {
        display: block;
        height: 100%;
        line-height: inherit;
        vertical-align: middle;
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

const DiffLine = forwardRef<HTMLTableRowElement, DiffLineProps>((props, ref) => {
  const styles = useStyles(props.type)

  return (
    <tr ref={ref} css={styles.container}>
      {!props.hideLeftNumber && (
        <td css={styles.numberContainer(props.view, 'left')}>
          {props.leftNumber !== null ? <span>{props.leftNumber}</span> : null}
        </td>
      )}

      {!props.hideRightNumber && (
        <td css={styles.numberContainer(props.view, 'right')}>
          {props.rightNumber !== null ? <span>{props.rightNumber}</span> : null}
        </td>
      )}

      <td css={styles.prefixContainer}>
        {props.type !== 'hunk' && (
          <AddButton
            css={styles.addButton}
            className="add-comment-btn"
            onClick={props.onAddButtonClick}
          />
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

export default DiffLine
