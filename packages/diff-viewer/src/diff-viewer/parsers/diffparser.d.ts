/**
 * README
 * ------
 *  - This file is a TypeScript declaration file for the 'diffparser' module.
 *  - The .d.ts extension stands for "Declaration File for TypeScript".
 *  - These files are used to declare types for modules that do not provide them, such as JavaScript libraries without TypeScript support.
 */

declare module 'diffparser' {
  /**
   * Parses a diff text and returns an array of RawFile objects.
   * @param diffText - The diff text to parse.
   * @returns An array of RawFile objects representing the parsed diff.
   */
  const parse: (diffText: string) => RawFile[]
  export default parse

  /** Represents a line change in a diff, which can be a context, addition, or deletion. */
  export interface RawLine {
    /** The content of the line. */
    content: string
    /** The line number in the original file, or undefined if not applicable. */
    oldLine?: number
    /** The line number in the new file, or undefined if not applicable. */
    newLine?: number
    /** The type of line change: 'add' for additions, 'del' for deletions, 'normal' for unchanged lines. */
    type: 'add' | 'del' | 'normal'
  }

  /** Represents a chunk of changes in a file, including the context and line changes. */
  export interface RawChunk {
    /** The content of the chunk, typically the @@ line in a diff. */
    content: string
    /** The starting line number in the original file where the chunk begins. */
    oldStart: number
    /** The number of lines in the original file affected by the chunk. */
    oldLines: number
    /** The starting line number in the new file where the chunk begins. */
    newStart: number
    /** The number of lines in the new file affected by the chunk. */
    newLines: number
    /** An array of line changes within the chunk. */
    changes: RawLine[]
  }

  /** Represents a raw file in a diff, including its name and chunks of changes. */
  export interface RawFile {
    /** The original name of the file. */
    from: string
    /** The new name of the file after the diff. */
    to: string
    /** An array of chunks representing the changes in the file. */
    chunks: RawChunk[]
    /** The number of deletions in the file. */
    deletions: number
    /** The number of additions in the file. */
    additions: number
  }
}
