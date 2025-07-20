import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GitHubInlineComment } from '../models'
import { getReviewInlineComments } from './get-review-inline-comments'
import type { GetMoreLineRequest } from './types'

// MOCK
vi.mock('./request-utils', () => ({
  buildHeaders: vi.fn(),
  getGithubError: vi.fn(),
  GITHUB_API_HOST: 'https://api.github.com',
}))

vi.mock('./github-request', () => ({
  default: vi.fn(),
}))

import githubRequest from './github-request'
import { buildHeaders, getGithubError } from './request-utils'

const mockBuildHeaders = buildHeaders as ReturnType<typeof vi.fn>
const mockGetGithubError = getGithubError as ReturnType<typeof vi.fn>
const mockGithubRequest = githubRequest as ReturnType<typeof vi.fn>

// HELPERS
const createPrKey = (overrides: Partial<GetMoreLineRequest['prKey']> = {}) => ({
  owner: 'test-owner',
  repo: 'test-repo',
  pullNumber: 123,
  ...overrides,
})

const createRequest = (
  overrides: Partial<GetMoreLineRequest & { reviewId: number }> = {},
): GetMoreLineRequest & { reviewId: number } => ({
  prKey: createPrKey(),
  reviewId: 456,
  ...overrides,
})

const createMockInlineComment = (overrides: Partial<GitHubInlineComment> = {}): GitHubInlineComment => ({
  id: 123,
  node_id: 'MDEyOkNvbW1lbnQxMjM=',
  url: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/123',
  body: 'This is a test comment',
  path: 'src/file.ts',
  diff_hunk: '@@ -14,1 +14,1 @@\n- old line\n+ new line',
  line: 14,
  original_line: 14,
  start_line: null,
  original_start_line: null,
  side: 'RIGHT',
  start_side: null,
  position: 1,
  original_position: 1,
  commit_id: 'abc123',
  original_commit_id: 'abc123',
  user: {
    login: 'test-user',
    id: 456,
    avatar_url: 'https://avatars.githubusercontent.com/u/456?v=4',
    html_url: 'https://github.com/test-user',
    node_id: 'MDQ6VXNlcjQ1Ng==',
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
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  html_url: 'https://github.com/test-owner/test-repo/pull/123#discussion_r123',
  pull_request_url: 'https://api.github.com/repos/test-owner/test-repo/pulls/123',
  author_association: 'CONTRIBUTOR',
  in_reply_to_id: null,
  pull_request_review_id: 456,
  subject_type: 'line',
  _links: {
    self: { href: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/123' },
    html: { href: 'https://github.com/test-owner/test-repo/pull/123#discussion_r123' },
    pull_request: { href: 'https://api.github.com/repos/test-owner/test-repo/pulls/123' },
  },
  reactions: {
    url: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/123/reactions',
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
  ...overrides,
})

describe('getReviewInlineComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildHeaders.mockReturnValue({ Accept: 'application/vnd.github+json' })
    mockGetGithubError.mockResolvedValue('GitHub API error message')
  })

  describe('normal flow', () => {
    it('given valid request with token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given valid request without token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: undefined })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given valid request with empty token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: '   ' })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given valid request with multiple comments, when called, expect all comments returned', async () => {
      // GIVEN
      const request = createRequest()
      const expectedResult = [
        createMockInlineComment({ id: 1, body: 'First comment' }),
        createMockInlineComment({ id: 2, body: 'Second comment' }),
        createMockInlineComment({ id: 3, body: 'Third comment' }),
      ]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(result).toHaveLength(3)
      expect(result[0].body).toBe('First comment')
      expect(result[1].body).toBe('Second comment')
      expect(result[2].body).toBe('Third comment')
    })

    it('given request with useMocks enabled, when called, expect githubRequest called with useMocks', async () => {
      // GIVEN
      const request = createRequest({ useMocks: true })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given request with forceDelayMs, when called, expect githubRequest called with delay', async () => {
      // GIVEN
      const request = createRequest({ forceDelayMs: 1000 })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })
  })

  describe('fetcher function behavior', () => {
    it('given valid request, when called, expect fetcher function passed to githubRequest', async () => {
      // GIVEN
      const request = createRequest()
      const expectedResult = [createMockInlineComment()]
      let capturedFetcher:
        | ((params: GetMoreLineRequest & { reviewId: number }) => Promise<GitHubInlineComment[]>)
        | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (
          params: GetMoreLineRequest & { reviewId: number },
        ) => Promise<GitHubInlineComment[]>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getReviewInlineComments(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
      expect(capturedFetcher).toBeDefined()
    })

    it('given request with token, when fetcher called, expect token handled correctly', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const expectedResult = [createMockInlineComment()]
      let capturedFetcher:
        | ((params: GetMoreLineRequest & { reviewId: number }) => Promise<GitHubInlineComment[]>)
        | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (
          params: GetMoreLineRequest & { reviewId: number },
        ) => Promise<GitHubInlineComment[]>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getReviewInlineComments(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given request without token, when fetcher called, expect token handled correctly', async () => {
      // GIVEN
      const request = createRequest({ token: undefined })
      const expectedResult = [createMockInlineComment()]
      let capturedFetcher:
        | ((params: GetMoreLineRequest & { reviewId: number }) => Promise<GitHubInlineComment[]>)
        | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (
          params: GetMoreLineRequest & { reviewId: number },
        ) => Promise<GitHubInlineComment[]>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getReviewInlineComments(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given request with empty token, when fetcher called, expect token treated as undefined', async () => {
      // GIVEN
      const request = createRequest({ token: '   ' })
      const expectedResult = [createMockInlineComment()]
      let capturedFetcher:
        | ((params: GetMoreLineRequest & { reviewId: number }) => Promise<GitHubInlineComment[]>)
        | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (
          params: GetMoreLineRequest & { reviewId: number },
        ) => Promise<GitHubInlineComment[]>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getReviewInlineComments(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given request with different review ID, when fetcher called, expect fetcher passed correctly', async () => {
      // GIVEN
      const request = createRequest({ reviewId: 789 })
      const expectedResult = [createMockInlineComment()]
      let capturedFetcher:
        | ((params: GetMoreLineRequest & { reviewId: number }) => Promise<GitHubInlineComment[]>)
        | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (
          params: GetMoreLineRequest & { reviewId: number },
        ) => Promise<GitHubInlineComment[]>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getReviewInlineComments(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given request with different PR key, when fetcher called, expect fetcher passed correctly', async () => {
      // GIVEN
      const request = createRequest({
        prKey: { owner: 'different-owner', repo: 'different-repo', pullNumber: 999 },
        reviewId: 456,
      })
      const expectedResult = [createMockInlineComment()]
      let capturedFetcher:
        | ((params: GetMoreLineRequest & { reviewId: number }) => Promise<GitHubInlineComment[]>)
        | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (
          params: GetMoreLineRequest & { reviewId: number },
        ) => Promise<GitHubInlineComment[]>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getReviewInlineComments(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })
  })

  describe('error handling', () => {
    it('given githubRequest throws error, when called, expect error propagated', async () => {
      // GIVEN
      const request = createRequest()
      const testError = new Error('Test error')
      mockGithubRequest.mockRejectedValue(testError)

      // WHEN & EXPECT
      await expect(getReviewInlineComments(request)).rejects.toThrow('Test error')
    })

    it('given fetcher throws GitHub API error, when called, expect error with status and message', async () => {
      // GIVEN
      const request = createRequest()
      const testError = new Error('GitHub API error (404): GitHub API error message')
      mockGithubRequest.mockRejectedValue(testError)

      // WHEN & EXPECT
      await expect(getReviewInlineComments(request)).rejects.toThrow('GitHub API error (404): GitHub API error message')
    })

    it('given network error, when called, expect error propagated', async () => {
      // GIVEN
      const request = createRequest()
      const networkError = new Error('Network error')
      mockGithubRequest.mockRejectedValue(networkError)

      // WHEN & EXPECT
      await expect(getReviewInlineComments(request)).rejects.toThrow('Network error')
    })
  })

  describe('edge cases', () => {
    it('given empty comments array returned, when called, expect empty array returned', async () => {
      // GIVEN
      const request = createRequest()
      const expectedResult: GitHubInlineComment[] = []
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(result).toHaveLength(0)
    })

    it('given request with all optional parameters, when called, expect githubRequest called correctly', async () => {
      // GIVEN
      const request = createRequest({
        token: 'test-token',
        useMocks: true,
        forceDelayMs: 500,
        reviewId: 789,
        prKey: { owner: 'test-owner', repo: 'test-repo', pullNumber: 123 },
      })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given request with zero review ID, when called, expect githubRequest called correctly', async () => {
      // GIVEN
      const request = createRequest({ reviewId: 0 })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given request with large review ID, when called, expect githubRequest called correctly', async () => {
      // GIVEN
      const request = createRequest({ reviewId: 999999999 })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })
  })

  describe('integration with githubRequest', () => {
    it('given request with useMocks true, when called, expect githubRequest handles mock resolution', async () => {
      // GIVEN
      const request = createRequest({ useMocks: true })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })

    it('given request with forceDelayMs, when called, expect githubRequest handles delay', async () => {
      // GIVEN
      const request = createRequest({ forceDelayMs: 2000 })
      const expectedResult = [createMockInlineComment()]
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getReviewInlineComments(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), {
        requestType: 'review-inline-comments',
      })
    })
  })
})
