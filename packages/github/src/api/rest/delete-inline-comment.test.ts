import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteInlineComment } from '../../api/rest/delete-inline-comment'
import type { DeleteInlineCommentRequest } from '../../api/rest/types'

// Mock dependencies
vi.mock('./request-utils', () => ({
  buildHeaders: vi.fn(),
  getGithubError: vi.fn(),
  GITHUB_API_HOST: 'https://api.github.com',
}))

vi.mock('./github-request', () => ({
  githubRequest: vi.fn(),
}))

import { buildHeaders, getGithubError, GITHUB_API_HOST } from '../../api/rest/request-utils'
import { githubRequest } from './github-request'

// Create typed mocks
const mockBuildHeaders = buildHeaders as ReturnType<typeof vi.fn>
const mockGetGithubError = getGithubError as ReturnType<typeof vi.fn>
const mockGithubRequest = githubRequest as ReturnType<typeof vi.fn>

describe('deleteInlineComment', () => {
  const mockRequest: DeleteInlineCommentRequest = {
    prKey: {
      owner: 'facebook',
      repo: 'react',
      pullNumber: 12345,
    },
    commentId: 987654321,
    token: 'ghp_test_token',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildHeaders.mockReturnValue({ Authorization: 'Bearer ghp_test_token' })
    mockGithubRequest.mockImplementation(async (params: DeleteInlineCommentRequest, fetcher) => {
      const typedFetcher = fetcher as (params: DeleteInlineCommentRequest) => Promise<void>
      return await typedFetcher(params)
    })
  })

  describe('successful deletion', () => {
    it('should delete an inline comment successfully', async () => {
      // Mock successful response (204 No Content)
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      const result = await deleteInlineComment(mockRequest)

      expect(result).toBeUndefined()
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${GITHUB_API_HOST}/repos/facebook/react/pulls/comments/987654321`,
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ghp_test_token' },
        },
      )
      expect(mockBuildHeaders).toHaveBeenCalledWith('ghp_test_token')
      expect(mockGithubRequest).toHaveBeenCalledWith(mockRequest, expect.any(Function), {
        requestType: 'delete-inline-comment',
      })
    })

    it('should handle missing token by passing undefined to buildHeaders', async () => {
      const requestWithoutToken = { ...mockRequest, token: undefined }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      await deleteInlineComment(requestWithoutToken)

      expect(mockBuildHeaders).toHaveBeenCalledWith(undefined)
    })

    it('should handle empty token by passing undefined to buildHeaders', async () => {
      const requestWithEmptyToken = { ...mockRequest, token: '   ' }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      await deleteInlineComment(requestWithEmptyToken)

      expect(mockBuildHeaders).toHaveBeenCalledWith(undefined)
    })
  })

  describe('error handling', () => {
    it('should throw error for 404 Not Found response', async () => {
      const errorMessage = 'Not Found'
      mockGetGithubError.mockResolvedValue(errorMessage)
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response)

      await expect(deleteInlineComment(mockRequest)).rejects.toThrow('GitHub API error (404): Not Found')

      expect(mockGetGithubError).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          status: 404,
        }),
      )
    })

    it('should throw error for 403 Forbidden response', async () => {
      const errorMessage = 'Forbidden'
      mockGetGithubError.mockResolvedValue(errorMessage)
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      } as Response)

      await expect(deleteInlineComment(mockRequest)).rejects.toThrow('GitHub API error (403): Forbidden')

      expect(mockGetGithubError).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          status: 403,
        }),
      )
    })

    it('should throw error for 500 Internal Server Error response', async () => {
      const errorMessage = 'Internal Server Error'
      mockGetGithubError.mockResolvedValue(errorMessage)
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      await expect(deleteInlineComment(mockRequest)).rejects.toThrow('GitHub API error (500): Internal Server Error')
    })

    it('should handle network errors', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(deleteInlineComment(mockRequest)).rejects.toThrow('Network error')
    })
  })

  describe('URL construction', () => {
    it('should construct correct URL with different repository details', async () => {
      const customRequest: DeleteInlineCommentRequest = {
        prKey: {
          owner: 'microsoft',
          repo: 'vscode',
          pullNumber: 54321,
        },
        commentId: 111222333,
        token: 'custom_token',
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      await deleteInlineComment(customRequest)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${GITHUB_API_HOST}/repos/microsoft/vscode/pulls/comments/111222333`,
        expect.objectContaining({
          method: 'DELETE',
        }),
      )
    })
  })

  describe('integration with githubRequest wrapper', () => {
    it('should pass correct parameters to githubRequest', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      await deleteInlineComment(mockRequest)

      expect(mockGithubRequest).toHaveBeenCalledWith(mockRequest, expect.any(Function), {
        requestType: 'delete-inline-comment',
      })
    })

    it('should use the fetcher function provided to githubRequest', async () => {
      let capturedFetcher: ((params: DeleteInlineCommentRequest) => Promise<void>) | undefined
      mockGithubRequest.mockImplementationOnce(async (params: DeleteInlineCommentRequest, fetcher) => {
        capturedFetcher = fetcher as (params: DeleteInlineCommentRequest) => Promise<void>
        return await capturedFetcher(params)
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      await deleteInlineComment(mockRequest)

      expect(capturedFetcher).toBeDefined()
      expect(typeof capturedFetcher).toBe('function')
    })
  })
})
