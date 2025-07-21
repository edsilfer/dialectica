import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFileContent } from '../../api/rest/get-file-content'
import githubRequest from '../../api/rest/github-request'
import { buildHeaders, decodeBase64, getGithubError } from '../../api/rest/request-utils'
import type { GetFileContentRequest, GitHubFileContentResponse } from '../../api/rest/types'

const mockBuildHeaders = buildHeaders as ReturnType<typeof vi.fn>
const mockDecodeBase64 = decodeBase64 as ReturnType<typeof vi.fn>
const mockGetGithubError = getGithubError as ReturnType<typeof vi.fn>
const mockGithubRequest = githubRequest as ReturnType<typeof vi.fn>

// MOCK
vi.mock('./request-utils', () => ({
  buildHeaders: vi.fn(),
  decodeBase64: vi.fn(),
  getGithubError: vi.fn(),
  GITHUB_API_HOST: 'https://api.github.com',
}))

vi.mock('./github-request', () => ({
  default: vi.fn(),
}))

// HELPERS
const createPrKey = (overrides: Partial<GetFileContentRequest['prKey']> = {}) => ({
  owner: 'test-owner',
  repo: 'test-repo',
  pullNumber: 123,
  ...overrides,
})

const createRequest = (overrides: Partial<GetFileContentRequest> = {}): GetFileContentRequest => ({
  prKey: createPrKey(),
  filePath: 'src/components/Button.tsx',
  sha: 'abc123def456',
  ...overrides,
})

const createMockFileContentResponse = (
  overrides: Partial<GitHubFileContentResponse> = {},
): GitHubFileContentResponse => ({
  content: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
  encoding: 'base64',
  size: 11,
  name: 'Button.tsx',
  path: 'src/components/Button.tsx',
  sha: 'abc123def456',
  url: 'https://api.github.com/repos/test-owner/test-repo/contents/src/components/Button.tsx',
  git_url: 'https://api.github.com/repos/test-owner/test-repo/git/blobs/abc123def456',
  html_url: 'https://github.com/test-owner/test-repo/blob/main/src/components/Button.tsx',
  download_url: 'https://raw.githubusercontent.com/test-owner/test-repo/main/src/components/Button.tsx',
  type: 'file',
  ...overrides,
})

