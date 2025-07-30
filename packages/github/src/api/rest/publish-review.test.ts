import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CommentMetadata } from '../../comment/models/CommentMetadata'
import { ReviewStatus } from '../models'
import { getInlineComments } from './get-inline-comments'
import { githubRequest, type GithubRequestFetcher } from './github-request'
import { publishReview } from './publish-review'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { PublishReviewRequest, PublishReviewResponse } from './types'

vi.mock('./github-request', () => ({
  githubRequest: vi.fn(),
}))

vi.mock('./request-utils', () => ({
  buildHeaders: vi.fn(),
  getGithubError: vi.fn(),
  GITHUB_API_HOST: 'https://api.github.com',
}))

vi.mock('./get-inline-comments', () => ({
  getInlineComments: vi.fn(),
}))

const mockBuildHeaders = buildHeaders as ReturnType<typeof vi.fn>
const mockGetGithubError = getGithubError as ReturnType<typeof vi.fn>
const mockGithubRequest = githubRequest as ReturnType<typeof vi.fn>
const mockGetInlineComments = getInlineComments as ReturnType<typeof vi.fn>

const mockRequest: PublishReviewRequest = {
  prKey: {
    owner: 'test-owner',
    repo: 'test-repo',
    pullNumber: 123,
  },
  body: 'LGTM!',
  event: ReviewStatus.APPROVE,
  commitId: 'abc123',
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
  commit_id: 'abc123',
  updatedComments: new Set(),
}

const mockInlineComments = [
  {
    id: 1,
    user: {
      login: 'test-user',
      avatar_url: 'https://avatars.githubusercontent.com/u/123?v=4',
      html_url: 'https://github.com/test-user',
    },
    body: 'Test comment',
    path: 'src/file.ts',
    line: 10,
    side: 'RIGHT' as const,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    html_url: 'https://github.com/test-owner/test-repo/pull/123#discussion_r1',
    commit_id: 'abc123',
    position: 1,
    original_position: 1,
    diff_hunk: '@@ -10,1 +10,1 @@\n-old line\n+new line',
    node_id: 'MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDE=',
    pull_request_review_id: 1,
    original_commit_id: 'abc123',
    in_reply_to_id: null,
    url: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/1',
    pull_request_url: 'https://api.github.com/repos/test-owner/test-repo/pulls/123',
    author_association: 'MEMBER',
    _links: {
      self: { href: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/1' },
      html: { href: 'https://github.com/test-owner/test-repo/pull/123#discussion_r1' },
      pull_request: { href: 'https://api.github.com/repos/test-owner/test-repo/pulls/123' },
    },
    reactions: {
      url: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/1/reactions',
      total_count: 0,
      '+1': 0,
      '-1': 0,
      laugh: 0,
      hooray: 0,
      confused: 0,
      heart: 0,
      rocket: 0,
      eyes: 0,
    },
    start_line: null,
    original_start_line: null,
    start_side: null,
    original_line: null,
    subject_type: 'line',
  },
]

describe('publishReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildHeaders.mockReturnValue({ Authorization: 'Bearer ghp_test_token' })
    mockGithubRequest.mockImplementation(async (params: PublishReviewRequest, fetcher) => {
      const typedFetcher = fetcher as GithubRequestFetcher<PublishReviewRequest, PublishReviewResponse>
      return await typedFetcher(params)
    })
    mockGetInlineComments.mockResolvedValue([])
  })

  it('should publish a review successfully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReview),
    })

    mockGetInlineComments.mockResolvedValue(mockInlineComments)

    const result = await publishReview(mockRequest)

    // Verify the review was published
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${GITHUB_API_HOST}/repos/test-owner/test-repo/pulls/123/reviews`,
      expect.any(Object),
    )

    // Verify getInlineComments was called to fetch updated comments
    expect(mockGetInlineComments).toHaveBeenCalledWith({
      prKey: mockRequest.prKey,
      token: mockRequest.token,
    })

    // Verify the result includes the updated comments
    expect(result).toEqual({
      ...mockReview,
      updatedComments: expect.any(Set) as Set<CommentMetadata>,
    })

    // Verify the updatedComments Set contains the expected comment
    expect(result.updatedComments.size).toBe(1)
    const comment = Array.from(result.updatedComments)[0]
    expect(comment.serverId).toBe(1)
    expect(comment.body).toBe('Test comment')
    expect(comment.path).toBe('src/file.ts')
    expect(comment.line).toBe(10)
    expect(comment.side).toBe('RIGHT')
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

  it('should handle inline comments fetch errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReview),
    })

    mockGetInlineComments.mockRejectedValue(new Error('Failed to fetch comments'))

    await expect(publishReview(mockRequest)).rejects.toThrow('Failed to fetch updated comments after publishing review')
  })
})
