import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fixtureRegistry } from '../../__fixtures__/fixture-registry'
import { githubRequest, type GithubRequestFetcher } from './github-request'
import type { BaseGitHubRequest } from './types'

// MOCK
vi.mock('../../__fixtures__/fixture-registry', () => ({
  fixtureRegistry: {
    getFixture: vi.fn(),
  },
}))

const mockFixtureRegistry = fixtureRegistry as typeof fixtureRegistry & {
  getFixture: ReturnType<typeof vi.fn>
}

// HELPERS
const createBaseRequest = (overrides: Partial<BaseGitHubRequest> = {}): BaseGitHubRequest => ({
  prKey: {
    owner: 'test-owner',
    repo: 'test-repo',
    pullNumber: 123,
  },
  ...overrides,
})

const createMockFetcher = <T>(returnValue: T): GithubRequestFetcher<BaseGitHubRequest, T> => {
  return vi.fn().mockResolvedValue(returnValue)
}

const createMockFetcherThatThrows = (error: Error): GithubRequestFetcher<BaseGitHubRequest, unknown> => {
  return vi.fn().mockRejectedValue(error)
}

describe('githubRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parameter validation', () => {
    const validationTestCases = [
      {
        description: 'missing owner',
        request: createBaseRequest({ prKey: { owner: '', repo: 'test-repo', pullNumber: 123 } }),
        shouldThrow: true,
      },
      {
        description: 'missing repo',
        request: createBaseRequest({ prKey: { owner: 'test-owner', repo: '', pullNumber: 123 } }),
        shouldThrow: true,
      },
      {
        description: 'missing pullNumber',
        request: createBaseRequest({ prKey: { owner: 'test-owner', repo: 'test-repo', pullNumber: 0 } }),
        shouldThrow: true,
      },
      {
        description: 'valid parameters',
        request: createBaseRequest(),
        shouldThrow: false,
      },
    ]

    validationTestCases.forEach(({ description, request, shouldThrow }) => {
      it(`given ${description}, when githubRequest called, expect ${shouldThrow ? 'error thrown' : 'no error'}`, async () => {
        // GIVEN
        const mockFetcher = createMockFetcher('success')

        // WHEN & EXPECT
        if (shouldThrow) {
          await expect(githubRequest(request, mockFetcher)).rejects.toThrow('owner, repo and pullNumber are required')
        } else {
          await expect(githubRequest(request, mockFetcher)).resolves.toBe('success')
        }
      })
    })

    it('given useMocks true, when validation fails, expect no error thrown', async () => {
      // GIVEN
      const invalidRequest = createBaseRequest({
        useMocks: true,
        prKey: { owner: '', repo: '', pullNumber: 0 },
      })
      const mockFetcher = createMockFetcher('success')

      // WHEN
      const result = await githubRequest(invalidRequest, mockFetcher)

      // EXPECT
      expect(result).toBe('success')
    })
  })

  describe('mock data resolution', () => {
    it('given useMocks true with requestType, when fixture exists, expect fixture returned', async () => {
      // GIVEN
      const mockData = { test: 'data' }
      mockFixtureRegistry.getFixture.mockReturnValue(mockData)
      const request = createBaseRequest({ useMocks: true })
      const mockFetcher = createMockFetcher('should not be called')

      // WHEN
      const result = await githubRequest(request, mockFetcher, { requestType: 'test-type' })

      // EXPECT
      expect(result).toBe(mockData)
      expect(mockFixtureRegistry.getFixture).toHaveBeenCalledWith({
        type: 'test-type',
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: 123,
      })
      expect(mockFetcher).not.toHaveBeenCalled()
    })

    it('given useMocks true with requestType, when fixture does not exist, expect fetcher called', async () => {
      // GIVEN
      mockFixtureRegistry.getFixture.mockReturnValue(undefined)
      const request = createBaseRequest({ useMocks: true })
      const mockFetcher = createMockFetcher('fetcher result')

      // WHEN
      const result = await githubRequest(request, mockFetcher, { requestType: 'test-type' })

      // EXPECT
      expect(result).toBe('fetcher result')
      expect(mockFixtureRegistry.getFixture).toHaveBeenCalled()
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })

    it('given useMocks true without requestType, when called, expect fetcher called', async () => {
      // GIVEN
      const request = createBaseRequest({ useMocks: true })
      const mockFetcher = createMockFetcher('fetcher result')

      // WHEN
      const result = await githubRequest(request, mockFetcher)

      // EXPECT
      expect(result).toBe('fetcher result')
      expect(mockFixtureRegistry.getFixture).not.toHaveBeenCalled()
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })

    it('given useMocks false, when called, expect fetcher called', async () => {
      // GIVEN
      const request = createBaseRequest({ useMocks: false })
      const mockFetcher = createMockFetcher('fetcher result')

      // WHEN
      const result = await githubRequest(request, mockFetcher, { requestType: 'test-type' })

      // EXPECT
      expect(result).toBe('fetcher result')
      expect(mockFixtureRegistry.getFixture).not.toHaveBeenCalled()
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })
  })

  describe('artificial delay handling', () => {
    it('given forceDelayMs set, when mock data returned, expect delay applied', async () => {
      // GIVEN
      const mockData = { test: 'data' }
      mockFixtureRegistry.getFixture.mockReturnValue(mockData)
      const request = createBaseRequest({ useMocks: true, forceDelayMs: 10 })
      const mockFetcher = createMockFetcher('should not be called')

      // WHEN
      const result = await githubRequest(request, mockFetcher, { requestType: 'test-type' })

      // EXPECT
      expect(result).toBe(mockData)
      expect(mockFixtureRegistry.getFixture).toHaveBeenCalledWith({
        type: 'test-type',
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: 123,
      })
      expect(mockFetcher).not.toHaveBeenCalled()
    })

    it('given forceDelayMs set, when fetcher called, expect delay applied after fetcher', async () => {
      // GIVEN
      mockFixtureRegistry.getFixture.mockReturnValue(undefined)
      const request = createBaseRequest({ useMocks: true, forceDelayMs: 10 })
      const mockFetcher = createMockFetcher('fetcher result')

      // WHEN
      const result = await githubRequest(request, mockFetcher, { requestType: 'test-type' })

      // EXPECT
      expect(result).toBe('fetcher result')
      expect(mockFixtureRegistry.getFixture).toHaveBeenCalled()
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })

    it('given forceDelayMs zero, when called, expect no delay applied', async () => {
      // GIVEN
      const request = createBaseRequest({ forceDelayMs: 0 })
      const mockFetcher = createMockFetcher('fetcher result')

      // WHEN
      const result = await githubRequest(request, mockFetcher)

      // EXPECT
      expect(result).toBe('fetcher result')
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })

    it('given forceDelayMs undefined, when called, expect no delay applied', async () => {
      // GIVEN
      const request = createBaseRequest({ forceDelayMs: undefined })
      const mockFetcher = createMockFetcher('fetcher result')

      // WHEN
      const result = await githubRequest(request, mockFetcher)

      // EXPECT
      expect(result).toBe('fetcher result')
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })
  })

  describe('fetcher error handling', () => {
    it('given fetcher throws error, when called, expect error propagated', async () => {
      // GIVEN
      const testError = new Error('Test error')
      const request = createBaseRequest()
      const mockFetcher = createMockFetcherThatThrows(testError)

      // WHEN & EXPECT
      await expect(githubRequest(request, mockFetcher)).rejects.toThrow('Test error')
    })

    it('given fetcher throws error with delay, when called, expect error propagated after delay', async () => {
      // GIVEN
      const testError = new Error('Test error')
      const request = createBaseRequest({ forceDelayMs: 10 })
      const mockFetcher = createMockFetcherThatThrows(testError)

      // WHEN & EXPECT
      await expect(githubRequest(request, mockFetcher)).rejects.toThrow('Test error')
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })
  })

  describe('integration scenarios', () => {
    it('given complete mock scenario, when called, expect proper flow', async () => {
      // GIVEN
      const mockData = { pr: { title: 'Test PR' } }
      mockFixtureRegistry.getFixture.mockReturnValue(mockData)
      const request = createBaseRequest({
        useMocks: true,
        forceDelayMs: 10,
        token: 'test-token',
      })
      const mockFetcher = createMockFetcher('should not be called')

      // WHEN
      const result = await githubRequest(request, mockFetcher, { requestType: 'pr-metadata' })

      // EXPECT
      expect(result).toBe(mockData)
      expect(mockFixtureRegistry.getFixture).toHaveBeenCalledWith({
        type: 'pr-metadata',
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: 123,
      })
      expect(mockFetcher).not.toHaveBeenCalled()
    })

    it('given complete real API scenario, when called, expect proper flow', async () => {
      // GIVEN
      const apiResponse = { data: 'api result' }
      const request = createBaseRequest({
        useMocks: false,
        forceDelayMs: 10,
        token: 'real-token',
      })
      const mockFetcher = createMockFetcher(apiResponse)

      // WHEN
      const result = await githubRequest(request, mockFetcher, { requestType: 'pr-diff' })

      // EXPECT
      expect(result).toBe(apiResponse)
      expect(mockFixtureRegistry.getFixture).not.toHaveBeenCalled()
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })
  })

  describe('type safety', () => {
    it('given typed request and response, when called, expect proper typing', async () => {
      // GIVEN
      interface TestRequest extends BaseGitHubRequest {
        customField: string
      }

      interface TestResponse {
        id: number
        name: string
      }

      const request: TestRequest = {
        ...createBaseRequest(),
        customField: 'test-value',
      }

      const expectedResponse: TestResponse = { id: 1, name: 'test' }
      const mockFetcher: GithubRequestFetcher<TestRequest, TestResponse> = createMockFetcher(expectedResponse)

      // WHEN
      const result = await githubRequest(request, mockFetcher)

      // EXPECT
      expect(result).toEqual(expectedResponse)
      expect(mockFetcher).toHaveBeenCalledWith(request)
    })
  })
})
