import { hashString } from '../../../../commons/src/utils/string-utils'

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
  serverId?: number
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
  state: CommentState
  /** True if the comment was ever published to the server at any point*/
  wasPublished: boolean

  constructor(data: {
    serverId?: number
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
    this.author = data.author
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.url = data.url
    this.body = data.body
    this.reactions = data.reactions
    this.path = data.path
    this.line = data.line
    this.side = data.side
    this.state = data.state
    this.wasPublished = data.wasPublished
    this.serverId = data.serverId
  }

  /**
   * A good-enough heuristic to identify the comment in the local context.
   */
  get localId(): number {
    const rawKey = `${this.path}:${this.author.login}:${this.line}:${this.side}:${this.body.trim()}`
    const hashKey = hashString(rawKey)
    return hashKey
  }

  /**
   * Utility to clone this comment with updated properties.
   */
  with(
    updates: Partial<{
      serverId: number
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
      serverId: updates.serverId ?? this.serverId,
      author: updates.author ?? this.author,
      createdAt: updates.createdAt ?? this.createdAt,
      updatedAt: updates.updatedAt ?? this.updatedAt,
      url: updates.url ?? this.url,
      body: updates.body ?? this.body,
      reactions: updates.reactions ?? this.reactions,
      path: updates.path ?? this.path,
      line: updates.line ?? this.line,
      side: updates.side ?? this.side,
      state: updates.state ?? this.state,
      wasPublished: updates.wasPublished ?? this.wasPublished,
    })
  }
}
