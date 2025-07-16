import { CommentMetadata, CommentState } from '@diff-viewer'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface ReviewHandle {
  /** Add one or more comments in any state */
  add: (comment: CommentMetadata | CommentMetadata[]) => void
  /** Update any comment */
  update: (key: string, updates: Parameters<CommentMetadata['with']>[0]) => void
  /** Remove a comment by key regardless of state */
  remove: (key: string) => void
  /** Clear all comments */
  clear: () => void
  /** Get a single comment by key */
  get: (key: string) => CommentMetadata | undefined
  /** List comments filtered by state */
  list: (state?: CommentState) => Map<string, CommentMetadata>
  /** Get all comments grouped by location */
  getThread: () => Map<string, CommentMetadata[]>
}

interface CommentsContextValue {
  /** The comments to render */
  comments: Map<string, CommentMetadata>
  /** The number of comments */
  size: number
  /** Handle with all comment operations */
  handle: ReviewHandle
}

const CommentsContext = createContext<CommentsContextValue | null>(null)

interface CommentsProviderProps {
  /** The children to render */
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
  const [comments, setComments] = useState<Map<string, CommentMetadata>>(new Map())

  const size = comments.size

  const add = useCallback((commentOrComments: CommentMetadata | CommentMetadata[]) => {
    const commentsToAdd = Array.isArray(commentOrComments) ? commentOrComments : [commentOrComments]

    setComments((prevComments) => {
      const newComments = new Map(prevComments)
      commentsToAdd.forEach((comment) => {
        const key = comment.getKey()
        // Always allow adding new comments (regardless of state)
        if (!newComments.has(key)) {
          newComments.set(key, comment)
        }
      })
      return newComments
    })
  }, [])

  const update = useCallback((key: string, updates: Parameters<CommentMetadata['with']>[0]) => {
    setComments((prevComments) => {
      const comment = prevComments.get(key)
      if (!comment) {
        throw new Error(`Cannot update: Comment with key "${key}" not found`)
      }

      const updated = comment.with(updates).with({ updatedAt: new Date().toISOString() })
      const newComments = new Map(prevComments)
      newComments.set(key, updated)
      return newComments
    })
  }, [])

  const remove = useCallback((key: string) => {
    setComments((prevComments) => {
      const comment = prevComments.get(key)
      if (!comment) {
        throw new Error(`Cannot remove: Comment with key "${key}" not found`)
      }

      const newComments = new Map(prevComments)
      newComments.delete(key)
      return newComments
    })
  }, [])

  const clear = useCallback(() => {
    setComments(new Map())
  }, [])

  const get = useCallback(
    (key: string) => {
      return comments.get(key)
    },
    [comments],
  )

  const list = useCallback(
    (state?: CommentState): Map<string, CommentMetadata> => {
      if (state === undefined) {
        return new Map(comments)
      }

      const filtered = new Map<string, CommentMetadata>()
      for (const [key, comment] of comments) {
        if (comment.currentState === state) {
          filtered.set(key, comment)
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
    throw new Error('useCommentContext must be used within a CommentProvider')
  }
  return context
}
