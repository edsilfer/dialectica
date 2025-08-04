import { Widget } from '@dialectica-org/diff-viewer'
import type { CommentEventHandler, CommentStore } from '@github'
import { CommentState } from '@github'
import { useMemo } from 'react'
import { WidgetFactory } from '../../models/WidgetFactory'
import { useSettings } from '../use-settings'

/**
 * Widget datastore operations interface
 */
interface WidgetDatastore {
  /**
   * List all comment widgets.
   *
   * @returns Array of comment widgets
   */
  list: () => Widget[]
}

/**
 * Hook that creates a widget datastore from a comment datastore and event handler.
 *
 * @param commentDs - The comment datastore to get comments from
 * @param onCommentEvent   - Event handler for comment events
 * @returns Widget datastore with list method
 */
export function useWidgetDatastore(commentDs?: CommentStore, onCommentEvent?: CommentEventHandler) {
  const { currentUser } = useSettings()

  const widgets = useMemo(() => {
    if (!commentDs || !onCommentEvent || !currentUser) return []

    const commentAuthor = {
      login: currentUser.login!,
      avatar_url: currentUser.avatar_url!,
      html_url: currentUser.avatar_url!,
    }

    const groupedComments = commentDs.getThreads()
    const draftComments = commentDs.list(CommentState.DRAFT)
    const pendingComments = commentDs.list(CommentState.PENDING)
    const isReviewing = draftComments.size + pendingComments.size > 1

    return WidgetFactory.build(groupedComments, commentAuthor, onCommentEvent, isReviewing)
  }, [commentDs, currentUser, onCommentEvent, commentDs])

  return {
    handle: { list: () => widgets } as WidgetDatastore,
  }
}
