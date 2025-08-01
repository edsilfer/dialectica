import { LineRequest, LoadMoreLinesResult } from '@edsilfer/diff-viewer'
import {
  getInlineComments,
  getMoreLines,
  getPrDiff,
  getPrMetadata,
  getUserData,
  GitHubInlineComment,
  GitHubPullRequest,
  GitHubUser,
  PrKey,
} from '@github'
import { PullRequestStore } from './PullRequestStore'

/**
 * Remote implementation of PullRequestStore that fetches data from GitHub API.
 */
export class PullRequestRemoteStore implements PullRequestStore {
  constructor(
    private token?: string,
    private useMocks?: boolean,
  ) {}

  async readUser(): Promise<GitHubUser> {
    if (!this.useMocks && !this.token) {
      throw new Error('Token is required to fetch user data')
    }

    const user = await getUserData({ token: this.token, useMocks: this.useMocks })
    if (!user) {
      throw new Error('Failed to fetch user data')
    }

    return user
  }

  async readMetadata(prKey: PrKey): Promise<GitHubPullRequest> {
    if (!this.useMocks && !this.token) {
      throw new Error('Token is required to fetch pull request metadata')
    }

    if (!prKey.owner || !prKey.repo || !prKey.pullNumber) {
      throw new Error('Invalid pull request key')
    }

    const metadata = await getPrMetadata({ prKey, token: this.token, useMocks: this.useMocks })
    return metadata
  }

  async readDiff(prKey: PrKey): Promise<string> {
    if (!this.useMocks && !this.token) {
      throw new Error('Token is required to fetch pull request diff')
    }

    if (!prKey.owner || !prKey.repo || !prKey.pullNumber) {
      throw new Error('Invalid pull request key')
    }

    const diff = await getPrDiff({ prKey, token: this.token, useMocks: this.useMocks })
    return diff
  }

  async listComments(prKey: PrKey): Promise<GitHubInlineComment[]> {
    if (!this.useMocks && !this.token) {
      throw new Error('Token is required to fetch inline comments')
    }

    if (!prKey.owner || !prKey.repo || !prKey.pullNumber) {
      throw new Error('Invalid pull request key')
    }

    const comments = await getInlineComments({ prKey, token: this.token, useMocks: this.useMocks })
    return comments
  }

  async loadLines(prKey: PrKey, baseSha: string, headSha: string, request: LineRequest): Promise<LoadMoreLinesResult> {
    if (!this.useMocks && !this.token) {
      throw new Error('Token is required to load more lines')
    }

    if (!prKey.owner || !prKey.repo || !prKey.pullNumber) {
      throw new Error('Invalid pull request key')
    }

    if (!baseSha || !headSha) {
      throw new Error('Base and head SHAs are required to load more lines')
    }

    const result = await getMoreLines(
      {
        prKey,
        token: this.token,
        useMocks: this.useMocks,
        baseSha,
        headSha,
      },
      request,
    )

    return result
  }
}
