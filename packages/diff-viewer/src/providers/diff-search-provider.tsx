import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { HunkListViewModel } from '../components/file-list/models/HunkListViewModel'
import { LineMetadata } from '../components/file-list/models/LineMetadata'
import { Side } from '../components/file-list/models/types'
import { FileDiff } from '../models/FileDiff'
import { useFileListConfig } from './file-list-context'

// TYPES -----------------------------------------------------------------
type LinePair = LineMetadata & { file: string }

export type SearchMatch = {
  /** The file key */
  fileKey: string
  /** The line metadata */
  line: LinePair
  /** The side of the match */
  side?: Side
  /** The start index of the match */
  startIndex: number
}

export type SearchResult = {
  /** The query that was used to find the match */
  query: string
  /** The total number of matches */
  size: number
  /** The line metadata -> index of the match */
  matches: Map<number, SearchMatch>
}

export interface DiffSearchProviderProps {
  /** The children of the diff search provider */
  children: ReactNode
  /** The array of line metadata for the current file */
  files: FileDiff[]
}

interface DiffSearchContextValue {
  /** The search results */
  result: SearchResult | null
  /** The current index of the focused match */
  currentIndex: number
  /** The total number of matches */
  totalMatches: number
  /** The focused match */
  focusedMatch: SearchMatch | undefined
  /** The function to clear the search results */
  clear: () => void
  /** The function to search for a query */
  search: (query: string) => void
  /** The next match in the diff. */
  nextMatch: () => void
  /** The previous match in the diff. */
  previousMatch: () => void
}

const DiffSearchContext = createContext<DiffSearchContextValue | undefined>(undefined)

// PROVIDER ---------------------------------------------------------------
export function DiffSearchProvider({ children, files = [] }: DiffSearchProviderProps) {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [focusedMatch, setFocusedMatch] = useState<SearchMatch | undefined>(undefined)
  const { config } = useFileListConfig()

  // TODO: there might be a better way to do this
  const linePairs: LinePair[] = useMemo(() => {
    return files.flatMap((file) => {
      const viewModel = new HunkListViewModel(file, config.mode, 10)
      return viewModel.linePairs.map(
        (linePair) =>
          ({
            ...linePair,
            file: file.key,
          }) as LinePair,
      )
    })
  }, [files, config.mode])

  const clear = () => {
    setResult(null)
    setCurrentIndex(0)
    setFocusedMatch(undefined)
  }

  useEffect(() => {
    if (result) {
      setFocusedMatch(result.matches.get(currentIndex) ?? undefined)
    }
  }, [result, currentIndex])

  const search = (query: string) => {
    clear()

    if (query.trim() === '') return

    let matchIdx = 0
    const matches = new Map<number, SearchMatch>()

    for (const line of linePairs) {
      if (line.typeLeft === 'hunk' || line.typeRight === 'hunk') {
        continue
      }

      for (const match of addMatches(query, line, 'left')) {
        matches.set(matchIdx++, match)
      }

      if (line.typeLeft === 'context' && config.mode === 'unified') {
        // skip checking the right side for unified
        continue
      }

      for (const match of addMatches(query, line, 'right')) {
        matches.set(matchIdx++, match)
      }
    }

    if (matches.size === 0) return

    setResult({ query, matches, size: matchIdx })
    setCurrentIndex(0)
  }

  const addMatches = (query: string, line: LinePair, side: Side) => {
    const result: SearchMatch[] = []
    const content = side === 'left' ? line.contentLeft : line.contentRight
    const lineNumber = side === 'left' ? line.lineNumberLeft : line.lineNumberRight

    if (!content || lineNumber == null) return result

    let idx = content.indexOf(query)
    while (idx !== -1) {
      result.push({
        fileKey: line.file,
        line,
        side: config.mode === 'split' ? side : undefined,
        startIndex: idx,
      })
      idx = content.indexOf(query, idx + query.length)
    }

    return result
  }

  const nextMatch = () => {
    if (!result) return
    const nextIndex = currentIndex + 1
    if (nextIndex > result.size - 1) setCurrentIndex(0)
    else setCurrentIndex(nextIndex)
  }

  const previousMatch = () => {
    if (!result) return
    const prevIndex = currentIndex - 1
    if (prevIndex < 0) setCurrentIndex(result.size - 1)
    else setCurrentIndex(prevIndex)
  }

  const value: DiffSearchContextValue = {
    result,
    currentIndex,
    totalMatches: result?.size ?? 0,
    focusedMatch,
    clear,
    search,
    nextMatch,
    previousMatch,
  }

  return <DiffSearchContext.Provider value={value}>{children}</DiffSearchContext.Provider>
}

export function useDiffSearch() {
  const context = useContext(DiffSearchContext)
  if (context === undefined) {
    throw new Error('useDiffSearch must be used within a DiffSearchProvider')
  }
  return context
}
