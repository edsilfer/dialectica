import type { RawFile } from 'diffparser'
import diffparser from 'diffparser'
import { FileDiff } from './FileDiff'

// Represents the parsed diff containing a list of file differences.
export class ParsedDiff {
  /** The raw diff text that was parsed. */
  rawContent: string
  /** An array of file differences parsed from the diff text. */
  files: FileDiff[]

  constructor(rawContent: string, files: FileDiff[]) {
    this.rawContent = rawContent
    this.files = files
  }

  /**
   * Creates a new ParsedDiff instance from raw diff content.
   *
   * @param rawContent - The raw diff text to parse
   * @returns            A new ParsedDiff instance
   */
  static build(rawContent: string): ParsedDiff {
    const raw = diffparser(rawContent)
    const files = raw.map((rawFile: RawFile) => {
      return FileDiff.build(rawContent, rawFile)
    })
    return new ParsedDiff(rawContent, files)
  }
}
