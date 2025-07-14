import { MoreOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { Dropdown, MenuProps, message, Typography } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { useDiffViewerConfig } from '../../../../components/diff-viewer/providers/diff-viewer-context'
import { CommentAuthor, CommentState } from '../../models/CommentMetadata'
import { InlineCommentEvent } from '../InlineComment'

const { Text, Link } = Typography

export interface CommentHeaderProps {
  /** The state of the comment */
  state: CommentState
  /** The author of the comment */
  author: CommentAuthor
  /** Current user information */
  currentUser: CommentAuthor
  /** ISO timestamp when comment was created */
  createdAt: string
  /** URL to the comment on GitHub */
  commentUrl: string
  /** Callback function triggered when an event occurs */
  onEventTrigger?: (event: InlineCommentEvent) => void
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
 * @param state          - The state of the comment
 * @param author         - The author of the comment
 * @param currentUser    - Current user information
 * @param createdAt      - ISO timestamp when comment was created
 * @param commentUrl     - URL to the comment on GitHub
 * @param onEventTrigger - Callback function triggered when an event occurs
 * @returns                A React component that displays the comment header
 */
export const Header: React.FC<CommentHeaderProps> = ({
  state,
  author,
  currentUser,
  createdAt,
  commentUrl,
  onEventTrigger,
}) => {
  const styles = useStyles()

  const isAuthor = currentUser.login === author.login

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

  const handleMenuClick = useCallback(
    (event: InlineCommentEvent) => {
      onEventTrigger?.(event)
    },
    [onEventTrigger],
  )

  const draftOptions: MenuProps = useMemo(
    () => ({
      items: isAuthor
        ? [
            {
              key: 'edit',
              label: 'Edit',
              onClick: () => {
                handleMenuClick(InlineCommentEvent.EDIT_DRAFT)
              },
            },
            {
              key: 'delete',
              label: 'Delete',
              onClick: () => handleMenuClick(InlineCommentEvent.DELETE_DRAFT),
            },
          ]
        : [],
    }),
    [handleMenuClick, isAuthor],
  )

  const publishedOptions: MenuProps = useMemo(
    () => ({
      items: [
        {
          key: 'copy-link',
          label: 'Copy link',
          onClick: handleCopyLink,
        },
        ...(isAuthor
          ? [
              {
                key: 'edit',
                label: 'Edit',
                onClick: () => handleMenuClick(InlineCommentEvent.EDIT_PUBLISHED),
              },
              {
                key: 'delete',
                label: 'Delete',
                onClick: () => handleMenuClick(InlineCommentEvent.DELETE_PUBLISHED),
              },
              {
                type: 'divider' as const,
              },
            ]
          : []),
        {
          key: 'resolve',
          label: 'Resolve',
          onClick: () => handleMenuClick(InlineCommentEvent.RESOLVE_PUBLISHED),
        },
      ],
    }),
    [handleCopyLink, handleMenuClick, isAuthor],
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
      <Dropdown
        menu={state === CommentState.SAVED_DRAFT ? draftOptions : publishedOptions}
        trigger={['click']}
        placement="bottomRight"
      >
        <MoreOutlined css={styles.menuButton} data-testid="comment-menu-button" />
      </Dropdown>
    </div>
  )
}
