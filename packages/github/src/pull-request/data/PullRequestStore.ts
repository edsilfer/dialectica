import { LineRequest, LoadMoreLinesResult } from '@dialectica-org/diff-viewer'
import { GitHubInlineComment, GitHubPullRequest, GitHubUser, PrKey } from '@github'

/**
 * Interface for pull request data operations.
 */
export interface PullRequestStore {
  /**
   * Fetch the current user data.
   *
   * @returns Promise resolving to the current user
   */
  readUser(): Promise<GitHubUser>

  /**
   * Fetch pull request metadata.
   *
   * @param prKey - The pull request key
   * @returns Promise resolving to pull request metadata
   */
  readMetadata(prKey: PrKey): Promise<GitHubPullRequest>

  /**
   * Fetch pull request diff.
   *
   * @param prKey - The pull request key
   * @returns Promise resolving to the raw diff string
   */
  readDiff(prKey: PrKey): Promise<string>

  /**
   * Fetch inline comments for a pull request.
   *
   * @param prKey - The pull request key
   * @returns Promise resolving to array of inline comments
   */
  listComments(prKey: PrKey): Promise<GitHubInlineComment[]>

  /**
   * Load additional lines for a file in the pull request.
   *
   * @param prKey - The pull request key
   * @param baseSha - The base commit SHA
   * @param headSha - The head commit SHA
   * @param request - The line request parameters
   * @returns Promise resolving to the load more lines result
   */
  loadLines(prKey: PrKey, baseSha: string, headSha: string, request: LineRequest): Promise<LoadMoreLinesResult>
}
