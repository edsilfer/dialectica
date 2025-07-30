import { describe, expect, it, vi } from 'vitest'
import { GITHUB_API_HOST, GITHUB_API_VERSION, buildHeaders, getGithubError, decodeBase64 } from './request-utils'

describe('request-utils', () => {
  describe('constants', () => {
    it('given constants, when accessed, expect correct values', () => {
      // EXPECT
      expect(GITHUB_API_HOST).toBe('https://api.github.com')
      expect(GITHUB_API_VERSION).toBe('2022-11-28')
    })
  })

  describe('buildHeaders', () => {
    it('given no token, when building headers, expect headers without authorization', () => {
      // WHEN
      const headers = buildHeaders()

      // EXPECT
      expect(headers).toEqual({
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
      })
    })

    it('given token, when building headers, expect headers with authorization', () => {
      // GIVEN
      const token = 'ghp_test123'

      // WHEN
      const headers = buildHeaders(token)

      // EXPECT
      expect(headers).toEqual({
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ghp_test123',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
      })
    })

    it('given empty token, when building headers, expect headers without authorization', () => {
      // WHEN
      const headers = buildHeaders('')

      // EXPECT
      expect(headers).toEqual({
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
      })
    })
  })

  describe('getGithubError', () => {
    it('given response with message, when extracting error, expect message returned', async () => {
      // GIVEN
      const mockJson = vi.fn().mockResolvedValue({ message: 'Repository not found' })
      const mockResponse = {
        json: mockJson,
        statusText: 'Not Found',
      } as unknown as Response

      // WHEN
      const error = await getGithubError(mockResponse)

      // EXPECT
      expect(error).toBe('Repository not found')
      expect(mockJson).toHaveBeenCalledOnce()
    })

    it('given response without message, when extracting error, expect statusText returned', async () => {
      // GIVEN
      const mockResponse = {
        json: vi.fn().mockResolvedValue({}),
        statusText: 'Internal Server Error',
      } as unknown as Response

      // WHEN
      const error = await getGithubError(mockResponse)

      // EXPECT
      expect(error).toBe('Internal Server Error')
    })

    it('given response with null message, when extracting error, expect statusText returned', async () => {
      // GIVEN
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ message: null }),
        statusText: 'Bad Request',
      } as unknown as Response

      // WHEN
      const error = await getGithubError(mockResponse)

      // EXPECT
      expect(error).toBe('Bad Request')
    })

    it('given response with undefined message, when extracting error, expect statusText returned', async () => {
      // GIVEN
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ message: undefined }),
        statusText: 'Unauthorized',
      } as unknown as Response

      // WHEN
      const error = await getGithubError(mockResponse)

      // EXPECT
      expect(error).toBe('Unauthorized')
    })

    it('given response with json parsing error, when extracting error, expect statusText returned', async () => {
      // GIVEN
      const mockResponse = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        statusText: 'Bad Gateway',
      } as unknown as Response

      // WHEN
      const error = await getGithubError(mockResponse)

      // EXPECT
      expect(error).toBe('Bad Gateway')
    })
  })

  describe('decodeBase64', () => {
    it('given valid base64 string, when decoding, expect correct result', () => {
      // GIVEN
      const base64String = 'SGVsbG8gV29ybGQ=' // "Hello World"

      // WHEN
      const result = decodeBase64(base64String)

      // EXPECT
      expect(result).toBe('Hello World')
    })

    it('given base64 string with whitespace, when decoding, expect whitespace removed', () => {
      // GIVEN
      const base64WithWhitespace = 'SGVs bG8g V29y bGQ='

      // WHEN
      const result = decodeBase64(base64WithWhitespace)

      // EXPECT
      expect(result).toBe('Hello World')
    })

    it('given empty string, when decoding, expect empty result', () => {
      // WHEN
      const result = decodeBase64('')

      // EXPECT
      expect(result).toBe('')
    })

    it('given complex base64 string, when decoding, expect correct result', () => {
      // GIVEN
      const base64String = 'eyJuYW1lIjogIkpvaG4gRG9lIiwgImFnZSI6IDMwLCAiY2l0eSI6ICJOZXcgWW9yayJ9' // JSON object

      // WHEN
      const result = decodeBase64(base64String)

      // EXPECT
      expect(result).toBe('{"name": "John Doe", "age": 30, "city": "New York"}')
    })
  })
})
