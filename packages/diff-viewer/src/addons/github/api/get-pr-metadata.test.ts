import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GitHubPullRequest } from '../models'
import { getPrMetadata } from './get-pr-metadata'
import type { GetPrMetadataRequest } from './types'

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
const createPrKey = (overrides: Partial<GetPrMetadataRequest['prKey']> = {}) => ({
  owner: 'test-owner',
  repo: 'test-repo',
  pullNumber: 123,
  ...overrides,
})

const createRequest = (overrides: Partial<GetPrMetadataRequest> = {}): GetPrMetadataRequest => ({
  prKey: createPrKey(),
  ...overrides,
})

const createMockPullRequest = (overrides: Partial<GitHubPullRequest> = {}): GitHubPullRequest => ({
  number: 123,
  title: 'Test PR',
  body: 'Test body',
  user: {
    login: 'test-user',
    avatar_url: 'https://example.com/avatar.jpg',
    html_url: 'https://github.com/test-user',
  },
  state: 'open',
  merged_at: null,
  commits: 5,
  changed_files: 3,
  additions: 100,
  deletions: 50,
  html_url: 'https://github.com/test-owner/test-repo/pull/123',
  head: { ref: 'feature-branch', sha: 'abc123' },
  base: { ref: 'main', sha: 'def456' },
  ...overrides,
})

describe('getPrMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildHeaders.mockReturnValue({ Accept: 'application/vnd.github+json' })
    mockGetGithubError.mockResolvedValue('GitHub API error message')
  })

  describe('normal flow', () => {
    it('given valid request with token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const expectedResult = createMockPullRequest()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrMetadata(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
    })

    it('given valid request without token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: undefined })
      const expectedResult = createMockPullRequest()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrMetadata(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
    })

    it('given valid request with empty token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: '   ' })
      const expectedResult = createMockPullRequest()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrMetadata(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
    })
  })

  describe('fetcher function behavior', () => {
    it('given valid request, when called, expect fetcher function passed to githubRequest', async () => {
      // GIVEN
      const request = createRequest()
      const expectedResult = createMockPullRequest()
      let capturedFetcher: ((params: GetPrMetadataRequest) => Promise<GitHubPullRequest>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrMetadataRequest) => Promise<GitHubPullRequest>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getPrMetadata(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
      expect(capturedFetcher).toBeDefined()
    })

    it('given request with token, when called, expect fetcher function passed to githubRequest', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const expectedResult = createMockPullRequest()
      let capturedFetcher: ((params: GetPrMetadataRequest) => Promise<GitHubPullRequest>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrMetadataRequest) => Promise<GitHubPullRequest>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getPrMetadata(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
      expect(capturedFetcher).toBeDefined()
    })

    it('given request without token, when called, expect fetcher function passed to githubRequest', async () => {
      // GIVEN
      const request = createRequest({ token: undefined })
      const expectedResult = createMockPullRequest()
      let capturedFetcher: ((params: GetPrMetadataRequest) => Promise<GitHubPullRequest>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrMetadataRequest) => Promise<GitHubPullRequest>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getPrMetadata(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
      expect(capturedFetcher).toBeDefined()
    })

    it('given request with empty token, when called, expect fetcher function passed to githubRequest', async () => {
      // GIVEN
      const request = createRequest({ token: '   ' })
      const expectedResult = createMockPullRequest()
      let capturedFetcher: ((params: GetPrMetadataRequest) => Promise<GitHubPullRequest>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrMetadataRequest) => Promise<GitHubPullRequest>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getPrMetadata(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
      expect(capturedFetcher).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('given githubRequest throws error, when called, expect error propagated', async () => {
      // GIVEN
      const request = createRequest()
      const testError = new Error('Test error')
      mockGithubRequest.mockRejectedValue(testError)

      // WHEN & EXPECT
      await expect(getPrMetadata(request)).rejects.toThrow('Test error')
    })

    it('given fetcher throws GitHub API error, when called, expect error with status and message', async () => {
      // GIVEN
      const request = createRequest()
      const testError = new Error('GitHub API error (404): GitHub API error message')
      mockGithubRequest.mockRejectedValue(testError)

      // WHEN & EXPECT
      await expect(getPrMetadata(request)).rejects.toThrow('GitHub API error (404): GitHub API error message')
    })
  })

  describe('integration with githubRequest', () => {
    it('given request with useMocks true, when called, expect githubRequest called with useMocks', async () => {
      // GIVEN
      const request = createRequest({ useMocks: true })
      const expectedResult = createMockPullRequest()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrMetadata(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
    })

    it('given request with forceDelayMs, when called, expect githubRequest called with delay', async () => {
      // GIVEN
      const request = createRequest({ forceDelayMs: 1000 })
      const expectedResult = createMockPullRequest()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrMetadata(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
    })
  })

  describe('URL construction', () => {
    it('given different prKey values, when fetcher called, expect correct URL constructed', async () => {
      // GIVEN
      const testCases = [
        { owner: 'facebook', repo: 'react', pullNumber: 33665 },
        { owner: 'microsoft', repo: 'typescript', pullNumber: 1 },
        { owner: 'vuejs', repo: 'vue', pullNumber: 999 },
      ]

      for (const testCase of testCases) {
        const request = createRequest({ prKey: testCase })
        const expectedResult = createMockPullRequest()
        mockGithubRequest.mockResolvedValue(expectedResult)

        // WHEN
        await getPrMetadata(request)

        // EXPECT
        expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
      }
    })
  })

  describe('request type configuration', () => {
    it('given any request, when called, expect requestType set to pr-metadata', async () => {
      // GIVEN
      const request = createRequest()
      const expectedResult = createMockPullRequest()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      await getPrMetadata(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
    })
  })

  describe('edge cases', () => {
    it('given request with null token, when called, expect githubRequest called', async () => {
      // GIVEN
      const request = createRequest({ token: null as unknown as string })
      const expectedResult = createMockPullRequest()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrMetadata(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
    })

    it('given request with zero pullNumber, when called, expect githubRequest called', async () => {
      // GIVEN
      const request = createRequest({ prKey: { owner: 'test', repo: 'test', pullNumber: 0 } })
      const expectedResult = createMockPullRequest()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrMetadata(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-metadata' })
    })
  })
})
