import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import AddButton from '../../shared/AddButton'

type DiffLineType = 'add' | 'delete' | 'context' | 'hunk'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  const LINE_TYPE_TO_COLOR = {
    add: theme.colors.lineAddedBg,
    delete: theme.colors.lineRemovedBg,
    context: 'transparent',
    hunk: theme.colors.lineHunkBg,
  }

  const sharedCellHeight = css`
    vertical-align: middle;
    height: ${theme.typography.codeLineHeight}rem;
    line-height: ${theme.typography.codeLineHeight}rem;
  `

  return {
    container: (lineType: DiffLineType) => [
      css`
        display: table-row;
        color: ${theme.colors.textPrimary};
        cursor: default;
        position: relative;
        background-color: ${LINE_TYPE_TO_COLOR[lineType]};

        &:hover .add-comment-btn {
          opacity: 1;
          pointer-events: auto;
        }
      `,
    ],

    numberContainer: (side: 'left' | 'right') => css`
      ${sharedCellHeight};
      text-align: center;
      font-family: ${theme.typography.codeFontFamily};
      font-size: ${theme.typography.codeFontSize}px;
      padding: 0 ${theme.spacing.xs}px;
      border-${side}: 1px solid ${theme.colors.borderBg};
      user-select: none;
    `,

    prefixContainer: css`
      ${sharedCellHeight};
      position: relative;
      user-select: none;
      font-size: 0.85rem;
      text-align: center;
      font-family: ${theme.typography.codeFontFamily};
    `,

    codeContainer: css`
      ${sharedCellHeight};
      padding-left: ${theme.spacing.xs}px;
      font-family: ${theme.typography.codeFontFamily};
      font-size: ${theme.typography.codeFontSize}px;
      white-space: pre-wrap;
      cursor: text;

      & > span {
        display: block;
        height: 100%;
        line-height: inherit;
        vertical-align: middle;
      }
    `,

    addButton: css`
      position: absolute;
      transform: translateX(-50%) translateY(-50%);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease-in-out;
      z-index: 1;
    `,
  }
}

interface DiffLineProps {
  /** The line number of the left side of the hunk. If null, the line number is not shown. */
  leftNumber: number | null
  /** The line number of the right side of the hunk. If null, the line number is not shown. */
  rightNumber: number | null
  /** The content of the line */
  content: string
  /** Whether to show the line numbers */
  showNumber: boolean
  /** The type of the line */
  type: DiffLineType
  /** Whether to hide the left number column entirely */
  hideLeftNumber?: boolean
  /** Whether to hide the right number column entirely */
  hideRightNumber?: boolean

  /** The function to call when the add button is clicked */
  onAddButtonClick: () => void
}

const DiffLine: React.FC<DiffLineProps> = (props) => {
  const styles = useStyles()

  return (
    <tr css={styles.container(props.type)}>
      {!props.hideLeftNumber && (
        <td css={styles.numberContainer('left')}>
          {props.leftNumber !== null ? <span>{props.leftNumber}</span> : null}
        </td>
      )}

      {!props.hideRightNumber && (
        <td css={styles.numberContainer('right')}>
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
}

export default DiffLine
