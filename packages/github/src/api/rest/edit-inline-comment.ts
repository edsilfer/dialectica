import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { EditInlineCommentRequest } from './types'
import type { GitHubInlineComment } from '../models'
import { githubRequest } from './github-request'

/**
 * Edits an existing inline comment (review comment) on a GitHub Pull Request.
 *
 * @example
 *   const updatedComment = await editInlineComment({
 *     prKey: { owner: 'facebook', repo: 'react', pullNumber: 1 },
 *     commentId: 123456789,
 *     body: 'Updated comment text',
 *     token: 'your-github-token'
 *   })
 */
export async function editInlineComment(params: EditInlineCommentRequest): Promise<GitHubInlineComment> {
  const fetcher = async ({ prKey, token, commentId, body }: EditInlineCommentRequest): Promise<GitHubInlineComment> => {
    if (!commentId) {
      throw new Error('commentId is required')
    }

    if (!body || body.trim() === '') {
      throw new Error('body is required and cannot be empty')
    }

    const url = `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/pulls/comments/${commentId}`
    const authToken = token && token.trim() !== '' ? token : undefined

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...buildHeaders(authToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    return (await res.json()) as GitHubInlineComment
  }

  return githubRequest<EditInlineCommentRequest, GitHubInlineComment>(params, fetcher, {
    requestType: 'edit-inline-comment',
  })
}
