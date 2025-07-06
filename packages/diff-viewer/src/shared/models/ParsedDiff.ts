import type { RawFile } from 'diffparser'
import diffparser from 'diffparser'
import { File } from './File'

// Represents the parsed diff containing a list of file differences.
export class ParsedDiff {
  /** The raw diff text that was parsed. */
  rawContent: string
  /** An array of file differences parsed from the diff text. */
  files: File[]

  constructor(rawContent: string, files: File[]) {
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
      return File.build(rawContent, rawFile)
    })
    return new ParsedDiff(rawContent, files)
  }
}
