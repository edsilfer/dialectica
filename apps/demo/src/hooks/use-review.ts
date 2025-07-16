import { CommentState, ReviewPayload } from '@diff-viewer'
import { useCallback, useMemo } from 'react'
import { useReviewContext } from '../provider/review-provider'

/**
 * Hook that provides review submission functionality.
 *
 * @returns Object containing pending review comments and submit handler
 */
export function publishReview() {
  const { handle } = useReviewContext()

  const comments = useMemo(() => {
    const savedDraftComments = handle.getComments(CommentState.SAVED_DRAFT)
    return Array.from(savedDraftComments.values())
  }, [handle])

  const handleSubmitReview = useCallback(
    (payload: ReviewPayload) => {
      console.log('Requested to submit review: ', payload, comments, 'author will come later')
    },
    [comments, handle],
  )

  return {
    pendingReviewComments: comments,
    handleSubmitReview,
  }
}
