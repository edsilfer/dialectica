import { PublishReviewRequest, PublishReviewResponse } from '../../api'
import { ReviewPayload } from '../models/review-payload'

/**
 * Review datastore operations interface
 */
export interface ReviewStore {
  /**
   * Publish a review.
   *
   * @param payload - The review payload containing status, comment, and commit ID
   * @param comments - Array of comments to include in the review
   * @returns Promise that resolves with the review response
   */
  save: (payload: ReviewPayload, comments: PublishReviewRequest['comments']) => Promise<PublishReviewResponse>
}
