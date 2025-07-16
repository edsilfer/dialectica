import { CommentMetadata, CommentState } from '@diff-viewer'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface ReviewHandle {
  /** Add one or more comments in any state */
  add: (comment: CommentMetadata | CommentMetadata[]) => void
  /** Update any comment */
  update: (id: number, updates: Parameters<CommentMetadata['with']>[0]) => void
  /** Remove a comment by id regardless of state */
  remove: (id: number) => void
  /** Clear all comments or comments with a specific state */
  clear: (state?: CommentState) => void
  /** Get a single comment by id */
  get: (id: number) => CommentMetadata | undefined
  /** List comments filtered by state */
  list: (state?: CommentState) => Map<number, CommentMetadata>
  /** Get all comments grouped by location */
  getThread: () => Map<string, CommentMetadata[]>
}

interface CommentsContextValue {
  /** All comments stored in the context */
  comments: Map<number, CommentMetadata>
  /** Number of comments in the context */
  size: number
  /** Handle for comment operations */
  handle: ReviewHandle
}

const CommentsContext = createContext<CommentsContextValue | null>(null)

interface CommentsProviderProps {
  children: React.ReactNode
}

/**
 * Generate a location-based key for grouping comments that belong together.
 * This matches the grouping logic from parseComments.
 */
function getLocationKey(path: string, line: number, side: 'LEFT' | 'RIGHT'): string {
  const sideStr = side === 'LEFT' ? 'left' : 'right'
  return `${path}:${line}:${sideStr}`
}

export function CommentsProvider({ children }: CommentsProviderProps) {
  const [comments, setComments] = useState<Map<number, CommentMetadata>>(new Map())

  const size = comments.size

  const add = useCallback((commentOrComments: CommentMetadata | CommentMetadata[]) => {
    const commentsToAdd = Array.isArray(commentOrComments) ? commentOrComments : [commentOrComments]

    setComments((prevComments) => {
      const newComments = new Map(prevComments)
      commentsToAdd.forEach((comment) => {
        // Always allow adding new comments (regardless of state)
        if (!newComments.has(comment.localId)) {
          newComments.set(comment.localId, comment)
        }
      })
      return newComments
    })
  }, [])

  const update = useCallback((id: number, updates: Parameters<CommentMetadata['with']>[0]) => {
    setComments((prevComments) => {
      const comment = prevComments.get(id)
      if (!comment) {
        throw new Error(`Cannot update: Comment with id "${id}" not found`)
      }

      const updated = comment.with(updates).with({ updatedAt: new Date().toISOString() })
      const newComments = new Map(prevComments)
      newComments.set(updated.localId, updated)
      if (updated.localId !== id) newComments.delete(id)
      return newComments
    })
  }, [])

  const remove = useCallback((id: number) => {
    setComments((prevComments) => {
      const comment = prevComments.get(id)
      if (!comment) {
        throw new Error(`Cannot remove: Comment with id "${id}" not found`)
      }

      const newComments = new Map(prevComments)
      newComments.delete(id)
      return newComments
    })
  }, [])

  const clear = useCallback((state?: CommentState) => {
    setComments((prevComments) => {
      const newComments = new Map(prevComments)
      if (state === undefined) {
        newComments.clear()
      } else {
        for (const [id, comment] of newComments) {
          if (comment.state === state) {
            newComments.delete(id)
          }
        }
      }
      return newComments
    })
  }, [])

  const get = useCallback(
    (id: number) => {
      return comments.get(id)
    },
    [comments],
  )

  const list = useCallback(
    (state?: CommentState): Map<number, CommentMetadata> => {
      if (state === undefined) {
        return new Map(comments)
      }

      const filtered = new Map<number, CommentMetadata>()
      for (const [id, comment] of comments) {
        if (comment.state === state) {
          filtered.set(id, comment)
        }
      }
      return filtered
    },
    [comments],
  )

  const getThread = useCallback((): Map<string, CommentMetadata[]> => {
    const grouped = new Map<string, CommentMetadata[]>()

    for (const comment of comments.values()) {
      const locationKey = getLocationKey(comment.path, comment.line, comment.side)

      if (!grouped.has(locationKey)) {
        grouped.set(locationKey, [])
      }
      grouped.get(locationKey)!.push(comment)
    }

    // Sort comments within each group by creation date
    for (const commentList of grouped.values()) {
      commentList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }

    return grouped
  }, [comments])

  const handle: ReviewHandle = useMemo(
    () => ({
      add,
      update,
      remove,
      clear,
      get,
      list,
      getThread,
    }),
    [add, update, remove, clear, get, list, getThread],
  )

  const contextValue: CommentsContextValue = useMemo(
    () => ({
      comments,
      size,
      handle,
    }),
    [comments, size, handle],
  )

  return <CommentsContext.Provider value={contextValue}>{children}</CommentsContext.Provider>
}

export function useCommentsContext(): CommentsContextValue {
  const context = useContext(CommentsContext)
  if (!context) {
    throw new Error('useCommentsContext must be used within a CommentsProvider')
  }
  return context
}
