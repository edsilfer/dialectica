import { LineMetadata } from '@dialectica-org/diff-viewer'
import { GitHubUser } from '../../api'
import { CommentFactory, CommentMetadata, CommentState } from '../models'
import { CommentLocalStore } from './CommentLocalStore'
import { CommentRemoteStore } from './CommentRemoteStore'
import { CommentStore } from './CommentStore'

/**
 * Repository class that orchestrates local and remote comment operations.
 */
export class CommentRepository implements CommentStore {
  constructor(
    private localStore: CommentLocalStore,
    private remoteStore: CommentRemoteStore,
    private currentUser?: GitHubUser,
    private refetchCallback?: () => void,
  ) {}

  create(lineMetadata: LineMetadata, state?: CommentState): CommentMetadata | null {
    if (!this.currentUser) return null

    const author = {
      login: this.currentUser.login,
      avatar_url: this.currentUser.avatar_url,
      html_url: this.currentUser.avatar_url,
    }

    return CommentFactory.create(lineMetadata, author, state)
  }

  save(comment: CommentMetadata): void {
    this.localStore.save(comment)
  }

  read(commentId: number): CommentMetadata | undefined {
    return this.localStore.read(commentId)
  }

  async update(commentId: number, updates: Partial<CommentMetadata>, updateRemote = false): Promise<boolean> {
    const comment = this.localStore.read(commentId)
    if (!comment) {
      return false
    }

    // Handle remote update if requested
    if (updateRemote && comment.wasPublished && comment.serverId) {
      const remoteSuccess = await this.remoteStore.update(comment.serverId, updates, true)
      if (!remoteSuccess) {
        return false
      }
    }

    await this.localStore.update(commentId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    return true
  }

  async delete(commentId: number, deleteFromRemote = false): Promise<boolean> {
    const comment = this.localStore.read(commentId)

    // Handle remote deletion if requested
    if (deleteFromRemote && comment?.serverId) {
      const remoteSuccess = await this.remoteStore.delete(comment.serverId, true)
      if (!remoteSuccess) {
        return false
      }
    }

    await this.localStore.delete(commentId)
    return true
  }

  list(state?: CommentState): Map<number, CommentMetadata> {
    return this.localStore.list(state)
  }

  getThreads(): Map<string, CommentMetadata[]> {
    return this.localStore.getThreads()
  }

  clear(state?: CommentState): void {
    this.localStore.clear(state)
  }

  refetch(): void {
    if (this.refetchCallback) {
      this.localStore.clear(CommentState.PUBLISHED)
      this.refetchCallback()
    }
  }
}
