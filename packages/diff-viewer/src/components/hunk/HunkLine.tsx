import { css } from '@emotion/react'
import React, { useContext, useState } from 'react'
import { ThemeContext } from '../../providers/theme-provider.js'
import AddButton from '../shared/AddButton.js'

type DiffLineType = 'add' | 'delete' | 'context' | 'hunk'

const useStyles = () => {
  const theme = useContext(ThemeContext)
  const LINE_TYPE_TO_COLOR = {
    add: theme.colors.lineAddedBg,
    delete: theme.colors.lineRemovedBg,
    context: 'transparent',
    hunk: theme.colors.lineHunkBg,
  }

  return {
    container: (lineType: DiffLineType) => {
      return [
        css`
          display: flex;
          align-items: center;
          line-height: ${theme.typography.codeLineHeight};
          color: ${theme.colors.textPrimary};
          cursor: default;
          position: relative;
          background-color: ${LINE_TYPE_TO_COLOR[lineType]};
          ${lineType === 'hunk' ? 'line-height: 2rem;' : ''};
        `,
      ]
    },

    numberContainer: css`
      display: flex;
      flex-direction: row;
      width: 75px;
      height: 100%;
      justify-content: flex-end;
      gap: ${theme.spacing.sm};
      padding-left: ${theme.spacing.xs};
      padding-right: ${theme.spacing.md};
      border-right: 1px solid ${theme.colors.borderBg};
    `,

    codeContainer: css`
      padding-left: ${theme.spacing.xs};
      width: 100%;
      font-family: ${theme.typography.codeFontFamily};
      font-size: ${theme.typography.codeFontSize}px;
      white-space: pre-wrap;
    `,

    addButton: css`
      position: absolute;
      transform: translateX(-50%);
      left: 90px;
    `,
  }
}

interface HunkLineProps {
  /** The line number on the left (old file). Null when not applicable */
  letfNumber: number | null
  /** The line number on the right (new file). Null when not applicable */
  rightNumber: number | null
  /** HTML-string representing the code/content for the line */
  content: string
  /** Whether line numbers should be displayed */
  showNumber: boolean
  /** The diff line type used for styling */
  type: DiffLineType
}

const getLinePrefix = (type: DiffLineType) => {
  switch (type) {
    case 'add':
      return ' + '
    case 'delete':
      return ' - '
    case 'context':
    default:
      // Keep the same spacing as the add/delete lines
      return '   '
  }
}

const HunkLine: React.FC<HunkLineProps> = (props) => {
  const styles = useStyles()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      css={styles.container(props.type)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {props.type !== 'hunk' && isHovered && (
        <AddButton css={styles.addButton} onClick={() => console.log('Add comment clicked')} />
      )}

      {props.showNumber && (
        <div css={styles.numberContainer}>
          {(props.letfNumber ?? props.rightNumber) === null ? '\u00A0' : null}
          {props.letfNumber !== null && <span>{props.letfNumber}</span>}
          {props.rightNumber !== null && <span>{props.rightNumber}</span>}
        </div>
      )}

      <div css={styles.codeContainer}>
        {props.type === 'hunk' ? '' : getLinePrefix(props.type)}
        <span dangerouslySetInnerHTML={{ __html: props.content }} />
      </div>
    </div>
  )
}

export default HunkLine
