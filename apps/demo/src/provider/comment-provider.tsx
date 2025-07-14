import { CommentMetadata, CommentState } from '@diff-viewer'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface CommentHandle {
  /** Add a new comment in any state */
  addComment: (comment: CommentMetadata) => void
  /** Add multiple comments at once */
  addComments: (comments: CommentMetadata[]) => void
  /** Save a draft comment */
  saveDraft: (key: string, body?: string) => void
  /** Update a draft comment */
  updateDraft: (key: string, updates: Parameters<CommentMetadata['with']>[0]) => void
  /** Cancel a draft comment */
  cancelDraft: (key: string) => void
  /** Delete a draft comment */
  deleteDraft: (key: string) => void
  /** Get a single comment by key */
  getComment: (key: string) => CommentMetadata | undefined
  /** Get comments filtered by state */
  getComments: (state?: CommentState) => Map<string, CommentMetadata>
  /** Get all comments grouped by location */
  getCommentsGroupedByLocation: () => Map<string, CommentMetadata[]>
}

interface CommentContextValue {
  /** The comments to render */
  comments: Map<string, CommentMetadata>
  /** The number of comments */
  size: number
  /** Whether there are any draft comments */
  hasDrafts: boolean
  /** Whether there are any published comments */
  hasPublished: boolean
  /** Handle with all comment operations */
  handle: CommentHandle
}

const CommentContext = createContext<CommentContextValue | null>(null)

interface CommentProviderProps {
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

export function CommentProvider({ children }: CommentProviderProps) {
  const [comments, setComments] = useState<Map<string, CommentMetadata>>(new Map())

  const size = comments.size

  const hasDrafts = useMemo(
    () =>
      Array.from(comments.values()).some(
        (comment) => comment.state === CommentState.DRAFT || comment.state === CommentState.SAVED_DRAFT,
      ),
    [comments],
  )

  const hasPublished = useMemo(
    () => Array.from(comments.values()).some((comment) => comment.state === CommentState.PUBLISHED),
    [comments],
  )

  const validate = useCallback(
    (key: string, comment: CommentMetadata | undefined, states: CommentState[], operation: string): CommentMetadata => {
      if (!comment) {
        throw new Error(`Cannot ${operation}: Comment with key "${key}" not found`)
      }

      if (!states.includes(comment.state)) {
        const stateStr = states.join(' or ')
        throw new Error(`Cannot ${operation}: Comment must be in ${stateStr} state, but is in ${comment.state} state`)
      }

      return comment
    },
    [],
  )

  const addComment = useCallback((comment: CommentMetadata) => {
    const key = comment.getKey()
    setComments((prevComments) => {
      // Always allow adding new comments (regardless of state)
      if (!prevComments.has(key)) {
        const newComments = new Map(prevComments)
        newComments.set(key, comment)
        return newComments
      }
      return prevComments
    })
  }, [])

  const addComments = useCallback((comments: CommentMetadata[]) => {
    setComments((prevComments) => {
      const newComments = new Map(prevComments)
      comments.forEach((comment) => {
        const key = comment.getKey()
        newComments.set(key, comment)
      })
      return newComments
    })
  }, [])

  const saveDraft = useCallback(
    (key: string, body?: string) => {
      setComments((prevComments) => {
        const comment = prevComments.get(key)
        const validatedComment = validate(key, comment, [CommentState.DRAFT], 'save draft')

        const updated = validatedComment.with({
          state: CommentState.SAVED_DRAFT,
          body: body || validatedComment.body,
        })

        const newComments = new Map(prevComments)
        newComments.set(key, updated)
        return newComments
      })
    },
    [validate],
  )

  const updateDraft = useCallback((key: string, updates: Parameters<CommentMetadata['with']>[0]) => {
    setComments((prevComments) => {
      const comment = prevComments.get(key)
      if (comment) {
        const updated = comment.with(updates)
        const newComments = new Map(prevComments)
        newComments.set(key, updated)
        return newComments
      }
      return prevComments
    })
  }, [])

  const cancelDraft = useCallback(
    (key: string) => {
      setComments((prevComments) => {
        const comment = prevComments.get(key)
        validate(key, comment, [CommentState.DRAFT], 'cancel draft')

        const newComments = new Map(prevComments)
        newComments.delete(key)
        return newComments
      })
    },
    [validate],
  )

  const deleteDraft = useCallback(
    (key: string) => {
      setComments((prevComments) => {
        const comment = prevComments.get(key)
        validate(key, comment, [CommentState.SAVED_DRAFT], 'delete draft')

        const newComments = new Map(prevComments)
        newComments.delete(key)
        return newComments
      })
    },
    [validate],
  )

  const getComment = useCallback(
    (key: string) => {
      return comments.get(key)
    },
    [comments],
  )

  const getComments = useCallback(
    (state?: CommentState): Map<string, CommentMetadata> => {
      if (state === undefined) {
        return new Map(comments)
      }

      const filtered = new Map<string, CommentMetadata>()
      for (const [key, comment] of comments) {
        if (comment.state === state) {
          filtered.set(key, comment)
        }
      }
      return filtered
    },
    [comments],
  )

  const getCommentsGroupedByLocation = useCallback((): Map<string, CommentMetadata[]> => {
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
      commentList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }

    return grouped
  }, [comments])

  const handle: CommentHandle = useMemo(
    () => ({
      addComment,
      addComments,
      saveDraft,
      updateDraft,
      cancelDraft,
      deleteDraft,
      getComment,
      getComments,
      getCommentsGroupedByLocation,
    }),
    [
      addComment,
      addComments,
      saveDraft,
      updateDraft,
      cancelDraft,
      deleteDraft,
      getComment,
      getComments,
      getCommentsGroupedByLocation,
    ],
  )

  const contextValue: CommentContextValue = {
    comments,
    size,
    hasDrafts,
    hasPublished,
    handle,
  }

  return <CommentContext.Provider value={contextValue}>{children}</CommentContext.Provider>
}

export function useCommentContext(): CommentContextValue {
  const context = useContext(CommentContext)
  if (!context) {
    throw new Error('useCommentContext must be used within a CommentProvider')
  }
  return context
}
