import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { DeleteInlineCommentRequest } from './types'
import githubRequest from './github-request'

/**
 * Deletes an existing inline comment (review comment) on a GitHub Pull Request.
 *
 * @example
 *   await deleteInlineComment({
 *     prKey: { owner: 'facebook', repo: 'react', pullNumber: 1 },
 *     commentId: 123456789,
 *     token: 'your-github-token'
 *   })
 */
export async function deleteInlineComment(params: DeleteInlineCommentRequest): Promise<void> {
  const fetcher = async ({ prKey, commentId, token }: DeleteInlineCommentRequest): Promise<void> => {
    const url = `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/pulls/comments/${commentId}`
    const authToken = token && token.trim() !== '' ? token : undefined
    const res = await fetch(url, {
      method: 'DELETE',
      headers: buildHeaders(authToken),
    })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    // DELETE returns 204 No Content, so no response body to parse
    return
  }

  return githubRequest<DeleteInlineCommentRequest, void>(params, fetcher, { requestType: 'delete-inline-comment' })
}

export default deleteInlineComment
