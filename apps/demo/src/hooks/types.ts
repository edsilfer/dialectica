import type { DiffParserAdapter, PullRequestMetadata } from '@diff-viewer'

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
  head?: { ref?: string }
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
  /** Parsed diff as returned by `DiffParserAdapter#parse`. Undefined while loading for the first time or when an error occurs. */
  data: ReturnType<DiffParserAdapter['parse']> | undefined
  /** True while an API call is in flight. */
  loading: boolean
  /** Any error thrown by the request. Reset to undefined on subsequent successful fetches. */
  error: Error | undefined
  /** Manually trigger a refetch */
  refetch: () => void
}
