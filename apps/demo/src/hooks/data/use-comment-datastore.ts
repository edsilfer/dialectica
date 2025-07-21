import { LineMetadata } from '@diff-viewer'
import {
  CommentFactory,
  CommentMetadata,
  CommentState,
  deleteInlineComment,
  editInlineComment,
  getInlineComments,
  GitHubInlineComment,
  PrKey,
} from '@github'
import { useCallback, useEffect } from 'react'
import { useCommentsContext } from '../../provider/comments-provider'
import { useSettings } from '../../provider/setttings-provider'
import { useAsync } from '../use-async'

/**
 * Comment datastore operations interface
 */
export interface CommentDatastore {
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

/**
 * Hook that handles all comment-related data fetching and CRUD operations.
 *
 * @param prKey          - The pull request key
 * @param refetchTrigger - Optional trigger to force refetch comments (increment to refetch)
 * @returns                Comment data operations and state
 */
export function useCommentDatastore(prKey?: PrKey) {
  const { handle } = useCommentsContext()
  const { githubPat: token, useMocks, currentUser } = useSettings()

  const commentsReq = useAsync<GitHubInlineComment[]>(!!prKey, [prKey, token, useMocks], async () => {
    if (!prKey) return []
    return getInlineComments({ prKey, token, useMocks })
  })

  // STATE MANAGEMENT _________________________________________________________________________________
  useEffect(() => {
    if (commentsReq.data && commentsReq.data.length > 0) {
      const commentMetadata = commentsReq.data.map((githubComment) => {
        return CommentFactory.fromGitHubComment(githubComment)
      })
      handle.add(commentMetadata)
    }
  }, [commentsReq.data])

  // PUBLIC API ______________________________________________________________________________________
  const create = useCallback(
    (lineMetadata: LineMetadata, state?: CommentState): CommentMetadata | null => {
      if (!currentUser) return null

      const author = {
        login: currentUser.login!,
        avatar_url: currentUser.avatar_url!,
        html_url: currentUser.avatar_url!,
      }

      return CommentFactory.create(lineMetadata, author, state)
    },
    [currentUser],
  )

  const save = useCallback(
    (comment: CommentMetadata): void => {
      handle.add([comment])
    },
    [handle],
  )

  const read = useCallback(
    (commentId: number): CommentMetadata | undefined => {
      return handle.get(commentId)
    },
    [handle],
  )

  const remove = useCallback(
    async (commentId: number, deleteFromRemote = false): Promise<boolean> => {
      if (!prKey) {
        throw new Error('Cannot delete comment: missing PR key')
      }

      const comment = handle.get(commentId)
      if (deleteFromRemote && comment?.serverId) {
        try {
          await deleteInlineComment({
            prKey,
            token,
            commentId: comment.serverId,
          })
        } catch {
          return false
        }
      }

      handle.remove(commentId)

      return true
    },
    [prKey, token, handle],
  )

  const update = useCallback(
    async (commentId: number, updates: Partial<CommentMetadata>, updateRemote = false): Promise<boolean> => {
      const comment = handle.get(commentId)
      if (!comment) {
        return false
      }

      if (updateRemote && comment.wasPublished && comment.serverId) {
        try {
          await editInlineComment({
            prKey: prKey!,
            token,
            commentId: comment.serverId,
            body: updates.body || comment.body,
          })
        } catch {
          return false
        }
      }

      handle.update(commentId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })

      return true
    },
    [prKey, token, handle],
  )

  function clear() {
    handle.clear()
  }

  const refetch = useCallback(() => {
    handle.clear(CommentState.PUBLISHED)
    commentsReq.refetch()
  }, [handle, commentsReq])

  const datastore: CommentDatastore = {
    create,
    save,
    read,
    update,
    delete: remove,
    list: handle.list,
    getThreads: handle.getThread,
    clear,
    refetch,
  }

  return {
    loading: commentsReq.loading,
    error: commentsReq.error,
    comments: commentsReq.data,
    handle: datastore,
  }
}
