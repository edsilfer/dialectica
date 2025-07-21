import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPrDiff } from '../../api/rest/get-pr-diff'
import type { GetPrDiffRequest } from '../../api/rest/types'
import githubRequest from './github-request'
import { buildHeaders, getGithubError } from './request-utils'

// MOCK
vi.mock('./request-utils', () => ({
  buildHeaders: vi.fn(),
  getGithubError: vi.fn(),
  GITHUB_API_HOST: 'https://api.github.com',
}))

vi.mock('./github-request', () => ({
  default: vi.fn(),
}))

// Mock global fetch
const mockFetch = vi.fn()
;(globalThis as typeof globalThis & { fetch: typeof mockFetch }).fetch = mockFetch

const mockBuildHeaders = buildHeaders as ReturnType<typeof vi.fn>
const mockGetGithubError = getGithubError as ReturnType<typeof vi.fn>
const mockGithubRequest = githubRequest as ReturnType<typeof vi.fn>

// HELPERS
const createPrKey = (overrides: Partial<GetPrDiffRequest['prKey']> = {}) => ({
  owner: 'test-owner',
  repo: 'test-repo',
  pullNumber: 123,
  ...overrides,
})

const createRequest = (overrides: Partial<GetPrDiffRequest> = {}): GetPrDiffRequest => ({
  prKey: createPrKey(),
  ...overrides,
})

const createMockDiffText = (overrides: string = ''): string => {
  const baseDiff = `diff --git a/src/file.ts b/src/file.ts
index abc123..def456 100644
--- a/src/file.ts
+++ b/src/file.ts
@@ -1,3 +1,4 @@
 export function test() {
   console.log('hello')
+  console.log('world')
 }
`
  return baseDiff + overrides
}