describe('getFileContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildHeaders.mockReturnValue({ Accept: 'application/vnd.github+json' })
    mockDecodeBase64.mockReturnValue('Hello World')
    mockGetGithubError.mockResolvedValue('GitHub API error message')
  })

  describe('normal flow', () => {
    it('given valid request with token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const expectedResult = 'Hello World'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })

    it('given valid request without token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: undefined })
      const expectedResult = 'Hello World'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })

    it('given valid request with empty token, when called, expect githubRequest called with correct parameters', async () => {
      // GIVEN
      const request = createRequest({ token: '   ' })
      const expectedResult = 'Hello World'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })
  })

  describe('fetcher function behavior', () => {
    it('given valid request, when fetcher called, expect correct URL constructed and content decoded', async () => {
      // GIVEN
      const request = createRequest()
      const mockResponse = createMockFileContentResponse()
      const expectedContent = 'Hello World'
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve(expectedContent)
      })

      // Mock fetch to return successful response
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      // WHEN
      await getFileContent(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
      expect(capturedFetcher).toBeDefined()
    })

    it('given request with special characters in filePath, when fetcher called, expect URL properly encoded', async () => {
      // GIVEN
      const request = createRequest({ filePath: 'src/components/My Component.tsx' })
      const mockResponse = createMockFileContentResponse()
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('Hello World')
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      // WHEN
      await getFileContent(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
      expect(capturedFetcher).toBeDefined()
    })

    it('given request with token, when fetcher called, expect headers built with token', async () => {
      // GIVEN
      const request = createRequest({ token: 'test-token' })
      const mockResponse = createMockFileContentResponse()
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('Hello World')
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      // WHEN
      await getFileContent(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
      expect(capturedFetcher).toBeDefined()
    })
  })

  describe('parameter validation', () => {
    it('given request without filePath, when fetcher called, expect error thrown', async () => {
      // GIVEN
      const request = createRequest({ filePath: '' })
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('Hello World')
      })

      // WHEN & EXPECT
      await getFileContent(request)
      expect(capturedFetcher).toBeDefined()

      // The actual validation happens in the fetcher function
      await expect(capturedFetcher!(request)).rejects.toThrow('filePath and sha are required')
    })

    it('given request without sha, when fetcher called, expect error thrown', async () => {
      // GIVEN
      const request = createRequest({ sha: '' })
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('Hello World')
      })

      // WHEN & EXPECT
      await getFileContent(request)
      expect(capturedFetcher).toBeDefined()

      await expect(capturedFetcher!(request)).rejects.toThrow('filePath and sha are required')
    })

    it('given request with null filePath, when fetcher called, expect error thrown', async () => {
      // GIVEN
      const request = createRequest({ filePath: null as unknown as string })
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('Hello World')
      })

      // WHEN & EXPECT
      await getFileContent(request)
      expect(capturedFetcher).toBeDefined()

      await expect(capturedFetcher!(request)).rejects.toThrow('filePath and sha are required')
    })

    it('given request with null sha, when fetcher called, expect error thrown', async () => {
      // GIVEN
      const request = createRequest({ sha: null as unknown as string })
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('Hello World')
      })

      // WHEN & EXPECT
      await getFileContent(request)
      expect(capturedFetcher).toBeDefined()

      await expect(capturedFetcher!(request)).rejects.toThrow('filePath and sha are required')
    })
  })

  describe('error handling', () => {
    it('given githubRequest throws error, when called, expect error propagated', async () => {
      // GIVEN
      const request = createRequest()
      const testError = new Error('Test error')
      mockGithubRequest.mockRejectedValue(testError)

      // WHEN & EXPECT
      await expect(getFileContent(request)).rejects.toThrow('Test error')
    })

    it('given 404 response, when fetcher called, expect empty string returned', async () => {
      // GIVEN
      const request = createRequest()
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('')
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response)

      // WHEN
      await getFileContent(request)
      const result = await capturedFetcher!(request)

      // EXPECT
      expect(result).toBe('')
    })

    it('given non-404 error response, when fetcher called, expect error thrown with GitHub error message', async () => {
      // GIVEN
      const request = createRequest()
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('')
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response)

      mockGetGithubError.mockResolvedValue('Access denied')

      // WHEN & EXPECT
      await getFileContent(request)
      await expect(capturedFetcher!(request)).rejects.toThrow('Access denied')
    })

    it('given network error, when fetcher called, expect error propagated', async () => {
      // GIVEN
      const request = createRequest()
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('')
      })

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      // WHEN & EXPECT
      await getFileContent(request)
      await expect(capturedFetcher!(request)).rejects.toThrow('Network error')
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
        const mockResponse = createMockFileContentResponse()
        let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

        mockGithubRequest.mockImplementation((params, fetcher) => {
          capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
          return Promise.resolve('Hello World')
        })

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)

        // WHEN
        await getFileContent(request)

        // EXPECT
        expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
        expect(capturedFetcher).toBeDefined()
      }
    })

    it('given different file paths, when fetcher called, expect correct URL constructed', async () => {
      // GIVEN
      const testCases = ['src/components/Button.tsx', 'package.json', 'docs/README.md', 'src/utils/helpers/index.ts']

      for (const filePath of testCases) {
        const request = createRequest({ filePath })
        const mockResponse = createMockFileContentResponse()
        let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

        mockGithubRequest.mockImplementation((params, fetcher) => {
          capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
          return Promise.resolve('Hello World')
        })

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)

        // WHEN
        await getFileContent(request)

        // EXPECT
        expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
        expect(capturedFetcher).toBeDefined()
      }
    })

    it('given different SHA values, when fetcher called, expect correct URL constructed', async () => {
      // GIVEN
      const testCases = ['abc123def456', 'main', 'feature-branch', 'v1.0.0']

      for (const sha of testCases) {
        const request = createRequest({ sha })
        const mockResponse = createMockFileContentResponse()
        let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

        mockGithubRequest.mockImplementation((params, fetcher) => {
          capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
          return Promise.resolve('Hello World')
        })

        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)

        // WHEN
        await getFileContent(request)

        // EXPECT
        expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
        expect(capturedFetcher).toBeDefined()
      }
    })
  })

  describe('content decoding', () => {
    it('given successful response, when fetcher called, expect content decoded from base64', async () => {
      // GIVEN
      const request = createRequest()
      const mockResponse = createMockFileContentResponse({ content: 'SGVsbG8gV29ybGQ=' })
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('Hello World')
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      mockDecodeBase64.mockReturnValue('Hello World')

      // WHEN
      await getFileContent(request)
      const result = await capturedFetcher!(request)

      // EXPECT
      expect(mockDecodeBase64).toHaveBeenCalledWith('SGVsbG8gV29ybGQ=')
      expect(result).toBe('Hello World')
    })

    it('given response with different content, when fetcher called, expect correct content decoded', async () => {
      // GIVEN
      const request = createRequest()
      const mockResponse = createMockFileContentResponse({ content: 'VGVzdCBDb250ZW50' })
      let capturedFetcher: ((params: GetFileContentRequest) => Promise<string>) | undefined

      mockGithubRequest.mockImplementation((params, fetcher) => {
        capturedFetcher = fetcher as (params: GetFileContentRequest) => Promise<string>
        return Promise.resolve('Test Content')
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      mockDecodeBase64.mockReturnValue('Test Content')

      // WHEN
      await getFileContent(request)
      const result = await capturedFetcher!(request)

      // EXPECT
      expect(mockDecodeBase64).toHaveBeenCalledWith('VGVzdCBDb250ZW50')
      expect(result).toBe('Test Content')
    })
  })

  describe('integration with githubRequest', () => {
    it('given request with useMocks true, when called, expect githubRequest called with useMocks', async () => {
      // GIVEN
      const request = createRequest({ useMocks: true })
      const expectedResult = 'Mocked content'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })

    it('given request with forceDelayMs, when called, expect githubRequest called with delay', async () => {
      // GIVEN
      const request = createRequest({ forceDelayMs: 1000 })
      const expectedResult = 'Delayed content'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })
  })

  describe('request type configuration', () => {
    it('given any request, when called, expect requestType set to file-content', async () => {
      // GIVEN
      const request = createRequest()
      const expectedResult = 'Hello World'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      await getFileContent(request)

      // EXPECT
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })
  })

  describe('edge cases', () => {
    it('given request with null token, when called, expect githubRequest called', async () => {
      // GIVEN
      const request = createRequest({ token: null as unknown as string })
      const expectedResult = 'Hello World'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })

    it('given request with zero pullNumber, when called, expect githubRequest called', async () => {
      // GIVEN
      const request = createRequest({ prKey: { owner: 'test', repo: 'test', pullNumber: 0 } })
      const expectedResult = 'Hello World'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })

    it('given request with very long filePath, when called, expect githubRequest called', async () => {
      // GIVEN
      const longPath = 'src/very/deep/nested/directory/structure/with/many/levels/and/a/very/long/filename.ts'
      const request = createRequest({ filePath: longPath })
      const expectedResult = 'Hello World'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })

    it('given request with special characters in SHA, when called, expect githubRequest called', async () => {
      // GIVEN
      const request = createRequest({ sha: 'abc123-def456_ghi789' })
      const expectedResult = 'Hello World'
      mockGithubRequest.mockResolvedValue(expectedResult)

      // WHEN
      const result = await getFileContent(request)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(request, expect.any(Function), { requestType: 'file-content' })
    })
  })
})
