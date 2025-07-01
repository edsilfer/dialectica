export interface SearchFormProps {
  /** Width of the search input */
  width?: number | string

  /** Callback invoked after a successful PR URL parsing */
  onSearch?: (pr: ParsedPR) => void
}

export interface ParsedPR {
  /** Repository owner/organization. Example: "facebook" */
  owner: string
  /** Repository name. Example: "react" */
  repo: string
  /** Pull request number */
  prNumber: number
}
