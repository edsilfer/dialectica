import { FileDiff, GitHubInlineComment, ParsedDiff } from '@diff-viewer'
import { mapInlineComment } from '../components/mappers'

export const CURRENT_USER = {
  login: 'current-user',
  avatar_url: 'https://github.com/github.png',
  html_url: 'https://github.com/current-user',
}

/**
 * Parse the comments, building groups per comment key.
 *
 * @param comments      - The comments to parse.
 * @param diff          - The diff to parse.
 * @returns             - The comment groups.
 */
export function parseComments(comments: GitHubInlineComment[], diff: ParsedDiff) {
  const commentGroups = new Map<string, GitHubInlineComment[]>()

  comments
    .filter((comment) => comment.line && comment.path)
    .forEach((comment) => {
      const file = diff.files.find((f: FileDiff) => f.newPath === comment.path || f.oldPath === comment.path)
      if (!file) return

      const filepath = file.newPath || file.oldPath
      const side = comment.side === 'LEFT' ? 'left' : 'right'
      const key = `${filepath}:${comment.line}:${side}`

      const diffViewerComment = mapInlineComment(comment)
      if (!commentGroups.has(key)) {
        commentGroups.set(key, [])
      }
      commentGroups.get(key)!.push(diffViewerComment)
    })

  return commentGroups
}
