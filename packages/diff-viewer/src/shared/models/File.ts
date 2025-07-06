import { Hunk } from './Hunk'
import { DiffLine } from './Line'
import type { RawChunk, RawFile, RawLine } from 'diffparser'
import { detectLanguage } from '../parsers/language-utils'

/**
 * - diffparse library's convention is to use `/dev/null` as the path for new or deleted files
 * - we use this constant to check for this specific path to determine the file's status.
 */
const NULL_PATH = '/dev/null'

// Represents the differences in a single file, including path changes and hunks.
export class File {
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
  /** The programming language of the file. */
  language: string
  /** An array of hunks representing the changes in the file. */
  hunks: Hunk[]
  /** The raw content of the file diff. */
  rawContent: string

  constructor(properties: {
    oldPath: string
    newPath: string
    isRenamed: boolean
    isNew?: boolean
    isDeleted?: boolean
    language: string
    hunks: Hunk[]
    rawContent: string
  }) {
    this.oldPath = properties.oldPath
    this.newPath = properties.newPath
    this.isRenamed = properties.isRenamed
    this.isNew = properties.isNew
    this.isDeleted = properties.isDeleted
    this.language = properties.language
    this.hunks = properties.hunks
    this.rawContent = properties.rawContent
    this.processHunks()
  }

  /**
   * Creates a new File instance from raw diff content and a parsed raw file.
   *
   * @param rawContent - The raw diff text
   * @param rawFile    - The parsed raw file from diffparser
   * @returns            A new File instance
   */
  static build(rawContent: string, rawFile: RawFile): File {
    const hunks: Hunk[] = rawFile.chunks.map((chunk: RawChunk) => {
      const changes: DiffLine[] = chunk.changes.map((line: RawLine) => {
        const base = {
          content: line.content.substring(1), // strip diff prefix (+|-| )
          lineNumberOld: line.oldLine ?? null,
          lineNumberNew: line.newLine ?? null,
        }

        switch (line.type) {
          case 'add':
            return { ...base, type: 'add' }
          case 'del':
            return { ...base, type: 'delete' }
          case 'normal':
            return { ...base, type: 'context' }
          default:
            throw new Error('Unknown line type encountered')
        }
      })

      return new Hunk(
        chunk.content,
        chunk.oldStart,
        chunk.oldLines,
        chunk.newStart,
        chunk.newLines,
        changes,
        rawFile.to !== NULL_PATH ? rawFile.to : rawFile.from,
        'in', // placeholder, will be reassigned in processHunks
      )
    })

    return new File({
      rawContent: rawContent,
      oldPath: rawFile.from,
      newPath: rawFile.to,
      isRenamed: rawFile.from !== rawFile.to,
      isNew: rawFile.from === NULL_PATH,
      isDeleted: rawFile.to === NULL_PATH,
      language: detectLanguage(rawFile.to !== NULL_PATH ? rawFile.to : rawFile.from),
      hunks, // will be post-processed by File constructor
    })
  }

  /**
   * Post-process the hunk list to:
   *   1. Assign an appropriate `expandDirection` (up | down | in | out) to every _real_ hunk.
   *   2. Append a synthetic *tail* hunk so that the UI can always render the ↓ expander glyph
   *      after the final real hunk.
   *
   * The computation replicates the historical VM logic formerly housed in
   * `DiffParserAdapter`.  Migrating it here allows the adapter to become a thin
   * parsing layer and ultimately be removed.
   */
  private processHunks(): void {
    if (!this.hunks?.length) return

    const OUT_THRESHOLD = 2_000_000 // matches legacy viewer behaviour

    // 1. Determine direction for each real hunk (mutate in-place)
    for (let i = 0; i < this.hunks.length; i++) {
      const current = this.hunks[i]

      // Default direction for non-first hunks
      let dir: typeof current.expandDirection = 'in'

      if (i === 0) {
        // First hunk ⇒ expandable "up" if there is hidden content above
        dir = current.newStart > 1 ? 'up' : 'in'
      } else {
        const prev = this.hunks[i - 1]
        const prevLastLine = prev.newStart + prev.newLines - 1
        const gap = current.newStart - prevLastLine - 1
        if (gap >= OUT_THRESHOLD) {
          dir = 'out'
        }
      }

      current.expandDirection = dir
    }

    // 2. Append a synthetic tail hunk so the viewer can always show a ↓ expander
    const lastReal = this.hunks[this.hunks.length - 1]
    const lastRealEnd = lastReal.newStart + lastReal.newLines - 1

    const tailStart = lastRealEnd + 1
    const tailHeader = `@@ -${tailStart},0 +${tailStart},0 @@`

    const tail = new Hunk(tailHeader, tailStart, 0, tailStart, 0, [], this.newPath || this.oldPath, 'down')

    this.hunks.push(tail)
  }

  // A consistent key for the file, preferring newPath over oldPath.
  get key(): string {
    return this.newPath || this.oldPath
  }
}
