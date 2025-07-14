import { fixtureRegistry } from '../fixtures/fixture-registry'
import type { BaseGitHubRequest } from './types'

export interface GithubRequestOptions {
  /** The type of request for mock data resolution */
  requestType?: string
}

export interface GithubRequestFetcher<P extends BaseGitHubRequest, R> {
  (params: P): Promise<R>
}

function validate(params: BaseGitHubRequest) {
  // When using mocks, we don't need valid GitHub API parameters
  if (params.useMocks) return
  if (!params.prKey.owner || !params.prKey.repo || !params.prKey.pullNumber) {
    throw new Error('owner, repo and pullNumber are required')
  }
}

/**
 * Promise-based wrapper that encapsulates common GitHub request concerns:
 *  • Parameter validation
 *  • Fixture resolution (mocks)
 *  • Optional artificial delay for demo/playground purposes
 */
export async function githubRequest<P extends BaseGitHubRequest, R>(
  params: P,
  fetcher: GithubRequestFetcher<P, R>,
  options: GithubRequestOptions = {},
): Promise<R> {
  const { requestType } = options

  validate(params)

  // Resolve fixture mocks first – short-circuit if available
  if (params.useMocks && requestType) {
    const mocked = fixtureRegistry.getFixture({ type: requestType, ...params.prKey })
    if (mocked !== undefined) {
      // Artificial delay if requested (useful for UI demos)
      if (params.forceDelayMs && params.forceDelayMs > 0) {
        await new Promise((res) => setTimeout(res, params.forceDelayMs))
      }
      return mocked as R
    }
  }

  const result = await fetcher(params)

  if (params.forceDelayMs && params.forceDelayMs > 0) {
    await new Promise((res) => setTimeout(res, params.forceDelayMs))
  }

  return result
}

export default githubRequest
