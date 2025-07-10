export interface StatTagProps {
  /** The value to display */
  value: number
  /** The label to display */
  label: string
  /** The color of the tag */
  color: string
}

export interface InlineCommentAuthor {
  /** GitHub username */
  login: string
  /** URL to user's avatar image */
  avatar_url: string
  /** URL to user's GitHub profile */
  html_url: string
}

export interface InlineCommentData {
  /** Unique identifier for the comment */
  id: string
  /** The comment body/text content */
  body: string
  /** The author of the comment */
  author: InlineCommentAuthor
  /** ISO timestamp when comment was created */
  created_at: string
  /** ISO timestamp when comment was last updated */
  updated_at: string
  /** Whether the comment has been resolved */
  resolved: boolean
  /** URL to the comment on GitHub */
  html_url: string
}

export interface InlineCommentProps {
  /** The comment data to display */
  comment: InlineCommentData
  /** Optional callback when reply button is clicked */
  onReply?: () => void
  /** Optional callback when resolve button is clicked */
  onResolve?: () => void
  /** Optional callback when edit button is clicked */
  onEdit?: () => void
  /** Optional callback when delete button is clicked */
  onDelete?: () => void
}

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
    avatar_url: string
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
