import { describe, it, expect, vi, beforeEach } from 'vitest'
import { publishReview } from './publish-review'
import type { PublishReviewRequest, PublishReviewResponse } from './types'
import githubRequest from './github-request'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'

vi.mock('./github-request', () => ({
  default: vi.fn(),
}))

vi.mock('./request-utils', () => ({
  buildHeaders: vi.fn(),
  getGithubError: vi.fn(),
  GITHUB_API_HOST: 'https://api.github.com',
}))

const mockBuildHeaders = buildHeaders as ReturnType<typeof vi.fn>
const mockGetGithubError = getGithubError as ReturnType<typeof vi.fn>
const mockGithubRequest = githubRequest as ReturnType<typeof vi.fn>

describe('publishReview', () => {
  const mockRequest: PublishReviewRequest = {
    prKey: {
      owner: 'test-owner',
      repo: 'test-repo',
      pullNumber: 123,
    },
    body: 'LGTM!',
    event: 'APPROVE',
    comments: [],
    token: 'ghp_test_token',
  }

  const mockReview: PublishReviewResponse = {
    id: 1,
    user: {
      login: 'test-user',
      avatar_url: 'https://avatars.githubusercontent.com/u/123?v=4',
      html_url: 'https://github.com/test-user',
      id: 123,
      node_id: 'MDQ6VXNlcjEyMw==',
      gravatar_id: '',
      url: 'https://api.github.com/users/test-user',
      type: 'User',
      site_admin: false,
      followers_url: 'https://api.github.com/users/test-user/followers',
      following_url: 'https://api.github.com/users/test-user/following{/other_user}',
      gists_url: 'https://api.github.com/users/test-user/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/test-user/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/test-user/subscriptions',
      organizations_url: 'https://api.github.com/users/test-user/orgs',
      repos_url: 'https://api.github.com/users/test-user/repos',
      events_url: 'https://api.github.com/users/test-user/events{/privacy}',
      received_events_url: 'https://api.github.com/users/test-user/received_events',
    },
    body: 'LGTM!',
    state: 'APPROVED',
    html_url: 'https://github.com/test-owner/test-repo/pull/123#pullrequestreview-1',
    pull_request_url: 'https://api.github.com/repos/test-owner/test-repo/pulls/123',
    _links: {
      html: {
        href: 'https://github.com/test-owner/test-repo/pull/123#pullrequestreview-1',
      },
      pull_request: {
        href: 'https://api.github.com/repos/test-owner/test-repo/pulls/123',
      },
    },
    submitted_at: '2023-01-01T00:00:00Z',
    commit_id: 'abc123',
    author_association: 'MEMBER',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildHeaders.mockReturnValue({ Authorization: 'Bearer ghp_test_token' })
    mockGithubRequest.mockImplementation(async (params: PublishReviewRequest, fetcher) => {
      const typedFetcher = fetcher as (params: PublishReviewRequest) => Promise<PublishReviewResponse>
      return await typedFetcher(params)
    })
  })

  it('should publish a review successfully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReview),
    })

    const result = await publishReview(mockRequest)

    expect(result).toEqual(mockReview)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${GITHUB_API_HOST}/repos/test-owner/test-repo/pulls/123/reviews`,
      expect.any(Object),
    )
  })

  it('should throw an error if event is missing', async () => {
    const invalidRequest = { ...mockRequest, event: undefined } as unknown as PublishReviewRequest
    await expect(publishReview(invalidRequest)).rejects.toThrow('event is required')
  })

  it('should handle API errors', async () => {
    const errorMessage = 'API Error'
    mockGetGithubError.mockResolvedValue(errorMessage)
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    await expect(publishReview(mockRequest)).rejects.toThrow(`GitHub API error (500): ${errorMessage}`)
  })
})
