export interface User {
  /** User ID */
  id?: number
  /** User's display name */
  name?: string
  /** GitHub username */
  username?: string
  /** URL to user's avatar image */
  avatar_url?: string
}

export interface Settings {
  /** GitHub Personal Access Token */
  githubPat: string
  /** Whether to use mock data */
  useMocks: boolean
  /** Current authenticated user */
  currentUser?: User
}

export interface SettingsContextType {
  /** GitHub Personal Access Token */
  githubPat: string
  /** Whether to use mock data */
  useMocks: boolean
  /** Current authenticated user */
  currentUser?: User
  /** Set the GitHub Personal Access Token */
  setGithubPat: (pat: string) => void
  /** Set whether to use mock data */
  setUseMocks: (useMocks: boolean) => void
  /** Set the current user */
  setCurrentUser: (user?: User) => void
}
