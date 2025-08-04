import { ThemeContext } from '@dialectica-org/commons'
import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { CommentEventHandler } from '../data/CommentEventProcessor'
import { CommentEvent, CommentMetadata, CommentState } from '../models/CommentMetadata'
import { ButtonMetadata, Editor } from './Editor'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      padding: ${theme.spacing.sm};
    `,
  }
}

/**
 * Props for the EditComment component
 */
export interface DraftCommentProps {
  /** The comment to edit */
  comment: CommentMetadata
  /** Whether there are saved drafts in the current context indicating review mode */
  isReviewing?: boolean
  /** Callback function triggered when an event occurs */
  onEventTrigger: CommentEventHandler
}

/**
 * A component that renders an editor for editing comments.
 *
 * @param comment        - The comment to edit
 * @param isReviewing    - Whether there are saved drafts in the current context indicating review mode
 * @param onEventTrigger - Callback function triggered when an event occurs
 * @returns                A React component that displays an editor with appropriate buttons
 */
export const DraftComment: React.FC<DraftCommentProps> = ({ comment, isReviewing, onEventTrigger }) => {
  const styles = useStyles()

  const getSaveButtonLabel = () => {
    switch (comment.state) {
      case CommentState.DRAFT:
        return comment.wasPublished ? 'Save edit' : isReviewing ? 'Add review comment' : 'Start a review'
      case CommentState.PENDING:
        return 'Save'
      case CommentState.PUBLISHED:
        return 'Save'
    }
  }

  const buttons: ButtonMetadata[] = [
    {
      label: 'Cancel',
      key: 'cancel',
      type: 'default',
    },
    {
      label: getSaveButtonLabel(),
      key: 'save',
      type: 'primary',
    },
  ]

  return (
    <div css={styles.container}>
      <Editor
        initialText={comment.body}
        placeholder={comment.state === CommentState.DRAFT ? 'Add a comment...' : 'Edit your comment...'}
        isVisible={true}
        buttons={buttons}
        onSave={(commentText) => onEventTrigger?.(CommentEvent.SAVE, comment, commentText)}
        onCancel={() => onEventTrigger?.(CommentEvent.CANCEL, comment)}
      />
    </div>
  )
}
