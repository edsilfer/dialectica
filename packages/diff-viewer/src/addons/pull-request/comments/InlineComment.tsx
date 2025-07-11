import { css } from '@emotion/react'
import { Avatar, Typography } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../components/diff-viewer/providers/diff-viewer-context'
import type { InlineCommentProps } from '../toolbar/models'
import { CommentActions } from './CommentActions'
import { CommentHeader } from './CommentHeader'
import { CommentReactions } from './CommentReactions'
import { CommentReply } from './CommentReply'

const { Paragraph } = Typography

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    outerContainer: css`
      border-top: 1px solid ${theme.colors.border};
      border-bottom: 1px solid ${theme.colors.border};
      background-color: ${theme.colors.backgroundPrimary};
    `,

    innerContainer: css`
      display: flex;
      gap: ${theme.spacing.sm};
      padding: ${theme.spacing.sm};
      margin: ${theme.spacing.sm};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
      position: relative;
    `,

    avatar: css`
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 2px;
    `,

    content: css`
      flex: 1;
      min-width: 0;
    `,

    body: css`
      font-family: ${theme.typography.regularFontFamily};
      color: ${theme.colors.textPrimary};
      font-size: ${theme.typography.regularFontSize}px;
      line-height: 1.4;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      text-align: left;
    `,
  }
}

/**
 * A component that displays multiple GitHub-style inline comments with a single reply footer.
 *
 * @param comments - The array of comment data to display
 * @param currentUser - Current user data for reply functionality
 * @param onResolve - Optional callback when resolve button is clicked
 * @param onEdit - Optional callback when edit button is clicked
 * @param onDelete - Optional callback when delete button is clicked
 * @param onReplySubmit - Optional callback when reply is submitted
 * @returns A React component that displays inline comments with a reply footer
 */
export const InlineComment: React.FC<InlineCommentProps> = ({
  comments,
  currentUser,
  onResolve,
  onEdit,
  onDelete,
  onReplySubmit,
}) => {
  const handleReactionClick = (reactionType: string) => {
    console.log('Reaction clicked:', reactionType)
    // TODO: Implement reaction handling
  }

  const handleReplySubmit = (replyText: string) => {
    console.log('Reply submitted:', replyText)
    onReplySubmit?.(replyText)
  }

  const styles = useStyles()

  if (comments.length === 0) {
    return null
  }

  return (
    <div css={styles.outerContainer} data-testid="inline-comments">
      {comments.map((comment, _index) => (
        <div key={comment.id}>
          <div css={styles.innerContainer} data-testid={`inline-comment-${comment.id}`}>
            <Avatar
              src={comment.user.avatar_url}
              size={24}
              alt={comment.user.login}
              data-testid={`comment-author-avatar-${comment.id}`}
              css={styles.avatar}
            />

            <div css={styles.content}>
              <CommentHeader author={comment.user} createdAt={comment.created_at} commentUrl={comment.html_url} />
              <Paragraph css={styles.body} data-testid={`comment-body-${comment.id}`}>
                {comment.body}
              </Paragraph>
              <CommentReactions reactions={comment.reactions} onReactionClick={handleReactionClick} />
              <CommentActions onResolve={onResolve} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </div>
        </div>
      ))}

      <CommentReply currentUser={currentUser} onSubmit={handleReplySubmit} placeholder="Add a comment..." />
    </div>
  )
}
