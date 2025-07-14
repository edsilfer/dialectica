import { css, SerializedStyles } from '@emotion/react'
import { DiffLineType } from '../../../models/LineDiff'
import { ThemeTokens } from '../../../themes'

/**
 * Generates the full style map required by both `UnifiedViewer` and `SplitViewer`.
 *
 * The returned object is entirely static for a given `theme` to avoid recreating
 * Emotion style instances on every component render. Complex style fragments
 * are pre-computed and cached per line-type, dramatically reducing work that
 * needs to happen during the diff rendering loop.
 */

export const getViewerStyles = (theme: ThemeTokens) => {
  const backgroundByType: Record<DiffLineType, string> = {
    add: theme.colors.hunkViewerLineAddedBg,
    delete: theme.colors.hunkViewerLineRemovedBg,
    context: 'transparent',
    hunk: theme.colors.hunkViewerLineHunkBg,
    empty: theme.colors.hunkViewerLineEmptyBg,
  }

  const numberBackgroundByType: Record<DiffLineType, string> = {
    add: theme.colors.hunkViewerLineNumberAddedBg,
    delete: theme.colors.hunkViewerLineNumberRemovedBg,
    context: theme.colors.hunkViewerLineNumberContextBg,
    hunk: theme.colors.hunkViewerLineNumberHunkBg,
    empty: theme.colors.hunkViewerLineNumberEmptyBg,
  }

  const baseCell = css`
    position: relative;
    vertical-align: middle;
    height: ${theme.typography.codeLineHeight}rem;
    line-height: ${theme.typography.codeLineHeight}rem;
    font-family: ${theme.typography.codeFontFamily};
    font-size: ${theme.typography.codeFontSize}px;
    padding: 0;
  `

  const numberCellBase = [
    baseCell,
    css`
      text-align: center;
      user-select: none;
      pointer-events: none;
    `,
  ]

  const addBorderLeft = css`
    border-left: 1px solid ${theme.colors.border};
  `

  const createNumberCell = (type: DiffLineType, isRightSide: boolean): SerializedStyles[] => {
    const styles: SerializedStyles[] = [
      ...numberCellBase,
      css`
        background: ${numberBackgroundByType[type]};
      `,
    ]

    // Right-hand side numbers get an extra border, except for hunk headers.
    if (isRightSide && type !== 'hunk') {
      styles.push(addBorderLeft)
    }

    return styles
  }

  const createCodeCell = (type: DiffLineType): SerializedStyles[] => [
    baseCell,
    css`
      text-align: left;
      padding: 0 ${theme.spacing.sm};
      background: ${backgroundByType[type]};
      white-space: pre-wrap;
      word-break: break-word;
      max-width: 0;
    `,
  ]

  const lineTypes: DiffLineType[] = ['add', 'delete', 'context', 'hunk', 'empty']

  const leftNumberCell = lineTypes.reduce<Record<DiffLineType, SerializedStyles[]>>(
    (acc, type) => {
      acc[type] = createNumberCell(type, false)
      return acc
    },
    {} as Record<DiffLineType, SerializedStyles[]>,
  )

  const rightNumberCell = lineTypes.reduce<Record<DiffLineType, SerializedStyles[]>>(
    (acc, type) => {
      acc[type] = createNumberCell(type, true)
      return acc
    },
    {} as Record<DiffLineType, SerializedStyles[]>,
  )

  const codeCell = lineTypes.reduce<Record<DiffLineType, SerializedStyles[]>>(
    (acc, type) => {
      acc[type] = createCodeCell(type)
      return acc
    },
    {} as Record<DiffLineType, SerializedStyles[]>,
  )

  const widgetCell = css`
    text-align: left;
    pointer-events: auto;
    user-select: text;
  `

  const container = css`
    display: flex;
    flex-direction: column;
    background: ${theme.colors.hunkViewerBg};
    width: 100%;
    overflow-x: auto;

    /* Hover-based lock — only when NOT selecting */
    &:not(.is-selecting):has(.split-viewer-left-row:hover) .split-viewer-right-row {
      user-select: none;
      pointer-events: none;

      /* Allow widgets to remain interactive */
      td[colspan] {
        pointer-events: auto;
      }
    }

    &:not(.is-selecting):has(.split-viewer-right-row:hover) .split-viewer-left-row {
      user-select: none;
      pointer-events: none;

      /* Allow widgets to remain interactive */
      td[colspan] {
        pointer-events: auto;
      }
    }

    /* Active-selection lock — freeze the opposite side */
    &.selecting-left .split-viewer-right-row,
    &.selecting-right .split-viewer-left-row {
      user-select: none;
      pointer-events: none;

      /* Allow widgets to remain interactive even during selection */
      td[colspan] {
        pointer-events: auto;
      }
    }

    /* Ensure widget rows are always interactive */
    tr:has(td[colspan]) {
      pointer-events: auto;
    }
  `

  const row = css`
    position: relative;
    color: ${theme.colors.textPrimary};

    /* Show overlay when hovering over left side cells */
    &:has(.split-viewer-left-row:hover) .split-viewer-left-row .diff-view-overlay {
      opacity: 1;
    }

    /* Show overlay when hovering over right side cells */
    &:has(.split-viewer-right-row:hover) .split-viewer-right-row .diff-view-overlay {
      opacity: 1;
    }

    /* Fallback for unified viewer */
    &:hover
      .diff-view-overlay:not(.split-viewer-left-row .diff-view-overlay):not(
        .split-viewer-right-row .diff-view-overlay
      ) {
      opacity: 1;
    }
  `

  const table = css`
    width: 100%;
    border-collapse: collapse;
    /* Fixed layout is noticeably faster than auto for large diffs */
    table-layout: fixed;
  `

  const lineType = css`
    display: inline-block;
    width: 1ch;
    text-align: center;
  `

  const overlay = css`
    position: absolute;
    left: 0;
    top: 50%;
    opacity: 0;
  `

  return {
    container,
    table,
    row,
    leftNumberCell,
    rightNumberCell,
    codeCell,
    widgetCell,
    lineType,
    overlay,
  }
}
