import { LineMetadata } from '@diff-viewer'
import {
  CommentFactory,
  CommentMetadata,
  CommentState,
  deleteInlineComment,
  editInlineComment,
  getInlineComments,
  PrKey,
} from '@github'
import { CommentStore } from './CommentStore'

export class CommentRemoteStore implements CommentStore {
  constructor(
    private prKey?: PrKey,
    private token?: string,
    private useMocks?: boolean,
  ) {}

  create: (line: LineMetadata, state?: CommentState) => CommentMetadata | null = () => {
    throw new Error('Not implemented - should be implemented by the hook')
  }

  save: (comment: CommentMetadata) => void = () => {
    throw new Error('Not implemented - should be implemented by the hook')
  }

  read: (commentId: number) => CommentMetadata | undefined = () => {
    throw new Error('Not implemented - should be implemented by the hook')
  }

  list: (state?: CommentState) => Map<number, CommentMetadata> = () => {
    throw new Error('Not implemented - should be implemented by the hook')
  }

  async listAsync(state?: CommentState): Promise<Map<number, CommentMetadata>> {
    if (!this.prKey) {
      throw new Error('Cannot delete comment: missing PR key')
    }

    if (state && state !== CommentState.PUBLISHED) {
      return new Map()
    }

    const comments = await getInlineComments({ prKey: this.prKey, token: this.token, useMocks: this.useMocks })
    return new Map(comments.map((comment) => [comment.id, CommentFactory.fromGitHubComment(comment)]))
  }

  getThreads: () => Map<string, CommentMetadata[]> = () => {
    throw new Error('Not implemented - should be implemented by the hook')
  }

  clear: (state?: CommentState) => void = () => {
    throw new Error('Not implemented - should be implemented by the hook')
  }

  async delete(commentId: number, deleteFromRemote = false): Promise<boolean> {
    if (!this.prKey) {
      throw new Error('Cannot delete comment: missing PR key')
    }

    if (deleteFromRemote) {
      try {
        await deleteInlineComment({
          prKey: this.prKey,
          token: this.token,
          useMocks: this.useMocks,
          commentId,
        })
        return true
      } catch {
        return false
      }
    }

    return true
  }

  async update(commentId: number, updates: Partial<CommentMetadata>, updateRemote = false): Promise<boolean> {
    if (updateRemote && this.prKey) {
      try {
        await editInlineComment({
          prKey: this.prKey,
          token: this.token,
          useMocks: this.useMocks,
          commentId,
          body: updates.body || '',
        })
        return true
      } catch {
        return false
      }
    }

    return true
  }

  refetch: () => void = () => {
    throw new Error('Not implemented - should be implemented by the hook')
  }
}
