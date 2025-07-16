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
  base?: { ref?: string; sha?: string }
}

/**
 * Comprehensive GitHub user/author information.
 */
export interface GitHubUser {
  /** GitHub username */
  login: string
  /** URL to user's avatar image */
  avatar_url: string
  /** URL to user's GitHub profile */
  html_url: string
  /** GitHub user ID */
  id: number
  /** GitHub's internal node ID */
  node_id: string
  /** Gravatar ID (deprecated) */
  gravatar_id: string
  /** API URL for the user */
  url: string
  /** User type (usually "User") */
  type: string
  /** Whether user is a site admin */
  site_admin: boolean
  /** User view type */
  user_view_type?: string
  /** Various API URLs for user resources */
  followers_url: string
  /** URL for following user */
  following_url: string
  /** URL for gists */
  gists_url: string
  /** URL for starred repositories */
  starred_url: string
  /** URL for subscriptions */
  subscriptions_url: string
  /** URL for organizations */
  organizations_url: string
  /** URL for repositories */
  repos_url: string
  /** URL for events */
  events_url: string
  /** URL for received events */
  received_events_url: string
  /** User's display name */
  name?: string | null
  /** User's company */
  company?: string | null
  /** User's blog URL */
  blog?: string | null
  /** User's location */
  location?: string | null
  /** User's public email address */
  email?: string | null
  /** User's notification email (for authenticated user only) */
  notification_email?: string | null
  /** Whether the user is available for hire */
  hireable?: boolean | null
  /** User's biography */
  bio?: string | null
  /** User's Twitter username */
  twitter_username?: string | null
  /** Number of public repositories */
  public_repos?: number
  /** Number of public gists */
  public_gists?: number
  /** Number of followers */
  followers?: number
  /** Number of people the user is following */
  following?: number
  /** When the account was created */
  created_at?: string
  /** When the account was last updated */
  updated_at?: string
  /** Private gists count (for authenticated user) */
  private_gists?: number
  /** Total private repositories (for authenticated user) */
  total_private_repos?: number
  /** Owned private repositories (for authenticated user) */
  owned_private_repos?: number
  /** Disk usage in bytes (for authenticated user) */
  disk_usage?: number
  /** Number of collaborators (for authenticated user) */
  collaborators?: number
  /** Whether two-factor authentication is enabled (for authenticated user) */
  two_factor_authentication?: boolean
  /** GitHub plan information (for authenticated user) */
  plan?: {
    name: string
    space: number
    private_repos: number
    collaborators: number
  }
}

/**
 * GitHub comment HATEOAS links.
 */
export interface GitHubCommentLinks {
  /** Self reference link */
  self: { href: string }
  /** HTML view link */
  html: { href: string }
  /** Pull request link */
  pull_request: { href: string }
}

/**
 * GitHub comment reactions.
 */
export interface GitHubCommentReactions {
  /** URL for reactions API */
  url: string
  /** Total reaction count */
  total_count: number
  /** Individual reaction counts */
  '+1': number
  /** Total reaction count */
  '-1': number
  /** Total reaction count */
  laugh: number
  /** Total reaction count */
  hooray: number
  /** Total reaction count */
  confused: number
  /** Total reaction count */
  heart: number
  /** Total reaction count */
  rocket: number
  /** Total reaction count */
  eyes: number
}

/**
 * Represents a GitHub inline comment (pull request review comment).
 * This is the comprehensive model that includes all GitHub API fields.
 */
export interface GitHubInlineComment {
  /** API URL for the comment */
  url: string
  /** ID of the review this comment belongs to */
  pull_request_review_id: number | null
  /** Unique identifier for the comment */
  id: number
  /** GitHub's internal node ID */
  node_id: string
  /** The actual diff hunk the comment is on */
  diff_hunk: string
  /** File path where the comment is located */
  path: string
  /** Position in the diff */
  position: number
  /** Original position in the diff */
  original_position: number
  /** Commit SHA where the comment was made */
  commit_id: string
  /** Original commit SHA */
  original_commit_id: string
  /** ID of the comment this is replying to (if any) */
  in_reply_to_id: number | null
  /** The comment body/text content */
  body: string
  /** The author of the comment */
  user: GitHubUser
  /** ISO timestamp when comment was created */
  created_at: string
  /** ISO timestamp when comment was last updated */
  updated_at: string
  /** URL to the comment on GitHub */
  html_url: string
  /** URL to the pull request */
  pull_request_url: string
  /** Relationship of author to the repository */
  author_association: string
  /** HATEOAS links */
  _links: GitHubCommentLinks
  /** Reaction counts */
  reactions: GitHubCommentReactions
  /** Start line for multi-line comments */
  start_line: number | null
  /** Original start line for multi-line comments */
  original_start_line: number | null
  /** Which side of the diff the start is on */
  start_side: 'LEFT' | 'RIGHT' | null
  /** Line number where comment is located */
  line: number | null
  /** Original line number */
  original_line: number | null
  /** Which side of the diff the comment is on */
  side: 'LEFT' | 'RIGHT' | null
  /** Type of subject (usually "line") */
  subject_type: string
}
