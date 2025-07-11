import { css } from '@emotion/react'
import { Avatar, Button, Typography } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../components/diff-viewer/providers/diff-viewer-context'
import type { InlineCommentProps } from './types'

const { Text, Paragraph } = Typography

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      display: flex;
      gap: ${theme.spacing.sm};
      padding: ${theme.spacing.sm};
      margin: ${theme.spacing.sm};
      background-color: ${theme.colors.backgroundContainer};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.sm};
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

    header: css`
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      margin-bottom: ${theme.spacing.xs};
    `,

    author: css`
      font-family: ${theme.typography.regularFontFamily};
      font-weight: 600;
      color: ${theme.colors.textPrimary};
      text-decoration: none;

      &:hover {
        color: ${theme.colors.accent};
      }
    `,

    timestamp: css`
      font-family: ${theme.typography.regularFontFamily};
      color: ${theme.colors.textContainerPlaceholder};
      font-size: 10px;
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

    actions: css`
      display: flex;
      gap: ${theme.spacing.xs};
      margin-top: ${theme.spacing.sm};
    `,

    actionButton: css`
      padding: ${theme.spacing.xs} ${theme.spacing.sm};
      height: auto;
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSizeSM}px;
    `,

    resolvedBadge: css`
      font-family: ${theme.typography.regularFontFamily};
      background-color: ${theme.colors.fileViewerAddedSquareBg};
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: ${theme.typography.regularFontSizeSM}px;
      font-weight: 500;
    `,
  }
}

/**
 * A component that displays a GitHub-style inline comment.
 *
 * @param comment - The comment data to display
 * @param onReply - Optional callback when reply button is clicked
 * @param onResolve - Optional callback when resolve button is clicked
 * @param onEdit - Optional callback when edit button is clicked
 * @param onDelete - Optional callback when delete button is clicked
 * @returns A React component that displays an inline comment
 */
export const InlineComment: React.FC<InlineCommentProps> = ({ comment, onReply, onResolve, onEdit, onDelete }) => {
  const styles = useStyles()

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'just now'
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInHours / 24)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  return (
    <div css={styles.container} data-testid="inline-comment">
      <div css={styles.avatar}>
        <Avatar
          src={comment.author.avatar_url}
          size={32}
          alt={comment.author.login}
          data-testid="comment-author-avatar"
        />
      </div>

      <div css={styles.content}>
        <div css={styles.header}>
          <a
            href={comment.author.html_url}
            target="_blank"
            rel="noreferrer"
            css={styles.author}
            data-testid="comment-author-link"
          >
            {comment.author.login}
          </a>
          <Text css={styles.timestamp} data-testid="comment-timestamp">
            {formatTimestamp(comment.created_at)}
          </Text>
        </div>
        {comment.resolved && (
          <span css={styles.resolvedBadge} data-testid="resolved-badge">
            Resolved
          </span>
        )}

        <Paragraph css={styles.body} data-testid="comment-body">
          {comment.body}
        </Paragraph>

        <div css={styles.actions}>
          {onReply && (
            <Button type="text" size="small" onClick={onReply} css={styles.actionButton} data-testid="reply-button">
              Reply
            </Button>
          )}
          {onResolve && !comment.resolved && (
            <Button type="text" size="small" onClick={onResolve} css={styles.actionButton} data-testid="resolve-button">
              Resolve
            </Button>
          )}
          {onEdit && (
            <Button type="text" size="small" onClick={onEdit} css={styles.actionButton} data-testid="edit-button">
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              type="text"
              size="small"
              danger
              onClick={onDelete}
              css={styles.actionButton}
              data-testid="delete-button"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
