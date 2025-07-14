import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { GetPrMetadataRequest } from './types'
import type { GitHubPullRequest } from '../models'
import githubRequest from './github-request'

/**
 * Retrieves Pull Request metadata (title, author, status, etc.) from GitHub's REST API.
 *
 * @example
 *   const metadata = await getPrMetadata({ owner: 'facebook', repo: 'react', pullNumber: 1 })
 */
export async function getPrMetadata(params: GetPrMetadataRequest): Promise<GitHubPullRequest> {
  const fetcher = async ({ prKey, token }: GetPrMetadataRequest): Promise<GitHubPullRequest> => {
    const url = `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/pulls/${prKey.pullNumber}`
    const authToken = token && token.trim() !== '' ? token : undefined
    const res = await fetch(url, { headers: buildHeaders(authToken) })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    return (await res.json()) as GitHubPullRequest
  }

  return githubRequest<GetPrMetadataRequest, GitHubPullRequest>(params, fetcher, { requestType: 'pr-metadata' })
}

export default getPrMetadata
