import type { PullRequestMetadata, LineRequest } from '@diff-viewer'

/**
 * Sub-set of the fields returned by GitHub's Pull-Request REST API that are
 * required to build a {@link PullRequestMetadata} instance.
 *
 * Only the properties we actively consume are declared and most of them are
 * optional so that the compiler does not complain if the fetched payload is
 * missing a field (highly unlikely, but it makes the function more robust).
 */
export interface GitHubPullRequest {
  /** The pull request number. */
  number?: number
  /** The pull request title. */
  title?: string
  /** The pull request body. */
  body?: string | null
  /** The pull request author. */
  user?: {
    login?: string
    avatar_url?: string
    html_url?: string
  }
  /** The pull request state. */
  state?: 'open' | 'closed'
  /** The pull request merged at date. */
  merged_at?: string | null
  /** The pull request number of commits. */
  commits?: number
  /** The pull request number of changed files. */
  changed_files?: number
  /** The pull request number of additions. */
  additions?: number
  /** The pull request number of deletions. */
  deletions?: number
  /** The pull request HTML URL. */
  html_url?: string
  /** The pull request head ref. */
  head?: { ref?: string; sha?: string }
  /** The pull request base ref. */
  base?: { ref?: string }
}

export interface UseGetPrMetadataParams {
  /** Repository owner/organization. Example: "facebook" */
  owner: string
  /** Repository name. Example: "react" */
  repo: string
  /** Pull request number */
  pullNumber: number
  /** Artificial delay in milliseconds to wait before resolving the request. Useful for demo/testing purposes. */
  forceDelayMs?: number
}

export interface UseGetPrMetadataReturn {
  /** Latest fetched PR metadata. Undefined while loading for the first time or when an error occurs. */
  data: PullRequestMetadata | undefined
  /** True while an API call is in flight */
  loading: boolean
  /** Any error thrown by the request. Reset to undefined on subsequent successful fetches. */
  error: Error | undefined
  /** Manually trigger a refetch */
  refetch: () => void
}

export interface UseGetPrDiffParams {
  /** Repository owner/organization. Example: "facebook" */
  owner: string
  /** Repository name. Example: "react" */
  repo: string
  /** Pull request number */
  pullNumber: number
  /** Artificial delay in milliseconds to wait before resolving the request. Useful for demo/testing purposes. */
  forceDelayMs?: number
}

export interface UseGetPrDiffReturn {
  /** Raw diff text as returned by GitHub API. Undefined while loading for the first time or when an error occurs. */
  data: string | undefined
  /** True while an API call is in flight. */
  loading: boolean
  /** Any error thrown by the request. Reset to undefined on subsequent successful fetches. */
  error: Error | undefined
  /** Manually trigger a refetch */
  refetch: () => void
}

/**
 * Represents a GitHub inline comment (pull request review comment).
 */
export interface GitHubInlineComment {
  /** Unique identifier of the comment */
  id: number
  /** Node ID for GraphQL API compatibility */
  node_id: string
  /** URL to the comment via API */
  url: string
  /** The comment body/content */
  body: string
  /** File path where the comment was made */
  path: string
  /** Line number where the comment was made */
  line?: number | null
  /** Original line number (for outdated comments) */
  original_line?: number | null
  /** Start line for multi-line comments */
  start_line?: number | null
  /** Original start line for multi-line comments */
  original_start_line?: number | null
  /** Side of the diff ('LEFT' for deletion, 'RIGHT' for addition) */
  side?: 'LEFT' | 'RIGHT'
  /** Start side for multi-line comments */
  start_side?: 'LEFT' | 'RIGHT' | null
  /** Position in the diff */
  position?: number | null
  /** Original position in the diff */
  original_position?: number | null
  /** Commit SHA the comment is associated with */
  commit_id: string
  /** Original commit SHA */
  original_commit_id: string
  /** Comment author */
  user: {
    login: string
    id: number
    avatar_url: string
    html_url: string
  }
  /** When the comment was created */
  created_at: string
  /** When the comment was last updated */
  updated_at: string
  /** HTML URL to view the comment */
  html_url: string
  /** Pull request URL */
  pull_request_url: string
  /** Author's association with the repository */
  author_association: string
  /** ID of the comment this is replying to */
  in_reply_to_id?: number | null
  /** Pull request review ID */
  pull_request_review_id?: number | null
  /** Subject type */
  subject_type?: string
}

export interface UseListInlineCommentsParams {
  /** Repository owner/organization. Example: "facebook" */
  owner: string
  /** Repository name. Example: "react" */
  repo: string
  /** Pull request number */
  pullNumber: number
  /** Artificial delay in milliseconds to wait before resolving the request. Useful for demo/testing purposes. */
  forceDelayMs?: number
}

export interface UseListInlineCommentsReturn {
  /** Array of inline comments for the PR. Undefined while loading for the first time or when an error occurs. */
  data: GitHubInlineComment[] | undefined
  /** True while an API call is in flight */
  loading: boolean
  /** Any error thrown by the request. Reset to undefined on subsequent successful fetches. */
  error: Error | undefined
  /** Manually trigger a refetch */
  refetch: () => void
}

export interface UseLoadMoreLinesParams {
  /* The owner of the repository */
  owner: string
  /* The name of the repository */
  repo: string
  /* The number of the pull request */
  pullNumber: number
  /* The path to the file to fetch */
  filePath: string
  /* The start line of the range */
  startLine: number
  /* The end line of the range */
  endLine: number
  /* The GitHub personal access token */
  githubToken: string
}

export interface UseLoadMoreLinesReturn {
  /** The lines of the file. */
  data: Map<number, string>
  /** True while an API call is in flight */
  loading: boolean
  /** Any error thrown by the request. Reset to undefined on subsequent successful fetches. */
  error: Error | undefined
  /** Function to fetch lines for a given file and line range */
  fetchLines: (request: LineRequest) => Promise<Map<number, string>>
}
