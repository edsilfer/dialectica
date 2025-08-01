import { MoreOutlined } from '@ant-design/icons'
import { formatTimestamp, ThemeContext } from '@edsilfer/commons'
import { css } from '@emotion/react'
import { Dropdown, MenuProps, message, Tag, Typography } from 'antd'
import { ItemType } from 'antd/es/menu/interface'
import React, { useCallback, useContext, useMemo } from 'react'
import { CommentAuthor, CommentEvent, CommentState } from '../models'

const { Text, Link } = Typography

export interface HeaderProps {
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
  onEventTrigger?: (event: CommentEvent) => void
}

const useStyles = () => {
  const theme = useContext(ThemeContext)

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

    actions: css`
      margin-left: auto;
      gap: ${theme.spacing.xs};
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
export const Header: React.FC<HeaderProps> = (props) => {
  const { state, author, currentUser, createdAt, commentUrl, onEventTrigger } = props
  const styles = useStyles()
  const isAuthor = currentUser.login === author.login

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
    (event: CommentEvent) => {
      onEventTrigger?.(event)
    },
    [onEventTrigger],
  )

  const options: MenuProps = useMemo(() => {
    const copy: ItemType = {
      key: 'copy-link',
      label: 'Copy link',
      onClick: handleCopyLink,
    }

    const edit: ItemType = {
      key: 'edit',
      label: 'Edit',
      onClick: () => handleMenuClick(CommentEvent.EDIT),
    }

    const _delete: ItemType = {
      key: 'delete',
      label: 'Delete',
      onClick: () => handleMenuClick(CommentEvent.DELETE),
    }

    const resolve: ItemType = {
      key: 'resolve',
      label: 'Resolve',
      onClick: () => handleMenuClick(CommentEvent.RESOLVE),
    }

    const getOptions = (): ItemType[] => {
      switch (state) {
        case CommentState.DRAFT:
          return []
        case CommentState.PENDING:
          return isAuthor ? [edit, _delete] : []
        case CommentState.PUBLISHED:
          return [copy, ...(isAuthor ? [edit, _delete] : []), resolve]
      }
    }

    return { items: getOptions() }
  }, [state, isAuthor, handleCopyLink, handleMenuClick])

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

      <div css={styles.actions}>
        {isAuthor && <Tag color="default">Author</Tag>}

        <Dropdown menu={options} trigger={['click']} placement="bottomRight">
          <MoreOutlined css={styles.menuButton} data-testid="comment-menu-button" />
        </Dropdown>
      </div>
    </div>
  )
}
