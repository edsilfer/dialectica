import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { BaseRequest } from './types'
import type { GitHubUser } from '../models'
import githubRequest from './github-request'

/**
 * Retrieves the authenticated user's GitHub data (username, name, avatar, bio, etc.) from GitHub's REST API.
 *
 * Note: This endpoint requires authentication and returns data for the currently authenticated user.
 *
 * @example
 *   const userData = await getUserData({ token: 'ghp_your_token_here' })
 */
export async function getUserData(params: BaseRequest): Promise<GitHubUser> {
  const fetcher = async ({ token }: BaseRequest): Promise<GitHubUser> => {
    if (!token || token.trim() === '') {
      throw new Error('Authentication token is required to fetch user data')
    }

    const url = `${GITHUB_API_HOST}/user`
    const res = await fetch(url, { headers: buildHeaders(token) })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    return (await res.json()) as GitHubUser
  }

  return githubRequest<BaseRequest, GitHubUser>(params, fetcher, { requestType: 'user-data' })
}

export default getUserData
