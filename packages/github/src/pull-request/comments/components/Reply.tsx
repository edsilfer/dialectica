import { css } from '@emotion/react'
import { Avatar, Input } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '@diff-viewer'
import { CommentAuthor } from '../../models/CommentMetadata'

const { TextArea } = Input

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.sm};
      padding: ${theme.spacing.sm};
      background-color: ${theme.colors.backgroundContainer};
      border-top: 1px solid ${theme.colors.border};
      cursor: pointer;
      transition: background-color 0.2s ease;
      margin-top: ${theme.spacing.md};

      &:hover {
        background-color: ${theme.colors.backgroundContainer};
      }
    `,

    avatar: css`
      flex-shrink: 0;
      border: 1px solid ${theme.colors.border};
    `,

    textArea: css`
      flex: 1;
      background-color: ${theme.colors.backgroundPrimary} !important;
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
      cursor: pointer;
      pointer-events: none;
    `,
  }
}

export interface CommentReplyProps {
  /** The current user data */
  currentUser: CommentAuthor
  /** Optional placeholder text for the reply input */
  placeholder?: string
  /** Whether the reply form is visible */
  isVisible?: boolean
  /** Callback function triggered when the reply area is clicked */
  onEventTrigger?: () => void
}

/**
 * A component that displays a clickable reply interface for inline comments.
 * When clicked, it triggers the parent to create a new DRAFT comment.
 *
 * @param currentUser - The current user data
 * @param onEventTrigger - Callback function triggered when the reply area is clicked
 * @param placeholder - Optional placeholder text for the reply input
 * @param isVisible - Whether the reply form is visible
 * @returns A React component that displays a clickable comment reply interface
 */
export const Reply: React.FC<CommentReplyProps> = ({
  currentUser,
  onEventTrigger,
  placeholder = 'Write a reply...',
  isVisible = true,
}) => {
  const styles = useStyles()

  const handleContainerClick = () => {
    onEventTrigger?.()
  }

  if (!isVisible) {
    return null
  }

  return (
    <div css={styles.container} data-testid="comment-reply" onClick={handleContainerClick}>
      <Avatar
        src={currentUser.avatar_url}
        size={24}
        alt={currentUser.login}
        data-testid="reply-author-avatar"
        css={styles.avatar}
      />

      <TextArea
        value=""
        placeholder={placeholder}
        css={styles.textArea}
        data-testid="reply-textarea"
        autoSize={{ minRows: 1, maxRows: 1 }}
        readOnly
      />
    </div>
  )
}
