import { LineMetadata } from '@dialectica-org/diff-viewer'
import { GitHubInlineComment } from '../../api/models'
import { CommentAuthor, CommentMetadata, CommentState } from './CommentMetadata'

/**
 * Factory class for creating CommentMetadata instances with proper defaults and conversions
 */
export class CommentFactory {
  /**
   * Create a new comment from line metadata.
   *
   * @param dockedLine - The line metadata where the comment should be placed
   * @param author - The author of the comment
   * @param state - The initial state of the comment (defaults to DRAFT)
   * @returns A new CommentMetadata instance
   */
  static create(
    dockedLine: LineMetadata,
    author: CommentAuthor,
    state: CommentState = CommentState.DRAFT,
  ): CommentMetadata {
    return new CommentMetadata({
      author,
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
      url: `#comment-${Date.now()}`,
      body: '',
      reactions: new Map(),
      path: dockedLine.filepath!,
      line: dockedLine.lineNumber!,
      side: dockedLine.side! === 'left' ? 'LEFT' : 'RIGHT',
      state,
      wasPublished: false,
    })
  }

  /**
   * Convert a GitHub comment to CommentMetadata.
   *
   * @param githubComment - The GitHub comment to convert
   * @returns CommentMetadata instance with PUBLISHED state
   */
  static fromGitHubComment(githubComment: GitHubInlineComment): CommentMetadata {
    return new CommentMetadata({
      serverId: githubComment.id,
      author: {
        login: githubComment.user.login,
        avatar_url: githubComment.user.avatar_url,
        html_url: githubComment.user.html_url,
      },
      createdAt: githubComment.created_at,
      updatedAt: githubComment.updated_at,
      url: githubComment.html_url,
      body: githubComment.body,
      reactions: CommentFactory.buildReactions(githubComment),
      path: githubComment.path,
      line: githubComment.line || 0,
      side: githubComment.side || 'RIGHT',
      state: CommentState.PUBLISHED, // GitHub comments are always published
      wasPublished: true,
    })
  }

  /**
   * Build reactions map from GitHub comment reactions.
   *
   * @param githubComment - The GitHub comment containing reactions
   * @returns Map of reaction types to counts
   */
  private static buildReactions(githubComment: GitHubInlineComment): Map<string, number> {
    return new Map([
      ['+1', githubComment.reactions['+1']],
      ['-1', githubComment.reactions['-1']],
      ['laugh', githubComment.reactions.laugh],
      ['hooray', githubComment.reactions.hooray],
      ['confused', githubComment.reactions.confused],
      ['heart', githubComment.reactions.heart],
      ['rocket', githubComment.reactions.rocket],
      ['eyes', githubComment.reactions.eyes],
    ])
  }
}
