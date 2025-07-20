import { describe, it, expect, vi, beforeEach } from 'vitest'
import { editInlineComment } from './edit-inline-comment'
import type { EditInlineCommentRequest } from './types'
import type { GitHubInlineComment } from '../models'

// Mock dependencies
vi.mock('./request-utils', () => ({
  buildHeaders: vi.fn(),
  getGithubError: vi.fn(),
  GITHUB_API_HOST: 'https://api.github.com',
}))

vi.mock('./github-request', () => ({
  default: vi.fn(),
}))

import githubRequest from './github-request'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'

// Create typed mocks
const mockBuildHeaders = buildHeaders as ReturnType<typeof vi.fn>
const mockGetGithubError = getGithubError as ReturnType<typeof vi.fn>
const mockGithubRequest = githubRequest as ReturnType<typeof vi.fn>

describe('editInlineComment', () => {
  const mockRequest: EditInlineCommentRequest = {
    prKey: {
      owner: 'test-owner',
      repo: 'test-repo',
      pullNumber: 123,
    },
    commentId: 987654321,
    body: 'Updated comment text',
    token: 'fake-token',
  }

  const mockUpdatedComment: GitHubInlineComment = {
    id: 987654321,
    body: 'Updated comment text',
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
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
    author_association: 'MEMBER',
    url: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/987654321',
    html_url: 'https://github.com/test-owner/test-repo/pull/123#issuecomment-987654321',
    pull_request_review_id: 1234567890,
    diff_hunk: '@@ -1,3 +1,3 @@',
    path: 'src/test-file.ts',
    position: 1,
    original_position: 1,
    commit_id: 'abc123',
    original_commit_id: 'def456',
    in_reply_to_id: 111,
    start_line: 10,
    original_start_line: 10,
    start_side: 'RIGHT',
    line: 12,
    original_line: 12,
    side: 'RIGHT',
    subject_type: 'line',
    reactions: {
      url: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/987654321/reactions',
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
    node_id: 'MDEyOklzc3VlQ29tbWVudDEyMzQ1Njc4OTA=',
    pull_request_url: 'https://api.github.com/repos/test-owner/test-repo/pulls/123',
    _links: {
      self: { href: 'https://api.github.com/repos/test-owner/test-repo/pulls/comments/987654321' },
      html: { href: 'https://github.com/test-owner/test-repo/pull/123#issuecomment-987654321' },
      pull_request: { href: 'https://api.github.com/repos/test-owner/test-repo/pulls/123' },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildHeaders.mockReturnValue({ Accept: 'application/vnd.github+json' })
    mockGetGithubError.mockResolvedValue('GitHub API error message')
  })

  describe('normal flow', () => {
    it('given valid request with token, when called, expect githubRequest called with correct parameters', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      mockGithubRequest.mockResolvedValue(mockUpdatedComment)

      const result = await editInlineComment(mockRequest)

      expect(result).toEqual(mockUpdatedComment)
      expect(mockGithubRequest).toHaveBeenCalledWith(mockRequest, expect.any(Function), {
        requestType: 'edit-inline-comment',
      })
    })

    it('given valid request without token, when called, expect githubRequest called with correct parameters', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      const requestWithoutToken = { ...mockRequest, token: undefined }
      mockGithubRequest.mockResolvedValue(mockUpdatedComment)

      const result = await editInlineComment(requestWithoutToken)

      expect(result).toEqual(mockUpdatedComment)
      expect(mockGithubRequest).toHaveBeenCalledWith(requestWithoutToken, expect.any(Function), {
        requestType: 'edit-inline-comment',
      })
    })

    it('given valid request with empty token, when called, expect githubRequest called with correct parameters', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      const requestWithEmptyToken = { ...mockRequest, token: '   ' }
      mockGithubRequest.mockResolvedValue(mockUpdatedComment)

      const result = await editInlineComment(requestWithEmptyToken)

      expect(result).toEqual(mockUpdatedComment)
      expect(mockGithubRequest).toHaveBeenCalledWith(requestWithEmptyToken, expect.any(Function), {
        requestType: 'edit-inline-comment',
      })
    })
  })

  describe('fetcher function behavior', () => {
    it('given valid request, when called, expect fetcher function passed to githubRequest', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      let capturedFetcher: ((params: EditInlineCommentRequest) => Promise<GitHubInlineComment>) | undefined
      mockGithubRequest.mockImplementationOnce((params, fetcher) => {
        capturedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return Promise.resolve(mockUpdatedComment)
      })

      await editInlineComment(mockRequest)

      expect(capturedFetcher).toBeDefined()
    })

    it('given request with token, when fetcher executed, expect correct URL and headers', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      let capturedFetcher: ((params: EditInlineCommentRequest) => Promise<GitHubInlineComment>) | undefined
      mockGithubRequest.mockImplementationOnce(async (params: EditInlineCommentRequest, fetcher) => {
        capturedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        // Execute the fetcher to test its behavior
        await capturedFetcher(params)
        return mockUpdatedComment
      })

      mockBuildHeaders.mockReturnValue({
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer fake-token',
      })

      await editInlineComment(mockRequest)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${GITHUB_API_HOST}/repos/test-owner/test-repo/pulls/comments/987654321`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: 'Updated comment text' }),
        },
      )
      expect(mockBuildHeaders).toHaveBeenCalledWith('fake-token')
    })

    it('given request without token, when fetcher executed, expect correct URL without authorization', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      const requestWithoutToken = { ...mockRequest, token: undefined }

      let capturedFetcher: ((params: EditInlineCommentRequest) => Promise<GitHubInlineComment>) | undefined
      mockGithubRequest.mockImplementationOnce(async (params: EditInlineCommentRequest, fetcher) => {
        capturedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        // Execute the fetcher to test its behavior
        await capturedFetcher(params)
        return mockUpdatedComment
      })

      mockBuildHeaders.mockReturnValue({ Accept: 'application/vnd.github+json' })

      await editInlineComment(requestWithoutToken)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${GITHUB_API_HOST}/repos/test-owner/test-repo/pulls/comments/987654321`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: 'Updated comment text' }),
        },
      )
      expect(mockBuildHeaders).toHaveBeenCalledWith(undefined)
    })
  })

  describe('parameter validation', () => {
    it('given missing commentId, when called, expect error thrown', async () => {
      const invalidRequest = { ...mockRequest, commentId: undefined } as unknown as EditInlineCommentRequest

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(invalidRequest)).rejects.toThrow()
    })

    it('given zero commentId, when called, expect error thrown', async () => {
      const invalidRequest = { ...mockRequest, commentId: 0 }

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(invalidRequest)).rejects.toThrow()
    })

    it('given missing body, when called, expect error thrown', async () => {
      const invalidRequest = { ...mockRequest, body: undefined } as unknown as EditInlineCommentRequest

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(invalidRequest)).rejects.toThrow()
    })

    it('given empty body, when called, expect error thrown', async () => {
      const invalidRequest = { ...mockRequest, body: '' }

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(invalidRequest)).rejects.toThrow()
    })

    it('given whitespace-only body, when called, expect error thrown', async () => {
      const invalidRequest = { ...mockRequest, body: '   \n  \t  ' }

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(invalidRequest)).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('given githubRequest throws error, when called, expect error propagated', async () => {
      const testError = new Error('Test error')
      mockGithubRequest.mockRejectedValue(testError)

      await expect(editInlineComment(mockRequest)).rejects.toThrow('Test error')
    })

    it('given fetcher throws GitHub API error, when called, expect error with status and message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
      })

      mockGetGithubError.mockResolvedValue('Validation failed')

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(mockRequest)).rejects.toThrow('GitHub API error (422): Validation failed')
    })

    it('given 401 unauthorized, when fetcher executed, expect authentication error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })

      mockGetGithubError.mockResolvedValue('Bad credentials')

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(mockRequest)).rejects.toThrow('GitHub API error (401): Bad credentials')
    })

    it('given 403 forbidden, when fetcher executed, expect permission error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      })

      mockGetGithubError.mockResolvedValue('Forbidden')

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(mockRequest)).rejects.toThrow('GitHub API error (403): Forbidden')
    })

    it('given 404 not found, when fetcher executed, expect not found error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      mockGetGithubError.mockResolvedValue('Not Found')

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await expect(editInlineComment(mockRequest)).rejects.toThrow('GitHub API error (404): Not Found')
    })
  })

  describe('integration with githubRequest', () => {
    it('given request with useMocks true, when called, expect githubRequest called with useMocks', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      const requestWithMocks = { ...mockRequest, useMocks: true }
      mockGithubRequest.mockResolvedValue(mockUpdatedComment)

      await editInlineComment(requestWithMocks)

      expect(mockGithubRequest).toHaveBeenCalledWith(requestWithMocks, expect.any(Function), {
        requestType: 'edit-inline-comment',
      })
    })

    it('given request with forceDelayMs, when called, expect githubRequest called with delay', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      const requestWithDelay = { ...mockRequest, forceDelayMs: 1000 }
      mockGithubRequest.mockResolvedValue(mockUpdatedComment)

      await editInlineComment(requestWithDelay)

      expect(mockGithubRequest).toHaveBeenCalledWith(requestWithDelay, expect.any(Function), {
        requestType: 'edit-inline-comment',
      })
    })
  })

  describe('request body formatting', () => {
    it('given different body content, when fetcher executed, expect correct JSON body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      const requestWithDifferentBody = { ...mockRequest, body: 'Different comment text' }

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await editInlineComment(requestWithDifferentBody)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ body: 'Different comment text' }),
        }),
      )
    })

    it('given body with special characters, when fetcher executed, expect properly escaped JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedComment),
      })

      const requestWithSpecialChars = { ...mockRequest, body: 'Comment with "quotes" and \\backslashes\\' }

      mockGithubRequest.mockImplementation(async (params: EditInlineCommentRequest, fetcher) => {
        const typedFetcher = fetcher as (params: EditInlineCommentRequest) => Promise<GitHubInlineComment>
        return await typedFetcher(params)
      })

      await editInlineComment(requestWithSpecialChars)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ body: 'Comment with "quotes" and \\backslashes\\' }),
        }),
      )
    })
  })
})
