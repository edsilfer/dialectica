import {
  CommentAuthor,
  CommentEvent,
  CommentMetadata,
  CommentState,
  PrKey,
  deleteInlineComment,
  editInlineComment,
} from '@diff-viewer'
import { GitHubInlineComment } from '@diff-viewer/src/addons/pull-request'
import { useCallback, useEffect, useState } from 'react'
import { CommentMetadataFactory } from '../models/CommentMetadataFactory'
import { EventHandler } from '../models/WidgetFactory'
import { useCommentsContext } from '../provider/comments-provider'
import { useSettings } from '../provider/setttings-provider'

/**
 * Hook that provides comment state management functions and data from the comment context.
 *
 * @returns Comment state management functions and data
 */
export function useCommentState(prKey: PrKey) {
  const [author, setAuthor] = useState<CommentAuthor | null>(null)

  const { currentUser } = useSettings()
  const { comments, handle } = useCommentsContext()
  const { githubPat: token } = useSettings()

  useEffect(() => {
    if (currentUser) {
      setAuthor({
        login: currentUser.login!,
        avatar_url: currentUser.avatar_url!,
        html_url: currentUser.avatar_url!,
      })
    }
  }, [currentUser])

  /**
   * Handle events from inline comments (both existing and authored).
   */
  const onCommentEvent = useCallback<EventHandler>(
    (metadata, event, data) => {
      const key = metadata.getKey()
      switch (metadata.currentState) {
        case CommentState.DRAFT:
          onDraftEvent(key, event, metadata, data)
          break
        case CommentState.PENDING:
          onPendingEvent(key, event, metadata, data)
          break
        case CommentState.PUBLISHED:
          onPublishedEvent(key, event, metadata, data)
          break
      }
    },
    [handle],
  )

  const onDraftEvent = (key: string, event: CommentEvent, metadata: CommentMetadata, data?: string) => {
    switch (event) {
      case CommentEvent.ADD: {
        const draftComment = createDraftComment(metadata)
        if (draftComment) {
          handle.add(draftComment)
        }
        break
      }

      case CommentEvent.SAVE:
        if (!metadata.wasPublished) {
          updateToPending(key, data)
        } else {
          // TODO: should we do this inside the handle?
          if (data) {
            editInlineComment({
              prKey,
              token,
              commentId: metadata.id,
              body: data,
            })
              .then((comment: GitHubInlineComment) => {
                handle.update(key, {
                  body: data,
                  state: CommentState.PUBLISHED,
                  updatedAt: comment.updated_at,
                  wasPublished: true,
                })
              })
              .catch((error: Error) => {
                console.error('Error editing inline comment', error)
              })
          }
        }
        break

      case CommentEvent.CANCEL: {
        const comment = handle.get(key)
        if (comment && comment.body.length > 0) {
          updateToPending(key)
        } else {
          handle.remove(key)
        }
        break
      }

      case CommentEvent.EDIT:
        handle.update(key, { state: CommentState.DRAFT })
        break

      case CommentEvent.DELETE:
        handle.remove(key)
        break
    }
  }

  const onPendingEvent = (key: string, event: CommentEvent, metadata: CommentMetadata, _data?: string) => {
    switch (event) {
      // When replying a non-published comment, we should convert it to a draft to ammend the edit
      case CommentEvent.REPLY:
      case CommentEvent.EDIT:
        handle.update(key, { state: CommentState.DRAFT })
        break

      case CommentEvent.DELETE:
        if (metadata.wasPublished) {
          deleteInlineComment({
            prKey,
            token,
            commentId: metadata.id,
          })
            .then(() => {
              handle.remove(key)
            })
            .catch((error: Error) => {
              console.error('Error deleting inline comment', error)
            })
        } else {
          handle.remove(key)
        }
        break
    }
  }

  const onPublishedEvent = (key: string, event: CommentEvent, metadata: CommentMetadata, _data?: string) => {
    switch (event) {
      case CommentEvent.REPLY: {
        const replyComment = createDraftComment(metadata)
        if (replyComment) {
          handle.add(replyComment)
        }
        break
      }

      case CommentEvent.EDIT:
        handle.update(key, { state: CommentState.DRAFT })
        break
      case CommentEvent.DELETE:
        deleteInlineComment({
          prKey,
          token,
          commentId: metadata.id,
        })
          .then(() => {
            handle.remove(key)
          })
          .catch((error: Error) => {
            console.error('Error deleting inline comment', error)
          })
        break
      case CommentEvent.RESOLVE:
        break
      case CommentEvent.REACT:
        break
    }
  }

  // PRIVATE HELPERS ------------------------------------------------------------
  const createDraftComment = useCallback(
    (metadata: CommentMetadata) => {
      if (!author) return null

      return CommentMetadataFactory.createDraft(
        {
          lineNumber: metadata.line,
          side: metadata.side.toLowerCase() as 'left' | 'right',
          content: undefined,
          filepath: metadata.path,
        },
        author,
      )
    },
    [author],
  )

  const updateToPending = useCallback(
    (key: string, body?: string) => {
      const comment = handle.get(key)
      if (comment) {
        handle.remove(key)
        const updated = comment.with({
          state: CommentState.PENDING,
          ...(body !== undefined && { body }),
          updatedAt: new Date().toISOString(),
        })
        handle.add(updated)
      }
    },
    [handle],
  )

  return { comments, onCommentEvent }
}
