import { PullRequestMetadata } from '../../hooks/types'

export interface PrHeaderProps {
  /** Pull request metadata */
  pr: PullRequestMetadata
  /** Optional: Overrides the default heading level (default: 4) */
  headingLevel?: 1 | 2 | 3 | 4 | 5
}

export interface StatTagProps {
  /** The value to display */
  value: number
  /** The label to display */
  label: string
  /** The color of the tag */
  color: string
}
