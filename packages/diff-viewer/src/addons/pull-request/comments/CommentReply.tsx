import { css } from '@emotion/react'
import { Avatar, Input } from 'antd'
import React, { useState } from 'react'
import { useDiffViewerConfig } from '../../../components/diff-viewer/providers/diff-viewer-context'
import { CommentEditor } from './editor/CommentEditor'

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
    `,
  }
}

export interface CommentReplyProps {
  /** The current user data */
  currentUser: {
    login: string
    avatar_url: string
  }
  /** Optional placeholder text for the reply input */
  placeholder?: string
  /** Whether the reply form is visible */
  isVisible?: boolean

  /** Optional callback when reply is submitted */
  onSubmit?: (replyText: string) => void
}

type ReplyState = 'displaying' | 'editing'

/**
 * A component that displays a reply interface for inline comments.
 *
 * @param currentUser - The current user data
 * @param onSubmit - Optional callback when reply is submitted
 * @param placeholder - Optional placeholder text for the reply input
 * @param isVisible - Whether the reply form is visible
 * @returns A React component that displays a comment reply interface
 */
export const CommentReply: React.FC<CommentReplyProps> = ({
  currentUser,
  onSubmit,
  placeholder = 'Write a reply...',
  isVisible = true,
}) => {
  const [replyText, setReplyText] = useState('')
  const [state, setState] = useState<ReplyState>('displaying')
  const styles = useStyles()

  const handleSubmit = () => {
    if (replyText.trim() && onSubmit) {
      onSubmit(replyText.trim())
      setReplyText('')
      setState('displaying')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  const handleContainerClick = () => {
    setState('editing')
  }

  const handleSave = (newText: string) => {
    if (onSubmit) {
      onSubmit(newText)
      setReplyText('')
      setState('displaying')
    }
  }

  const handleCancel = () => {
    setReplyText('')
    setState('displaying')
  }

  if (!isVisible) {
    return null
  }

  if (state === 'editing') {
    return (
      <CommentEditor
        initialText={replyText}
        placeholder={placeholder}
        onSave={handleSave}
        onCancel={handleCancel}
        isVisible={true}
      />
    )
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
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        css={styles.textArea}
        data-testid="reply-textarea"
        autoSize={{ minRows: 1, maxRows: 1 }}
        readOnly
      />
    </div>
  )
}
