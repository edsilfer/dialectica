import { CommentEvent, CommentMetadata, CommentState } from '../models/CommentMetadata'
import { CommentStore } from './CommentStore'
import { LineMetadata } from '@diff-viewer'

/**
 * Event handler for comment widget events
 */
export type CommentEventHandler = (event: CommentEvent, metadata?: CommentMetadata, data?: string) => void

/**
 * Interface for comment event processors.
 */
interface CommentEventProcessor {
  /**
   * Process a comment event.
   *
   * @param e       - The event to process.
   * @param comment - The metadata of the comment.
   * @param content - The data of the comment.
   */
  process(e: CommentEvent, comment?: CommentMetadata, content?: string): void
}

export class CommentEventProcessorImpl implements CommentEventProcessor {
  constructor(
    private ds: CommentStore,
    private getDockedLine: () => LineMetadata | undefined,
  ) {}

  process(e: CommentEvent, comment?: CommentMetadata, content?: string): void {
    if (e === CommentEvent.ADD) {
      const dockedLine = this.getDockedLine()
      if (dockedLine) {
        const newComment = this.ds.create(dockedLine, CommentState.DRAFT)
        if (newComment) {
          this.ds.save(newComment)
        }
      }
      return
    }

    if (!comment) {
      return
    }

    switch (comment.state) {
      case CommentState.DRAFT:
        this.processDraftEvent(e, comment, content)
        break
      case CommentState.PENDING:
        this.processPendingEvent(e, comment)
        break
      case CommentState.PUBLISHED:
        this.processPublishedEvent(e, comment, content)
        break
    }
  }

  private processDraftEvent(e: CommentEvent, comment: CommentMetadata, content?: string): void {
    switch (e) {
      case CommentEvent.SAVE:
        if (!comment.wasPublished) {
          void this.ds.update(comment.localId, { state: CommentState.PENDING, body: content })
        } else {
          if (content) {
            void this.ds.update(comment.localId, { body: content }, true)
          }
        }
        break

      case CommentEvent.CANCEL: {
        console.log('CANCEL', comment)
        if (comment.wasPublished || comment.body.length > 0) {
          void this.ds.update(comment.localId, { state: CommentState.PENDING, body: content })
        } else {
          void this.ds.delete(comment.localId)
        }
        break
      }

      case CommentEvent.EDIT:
        void this.ds.update(comment.localId, { state: CommentState.DRAFT })
        break

      case CommentEvent.DELETE:
        void this.ds.delete(comment.localId)
        break
    }
  }

  private processPendingEvent(e: CommentEvent, comment: CommentMetadata): void {
    switch (e) {
      case CommentEvent.REPLY:
      case CommentEvent.EDIT:
        void this.ds.update(comment.localId, { state: CommentState.DRAFT })
        break

      case CommentEvent.DELETE:
        if (comment.wasPublished) {
          void this.ds.delete(comment.localId, true)
        } else {
          void this.ds.delete(comment.localId)
        }
        break
    }
  }

  private processPublishedEvent(e: CommentEvent, comment: CommentMetadata, _?: string): void {
    switch (e) {
      case CommentEvent.REPLY: {
        const replyComment = this.ds.create(
          {
            lineNumber: comment.line,
            side: comment.side.toLowerCase() as 'left' | 'right',
            content: undefined,
            filepath: comment.path,
          },
          CommentState.DRAFT,
        )
        if (replyComment) {
          this.ds.save(replyComment)
        }
        break
      }

      case CommentEvent.EDIT:
        void this.ds.update(comment.localId, { state: CommentState.DRAFT })
        break
      case CommentEvent.DELETE:
        void this.ds.delete(comment.localId, true)
        break
    }
  }
}
