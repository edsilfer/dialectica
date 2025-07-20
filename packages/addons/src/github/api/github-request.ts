import { fixtureRegistry } from '../fixtures/fixture-registry'
import type { BaseGitHubRequest, BaseRequest } from './types'

export interface GithubRequestOptions {
  /** The type of request for mock data resolution */
  requestType?: string
}

export interface GithubRequestFetcher<P extends BaseRequest, R> {
  (params: P): Promise<R>
}

// RequestKey interface matching the fixture registry expectation
interface RequestKey {
  /** The type of request */
  type: string
  /** The owner of the repository */
  owner: string
  /** The repository name */
  repo: string
  /** The pull request number */
  pullNumber: number
  /** Additional properties */
  [key: string]: unknown
}

/**
 * Creates a RequestKey for fixture lookup based on the request type
 */
function createMockKey(requestType: string, params: BaseRequest): RequestKey {
  if ('prKey' in params) {
    const prParams = params as BaseGitHubRequest
    return {
      type: requestType,
      owner: prParams.prKey.owner,
      repo: prParams.prKey.repo,
      pullNumber: prParams.prKey.pullNumber,
    }
  } else {
    // For user requests, provide default values that create a unique key
    return {
      type: requestType,
      owner: 'user',
      repo: 'authenticated',
      pullNumber: 0,
    }
  }
}

function validate(params: BaseRequest) {
  // When using mocks, we don't need valid GitHub API parameters
  if (params.useMocks) return

  // Only validate PR-specific fields if this is a PR request
  if ('prKey' in params) {
    const prParams = params as BaseGitHubRequest
    if (!prParams.prKey.owner || !prParams.prKey.repo || !prParams.prKey.pullNumber) {
      throw new Error('owner, repo and pullNumber are required')
    }
  }
}

/**
 * Promise-based wrapper that encapsulates common GitHub request concerns:
 *  • Parameter validation
 *  • Fixture resolution (mocks)
 *  • Optional artificial delay for demo/playground purposes
 */
export async function githubRequest<P extends BaseRequest, R>(
  params: P,
  fetcher: GithubRequestFetcher<P, R>,
  options: GithubRequestOptions = {},
): Promise<R> {
  const { requestType } = options

  validate(params)

  // Resolve fixture mocks first – short-circuit if available
  if (params.useMocks && requestType) {
    const mockKey = createMockKey(requestType, params)
    const mocked = fixtureRegistry.getFixture(mockKey)
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
