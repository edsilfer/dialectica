import { LineRequest, LoadMoreLinesResult } from '@diff-viewer'
import { GitHubInlineComment, GitHubPullRequest, GitHubUser, PrKey } from '@github'
import { PullRequestStore } from './PullRequestStore'
import { PullRequestRemoteStore } from './PullRequestRemoteStore'

/**
 * Repository class that orchestrates pull request data operations.
 */
export class PullRequestRepository implements PullRequestStore {
  constructor(private remoteStore: PullRequestRemoteStore) {}

  async readUser(): Promise<GitHubUser> {
    return this.remoteStore.readUser()
  }

  async readMetadata(prKey: PrKey): Promise<GitHubPullRequest> {
    return this.remoteStore.readMetadata(prKey)
  }

  async readDiff(prKey: PrKey): Promise<string> {
    return this.remoteStore.readDiff(prKey)
  }

  async listComments(prKey: PrKey): Promise<GitHubInlineComment[]> {
    return this.remoteStore.listComments(prKey)
  }

  async loadLines(prKey: PrKey, baseSha: string, headSha: string, request: LineRequest): Promise<LoadMoreLinesResult> {
    return this.remoteStore.loadLines(prKey, baseSha, headSha, request)
  }
}
