import { LineMetadata } from '@edsilfer/diff-viewer'
import React from 'react'
import { CommentMetadata, CommentState } from '../models/CommentMetadata'
import { CommentStore } from './CommentStore'

/**
 * Local implementation of CommentDatastore that manages state updates
 */
export class CommentLocalStore implements CommentStore {
  constructor(
    private comments: Map<number, CommentMetadata>,
    private setComments: React.Dispatch<React.SetStateAction<Map<number, CommentMetadata>>>,
  ) {}

  create(_line: LineMetadata, _state?: CommentState): CommentMetadata | null {
    throw new Error('Not implemented - should be implemented by the hook')
  }

  save(comment: CommentMetadata) {
    this.setComments((prev) => {
      const existing = prev.get(comment.localId)
      if (existing && typeof existing.equals === 'function' && existing.equals(comment)) return prev
      const next = new Map(prev)
      next.set(comment.localId, comment)
      return next
    })
  }

  read(commentId: number): CommentMetadata | undefined {
    return this.comments.get(commentId)
  }

  update(id: number, updates: Partial<CommentMetadata>, updateRemote?: boolean): Promise<boolean> {
    try {
      this.setComments((prevComments) => {
        const comment = prevComments.get(id)
        if (!comment) return prevComments

        const updated = comment.with(updates).with({ updatedAt: new Date().toISOString() })
        if (typeof comment.equals === 'function' && comment.equals(updated)) return prevComments

        const newComments = new Map(prevComments)
        newComments.set(updated.localId, updated)
        if (updated.localId !== id) newComments.delete(id)
        return newComments
      })

      if (updateRemote) {
        console.warn('Remote update not implemented in CommentLocalDatastore')
      }

      return Promise.resolve(true)
    } catch (error) {
      console.error('Failed to update comment:', error)
      return Promise.resolve(false)
    }
  }

  delete(id: number, deleteFromRemote?: boolean): Promise<boolean> {
    try {
      this.setComments((prevComments) => {
        if (!prevComments.has(id)) return prevComments

        const newComments = new Map(prevComments)
        newComments.delete(id)
        return newComments
      })

      if (deleteFromRemote) {
        console.warn('Remote delete not implemented in CommentLocalDatastore')
      }

      return Promise.resolve(true)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      return Promise.resolve(false)
    }
  }

  list(state?: CommentState): Map<number, CommentMetadata> {
    if (state === undefined) {
      return new Map(this.comments)
    }

    const filtered = new Map<number, CommentMetadata>()
    for (const [id, comment] of this.comments) {
      if (comment.state === state) {
        filtered.set(id, comment)
      }
    }
    return filtered
  }

  getThreads(): Map<string, CommentMetadata[]> {
    const grouped = new Map<string, CommentMetadata[]>()

    for (const comment of this.comments.values()) {
      const locationKey = this.getLocationKey(comment.path, comment.line, comment.side)

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
  }

  clear(state?: CommentState): void {
    this.setComments((prevComments) => {
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
  }

  refetch(): void {
    throw new Error('Not implemented - should be implemented by the hook')
  }

  private getLocationKey(path: string, line: number, side: 'LEFT' | 'RIGHT'): string {
    const sideStr = side === 'LEFT' ? 'left' : 'right'
    return `${path}:${line}:${sideStr}`
  }
}
