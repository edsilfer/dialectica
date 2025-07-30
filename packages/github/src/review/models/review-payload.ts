import { ReviewStatus } from '../../api'

export interface ReviewPayload {
  /** The status of the review */
  reviewStatus: ReviewStatus
  /** The comment of the review */
  comment?: string
  /** The commit SHA associated with the review (injected by parent). */
  commitId?: string
}
