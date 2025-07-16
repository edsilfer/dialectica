import githubRequest from './github-request'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { PublishReviewRequest, PublishReviewResponse } from './types'

/**
 * Publishes a review to a GitHub Pull Request.
 *
 * @see https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request
 *
 * @example
 *   const review = await publishReview({
 *     prKey: { owner: 'facebook', repo: 'react', pullNumber: 1 },
 *     body: 'LGTM!',
 *     event: 'APPROVE',
 *     comments: [],
 *     token: 'your-github-token'
 *   })
 */
export async function publishReview(params: PublishReviewRequest): Promise<PublishReviewResponse> {
  const fetcher = async ({
    prKey,
    token,
    body,
    event,
    comments,
  }: PublishReviewRequest): Promise<PublishReviewResponse> => {
    if (!event) {
      throw new Error('event is required')
    }

    const url = `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/pulls/${prKey.pullNumber}/reviews`
    const authToken = token && token.trim() !== '' ? token : undefined

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...buildHeaders(authToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body, event, comments, commit_id: params.commitId }),
    })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    return (await res.json()) as PublishReviewResponse
  }

  return githubRequest<PublishReviewRequest, PublishReviewResponse>(params, fetcher, { requestType: 'publish-review' })
}
