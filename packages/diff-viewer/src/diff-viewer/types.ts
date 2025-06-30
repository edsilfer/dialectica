import { Interpolation, Theme } from '@emotion/react'
import { DiffViewerConfig } from './providers/types'

// Represents a parser for diff text, which converts raw diff text into a structured ParsedDiff object.
export interface IDiffParser {
  /**
   * Parses the given diff text and returns a structured ParsedDiff object.
   * @param diffText - The raw diff text to be parsed.
   * @returns A ParsedDiff object containing the parsed diff information.
   */
  parse(diffText: string): ParsedDiff
}

// Represents the parsed diff containing a list of file differences.
export interface ParsedDiff {
  /** An array of file differences parsed from the diff text. */
  files: FileDiff[]
}

export type DiffViewerProps = {
  /** The parsed diff to display. */
  diff: ParsedDiff
  /** The file to scroll to when the diff is loaded. */
  scrollTo?: string | null
  /** Display configuration options. */
  config?: DiffViewerConfig
  /** Kept to make typescript happy, but not used by emotion */
  css?: Interpolation<Theme>
  /** The content of css will be hashed and passed here */
  className?: string

  // Callbacks ____________________________________________
  /** Callback for when a line is clicked. */
  onLineClick?: (line: DiffLine) => void
}

// Represents the differences in a single file, including path changes and hunks.
export interface FileDiff {
  /** The original path of the file before the diff. */
  oldPath: string
  /** The new path of the file after the diff. */
  newPath: string
  /** Indicates if the file was renamed. */
  isRenamed: boolean
  /** Indicates if the file is new. */
  isNew?: boolean
  /** Indicates if the file is deleted. */
  isDeleted?: boolean
  /** An array of hunks representing the changes in the file. */
  hunks: Hunk[]
}

// Represents a hunk of changes in a file, including the context and line changes.
export interface Hunk {
  /** The content of the hunk, typically the @@ line in a diff. */
  content: string // the @@ line
  /** The starting line number in the original file where the hunk begins. */
  oldStart: number
  /** The number of lines in the original file affected by the hunk. */
  oldLines: number
  /** The starting line number in the new file where the hunk begins. */
  newStart: number
  /** The number of lines in the new file affected by the hunk. */
  newLines: number
  /** An array of line changes within the hunk. */
  changes: DiffLine[]
}

// Represents a line change in a diff, which can be a context, addition, or deletion.
export type DiffLine = ContextLine | AddLine | DeleteLine

// Base interface for a line in a diff, containing common properties.
export interface BaseLine {
  /** The content of the line. */
  content: string
  /** The line number in the original file, or null if not applicable. */
  lineNumberOld: number | null
  /** The line number in the new file, or null if not applicable. */
  lineNumberNew: number | null
}

// Represents a context line in a diff, which is unchanged between the old and new files.
export interface ContextLine extends BaseLine {
  /** The type of line, which is 'context' for unchanged lines. */
  type: 'context'
}

// Represents an added line in a diff.
export interface AddLine extends BaseLine {
  /** The type of line, which is 'add' for added lines. */
  type: 'add'
}

// Represents a deleted line in a diff.
export interface DeleteLine extends BaseLine {
  /** The type of line, which is 'delete' for deleted lines. */
  type: 'delete'
}
