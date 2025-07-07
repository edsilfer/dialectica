import { css, SerializedStyles } from '@emotion/react'
import { ThemeTokens } from '../../../shared/themes'
import { DiffLineType } from '../../../shared/models/LineDiff'

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
      padding: 0 ${theme.spacing.sm};
      background: ${backgroundByType[type]};
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

  const container = css`
    display: flex;
    flex-direction: column;
    background: ${theme.colors.hunkViewerBg};
    width: 100%;
    overflow-x: auto;
  `

  const row = css`
    display: table-row;
    color: ${theme.colors.textPrimary};
    /* Show add button when hovering over left side cells */
    &:has(.split-viewer-left-row:hover) .split-viewer-left-row .add-comment-btn {
      opacity: 1;
      pointer-events: auto;
    }

    /* Show add button when hovering over right side cells */
    &:has(.split-viewer-right-row:hover) .split-viewer-right-row .add-comment-btn {
      opacity: 1;
      pointer-events: auto;
    }

    /* For unified viewer - keep the original behavior for backward compatibility */
    &:hover
      .add-comment-btn:not(.split-viewer-left-row .add-comment-btn):not(.split-viewer-right-row .add-comment-btn) {
      opacity: 1;
      pointer-events: auto;
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
  const addButton = css`
    position: absolute;
    left: 0;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease-in-out;
    z-index: 10;
  `

  return {
    container,
    table,
    row,
    leftNumberCell,
    rightNumberCell,
    codeCell,
    lineType,
    addButton,
  }
}
