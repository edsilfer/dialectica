export interface Settings {
  /** GitHub Personal Access Token */
  githubPat: string
  /** Whether to use mock data */
  useMocks: boolean
}

export interface SettingsContextType {
  /** GitHub Personal Access Token */
  githubPat: string
  /** Whether to use mock data */
  useMocks: boolean
  /** Set the GitHub Personal Access Token */
  setGithubPat: (pat: string) => void
  /** Set whether to use mock data */
  setUseMocks: (useMocks: boolean) => void
}
