import { MoreOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { Dropdown, MenuProps, message, Typography } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { useDiffViewerConfig } from '../../../components/diff-viewer/providers/diff-viewer-context'
import { InlineCommentAuthor } from './models'

const { Text, Link } = Typography

export interface CommentHeaderProps {
  /** The author of the comment */
  author: InlineCommentAuthor
  /** ISO timestamp when comment was created */
  createdAt: string
  /** URL to the comment on GitHub */
  commentUrl: string
}

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      margin-bottom: ${theme.spacing.xs};
    `,

    author: css`
      font-family: ${theme.typography.regularFontFamily};
      font-weight: 600;
      color: ${theme.colors.textPrimary} !important;
      text-decoration: none;
      font-size: ${theme.typography.regularFontSize}px;

      &:hover {
        color: ${theme.colors.accent} !important;
      }
    `,

    timestamp: css`
      font-family: ${theme.typography.regularFontFamily};
      color: ${theme.colors.textContainerPlaceholder};
      font-size: ${theme.typography.regularFontSize}px;
    `,

    menuButton: css`
      margin-left: auto;
      color: ${theme.colors.textContainerPlaceholder};
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      transform: rotate(90deg);

      &:hover {
        color: ${theme.colors.textPrimary};
        background-color: ${theme.colors.border}50;
      }
    `,
  }
}

/**
 * A component that displays the header of an inline comment including author, timestamp, and a menu.
 *
 * @param author - The author of the comment
 * @param createdAt - ISO timestamp when comment was created
 * @param commentUrl - URL to the comment on GitHub
 * @returns A React component that displays the comment header
 */
export const CommentHeader: React.FC<CommentHeaderProps> = ({ author, createdAt, commentUrl }) => {
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

  const handleCopyLink = useCallback(() => {
    navigator.clipboard
      .writeText(commentUrl)
      .then(() => {
        message.success('Link copied to clipboard')
      })
      .catch(() => {
        message.error('Failed to copy link')
      })
  }, [commentUrl])

  const menuProps: MenuProps = useMemo(
    () => ({
      items: [
        {
          key: 'copy-link',
          label: 'Copy link',
          onClick: handleCopyLink,
        },
      ],
    }),
    [handleCopyLink],
  )

  return (
    <div css={styles.container}>
      <Link
        href={author.html_url}
        target="_blank"
        rel="noreferrer"
        css={styles.author}
        data-testid="comment-author-link"
      >
        {author.login}
      </Link>
      <Text css={styles.timestamp} data-testid="comment-timestamp">
        {formatTimestamp(createdAt)}
      </Text>
      <Dropdown menu={menuProps} trigger={['click']} placement="bottomRight">
        <MoreOutlined css={styles.menuButton} data-testid="comment-menu-button" />
      </Dropdown>
    </div>
  )
}
