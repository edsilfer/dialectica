import { ParsedDiff } from '@diff-viewer'
import { ParsedPR } from '../components/search-form/types'
import { parseURL, setURL } from '../utils'

export type PRViewAction =
  | { type: 'SELECT_PR'; payload: ParsedPR }
  | { type: 'PARSE_DIFF'; payload: string | undefined }
  | { type: 'UPDATE_PAGE_TITLE'; payload?: string }
  | { type: 'INITIALIZE_FROM_URL' }

export const INITIAL_STATE: PrViewState = {
  selectedPr: null,
  displayedDiff: undefined,
  pageTitle: 'Diff Viewer Demo',
}

export interface PrViewState {
  /** The selected pull request. */
  selectedPr: ParsedPR | null
  /** The displayed diff. */
  displayedDiff: ParsedDiff | undefined
  /** The page title. */
  pageTitle: string
}

export function prViewReducer(state: PrViewState, action: PRViewAction): PrViewState {
  switch (action.type) {
    case 'SELECT_PR': {
      const pr = action.payload
      setURL(pr)
      return {
        ...state,
        selectedPr: pr,
        pageTitle: `${pr.owner}/${pr.repo}#${pr.prNumber} - Diff Viewer Demo`,
      }
    }

    case 'PARSE_DIFF': {
      const diff = action.payload
      if (!diff || diff.trim() === '') {
        return {
          ...state,
          displayedDiff: undefined,
        }
      }

      try {
        const parsedDiff = ParsedDiff.build(diff)
        return {
          ...state,
          displayedDiff: parsedDiff,
        }
      } catch (err) {
        console.error('Failed to parse diff:', err)
        return {
          ...state,
          displayedDiff: undefined,
        }
      }
    }

    case 'UPDATE_PAGE_TITLE': {
      const prTitle = action.payload
      return {
        ...state,
        pageTitle: prTitle ? `${prTitle} - Diff Viewer Demo` : 'Diff Viewer Demo',
      }
    }

    case 'INITIALIZE_FROM_URL': {
      const parsedPr = parseURL()
      return {
        ...state,
        selectedPr: parsedPr,
        pageTitle: parsedPr
          ? `${parsedPr.owner}/${parsedPr.repo}#${parsedPr.prNumber} - Diff Viewer Demo`
          : 'Diff Viewer Demo',
      }
    }

    default:
      return state
  }
}
