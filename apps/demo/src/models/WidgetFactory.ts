import {
  CommentAuthor,
  CommentMetadata,
  CommentState,
  GitHubInlineComment,
  InlineComment,
  CommentEvent,
  Widget,
} from '@diff-viewer'
import React from 'react'

/**
 * Event handler for comment widget events
 */
export type EventHandler = (metadata: CommentMetadata, event: CommentEvent, data?: string) => void

/**
 * Generic comment type that can be either existing comment groups or new comment metadata
 */
export type GenericComment = Map<string, GitHubInlineComment[]> | Map<string, CommentMetadata[]> | CommentMetadata[]

/**
 * Factory class for creating comment widgets
 */
export class WidgetFactory {
  /**
   * Build widgets from either existing comment groups or comment metadata
   *
   * @param comments - Either existing comment groups or new comment metadata
   * @param author - Author information for the widgets
   * @param onEventTrigger - Event handler for comment events
   * @param isReviewing - Whether there are saved drafts in the current context indicating review mode
   * @returns The widgets
   */
  static build(
    comments: GenericComment,
    author: CommentAuthor,
    onEventTrigger: EventHandler,
    isReviewing?: boolean,
  ): Widget[] {
    const builder = new Builder(onEventTrigger, author, isReviewing)
    return builder.build(comments)
  }
}

/**
 * Internal builder class that encapsulates the widget creation logic
 */
class Builder {
  constructor(
    private readonly onEventTrigger: EventHandler,
    private readonly author: CommentAuthor,
    private readonly isReviewing?: boolean,
  ) {}

  /**
   * Build widgets from either existing comment groups or comment metadata
   *
   * @param comments - Either existing comment groups or new comment metadata
   * @returns The widgets
   */
  build(comments: GenericComment): Widget[] {
    if (comments instanceof Map) {
      // Check if the Map contains GitHubInlineComment or CommentMetadata
      const values = Array.from((comments as Map<string, unknown>).values()) as (
        | GitHubInlineComment[]
        | CommentMetadata[]
      )[]
      const firstEntry = values[0]
      if (firstEntry && firstEntry.length > 0) {
        // Check if it's a CommentMetadata by looking for the 'author' property
        if ('author' in firstEntry[0]) {
          return this.fromGroupedMetadata(comments as Map<string, CommentMetadata[]>)
        } else {
          return this.fromGitHub(comments as Map<string, GitHubInlineComment[]>)
        }
      }
      return []
    }
    return this.fromMetadata(comments)
  }

  private fromGitHub(commentGroups: Map<string, GitHubInlineComment[]>): Widget[] {
    return Array.from(commentGroups.entries()).map(([key, groupComments]) => {
      const [filepath, lineStr, side] = key.split(':')
      const line = parseInt(lineStr, 10)
      const convertedComments = groupComments.map((comment) => this.toMetadata(comment))

      return {
        content: React.createElement(InlineComment, {
          currentUser: this.author,
          thread: convertedComments,
          onEventTrigger: this.onEventTrigger,
          isReviewing: this.isReviewing,
        }) as React.ReactNode,
        line,
        side: side as 'left' | 'right',
        position: 'bottom',
        filepath,
      } as Widget
    })
  }

  private fromGroupedMetadata(commentGroups: Map<string, CommentMetadata[]>): Widget[] {
    return Array.from(commentGroups.entries()).map(([key, groupComments]) => {
      const [filepath, lineStr, side] = key.split(':')
      const line = parseInt(lineStr, 10)

      return {
        content: React.createElement(InlineComment, {
          currentUser: this.author,
          thread: groupComments,
          onEventTrigger: this.onEventTrigger,
          isReviewing: this.isReviewing,
        }) as React.ReactNode,
        line,
        side: side as 'left' | 'right',
        position: 'bottom',
        filepath,
      } as Widget
    })
  }

  private fromMetadata(comments: CommentMetadata[]): Widget[] {
    return comments.map((comment) => {
      const thread = [comment]
      return {
        content: React.createElement(InlineComment, {
          currentUser: this.author,
          thread,
          onEventTrigger: this.onEventTrigger,
          isReviewing: this.isReviewing,
        }) as React.ReactNode,
        line: comment.line,
        side: comment.side.toLowerCase() as 'left' | 'right',
        position: 'bottom',
        filepath: comment.path,
      } as Widget
    })
  }

  private toMetadata(comment: GitHubInlineComment): CommentMetadata {
    return new CommentMetadata({
      id: comment.id,
      author: {
        login: comment.user.login,
        avatar_url: comment.user.avatar_url,
        html_url: comment.user.html_url,
      },
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      url: comment.html_url,
      body: comment.body,
      reactions: this.buildReactions(comment),
      path: comment.path,
      line: comment.line || 0,
      side: comment.side || 'RIGHT',
      state: CommentState.PUBLISHED, // GitHub comments are always published
      wasPublished: true,
    })
  }

  private buildReactions(comment: GitHubInlineComment) {
    const reactions = new Map<string, number>()
    reactions.set('+1', comment.reactions['+1'])
    reactions.set('-1', comment.reactions['-1'])
    reactions.set('laugh', comment.reactions.laugh)
    reactions.set('hooray', comment.reactions.hooray)
    reactions.set('confused', comment.reactions.confused)
    reactions.set('heart', comment.reactions.heart)
    reactions.set('rocket', comment.reactions.rocket)
    reactions.set('eyes', comment.reactions.eyes)
    return reactions
  }
}
