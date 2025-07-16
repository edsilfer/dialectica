import { CommentFactory } from '../../pull-request/models/CommentFactory'
import type { CommentMetadata } from '../../pull-request/models/CommentMetadata'
import getInlineComments from './get-inline-comments'
import githubRequest from './github-request'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { PublishReviewRequest, PublishReviewResponse } from './types'

/**
 * Error thrown when inline comments fetch fails after successful review submission
 */
export class InlineCommentsFetchError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
  ) {
    super(message)
    this.name = 'InlineCommentsFetchError'
  }
}

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
    const payload = { body, event, comments, commit_id: params.commitId }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...buildHeaders(authToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    const response = (await res.json()) as PublishReviewResponse

    /*
     * After successfully submitting a review, we need to refetch the inline comments
     * to ensure the local context is updated with the latest comments (the server ID)
     */
    let updatedComments: Set<CommentMetadata>
    try {
      const inlineComments = await getInlineComments({ prKey, token })
      updatedComments = new Set(inlineComments.map((comment) => CommentFactory.fromGitHubComment(comment)))
    } catch (error) {
      throw new InlineCommentsFetchError(
        'Failed to fetch updated comments after publishing review',
        error instanceof Error ? error : new Error('Unknown error'),
      )
    }

    return {
      ...response,
      updatedComments,
    }
  }

  return githubRequest<PublishReviewRequest, PublishReviewResponse>(params, fetcher, { requestType: 'publish-review' })
}
