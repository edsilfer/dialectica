import { LineMetadata } from '@diff-viewer'
import { CommentMetadata, CommentState } from '../models'

/**
 * Comment datastore operations interface
 */
export interface CommentStore {
  /**
   * Create a new comment.
   *
   * @param lineMetadata - The line metadata
   * @param state        - The comment state
   * @returns              The comment metadata
   */
  create: (lineMetadata: LineMetadata, state?: CommentState) => CommentMetadata | null

  /**
   * Save a comment in the local context provider.
   *
   * @param comment - The comment metadata
   */
  save: (comment: CommentMetadata) => void

  /**
   * Read a comment from the local context provider.
   *
   * @param commentId - The comment id
   * @returns          The comment metadata
   */
  read: (commentId: number) => CommentMetadata | undefined

  /**
   * Update a comment in the local context provider.
   *
   * @param commentId    - The comment id
   * @param updates      - The updates to apply to the comment
   * @param updateRemote - Whether to update the comment on the remote server
   * @returns              The updated comment metadata
   */
  update: (commentId: number, updates: Partial<CommentMetadata>, updateRemote?: boolean) => Promise<boolean>

  /**
   * Delete a comment from the local context provider.
   *
   * @param commentId        - The comment id
   * @param deleteFromRemote - Whether to delete the comment from the remote server
   * @returns                  The result of the deletion
   */
  delete: (commentId: number, deleteFromRemote?: boolean) => Promise<boolean>

  /**
   * List comments filtered by state.
   *
   * @param state - The state to filter by (optional)
   * @returns       Map of comment ids to comment metadata
   */
  list: (state?: CommentState) => Map<number, CommentMetadata>

  /**
   * Get all comments grouped by location.
   *
   * @returns Map of location keys to comment arrays
   */
  getThreads: () => Map<string, CommentMetadata[]>

  /**
   * Clear all comments or comments with a specific state.
   *
   * @param state - The state to clear (optional)
   */
  clear: (state?: CommentState) => void

  /**
   * Refetch comments from the remote server.
   */
  refetch: () => void
}
