import { highlight, HighlightMatch, ThemeContext } from '@edsilfer/commons'
import type { CSSObject } from '@emotion/react'
import React, { useContext } from 'react'
import { useDiffSearch } from '../../../../providers/diff-search-provider'
import { useFileListConfig } from '../../../../providers/file-list-context'
import type { Row } from '../../models/Row'
import type { Side } from '../../models/types'

interface CodeSpanProps {
  /** The diff row view model containing the content and language. */
  row: Row
  /** The side to display content from ('left' or 'right'). If not specified, uses unified view. */
  side?: Side
  /** Additional CSS styles to apply. */
  css?: CSSObject
  /** Additional CSS class names. */
  className?: string
}

export const CodeSpan: React.FC<CodeSpanProps> = ({ row, side, css, className }) => {
  const theme = useContext(ThemeContext)
  const HIGHLIGHT_STYLE = `
    background-color: ${theme.colors.accent}40; 
    color: ${theme.colors.textPrimary}; 
    font-weight: bold; 
    border-radius: 2px;
  `

  const content = row.getContent(side)
  const { result: searchResult, focusedMatch } = useDiffSearch()
  const { config } = useFileListConfig()

  const queryExists = searchResult && searchResult.query
  const sideMatch = (config.mode === 'split' && focusedMatch && focusedMatch.side === side) || config.mode === 'unified'
  const lineMatch = focusedMatch && row.rawLine.equals(focusedMatch.line)
  const isFocused = queryExists && lineMatch && sideMatch

  // If there's no content, render a non-breaking space character directly
  if (!content || content === '&nbsp;') {
    return (
      <span css={css} className={className}>
        &nbsp;
      </span>
    )
  }

  let matches: HighlightMatch[] = []
  const language = row.getLanguage()
  if (isFocused) matches = [{ start: focusedMatch.startIndex, length: searchResult.query.length }]
  const highlightedContent = highlight(content, language, matches, HIGHLIGHT_STYLE)
  return <span css={css} className={className} dangerouslySetInnerHTML={{ __html: highlightedContent }} />
}
