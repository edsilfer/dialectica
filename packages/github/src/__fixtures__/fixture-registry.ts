import { COMMENTS } from './facebook/react/33665/comments'
import { DIFF } from './facebook/react/33665/diff'
import { METADATA } from './facebook/react/33665/metadata'
import { USER_DATA } from './user-data'

const DEFAULT_FIXTURES = [
  {
    request: { type: 'pr-diff', owner: 'facebook', repo: 'react', pullNumber: 33665 },
    data: DIFF,
  },
  {
    request: { type: 'pr-metadata', owner: 'facebook', repo: 'react', pullNumber: 33665 },
    data: METADATA,
  },
  {
    request: { type: 'inline-comments', owner: 'facebook', repo: 'react', pullNumber: 33665 },
    data: COMMENTS,
  },
  {
    request: { type: 'user-data', owner: 'user', repo: 'authenticated', pullNumber: 0 },
    data: USER_DATA,
  },
] as const

/**
 * Represents a generic request that can be used to generate a cache key
 */
interface RequestKey {
  /** The type of request */
  type: string
  /** The owner of the repository */
  owner: string
  /** The repository name */
  repo: string
  /** The pull request number */
  pullNumber: number
  /** Additional parameters */
  [key: string]: unknown
}

/**
 * A centralized registry for storing and serving fixtures when useMocks is true.
 * This class abstracts mock handling away from individual hooks.
 */
export class FixtureRegistry {
  private fixtures = new Map<string, unknown>()

  constructor() {
    this.registerDefaults()
  }

  /**
   * Register a fixture for a specific request
   *
   * @param request - The request to register the fixture for
   * @param fixture - The fixture to register
   */
  registerFixture<T>(request: RequestKey, fixture: T): void {
    const key = this.generateKey(request)
    this.fixtures.set(key, fixture)
  }

  /**
   * Get a fixture for a specific request
   *
   * @param request - The request to get the fixture for
   * @returns         The fixture
   */
  getFixture<T>(request: RequestKey): T | undefined {
    const key = this.generateKey(request)
    return this.fixtures.get(key) as T | undefined
  }

  /**
   * Get all registered fixture keys (for debugging)
   *
   * @returns All registered fixture keys
   */
  getAllKeys(): string[] {
    return Array.from(this.fixtures.keys())
  }

  /**
   * Check if a fixture exists for a specific request
   *
   * @param request - The request to check if a fixture exists for
   * @returns         True if a fixture exists for the request, false otherwise
   */
  hasFixture(request: RequestKey): boolean {
    const key = this.generateKey(request)
    return this.fixtures.has(key)
  }

  clear(): void {
    this.fixtures.clear()
  }

  private registerDefaults(): void {
    DEFAULT_FIXTURES.forEach(({ request, data }) => {
      this.registerFixture(request, data)
    })
  }

  private generateKey(request: RequestKey): string {
    const { type, owner, repo, pullNumber, ...rest } = request
    const baseKey = `${type}:${owner}/${repo}#${pullNumber}`
    const additionalParams = Object.entries(rest)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${String(value)}`)
      .join('&')
    return additionalParams ? `${baseKey}?${additionalParams}` : baseKey
  }
}

export const fixtureRegistry = new FixtureRegistry()
