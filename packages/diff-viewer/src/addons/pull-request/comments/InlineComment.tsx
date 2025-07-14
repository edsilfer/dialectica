import { css } from '@emotion/react'
import { Avatar } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../components/diff-viewer/providers/diff-viewer-context'
import { MarkdownText } from '../../MarkdownText'
import { CommentAuthor, CommentMetadata, CommentState } from '../models/CommentMetadata'
import { Editor } from './components/Editor'
import { Header } from './components/Header'
import { Reactions } from './components/Reactions'
import { Reply } from './components/Reply'

/**
 * Event types that can be triggered by the InlineComment component
 */
export enum InlineCommentEvent {
  // Events that will act on the local draft data
  ADD_DRAFT = 'ADD_DRAFT',
  SAVE_DRAFT = 'SAVE_DRAFT',
  CANCEL_DRAFT = 'CANCEL_DRAFT',
  DELETE_DRAFT = 'DELETE_DRAFT',
  EDIT_DRAFT = 'EDIT_DRAFT',
  PUBLISH_DRAFT = 'PUBLISH_DRAFT',

  // Events that will act on the server data
  RESOLVE_PUBLISHED = 'RESOLVE_PUBLISHED',
  DELETE_PUBLISHED = 'DELETE_PUBLISHED',
  EDIT_PUBLISHED = 'EDIT_PUBLISHED',

  POST_REACTION = 'POST_REACTION',
}

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    outerContainer: css`
      border-top: 1px solid ${theme.colors.border};
      border-bottom: 1px solid ${theme.colors.border};
      background-color: ${theme.colors.backgroundPrimary};
      padding: ${theme.spacing.sm};
    `,

    innerContainer: css`
      display: flex;
      flex-direction: column;
      max-width: 1000px;
      gap: ${theme.spacing.sm};
      margin: ${theme.spacing.sm};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
      position: relative;
    `,

    content: css`
      display: flex;
      flex-direction: row;
      padding: ${theme.spacing.sm};
      width: 100%;
      gap: ${theme.spacing.sm};
    `,

    avatar: css`
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 2px;
    `,

    editorContainer: css`
      background-color: ${theme.colors.backgroundPrimary};
      padding: ${theme.spacing.xs};
      border-top: 1px solid ${theme.colors.border};
    `,
  }
}

/**
 * Event handler type that takes metadata, event, and optional data
 */
export type EventHandler = (metadata: CommentMetadata, event: InlineCommentEvent, data?: string) => void

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

/**
 * A React component that displays inline comments with intelligent state-based rendering.
 * Handles different scenarios based on DRAFT comment presence in the thread.
 *
 * @param thread - Array of comments in the thread
 * @param currentUser - Current user information
 * @param onEventTrigger - Callback function triggered when an event occurs
 * @param isReviewing - Whether there are saved drafts in the current context indicating review mode
 * @returns A React component that displays inline comments with appropriate UI for the thread state
 */
export const InlineComment: React.FC<InlineCommentProps> = ({ thread, currentUser, isReviewing, onEventTrigger }) => {
  const styles = useStyles()

  if (thread.length === 0) return null

  const draftComments = thread.filter((comment) => comment.state === CommentState.DRAFT)
  const nonDraftComments = thread.filter((comment) => comment.state !== CommentState.DRAFT)

  // VALIDATIONS
  if (draftComments.length > 1) throw new Error('Thread cannot have more than one DRAFT comment')
  const hasDraftComment = draftComments.length === 1
  const hasNonDraftComments = nonDraftComments.length > 0

  const renderComment = (comment: CommentMetadata) => (
    <div css={styles.content} key={comment.id}>
      <Avatar
        src={comment.author.avatar_url}
        size={24}
        alt={comment.author.login}
        data-testid={`comment-author-avatar-${comment.id}`}
        css={styles.avatar}
      />

      <div style={{ flex: 1 }}>
        <Header
          state={comment.state}
          author={comment.author}
          currentUser={currentUser}
          createdAt={comment.created_at}
          commentUrl={comment.url}
          onEventTrigger={(event) => onEventTrigger?.(comment, event)}
        />
        <MarkdownText>{comment.body}</MarkdownText>
        <Reactions
          reactions={comment.reactions}
          onReactionClick={(reactionType) => onEventTrigger?.(comment, InlineCommentEvent.POST_REACTION, reactionType)}
        />
      </div>
    </div>
  )

  const renderEditor = (draftComment: CommentMetadata) => (
    <Editor
      initialText={draftComment.body}
      placeholder="Add a comment..."
      isVisible={true}
      onSave={(commentText) => onEventTrigger?.(draftComment, InlineCommentEvent.SAVE_DRAFT, commentText)}
      onCancel={() => onEventTrigger?.(draftComment, InlineCommentEvent.CANCEL_DRAFT)}
      isReviewing={isReviewing}
    />
  )

  // Case 1: Thread has a single DRAFT comment only - render only the editor
  if (hasDraftComment && !hasNonDraftComments) {
    const draftComment = draftComments[0]
    return (
      <div css={styles.editorContainer} data-testid="draft-only-editor">
        {renderEditor(draftComment)}
      </div>
    )
  }

  // Case 2: Thread has non-DRAFT comments and zero DRAFT comments - render with Reply section or Editor
  if (hasNonDraftComments && !hasDraftComment) {
    return (
      <div css={styles.outerContainer} data-testid="inline-comments">
        <div css={styles.innerContainer}>
          {nonDraftComments.map(renderComment)}
          <Reply
            currentUser={currentUser}
            onEventTrigger={() => onEventTrigger?.(nonDraftComments[0], InlineCommentEvent.ADD_DRAFT, '')}
            placeholder="Add a comment..."
          />
        </div>
      </div>
    )
  }

  // Case 3: Thread has non-DRAFT comments and a single DRAFT comment - render conversation + Editor (no Reply)
  if (hasNonDraftComments && hasDraftComment) {
    const draftComment = draftComments[0]

    return (
      <div css={styles.outerContainer} data-testid="inline-comments-with-draft">
        <div css={styles.innerContainer}>
          {nonDraftComments.map(renderComment)}
          <div css={styles.editorContainer}>{renderEditor(draftComment)}</div>
        </div>
      </div>
    )
  }

  return null
}
