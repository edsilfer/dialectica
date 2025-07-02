import { css } from '@emotion/react'
import { DiffLineType } from './types'
import { ThemeTokens } from '../../../shared/themes'

/**
 * Common constants used by diff viewers.
 */
export const COLUMN = { number: 50, prefix: 25 } as const

/**
 * Mapping of diff line type to background colours.
 */
export const getBgColor = (theme: ThemeTokens): Record<DiffLineType, string> => ({
  add: theme.colors.hunkViewerLineAddedBg,
  delete: theme.colors.hunkViewerLineRemovedBg,
  context: 'transparent',
  hunk: theme.colors.hunkViewerLineHunkBg,
  empty: theme.colors.hunkViewerLineEmptyBg,
})

/**
 * Mapping of diff line type to line-number background colours.
 */
export const getNumberBgColor = (theme: ThemeTokens): Record<DiffLineType, string> => ({
  add: theme.colors.hunkViewerLineNumberAddedBg,
  delete: theme.colors.hunkViewerLineNumberRemovedBg,
  context: theme.colors.hunkViewerLineNumberContextBg,
  hunk: theme.colors.hunkViewerLineNumberHunkBg,
  empty: theme.colors.hunkViewerLineNumberEmptyBg,
})

/**
 * Base cell styles shared by all grid cells.
 */
export const makeCellBase = (theme: ThemeTokens) => css`
  vertical-align: middle;
  height: ${theme.typography.codeLineHeight}rem;
  line-height: ${theme.typography.codeLineHeight}rem;
  font-family: ${theme.typography.codeFontFamily};
  font-size: ${theme.typography.codeFontSize}px;
`

/**
 * Utility to create sticky positioning for a given left offset.
 */
export const makeSticky = (left: number) => css`
  position: sticky;
  left: ${left}px;
  z-index: 3;
`

/**
 * Container style shared by both unified and split viewers.
 */
export const containerStyle = (theme: ThemeTokens) => css`
  display: flex;
  flex-direction: column;
  background: ${theme.colors.hunkViewerBg};
  width: 100%;
  overflow-x: auto;
`

/**
 * Row style shared by both unified and split viewers.
 */
export const rowStyle = (theme: ThemeTokens) => css`
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
  &:hover .add-comment-btn:not(.split-viewer-left-row .add-comment-btn):not(.split-viewer-right-row .add-comment-btn) {
    opacity: 1;
    pointer-events: auto;
  }
`

/**
 * Style applied to the floating "add comment" button that appears on hover.
 */
export const addButtonStyle = css`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease-in-out;
  z-index: 10;
`

/**
 * Style applied to prefix cells to establish positioning context for add buttons.
 */
export const makePrefixCellBase = (theme: ThemeTokens, offset: number, bgColor: string) => [
  makeCellBase(theme),
  makeSticky(offset),
  css`
    width: ${COLUMN.prefix}px;
    background-color: ${bgColor};
    text-align: center;
  `,
]
