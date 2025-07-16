import { CommentState, PrKey, PublishReviewResponse, ReviewPayload, publishReview } from '@diff-viewer'
import { useCallback, useMemo, useState } from 'react'
import { useCommentsContext } from '../provider/comments-provider'
import { useSettings } from '../provider/setttings-provider'

/**
 * Hook that provides review submission functionality.
 *
 * @returns Object containing pending review comments and submit handler
 */
export function useReview(prKey: PrKey) {
  const { handle } = useCommentsContext()
  const { githubPat: token, useMocks } = useSettings()
  const [isPosting, setIsPosting] = useState(false)

  const comments = useMemo(() => {
    return Array.from(handle.list(CommentState.PENDING).values())
  }, [handle])

  const onSubmitReview = useCallback(
    (payload: ReviewPayload) => {
      const reviewComments = comments.map((comment) => ({
        path: comment.path,
        line: comment.line,
        side: comment.side,
        body: comment.body,
      }))

      if (reviewComments.length === 0) {
        throw new Error('No review comments to submit')
      }

      setIsPosting(true)

      publishReview({
        prKey,
        token,
        useMocks,
        body: payload.comment,
        event: payload.reviewStatus,
        comments: reviewComments,
        commitId: payload.commitId,
      })
        .then((_: PublishReviewResponse) => {
          handle.clear()
        })
        .catch((error: Error) => {
          console.error('Error publishing review', error)
        })
        .finally(() => setIsPosting(false))
    },
    [comments, handle, token, useMocks],
  )

  return {
    isPosting,
    comments,
    onSubmitReview,
  }
}
