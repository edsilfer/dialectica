import 'highlight.js/styles/github.css'

import { Hunk } from '../../../shared/parsers/types'
import { escapeHtml, highlightContent } from './highlight-utils'
import { FileViewerProps, LinePair } from './types'

/**
 * Prepare a flattened list of lines for the unified (one-column) diff viewer.
 *
 * --> IMPORTANT <--
 * Only the "left" fields are populated – the right-hand side stays `null` so
 * that both viewers can share the same underlying type without extra work.
 *
 * @param file     - The file to parse.
 * @param language - The language of the code snippet.
 * @returns        - The parsed lines.
 */
export const parseUnifiedLines = (file: FileViewerProps['file'], language: string): LinePair[] =>
  file.hunks.flatMap((hunk) => [
    buildHunkHeader(hunk),
    ...hunk.changes.filter(hasVisibleContent).map((change) => mapChangeToUnifiedLine(change, language)),
  ])

/**
 * Convert a single hunk into a list of paired rows suitable for the SplitViewer
 *
 * @param hunk     - The hunk to parse.
 * @param language - The language of the code snippet.
 * @returns        - The parsed lines.
 */
export const parseSplitLines = (hunk: Hunk, language: string): LinePair[] => {
  const rows: LinePair[] = [buildHunkHeader(hunk)]

  const pushContext = (change: Change) => rows.push(mapContext(change, language))
  const pushDelete = (change: Change) => rows.push(mapDelete(change, language))
  const pushAdd = (change: Change) => {
    const lastRow = rows.at(-1)
    if (lastRow?.typeLeft === 'delete' && lastRow.typeRight === 'empty') {
      /*
       * Pair this addition with the previous deletion so they render on the same visual row.
       * Only update the right-side properties to keep the left-side deletion intact
       */
      const addLine = mapAdd(change, language)
      lastRow.typeRight = addLine.typeRight
      lastRow.contentRight = addLine.contentRight
      lastRow.highlightedContentRight = addLine.highlightedContentRight
      lastRow.lineNumberRight = addLine.lineNumberRight
    } else {
      rows.push(mapAdd(change, language))
    }
  }

  hunk.changes.forEach((change) => {
    if (!hasVisibleContent(change)) return
    switch (change.type) {
      case 'context':
        pushContext(change)
        break
      case 'delete':
        pushDelete(change)
        break
      case 'add':
        pushAdd(change)
        break
    }
  })

  return rows
}

type Change = Hunk['changes'][number]

const hasVisibleContent = (change: Change): boolean => !!change.content.trim()

const buildHunkHeader = (hunk: Hunk): LinePair =>
  createLinePair({
    typeLeft: 'hunk',
    contentLeft: escapeHtml(hunk.content),
    lineNumberLeft: null,

    typeRight: 'hunk',
    contentRight: escapeHtml(hunk.content),
    lineNumberRight: null,
  })

const mapChangeToUnifiedLine = (change: Change, language: string): LinePair => {
  const base = baseFields(change, language)

  if (change.type === 'context') {
    return createLinePair({
      ...base,
      typeLeft: 'context',
      typeRight: 'context',
    })
  }

  if (change.type === 'delete') {
    return createLinePair({
      ...base,
      typeLeft: 'delete',
      contentRight: null,
      highlightedContentRight: null,
      typeRight: 'empty',
      lineNumberRight: null,
    })
  }

  return createLinePair({
    ...base,
    typeLeft: 'add',
    lineNumberLeft: null,
    contentRight: null,
    highlightedContentRight: null,
    typeRight: 'empty',
  })
}

const mapContext = (change: Change, language: string): LinePair => {
  const base = baseFields(change, language)
  return createLinePair({
    ...base,
    typeLeft: 'context',
    typeRight: 'context',
  })
}

const mapDelete = (change: Change, language: string): LinePair => {
  const base = baseFields(change, language)
  return createLinePair({
    ...base,
    typeLeft: 'delete',
    contentRight: null,
    highlightedContentRight: null,
    typeRight: 'empty',
    lineNumberRight: null,
  })
}

const mapAdd = (change: Change, language: string): LinePair => {
  const base = baseFields(change, language)
  return createLinePair({
    ...base,
    typeLeft: 'empty',
    contentLeft: null,
    highlightedContentLeft: null,
    lineNumberLeft: null,
    typeRight: 'add',
  })
}

const baseFields = (change: Change, language: string) => {
  const highlighted = highlightContent(change.content, language)
  return {
    contentLeft: change.content,
    highlightedContentLeft: highlighted,
    lineNumberLeft: change.lineNumberOld ?? null,

    contentRight: change.content,
    highlightedContentRight: highlighted,
    lineNumberRight: change.lineNumberNew ?? null,
  }
}

const createLinePair = (
  input: Partial<LinePair> & {
    /** At minimum both sides must declare their visual type */
    typeLeft: LinePair['typeLeft']
    typeRight: LinePair['typeRight']
  },
): LinePair => ({
  typeLeft: input.typeLeft ?? null,
  contentLeft: input.contentLeft ?? null,
  highlightedContentLeft: input.highlightedContentLeft ?? input.contentLeft ?? null,
  lineNumberLeft: input.lineNumberLeft ?? null,

  typeRight: input.typeRight ?? null,
  contentRight: input.contentRight ?? null,
  highlightedContentRight: input.highlightedContentRight ?? input.contentRight ?? null,
  lineNumberRight: input.lineNumberRight ?? null,
})
