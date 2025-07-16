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
  /** A saved draft comment, not published yet */
  PENDING = 'PENDING',
  /** A published comment */
  PUBLISHED = 'PUBLISHED',
}

/**
 * Event types that can be triggered by the StaticComment component
 */
export enum CommentEvent {
  ADD = 'ADD',
  REPLY = 'REPLY',
  SAVE = 'SAVE',
  CANCEL = 'CANCEL',
  DELETE = 'DELETE',
  EDIT = 'EDIT',
  RESOLVE = 'RESOLVE',
  REACT = 'REACT',
}

/**
 * Event handler type that takes metadata, event, and optional data
 */
export type EventHandler = (comment: CommentMetadata, event: CommentEvent, data?: string) => void

/**
 * Minimal comment metadata needed for display purposes
 */
export class CommentMetadata {
  /** Unique identifier for the comment */
  id: number
  /** The author of the comment */
  author: CommentAuthor
  /** ISO timestamp when comment was created */
  createdAt: string
  /** ISO timestamp when comment was last updated (optional) */
  updatedAt?: string
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
  currentState: CommentState
  /** True if the comment was ever published to the server at any point*/
  wasPublished: boolean

  constructor(data: {
    id: number
    author: CommentAuthor
    createdAt: string
    updatedAt?: string
    url: string
    body: string
    reactions: Map<string, number>
    path: string
    line: number
    side: 'LEFT' | 'RIGHT'
    state: CommentState
    wasPublished: boolean
  }) {
    this.id = data.id
    this.author = data.author
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.url = data.url
    this.body = data.body
    this.reactions = data.reactions
    this.path = data.path
    this.line = data.line
    this.side = data.side
    this.currentState = data.state
    this.wasPublished = data.wasPublished
  }

  /**
   * Generate a unique key for this comment.
   * Uses stable identifiers that don't change when content is updated.
   */
  getKey(): string {
    const rawKey = `${this.author.login}:${this.path}:${this.line}:${this.side}:${this.createdAt}:${this.id}`
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
      createdAt: string
      updatedAt?: string
      url: string
      body: string
      reactions: Map<string, number>
      path: string
      line: number
      side: 'LEFT' | 'RIGHT'
      state: CommentState
      wasPublished?: boolean
    }>,
  ): CommentMetadata {
    return new CommentMetadata({
      id: updates.id ?? this.id,
      author: updates.author ?? this.author,
      createdAt: updates.createdAt ?? this.createdAt,
      updatedAt: updates.updatedAt ?? this.updatedAt,
      url: updates.url ?? this.url,
      body: updates.body ?? this.body,
      reactions: updates.reactions ?? this.reactions,
      path: updates.path ?? this.path,
      line: updates.line ?? this.line,
      side: updates.side ?? this.side,
      state: updates.state ?? this.currentState,
      wasPublished: updates.wasPublished ?? this.wasPublished,
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
   * Create a new CommentMetadata instance with updated wasPublished state.
   */
  withWasPublished(wasPublished: boolean): CommentMetadata {
    return this.with({ wasPublished })
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
