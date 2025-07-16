import { CommentState, InlineCommentEvent } from '@diff-viewer'
import { useCallback } from 'react'
import { CommentMetadataFactory } from '../models/CommentMetadataFactory'
import { EventHandler } from '../models/WidgetFactory'
import { useCommentContext } from '../provider/comment-provider'
import { useSettings } from '../provider/setttings-provider'

/**
 * Hook that provides comment state management functions and data from the comment context.
 *
 * @returns Comment state management functions and data
 */
export function useCommentState() {
  const { comments, handle } = useCommentContext()
  const { currentUser } = useSettings()

  /**
   * Handle events from inline comments (both existing and authored).
   */
  const onCommentEvent = useCallback<EventHandler>(
    (metadata, event, data) => {
      const key = metadata.getKey()

      switch (event) {
        case InlineCommentEvent.ADD_DRAFT:
          handle.addComment(
            CommentMetadataFactory.createDraft(
              {
                lineNumber: metadata.line,
                side: metadata.side.toLowerCase() as 'left' | 'right',
                content: undefined,
                filepath: metadata.path,
              },
              currentUser,
            ),
          )
          break
        case InlineCommentEvent.SAVE_DRAFT:
          handle.saveDraft(key, data)
          break
        case InlineCommentEvent.CANCEL_DRAFT: {
          const comment = handle.getComment(key)
          if (comment && comment.body.length > 0) {
            // User gave trying to edit an existing in-mem content
            handle.saveDraft(key)
          } else {
            // The draft was empty, so we can just delete it
            handle.cancelDraft(key)
          }
          break
        }
        case InlineCommentEvent.EDIT_DRAFT:
          handle.updateDraft(key, { state: CommentState.DRAFT })
          break
        case InlineCommentEvent.DELETE_DRAFT:
          handle.deleteDraft(key)
          break

        // Published comment events - happens on the server
        // TODO: implement
        case InlineCommentEvent.PUBLISH_DRAFT:
          break
        case InlineCommentEvent.EDIT_PUBLISHED:
          break
        case InlineCommentEvent.DELETE_PUBLISHED:
          break
        case InlineCommentEvent.RESOLVE_PUBLISHED:
          break
        case InlineCommentEvent.POST_REACTION:
          break

        default:
          console.warn(`Unhandled comment event: ${String(event)}`)
      }
    },
    [handle],
  )

  return { comments, onCommentEvent }
}
