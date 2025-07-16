import { css } from '@emotion/react'
import { Divider } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../components/diff-viewer/providers/diff-viewer-context'
import { CommentAuthor, CommentEvent, CommentMetadata, CommentState, EventHandler } from '../models/CommentMetadata'
import { Reply } from './components/Reply'
import { DisplayComment } from './DisplayComment'
import { DraftComment } from './DraftComment'

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      border-top: 1px solid ${theme.colors.border};
      border-bottom: 1px solid ${theme.colors.border};
      background-color: ${theme.colors.backgroundPrimary};
      padding: ${theme.spacing.sm};
    `,

    innerContainer: (addBorder: boolean) => css`
      width: auto;
      border: ${addBorder ? `1px solid ${theme.colors.border}` : 'none'};
      border-radius: ${theme.spacing.xs};
    `,

    divider: css`
      margin: 0;
      border-color: ${theme.colors.border};
    `,
  }
}

/**
 * Props for the InlineComment component
 */
export interface InlineCommentProps {
  /** Array of comments in the thread */
  thread: CommentMetadata[]
  /** Current user information */
  currentUser: CommentAuthor
  /** Whether there are saved drafts in the current context indicating review mode */
  isReviewing?: boolean
  /** Callback function triggered when an event occurs */
  onEventTrigger: EventHandler
}

export const InlineComment: React.FC<InlineCommentProps> = ({ thread, currentUser, isReviewing, onEventTrigger }) => {
  const styles = useStyles()

  if (thread.length === 0) return null

  // Sort comments chronologically (oldest → newest)
  const ordered = [...thread].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const nodes: React.ReactNode[] = []
  const pendingStatic: CommentMetadata[] = []

  const flushStatic = () => {
    if (pendingStatic.length) {
      nodes.push(
        <DisplayComment
          key={`static-${pendingStatic[0].id}`}
          thread={[...pendingStatic]}
          currentUser={currentUser}
          onEventTrigger={onEventTrigger}
        />,
      )
      pendingStatic.length = 0
    }
  }

  ordered.forEach((comment) => {
    if (comment.currentState === CommentState.DRAFT) {
      flushStatic()
      nodes.push(
        <DraftComment
          key={`draft-${comment.id}`}
          comment={comment}
          isReviewing={isReviewing}
          onEventTrigger={onEventTrigger}
        />,
      )
    } else {
      pendingStatic.push(comment)
    }
  })

  flushStatic()

  const last = ordered[ordered.length - 1]
  let replyComponent: React.ReactNode | null = null

  if (last.currentState !== CommentState.DRAFT) {
    replyComponent = (
      <Reply
        key="reply"
        currentUser={currentUser}
        onEventTrigger={() => onEventTrigger?.(last, CommentEvent.REPLY, '')}
        placeholder="Add a comment..."
      />
    )
  }

  const hasStatic = ordered.some((c) => c.currentState !== CommentState.DRAFT)

  // Add dividers between comment nodes (but not before reply)
  const nodesWithDividers = nodes.map((node, index) => (
    <div key={`node-${index}`}>
      {node}
      {index < nodes.length - 1 && <Divider css={styles.divider} />}
    </div>
  ))

  // Combine comment nodes with reply (no divider before reply)
  const allNodes = [...nodesWithDividers]
  if (replyComponent) {
    allNodes.push(<div key="reply">{replyComponent}</div>)
  }

  return (
    <div css={styles.container} data-testid="inline-comments">
      <div css={styles.innerContainer(hasStatic)}>{allNodes}</div>
    </div>
  )
}
