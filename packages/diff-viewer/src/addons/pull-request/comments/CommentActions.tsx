import { css } from '@emotion/react'
import { Button } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../components/diff-viewer/providers/diff-viewer-context'

export interface CommentActionsProps {
  /** Optional callback when resolve button is clicked */
  onResolve?: () => void
  /** Optional callback when edit button is clicked */
  onEdit?: () => void
  /** Optional callback when delete button is clicked */
  onDelete?: () => void
}

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      display: flex;
      gap: ${theme.spacing.xs};
      margin-top: ${theme.spacing.sm};
    `,

    button: css`
      padding: ${theme.spacing.xs} ${theme.spacing.sm};
      height: auto;
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSizeSM}px;
    `,
  }
}

/**
 * A component that displays action buttons for a comment.
 *
 * @param onResolve - Optional callback when resolve button is clicked
 * @param onEdit - Optional callback when edit button is clicked
 * @param onDelete - Optional callback when delete button is clicked
 * @returns A React component that displays comment action buttons
 */
export const CommentActions: React.FC<CommentActionsProps> = ({ onResolve, onEdit, onDelete }) => {
  const styles = useStyles()

  return (
    <div css={styles.container}>
      {onResolve && (
        <Button type="text" size="small" onClick={onResolve} css={styles.button} data-testid="resolve-button">
          Resolve
        </Button>
      )}
      {onEdit && (
        <Button type="text" size="small" onClick={onEdit} css={styles.button} data-testid="edit-button">
          Edit
        </Button>
      )}
      {onDelete && (
        <Button type="text" size="small" danger onClick={onDelete} css={styles.button} data-testid="delete-button">
          Delete
        </Button>
      )}
    </div>
  )
}
