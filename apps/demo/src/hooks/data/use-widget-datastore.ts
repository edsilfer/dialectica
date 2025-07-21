import { Widget } from '@diff-viewer'
import { CommentState } from '@github'
import { useMemo } from 'react'
import { EventHandler, WidgetFactory } from '../../models/WidgetFactory'
import { useSettings } from '../../provider/setttings-provider'
import type { CommentDatastore } from './use-comment-datastore'

/**
 * Widget datastore operations interface
 */
export interface WidgetDatastore {
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
 * @param commentDatastore - The comment datastore to get comments from
 * @param onCommentEvent   - Event handler for comment events
 * @returns Widget datastore with list method
 */
export function useWidgetDatastore(commentDatastore?: CommentDatastore, onCommentEvent?: EventHandler) {
  const { currentUser } = useSettings()

  const widgets = useMemo(() => {
    if (!commentDatastore || !onCommentEvent || !currentUser) return []

    const comments = commentDatastore.list()
    if (comments.size === 0) return []

    const commentAuthor = {
      login: currentUser.login!,
      avatar_url: currentUser.avatar_url!,
      html_url: currentUser.avatar_url!,
    }

    const groupedComments = commentDatastore.getThreads()
    const draftComments = commentDatastore.list(CommentState.DRAFT)
    const pendingComments = commentDatastore.list(CommentState.PENDING)
    const isReviewing = draftComments.size + pendingComments.size > 1

    return WidgetFactory.build(groupedComments, commentAuthor, onCommentEvent, isReviewing)
  }, [commentDatastore, onCommentEvent, currentUser])

  return {
    handle: {
      list: () => widgets,
    },
  }
}
