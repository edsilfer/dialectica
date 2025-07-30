import { Widget } from '@diff-viewer'
import {
  CommentAuthor,
  CommentEventHandler,
  CommentFactory,
  CommentMetadata,
  GitHubInlineComment,
  InlineComment,
} from '@github'
import React from 'react'

/**
 * Generic comment type that can be either existing comment groups or new comment metadata
 */
type GenericComment = Map<string, GitHubInlineComment[]> | Map<string, CommentMetadata[]> | CommentMetadata[]

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
    onEventTrigger: CommentEventHandler,
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
    private readonly onEventTrigger: CommentEventHandler,
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
      const convertedComments = groupComments.map((comment) => CommentFactory.fromGitHubComment(comment))

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
}
