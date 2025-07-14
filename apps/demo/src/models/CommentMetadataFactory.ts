import { CommentState, CommentMetadata, CommentAuthor, GitHubInlineComment, LineMetadata } from '@diff-viewer'

/**
 * Factory class for creating CommentMetadata instances with proper defaults and conversions
 */
export class CommentMetadataFactory {
  /**
   * Create a new draft comment from line metadata.
   *
   * @param dockedLine - The line metadata where the comment should be placed
   * @param author - The author of the comment
   * @returns A new CommentMetadata instance in DRAFT state
   */
  static createDraft(dockedLine: LineMetadata, author: CommentAuthor): CommentMetadata {
    return new CommentMetadata({
      id: Date.now(), // Temporary ID for new comments
      author,
      created_at: new Date().toISOString(),
      url: `#comment-${Date.now()}`,
      body: '',
      reactions: new Map(),
      path: dockedLine.filepath!,
      line: dockedLine.lineNumber!,
      side: dockedLine.side! === 'left' ? 'LEFT' : 'RIGHT',
      state: CommentState.DRAFT,
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
      id: githubComment.id,
      author: {
        login: githubComment.user.login,
        avatar_url: githubComment.user.avatar_url,
        html_url: githubComment.user.html_url,
      },
      created_at: githubComment.created_at,
      url: githubComment.html_url,
      body: githubComment.body,
      reactions: CommentMetadataFactory.buildReactions(githubComment),
      path: githubComment.path,
      line: githubComment.line || 0,
      side: githubComment.side || 'RIGHT',
      state: CommentState.PUBLISHED, // GitHub comments are always published
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
