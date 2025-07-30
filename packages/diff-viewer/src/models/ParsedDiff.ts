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
    const fileContentMap = ParsedDiff.getFileContent(rawContent)
    const files = raw.map((rawFile: RawFile) => {
      // For deleted files, the content is stored under the original file path, not /dev/null
      const contentKey = rawFile.to === '/dev/null' ? rawFile.from : rawFile.to
      return FileDiff.build((fileContentMap.get(contentKey) ?? []).join('\n'), rawFile)
    })
    return new ParsedDiff(rawContent, files)
  }

  private static getFileContent(rawContent: string): Map<string, string[]> {
    const allLines = rawContent.split('\n')
    const result: Map<string, string[]> = new Map()
    let currentFile = null

    for (const line of allLines) {
      if (line.startsWith('diff --git')) {
        const [, , fromPath, toPath] = line.split(' ')
        // Remove 'a/' and 'b/' prefixes to match diffparser output
        const fromFile = fromPath.replace(/^[ab]\//, '')
        const toFile = toPath.replace(/^[ab]\//, '')
        const newFile = toFile === '/dev/null' ? fromFile : toFile
        if (!result.has(newFile)) result.set(newFile, [])
        currentFile = newFile
      } else if (currentFile) {
        if (!result.has(currentFile)) result.set(currentFile, [])
        result.get(currentFile)!.push(line)
      }
    }

    return result
  }
}
