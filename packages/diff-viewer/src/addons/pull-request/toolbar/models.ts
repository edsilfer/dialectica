// Re-export comment models from github addon
export type { GitHubInlineComment, GitHubUser, GitHubCommentLinks, GitHubCommentReactions } from '../../github/models'

export interface StatTagProps {
  /** The value to display */
  value: number | string
  /** The label to display */
  label: string
  /** The color of the tag */
  color: string
}

/**
 * - This is mean to be different from the GitHubPullRequest model.
 * - It is a generic model that can be used to display pull request metadata.
 * - It decouples from GitHub and could be used with other providers.
 */
export interface PullRequestMetadata {
  /** Pull request number */
  number: number
  /** Pull request title */
  title: string
  /** Body/description markdown */
  body: string | null
  /** Username of the PR author */
  user: {
    login: string
    avatar_url: string | null
    html_url: string
  }
  /** State of the PR (open, closed) */
  state: 'open' | 'closed' | 'merged'
  /** Whether the PR has been merged */
  merged: boolean
  /** Date string of merge event (ISO) */
  merged_at: string | null
  /** Total commits in the PR */
  commits: number
  /** Total files changed */
  changed_files: number
  /** Total additions across all files */
  additions: number
  /** Total deletions across all files */
  deletions: number
  /** PR web url */
  html_url: string
  /** Source branch (head) where changes were made */
  head_ref: string
  /** Destination branch (base) where the PR will be merged */
  base_ref: string
  /** SHA of the head commit */
  head_sha: string
  /** SHA of the base commit */
  base_sha: string
}
