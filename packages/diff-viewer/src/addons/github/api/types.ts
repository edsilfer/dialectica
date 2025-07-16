import { LineRequest, LoadMoreLinesResult } from '../../../components/diff-viewer/types'
import type { GitHubInlineComment, GitHubPullRequest, GitHubUser, ReviewStatus } from '../models'

// BASE GITHUB REQUEST/RESPONSE TYPE ____________________________________________________
export interface PrKey {
  /** The owner of the repository */
  owner: string
  /** The repository name */
  repo: string
  /** The pull request number */
  pullNumber: number
}

export interface BaseRequest {
  /** GitHub personal access token for authentication */
  token?: string
  /** Whether to use mock data instead of making API calls */
  useMocks?: boolean
  /** Artificial delay in milliseconds to wait before resolving the request. Useful for demo/testing purposes. */
  forceDelayMs?: number
}

export interface BaseGitHubRequest extends BaseRequest {
  /** The pull request key */
  prKey: PrKey
}

export interface BaseGitHubResponse<T> {
  /** The response data. Undefined while loading for the first time or when an error occurs. */
  data: T | undefined
  /** True while an API call is in flight */
  loading: boolean
  /** Any error thrown by the request. Reset to undefined on subsequent successful fetches. */
  error: Error | undefined
}

// GET PR METADATA ______________________________________________________________________
export type GetPrMetadataRequest = BaseGitHubRequest
export interface GetPrMetadataResponse extends BaseGitHubResponse<GitHubPullRequest> {
  refetch: () => void
}

// GET PR DIFF __________________________________________________________________________
export type GetPrDiffRequest = BaseGitHubRequest
export interface GetPrDiffResponse extends BaseGitHubResponse<string> {
  refetch: () => void
}

// GET PR INLINE COMMENTS _______________________________________________________________
export type GetMoreLineRequest = BaseGitHubRequest
export interface GetInlineCommentsResponse extends BaseGitHubResponse<GitHubInlineComment[]> {
  /** Manually trigger a refetch */
  refetch: () => void
}

// EDIT INLINE COMMENT __________________________________________________________________
export interface EditInlineCommentRequest extends BaseGitHubRequest {
  /** The unique identifier of the comment to edit */
  commentId: number
  /** The new body/text content for the comment */
  body: string
}

export interface EditInlineCommentResponse extends BaseGitHubResponse<GitHubInlineComment> {
  /** Manually trigger a refetch */
  refetch: () => void
}

// DELETE INLINE COMMENT ________________________________________________________________
export interface DeleteInlineCommentRequest extends BaseGitHubRequest {
  /** The unique identifier of the comment to delete */
  commentId: number
}
export interface DeleteInlineCommentResponse extends BaseGitHubResponse<void> {
  /** Manually trigger a refetch */
  refetch: () => void
}

// GET PR MORE LINES _____________________________________________________________________
export interface GetMoreLinesRequest extends BaseGitHubRequest {
  /** The base commit SHA (for old file version) */
  baseSha: string
  /** The head commit SHA (for new file version) */
  headSha: string
}

export interface GetMoreLinesResponse
  extends BaseGitHubResponse<{ leftLines: Map<number, string>; rightLines: Map<number, string> }> {
  /** Function to fetch lines for a given file and line range */
  fetchLines: (request: LineRequest) => Promise<LoadMoreLinesResult>
}

// GET FILE CONTENT _____________________________________________________________________
export interface GetFileContentRequest extends BaseGitHubRequest {
  /** The file path to fetch content for */
  filePath: string
  /** The commit SHA to fetch the file content from */
  sha: string
}

export interface GitHubFileContentResponse {
  /** The file content in base64 encoding */
  content: string
  /** The encoding type (usually 'base64') */
  encoding: string
  /** The file size in bytes */
  size: number
  /** The file name */
  name: string
  /** The file path */
  path: string
  /** The file SHA */
  sha: string
  /** The API URL for the file */
  url: string
  /** The Git blob URL */
  git_url: string
  /** The HTML URL for viewing the file */
  html_url: string
  /** The download URL for the raw file */
  download_url: string
  /** The type of the item (file, dir, etc.) */
  type: string
}

export interface GetFileContentResponse extends BaseGitHubResponse<string> {
  /** Function to fetch file content for a given file path and SHA */
  fetchFileContent: (filePath: string, sha: string) => Promise<string>
}

// GET USER DATA ________________________________________________________________________
export interface GetUserDataResponse extends BaseGitHubResponse<GitHubUser> {
  /** Manually trigger a refetch */
  refetch: () => void
}

// PUBLISH REVIEW _______________________________________________________________________
export interface PublishReviewRequest extends GetPrMetadataRequest {
  /** The body of the review. */
  body?: string
  /** The review event type. */
  event: ReviewStatus
  /** The comments to include in the review. */
  comments?: {
    /** The path of the file to comment on. */
    path: string
    /** The position in the diff to comment on. */
    position: number
    /** The text of the comment. */
    body: string
  }[]
}
export interface PublishReviewResponse {
  /** The ID of the review. */
  id: number
  /** The user who submitted the review. */
  user: GitHubUser
  /** The body of the review. */
  body: string
  /** The state of the review. */
  state: string
  /** The URL of the review. */
  html_url: string
  /** The commit ID the review was submitted on. */
  commit_id: string
}
