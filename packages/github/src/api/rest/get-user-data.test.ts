import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GitHubUser } from '../models'
import { getUserData } from './get-user-data'
import { githubRequest } from './github-request'
import type { BaseRequest } from './types'

// MOCK
vi.mock('./request-utils', () => ({
  buildHeaders: vi.fn(() => ({ 'X-GitHub-Api-Version': '2022-11-28' })),
  getGithubError: vi.fn(() => Promise.resolve('Mocked error')),
  GITHUB_API_HOST: 'https://api.github.com',
}))

vi.mock('./github-request', () => ({
  githubRequest: vi.fn(),
}))

const mockGithubRequest = vi.mocked(githubRequest)

describe('getUserData', () => {
  const baseRequest: BaseRequest = {
    token: 'test-token',
  }

  const mockUserData: GitHubUser = {
    login: 'edsilfer',
    id: 12755321,
    node_id: 'MDQ6VXNlcjEyNzU1MzIx',
    avatar_url: 'https://avatars.githubusercontent.com/u/12755321?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/edsilfer',
    html_url: 'https://github.com/edsilfer',
    followers_url: 'https://api.github.com/users/edsilfer/followers',
    following_url: 'https://api.github.com/users/edsilfer/following{/other_user}',
    gists_url: 'https://api.github.com/users/edsilfer/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/edsilfer/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/edsilfer/subscriptions',
    organizations_url: 'https://api.github.com/users/edsilfer/orgs',
    repos_url: 'https://api.github.com/users/edsilfer/repos',
    events_url: 'https://api.github.com/users/edsilfer/events{/privacy}',
    received_events_url: 'https://api.github.com/users/edsilfer/received_events',
    type: 'User',
    user_view_type: 'public',
    site_admin: false,
    name: 'Edgar Fernandes',
    company: null,
    blog: 'https://br.linkedin.com/in/edsilfer',
    location: 'Amsterdam - Netherlands',
    email: null,
    notification_email: null,
    hireable: true,
    bio: 'Software Engineer',
    twitter_username: null,
    public_repos: 14,
    public_gists: 0,
    followers: 57,
    following: 23,
    created_at: '2015-06-05T00:47:26Z',
    updated_at: '2025-07-08T09:30:03Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGithubRequest.mockImplementation(async (params, fetcher) => fetcher(params))
  })

  describe('successful requests', () => {
    it('given valid token, when called, expect authenticated user data returned', async () => {
      // GIVEN
      mockGithubRequest.mockResolvedValueOnce(mockUserData)

      // WHEN
      const result = await getUserData(baseRequest)

      // EXPECT
      expect(result).toEqual(mockUserData)
      expect(mockGithubRequest).toHaveBeenCalledWith(baseRequest, expect.any(Function), { requestType: 'user-data' })
    })

    it('given request with forceDelayMs, when called, expect delay applied', async () => {
      // GIVEN
      const requestWithDelay: BaseRequest = {
        ...baseRequest,
        forceDelayMs: 100,
      }

      // Mock githubRequest to return immediately but apply the delay
      mockGithubRequest.mockImplementation(async (params, _) => {
        // Simulate the delay that githubRequest would apply
        if (params.forceDelayMs && params.forceDelayMs > 0) {
          await new Promise((res) => setTimeout(res, params.forceDelayMs))
        }
        return mockUserData
      })

      // WHEN
      const startTime = Date.now()
      await getUserData(requestWithDelay)
      const endTime = Date.now()

      // EXPECT
      expect(endTime - startTime).toBeGreaterThanOrEqual(90) // Allow some tolerance
    })

    it('given request with useMocks, when called, expect mock data handling', async () => {
      // GIVEN
      const requestWithMocks = {
        ...baseRequest,
        useMocks: true,
      }

      // Mock githubRequest to return mock data without calling fetcher
      mockGithubRequest.mockResolvedValueOnce(mockUserData)

      // WHEN
      const result = await getUserData(requestWithMocks)

      // EXPECT
      expect(result).toEqual(mockUserData)
      expect(mockGithubRequest).toHaveBeenCalledWith(requestWithMocks, expect.any(Function), {
        requestType: 'user-data',
      })
    })
  })

  describe('error scenarios', () => {
    it('given no token, when called, expect error thrown', async () => {
      // GIVEN
      const requestWithoutToken = {
        token: undefined,
      }

      // WHEN & EXPECT
      await expect(getUserData(requestWithoutToken)).rejects.toThrow(
        'Authentication token is required to fetch user data',
      )
    })

    it('given empty token, when called, expect error thrown', async () => {
      // GIVEN
      const requestWithEmptyToken = {
        token: '',
      }

      // WHEN & EXPECT
      await expect(getUserData(requestWithEmptyToken)).rejects.toThrow(
        'Authentication token is required to fetch user data',
      )
    })

    it('given whitespace-only token, when called, expect error thrown', async () => {
      // GIVEN
      const requestWithWhitespaceToken = {
        token: '   ',
      }

      // WHEN & EXPECT
      await expect(getUserData(requestWithWhitespaceToken)).rejects.toThrow(
        'Authentication token is required to fetch user data',
      )
    })

    it('given 401 response, when called, expect error thrown', async () => {
      // GIVEN
      mockGithubRequest.mockRejectedValueOnce(new Error('GitHub API error (401): Bad credentials'))

      // WHEN & EXPECT
      await expect(getUserData(baseRequest)).rejects.toThrow('GitHub API error (401): Bad credentials')
    })

    it('given 403 response, when called, expect error thrown', async () => {
      // GIVEN
      mockGithubRequest.mockRejectedValueOnce(new Error('GitHub API error (403): API rate limit exceeded'))

      // WHEN & EXPECT
      await expect(getUserData(baseRequest)).rejects.toThrow('GitHub API error (403): API rate limit exceeded')
    })

    it('given network error, when called, expect error thrown', async () => {
      // GIVEN
      mockGithubRequest.mockRejectedValueOnce(new Error('Network error'))

      // WHEN & EXPECT
      await expect(getUserData(baseRequest)).rejects.toThrow('Network error')
    })

    it('given invalid JSON response, when called, expect error thrown', async () => {
      // GIVEN
      mockGithubRequest.mockRejectedValueOnce(new Error('Invalid JSON'))

      // WHEN & EXPECT
      await expect(getUserData(baseRequest)).rejects.toThrow('Invalid JSON')
    })
  })

  describe('github request integration', () => {
    it('given valid params, when called, expect github request called with correct parameters', async () => {
      // GIVEN
      const expectedResult = mockUserData
      mockGithubRequest.mockResolvedValueOnce(expectedResult)

      // WHEN
      const result = await getUserData(baseRequest)

      // EXPECT
      expect(result).toBe(expectedResult)
      expect(mockGithubRequest).toHaveBeenCalledWith(baseRequest, expect.any(Function), { requestType: 'user-data' })
    })

    it('given githubRequest throws error, when called, expect error propagated', async () => {
      // GIVEN
      const expectedError = new Error('GitHub request failed')
      mockGithubRequest.mockRejectedValueOnce(expectedError)

      // WHEN & EXPECT
      await expect(getUserData(baseRequest)).rejects.toThrow('GitHub request failed')
    })
  })

  describe('edge cases', () => {
    it('given user with minimal data, when called, expect partial user object returned', async () => {
      // GIVEN
      const minimalUserData: GitHubUser = {
        login: 'minimal-user',
        id: 999,
        node_id: 'MDQ6VXNlcjk5OQ==',
        avatar_url: 'https://github.com/images/error/minimal_user.gif',
        gravatar_id: '',
        url: 'https://api.github.com/users/minimal-user',
        html_url: 'https://github.com/minimal-user',
        followers_url: 'https://api.github.com/users/minimal-user/followers',
        following_url: 'https://api.github.com/users/minimal-user/following{/other_user}',
        gists_url: 'https://api.github.com/users/minimal-user/gists{/gist_id}',
        starred_url: 'https://api.github.com/users/minimal-user/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/users/minimal-user/subscriptions',
        organizations_url: 'https://api.github.com/users/minimal-user/orgs',
        repos_url: 'https://api.github.com/users/minimal-user/repos',
        events_url: 'https://api.github.com/users/minimal-user/events{/privacy}',
        received_events_url: 'https://api.github.com/users/minimal-user/received_events',
        type: 'User',
        site_admin: false,
        // Optional fields omitted
      }

      mockGithubRequest.mockResolvedValueOnce(minimalUserData)

      // WHEN
      const result = await getUserData(baseRequest)

      // EXPECT
      expect(result).toEqual(minimalUserData)
      expect(result.name).toBeUndefined()
      expect(result.email).toBeUndefined()
      expect(result.bio).toBeUndefined()
    })
  })
})
