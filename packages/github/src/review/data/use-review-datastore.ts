import { useCallback } from 'react'
import { PrKey, publishReview, PublishReviewRequest, PublishReviewResponse } from '../../api'
import { ReviewPayload } from '../models/review-payload'

/**
 * Hook that handles review publishing operations.
 *
 * @param token    - The GitHub token
 * @param prKey    - The pull request key
 * @param useMocks - Whether to use mock data
 * @returns Review data operations and state
 */
export function useReviewDatastore(token?: string, prKey?: PrKey, useMocks?: boolean) {
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
    reviewDs: {
      save,
    },
  }
}
