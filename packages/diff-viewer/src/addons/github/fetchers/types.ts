import { LineRequest, LoadMoreLinesResult } from '../../../components/diff-viewer/types'
import type { GitHubInlineComment, GitHubPullRequest } from '../models'

// BASE GITHUB REQUEST/RESPONSE TYPE ____________________________________________________
export interface PrKey {
  /** The owner of the repository */
  owner: string
  /** The repository name */
  repo: string
  /** The pull request number */
  pullNumber: number
}

export interface BaseGitHubRequest {
  /** The pull request key */
  prKey: PrKey
  /** GitHub personal access token for authentication */
  token?: string
  /** Whether to use mock data instead of making API calls */
  useMocks?: boolean
  /** Artificial delay in milliseconds to wait before resolving the request. Useful for demo/testing purposes. */
  forceDelayMs?: number
}

export interface BaseGitHubResponse<T> {
  /** The response data. Undefined while loading for the first time or when an error occurs. */
  data: T | undefined
  /** True while an API call is in flight */
  loading: boolean
  /** Any error thrown by the request. Reset to undefined on subsequent successful fetches. */
  error: Error | undefined
}

// GET PR METADATA
export type GetPrMetadataRequest = BaseGitHubRequest
export interface GetPrMetadataResponse extends BaseGitHubResponse<GitHubPullRequest> {
  refetch: () => void
}

// GET PR DIFF
export type GetPrDiffRequest = BaseGitHubRequest
export interface GetPrDiffResponse extends BaseGitHubResponse<string> {
  refetch: () => void
}

// GET PR INLINE COMMENTS
export type GetMoreLineRequest = BaseGitHubRequest

export interface GetInlineCommentsResponse extends BaseGitHubResponse<GitHubInlineComment[]> {
  /** Manually trigger a refetch */
  refetch: () => void
}

// GET PR MORE LINES
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

// GET FILE CONTENT
export interface GetFileContentRequest extends BaseGitHubRequest {
  /** The file path to fetch content for */
  filePath: string
  /** The commit SHA to fetch the file content from */
  sha: string
}

export interface GetFileContentResponse extends BaseGitHubResponse<string> {
  /** Function to fetch file content for a given file path and SHA */
  fetchFileContent: (filePath: string, sha: string) => Promise<string>
}

// USE GITHUB REQUEST HOOK TYPES ____________________________________________________
export interface UseGithubRequestOptions {
  /** Whether to fetch immediately when the hook is called */
  immediate?: boolean
  /** The type of request for mock data resolution */
  requestType?: string
}

export interface UseGithubRequestFetcher<P extends BaseGitHubRequest, R> {
  (params: P, signal?: AbortSignal): Promise<R>
}

export interface UseGithubRequestReturn<R, P extends BaseGitHubRequest = BaseGitHubRequest> {
  /** The response data. Undefined while loading for the first time or when an error occurs. */
  data: R | undefined
  /** True while an API call is in flight */
  loading: boolean
  /** Any error thrown by the request. Reset to undefined on subsequent successful fetches. */
  error: Error | undefined
  /** Re-executes the request with the latest parameters */
  refetch: () => void
  /** Executes the request with optional parameter overrides */
  execute: (override?: Partial<P>, signal?: AbortSignal) => Promise<R>
}

export interface GitHubFileContentResponse {
  /** The base64-encoded content of the file. */
  content: string
  /** The encoding of the file. */
  encoding: string
  /** The size of the file. */
  size: number
  /** The name of the file. */
  name: string
  /** The path of the file. */
  path: string
  /** The SHA of the file. */
  sha: string
  /** The URL of the file. */
  url: string
  /** The Git URL of the file. */
  git_url: string
  /** The HTML URL of the file. */
  html_url: string
  /** The download URL of the file. */
  download_url: string
  /** The type of the file. */
  type: string
}
