export interface InlineCommentAuthor {
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
}

export interface InlineCommentLinks {
  /** Self reference link */
  self: { href: string }
  /** HTML view link */
  html: { href: string }
  /** Pull request link */
  pull_request: { href: string }
}

export interface InlineCommentReactions {
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

export interface InlineCommentData {
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
  user: InlineCommentAuthor
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
  _links: InlineCommentLinks
  /** Reaction counts */
  reactions: InlineCommentReactions
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

export interface InlineCommentProps {
  /** The array of comment data to display */
  comments: InlineCommentData[]
  /** Current user data for reply functionality */
  currentUser: {
    login: string
    avatar_url: string
  }
  /** Optional callback when reply button is clicked */
  onReply?: () => void
  /** Optional callback when resolve button is clicked */
  onResolve?: () => void
  /** Optional callback when edit button is clicked */
  onEdit?: () => void
  /** Optional callback when delete button is clicked */
  onDelete?: () => void
  /** Optional callback when reply is submitted */
  onReplySubmit?: (replyText: string) => void
}
