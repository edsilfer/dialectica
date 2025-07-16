import { CommentState, ReviewPayload } from '@diff-viewer'
import { useCallback, useMemo, useState } from 'react'
import { useCommentsContext } from '../../provider/comments-provider'
import { CommentDatastore } from '../data/use-comment-datastore'
import { ReviewDatastore } from '../data/use-review-datastore'

/**
 * Hook that provides review submission functionality.
 *
 * @param reviewDatastore - The review datastore instance
 * @param commentDatastore - The comment datastore instance
 * @returns Object containing pending review comments and submit handler
 */
export function useReview(reviewDatastore: ReviewDatastore, commentDatastore: CommentDatastore) {
  const { handle } = useCommentsContext()
  const [isPosting, setIsPosting] = useState(false)

  const comments = useMemo(() => {
    return Array.from(handle.list(CommentState.PENDING).values())
  }, [handle])

  const onSubmitReview = useCallback(
    async (payload: ReviewPayload) => {
      const reviewComments = comments.map((comment) => ({
        path: comment.path,
        line: comment.line,
        side: comment.side,
        body: comment.body,
      }))

      setIsPosting(true)

      try {
        const response = await reviewDatastore.save(payload, reviewComments)

        /**
         * Upon successful review submission, we need to update the local comment datastore
         * with the server ID of the comments. This is necessary to ensure the local context
         * is updated with the latest comments (the server ID), allowing operations like
         * deleting and editing comments to work correctly.
         */
        for (const comment of response.updatedComments) {
          void commentDatastore.update(comment.localId, {
            serverId: comment.serverId,
            state: CommentState.PUBLISHED,
            wasPublished: true,
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'InlineCommentsFetchError') {
          console.error('Failed to fetch updated comments after publishing review:', error)
          commentDatastore.clear()
          commentDatastore.refetch()
        } else {
          // TODO: Display a notification to the user about the failed review submission
          console.error('Error publishing review', error)
          throw error
        }
      } finally {
        setIsPosting(false)
      }
    },
    [comments, handle, reviewDatastore, commentDatastore],
  )

  return {
    isPosting,
    comments,
    onSubmitReview,
  }
}
