import { PrKey } from '@diff-viewer'

export interface SearchFormProps {
  /** Width of the search input */
  width?: number | string

  /** Callback invoked after a successful PR URL parsing */
  onSearch?: (pr: PrKey) => void
}
