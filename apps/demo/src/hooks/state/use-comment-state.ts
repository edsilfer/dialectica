import { CommentAuthor, CommentEvent, CommentMetadata, CommentState, LineMetadata } from '@diff-viewer'
import { useCallback, useEffect, useState } from 'react'
import { EventHandler } from '../../models/WidgetFactory'
import { useSettings } from '../../provider/setttings-provider'
import type { CommentDatastore } from '../data/use-comment-datastore'

/**
 * Hook that provides comment state management functions and data from the comment context.
 *
 * @param datastore - The comment datastore handle
 * @returns Comment state management functions and data
 */
export function useCommentState(datastore?: CommentDatastore) {
  const { currentUser } = useSettings()

  const [author, setAuthor] = useState<CommentAuthor | null>(null)
  const [dockedLine, setDockedLine] = useState<LineMetadata | undefined>()

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
      if (!datastore) return

      switch (metadata.state) {
        case CommentState.DRAFT:
          onDraftEvent(event, metadata, data)
          break
        case CommentState.PENDING:
          onPendingEvent(event, metadata, data)
          break
        case CommentState.PUBLISHED:
          onPublishedEvent(event, metadata, data)
          break
      }
    },
    [datastore],
  )

  const onDraftEvent = (event: CommentEvent, metadata: CommentMetadata, data?: string) => {
    if (!datastore) return

    switch (event) {
      case CommentEvent.SAVE:
        if (!metadata.wasPublished) {
          void datastore.update(metadata.localId, { state: CommentState.PENDING, body: data })
        } else {
          if (data) {
            void datastore.update(metadata.localId, { body: data }, true)
          }
        }
        break

      case CommentEvent.CANCEL: {
        if (metadata.wasPublished || metadata.body.length > 0) {
          void datastore.update(metadata.localId, { state: CommentState.PENDING, body: data })
        } else {
          void datastore.delete(metadata.localId)
        }
        break
      }

      case CommentEvent.EDIT:
        void datastore.update(metadata.localId, { state: CommentState.DRAFT })
        break

      case CommentEvent.DELETE:
        void datastore.delete(metadata.localId)
        break
    }
  }

  const onPendingEvent = (event: CommentEvent, metadata: CommentMetadata, _data?: string) => {
    if (!datastore) return

    switch (event) {
      case CommentEvent.REPLY:
      case CommentEvent.EDIT:
        void datastore.update(metadata.localId, { state: CommentState.DRAFT })
        break

      case CommentEvent.DELETE:
        if (metadata.wasPublished) {
          void datastore.delete(metadata.localId, true)
        } else {
          void datastore.delete(metadata.localId)
        }
        break
    }
  }

  const onPublishedEvent = (event: CommentEvent, metadata: CommentMetadata, _data?: string) => {
    if (!datastore) return

    switch (event) {
      case CommentEvent.REPLY: {
        const replyComment = createDraftComment(metadata)
        if (replyComment) {
          datastore.save(replyComment)
        }
        break
      }

      case CommentEvent.EDIT:
        void datastore.update(metadata.localId, { state: CommentState.DRAFT })
        break
      case CommentEvent.DELETE:
        void datastore.delete(metadata.localId, true)
        break
      case CommentEvent.RESOLVE:
        break
      case CommentEvent.REACT:
        break
    }
  }

  /**
   * Handler to set the docked line for comment creation.
   */
  const onDock = useCallback((lineMetadata: LineMetadata) => {
    setDockedLine(lineMetadata)
  }, [])

  /**
   * Create and save a new draft comment for the current docked line.
   *
   * @returns void
   */
  const newComment = useCallback(() => {
    if (!datastore || !currentUser || !dockedLine) return
    const comment = datastore.create(dockedLine, CommentState.DRAFT)
    if (comment) {
      datastore.save(comment)
    }
  }, [datastore, currentUser, dockedLine])

  // PRIVATE HELPERS ------------------------------------------------------------
  const createDraftComment = useCallback(
    (metadata: CommentMetadata) => {
      if (!author || !datastore) return null

      return datastore.create(
        {
          lineNumber: metadata.line,
          side: metadata.side.toLowerCase() as 'left' | 'right',
          content: undefined,
          filepath: metadata.path,
        },
        CommentState.DRAFT,
      )
    },
    [author, datastore],
  )

  return {
    comments: datastore?.list() || new Map(),
    onCommentEvent,
    newComment,
    dockedLine,
    onDock,
  }
}
