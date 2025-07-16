/**
 * Author information for the comment
 */
export interface CommentAuthor {
  /** GitHub username */
  login: string
  /** URL to user's avatar image */
  avatar_url: string
  /** URL to user's GitHub profile */
  html_url: string
}

/**
 * State of the comment in its lifecycle
 */
export enum CommentState {
  /** A draft comment */
  DRAFT = 'DRAFT',
  /** A saved draft comment */
  SAVED_DRAFT = 'SAVED_DRAFT',
  /** A published comment */
  PUBLISHED = 'PUBLISHED',
}

/**
 * Minimal comment metadata needed for display purposes
 */
export class CommentMetadata {
  /** Unique identifier for the comment */
  id: number
  /** The author of the comment */
  author: CommentAuthor
  /** ISO timestamp when comment was created */
  created_at: string
  /** URL to the comment */
  url: string
  /** The comment body/text content */
  body: string
  /** Map of reaction type to count */
  reactions: Map<string, number>
  /** File path where the comment is located */
  path: string
  /** Line number where the comment is positioned */
  line: number
  /** Which side of the diff the comment is on */
  side: 'LEFT' | 'RIGHT'
  /** The current state of the comment (draft, saved draft, or published) */
  state: CommentState

  constructor(data: {
    id: number
    author: CommentAuthor
    created_at: string
    url: string
    body: string
    reactions: Map<string, number>
    path: string
    line: number
    side: 'LEFT' | 'RIGHT'
    state: CommentState
  }) {
    this.id = data.id
    this.author = data.author
    this.created_at = data.created_at
    this.url = data.url
    this.body = data.body
    this.reactions = data.reactions
    this.path = data.path
    this.line = data.line
    this.side = data.side
    this.state = data.state
  }

  /**
   * Generate a unique key for this comment.
   * Uses stable identifiers that don't change when content is updated.
   */
  getKey(): string {
    const rawKey = `${this.author.login}:${this.path}:${this.line}:${this.side}:${this.created_at}:${this.id}`
    return this.hashString(rawKey)
  }

  /**
   * Create a new CommentMetadata instance with updated properties.
   * Uses the immutable "with" pattern for clean updates.
   */
  with(
    updates: Partial<{
      id: number
      author: CommentAuthor
      created_at: string
      url: string
      body: string
      reactions: Map<string, number>
      path: string
      line: number
      side: 'LEFT' | 'RIGHT'
      state: CommentState
    }>,
  ): CommentMetadata {
    return new CommentMetadata({
      id: updates.id ?? this.id,
      author: updates.author ?? this.author,
      created_at: updates.created_at ?? this.created_at,
      url: updates.url ?? this.url,
      body: updates.body ?? this.body,
      reactions: updates.reactions ?? this.reactions,
      path: updates.path ?? this.path,
      line: updates.line ?? this.line,
      side: updates.side ?? this.side,
      state: updates.state ?? this.state,
    })
  }

  /**
   * Create a new CommentMetadata instance with updated body content.
   */
  withBody(body: string): CommentMetadata {
    return this.with({ body })
  }

  /**
   * Create a new CommentMetadata instance with updated reactions.
   */
  withReactions(reactions: Map<string, number>): CommentMetadata {
    return this.with({ reactions })
  }

  /**
   * Create a new CommentMetadata instance with updated state.
   */
  withState(state: CommentState): CommentMetadata {
    return this.with({ state })
  }

  /**
   * Simple hash function to convert long strings into shorter, consistent hashes.
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}
