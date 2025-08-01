import { useCallback, useState } from 'react'
import { CommentMetadata, CommentState, CommentStore } from '../../comment'
import { ReviewStore } from '../data'
import { ReviewPayload } from '../models/review-payload'

/**
 * Hook that creates a review controller.
 *
 * @param reviewDatastore - The review datastore to coordinate with.
 * @param commentDatastore - The comment datastore to coordinate with.
 * @returns The review controller.
 */
export function useReviewController(reviewDatastore: ReviewStore, commentDatastore: CommentStore) {
  const [isPosting, setIsPosting] = useState(false)

  const onSubmitReview = useCallback(
    async (payload: ReviewPayload, pendingComments: CommentMetadata[]) => {
      if (!commentDatastore) {
        throw new Error('Comment datastore is required for review submission')
      }

      const reviewComments = pendingComments.map((comment) => ({
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
    [reviewDatastore, commentDatastore],
  )

  return {
    isPosting,
    onSubmitReview,
  }
}
