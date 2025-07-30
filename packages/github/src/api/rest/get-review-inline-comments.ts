import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { GetMoreLineRequest } from './types'
import type { GitHubInlineComment } from '../models'
import { githubRequest } from './github-request'

/**
 * Retrieves the inline comments of a specific GitHub Pull Request review.
 */
export async function getReviewInlineComments(
  params: GetMoreLineRequest & { reviewId: number },
): Promise<GitHubInlineComment[]> {
  const fetcher = async ({
    prKey,
    token,
    reviewId,
  }: GetMoreLineRequest & { reviewId: number }): Promise<GitHubInlineComment[]> => {
    const url = `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/pulls/${prKey.pullNumber}/reviews/${reviewId}/comments`
    const githubToken = token && token.trim() !== '' ? token : undefined
    const res = await fetch(url, { headers: buildHeaders(githubToken) })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    return (await res.json()) as GitHubInlineComment[]
  }

  return githubRequest<GetMoreLineRequest & { reviewId: number }, GitHubInlineComment[]>(params, fetcher, {
    requestType: 'review-inline-comments',
  })
}
