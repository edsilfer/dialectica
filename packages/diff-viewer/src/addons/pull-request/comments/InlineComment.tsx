import { css } from '@emotion/react'
import { Avatar, Divider } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../components/diff-viewer/providers/diff-viewer-context'
import { COMMENT_WIDTHS, MACBOOK_14_WIDTH } from '../../../utils/screen-utils'
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

  // Determine comment widths based on screen size
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= MACBOOK_14_WIDTH
  const { MIN_WIDTH_PX, MAX_WIDTH_PX } = isSmallScreen ? COMMENT_WIDTHS.SMALL_SCREEN : COMMENT_WIDTHS.LARGE_SCREEN

  return {
    outerContainer: css`
      border-top: 1px solid ${theme.colors.border};
      border-bottom: 1px solid ${theme.colors.border};
      background-color: ${theme.colors.backgroundPrimary};
      padding: ${theme.spacing.sm};
    `,

    innerContainer: (addBorder: boolean) => css`
      max-width: ${MAX_WIDTH_PX}px;
      min-width: ${MIN_WIDTH_PX}px;
      width: 75%;
      border: ${addBorder ? `1px solid ${theme.colors.border}` : 'none'};
      border-radius: ${theme.spacing.xs};
    `,

    content: css`
      display: flex;
      flex-direction: row;
      padding: ${theme.spacing.sm};
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

  const renderCommentsWithDividers = (comments: CommentMetadata[]) => {
    return comments.map((comment, index) => (
      <React.Fragment key={comment.id}>
        {renderComment(comment)}
        {index < comments.length - 1 && <Divider css={styles.divider} />}
      </React.Fragment>
    ))
  }

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

  let content: React.ReactNode
  let testId: string
  let addBorder = false

  // Case 1: Thread has a single DRAFT comment only - render only the editor
  if (hasDraftComment && !hasNonDraftComments) {
    const draftComment = draftComments[0]
    content = renderEditor(draftComment)
    testId = 'draft-only-editor'
  }
  // Case 2: Thread has non-DRAFT comments and zero DRAFT comments - render with Reply section
  else if (hasNonDraftComments && !hasDraftComment) {
    content = (
      <>
        {renderCommentsWithDividers(nonDraftComments)}
        <Reply
          currentUser={currentUser}
          onEventTrigger={() => onEventTrigger?.(nonDraftComments[0], InlineCommentEvent.ADD_DRAFT, '')}
          placeholder="Add a comment..."
        />
      </>
    )
    addBorder = true
    testId = 'inline-comments'
  }
  // Case 3: Thread has non-DRAFT comments and a single DRAFT comment - render conversation + Editor
  else if (hasNonDraftComments && hasDraftComment) {
    const draftComment = draftComments[0]
    content = (
      <>
        {renderCommentsWithDividers(nonDraftComments)}
        {renderEditor(draftComment)}
      </>
    )
    addBorder = true
    testId = 'inline-comments-with-draft'
  }
  // No valid case found
  else {
    return null
  }

  return (
    <div css={styles.outerContainer} data-testid={testId}>
      <div css={styles.innerContainer(addBorder)}>{content}</div>
    </div>
  )
}