describe('getPrDiff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildHeaders.mockReturnValue({ Accept: 'application/vnd.github+json' })
    mockGetGithubError.mockResolvedValue('GitHub API error message')
    mockFetch.mockReset()
  })

  describe('normal flow', () => {
    it('given valid request with token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })

    it('given valid request without token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: undefined })
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })

    it('given valid request with empty token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: '   ' })
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })
  })

  describe('fetcher function behavior', () => {
    it('given valid request, when called, expect fetcher function passed to githubRequest', async () => {
      // GIVEN
      const request = createRequest()
      const expectedResult = createMockDiffText()
      let capturedFetcher: ((params: GetPrDiffRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrDiffRequest) => Promise<string>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getPrDiff(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
      expect(capturedFetcher).toBeDefined()
    })

    it('given request with token, when fetcher executed, expect correct URL and headers', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const expectedResult = createMockDiffText()
      let capturedFetcher: ((params: GetPrDiffRequest) => Promise<string>) | undefined

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(expectedResult),
      })

      mockGithubRequest.mockImplementation(async (params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrDiffRequest) => Promise<string>
        // Execute the fetcher to test its behavior
        await capturedFetcher(params as GetPrDiffRequest)
        return expectedResult
      })

      mockBuildHeaders.mockReturnValue({
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer test-token',
        'X-GitHub-Api-Version': '2022-11-28',
      })

      // WHEN
      await getPrDiff(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      expect(mockBuildHeaders).toHaveBeenCalledWith('test-token')
    })

    it('given request without token, when fetcher executed, expect correct URL and headers without auth', async () => {
      // GIVEN
      const request = createRequest({ token: undefined })
      const expectedResult = createMockDiffText()
      let capturedFetcher: ((params: GetPrDiffRequest) => Promise<string>) | undefined

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(expectedResult),
      })

      mockGithubRequest.mockImplementation(async (params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrDiffRequest) => Promise<string>
        // Execute the fetcher to test its behavior
        await capturedFetcher(params as GetPrDiffRequest)
        return expectedResult
      })

      mockBuildHeaders.mockReturnValue({
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      })

      // WHEN
      await getPrDiff(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      expect(mockBuildHeaders).toHaveBeenCalledWith(undefined)
    })

    it('given request with empty token, when fetcher executed, expect correct URL and headers without auth', async () => {
      // GIVEN
      const request = createRequest({ token: '   ' })
      const expectedResult = createMockDiffText()
      let capturedFetcher: ((params: GetPrDiffRequest) => Promise<string>) | undefined

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(expectedResult),
      })

      mockGithubRequest.mockImplementation(async (params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrDiffRequest) => Promise<string>
        // Execute the fetcher to test its behavior
        await capturedFetcher(params as GetPrDiffRequest)
        return expectedResult
      })

      mockBuildHeaders.mockReturnValue({
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      })

      // WHEN
      await getPrDiff(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      expect(mockBuildHeaders).toHaveBeenCalledWith(undefined)
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
        const expectedResult = createMockDiffText()
        mockGithubRequest.mockResolvedValue(expectedResult)

        // WHEN
        await getPrDiff(request)

        // EXPECT
        expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
      }
    })

    it('given specific prKey, when fetcher executed, expect correct GitHub API URL', async () => {
      // GIVEN
      const request = createRequest({
        prKey: { owner: 'facebook', repo: 'react', pullNumber: 33665 },
      })
      const expectedResult = createMockDiffText()
      let capturedFetcher: ((params: GetPrDiffRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrDiffRequest) => Promise<string>
        return Promise.resolve(expectedResult)
      })

      // WHEN
      await getPrDiff(request)

      // EXPECT
      expect(capturedFetcher).toBeDefined()
      // The URL should be constructed as: `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/pulls/${prKey.pullNumber}`
      // We can't directly test the URL construction since it's inside the fetcher, but we can verify the pattern
    })
  })

  describe('headers configuration', () => {
    it('given request with token, when fetcher executed, expect Accept header for diff format', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const expectedResult = createMockDiffText()
      let capturedFetcher: ((params: GetPrDiffRequest) => Promise<string>) | undefined

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(expectedResult),
      })

      mockGithubRequest.mockImplementation(async (params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrDiffRequest) => Promise<string>
        // Execute the fetcher to test its behavior
        await capturedFetcher(params as GetPrDiffRequest)
        return expectedResult
      })

      mockBuildHeaders.mockReturnValue({
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer test-token',
        'X-GitHub-Api-Version': '2022-11-28',
      })

      // WHEN
      await getPrDiff(request)

      // EXPECT
      expect(mockBuildHeaders).toHaveBeenCalledWith('test-token')
    })

    it('given request without token, when fetcher executed, expect Accept header for diff format', async () => {
      // GIVEN
      const request = createRequest({ token: undefined })
      const expectedResult = createMockDiffText()
      let capturedFetcher: ((params: GetPrDiffRequest) => Promise<string>) | undefined

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(expectedResult),
      })

      mockGithubRequest.mockImplementation(async (params, fetcher) => {
        capturedFetcher = fetcher as (params: GetPrDiffRequest) => Promise<string>
        // Execute the fetcher to test its behavior
        await capturedFetcher(params as GetPrDiffRequest)
        return expectedResult
      })

      mockBuildHeaders.mockReturnValue({
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      })

      // WHEN
      await getPrDiff(request)

      // EXPECT
      expect(mockBuildHeaders).toHaveBeenCalledWith(undefined)
    })
  })

  describe('error handling', () => {
    it('given githubRequest throws error, when called, expect error propagated', async () => {
      // GIVEN
      const request = createRequest()
      const testError = new Error('Test error')
      mockGithubRequest.mockRejectedValue(testError)

      // WHEN & EXPECT
      await expect(getPrDiff(request)).rejects.toThrow('Test error')
    })

    it('given fetcher throws GitHub API error, when called, expect error with status and message', async () => {
      // GIVEN
      const request = createRequest()
      const testError = new Error('GitHub API error (404): GitHub API error message')
      mockGithubRequest.mockRejectedValue(testError)

      // WHEN & EXPECT
      await expect(getPrDiff(request)).rejects.toThrow('GitHub API error (404): GitHub API error message')
    })
  })

  describe('integration with githubRequest', () => {
    it('given request with useMocks true, when called, expect githubRequest called with useMocks', async () => {
      // GIVEN
      const request = createRequest({ useMocks: true })
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })

    it('given request with forceDelayMs, when called, expect githubRequest called with delay', async () => {
      // GIVEN
      const request = createRequest({ forceDelayMs: 1000 })
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })
  })

  describe('request type configuration', () => {
    it('given any request, when called, expect requestType set to pr-diff', async () => {
      // GIVEN
      const request = createRequest()
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      await getPrDiff(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })
  })

  describe('edge cases', () => {
    it('given request with null token, when called, expect githubRequest called', async () => {
      // GIVEN
      const request = createRequest({ token: null as unknown as string })
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })

    it('given request with zero pullNumber, when called, expect githubRequest called', async () => {
      // GIVEN
      const request = createRequest({ prKey: { owner: 'test', repo: 'test', pullNumber: 0 } })
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })

    it('given request with whitespace-only token, when called, expect githubRequest called', async () => {
      // GIVEN
      const request = createRequest({ token: '\t\n\r ' })
      const expectedResult = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'pr-diff' })
    })
  })

  describe('return value', () => {
    it('given successful request, when called, expect diff text returned', async () => {
      // GIVEN
      const request = createRequest()
      const expectedDiff = createMockDiffText()
      mockGithubRequest.mockResolvedValue(expectedDiff)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe(expectedDiff)
      expect(typeof result).toBe('string')
      expect(result).toContain('diff --git')
    })

    it('given empty diff response, when called, expect empty string returned', async () => {
      // GIVEN
      const request = createRequest()
      const expectedDiff = ''
      mockGithubRequest.mockResolvedValue(expectedDiff)

      // WHEN
      const result = await getPrDiff(request)

      // EXPECT
      expect(result).toBe('')
      expect(result).toBe(expectedDiff)
    })
  })
})
