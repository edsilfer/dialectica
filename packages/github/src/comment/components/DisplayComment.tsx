import { ThemeContext, MarkdownText } from '@dialectica-org/commons'
import { css } from '@emotion/react'
import { Avatar, Divider } from 'antd'
import React, { useContext } from 'react'
import { CommentAuthor, CommentEvent, CommentMetadata } from '../models/CommentMetadata'
import { CommentEventHandler } from '../data/CommentEventProcessor'
import { Header } from './Header'
import { Reactions } from './Reactions'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    content: css`
      display: flex;
      flex-direction: row;
      padding: ${theme.spacing.md};
      gap: ${theme.spacing.sm};
    `,

    avatar: css`
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 2px;
    `,

    divider: css`
      margin: 0;
      border-color: ${theme.colors.border};
    `,
  }
}

/**
 * Props for the StaticComment component
 */
export interface StaticCommentProps {
  /** Array of comments in the thread */
  thread: CommentMetadata[]
  /** Current user information */
  currentUser: CommentAuthor
  /** Callback function triggered when an event occurs */
  onEventTrigger: CommentEventHandler
}

/**
 * A component that displays multiple static comments with dividers between them
 */
export const DisplayComment: React.FC<StaticCommentProps> = ({ thread, currentUser, onEventTrigger }) => {
  const styles = useStyles()

  if (thread.length === 0) {
    return null
  }

  return (
    <>
      {thread.map((comment, idx) => (
        <div key={comment.localId}>
          <Item comment={comment} user={currentUser} onEvent={onEventTrigger} />
          {idx < thread.length - 1 && <Divider css={styles.divider} />}
        </div>
      ))}
    </>
  )
}

const Item: React.FC<{ comment: CommentMetadata; user: CommentAuthor; onEvent: CommentEventHandler }> = (props) => {
  const { comment, user, onEvent } = props
  const styles = useStyles()

  return (
    <div css={styles.content}>
      <Avatar
        src={comment.author.avatar_url}
        size={24}
        alt={comment.author.login}
        data-testid={`comment-author-avatar-${comment.serverId}`}
        css={styles.avatar}
      />

      <div style={{ flex: 1 }}>
        <Header
          state={comment.state}
          author={comment.author}
          currentUser={user}
          createdAt={comment.createdAt}
          commentUrl={comment.url}
          onEventTrigger={(event) => onEvent?.(event, comment)}
        />

        <MarkdownText>{comment.body}</MarkdownText>

        <Reactions
          reactions={comment.reactions}
          onReactionClick={(reactionType) => onEvent?.(CommentEvent.REACT, comment, reactionType)}
        />
      </div>
    </div>
  )
}
