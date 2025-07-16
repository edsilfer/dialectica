import { PrKey, publishReview, PublishReviewRequest, PublishReviewResponse, ReviewPayload } from '@diff-viewer'
import { useCallback } from 'react'
import { useSettings } from '../../provider/setttings-provider'

/**
 * Review datastore operations interface
 */
export interface ReviewDatastore {
  /**
   * Publish a review.
   *
   * @param payload - The review payload containing status, comment, and commit ID
   * @param comments - Array of comments to include in the review
   * @returns Promise that resolves with the review response
   */
  save: (payload: ReviewPayload, comments: PublishReviewRequest['comments']) => Promise<PublishReviewResponse>
}

/**
 * Hook that handles review publishing operations.
 *
 * @param prKey - The pull request key
 * @returns Review data operations and state
 */
export function useReviewDatastore(prKey?: PrKey) {
  const { githubPat: token, useMocks } = useSettings()

  // PUBLIC API ______________________________________________________________________________________
  const save = useCallback(
    async (payload: ReviewPayload, comments: PublishReviewRequest['comments']): Promise<PublishReviewResponse> => {
      if (!prKey) {
        throw new Error('Cannot publish review: missing PR key')
      }

      if (comments.length === 0) {
        throw new Error('No review comments to submit')
      }

      return await publishReview({
        prKey,
        token,
        useMocks,
        body: payload.comment,
        event: payload.reviewStatus,
        comments,
        commitId: payload.commitId,
      } as PublishReviewRequest)
    },
    [prKey, token, useMocks],
  )

  return {
    handle: {
      save,
    },
  }
}
