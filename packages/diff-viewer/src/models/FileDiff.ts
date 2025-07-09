import type { RawChunk, RawFile } from 'diffparser'
import { HunkDirection } from '../components/code-panel/components/types'
import { detectLanguage } from '../utils/parsers/language-utils'
import { Hunk } from './Hunk'
import { LineDiff } from './LineDiff'

/**
 * - diffparse library's convention is to use `/dev/null` as the path for new or deleted files
 * - we use this constant to check for this specific path to determine the file's status.
 */
const NULL_PATH = '/dev/null'

// Represents the differences in a single file, including path changes and hunks.
export class FileDiff {
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
  }

  // A consistent key for the file, preferring newPath over oldPath.
  get key(): string {
    return this.newPath || this.oldPath
  }

  /**
   * Creates a new File instance from raw diff content and a parsed raw file.
   *
   * @param rawContent - The raw diff text
   * @param rawFile    - The parsed raw file from diffparser
   * @returns            A new File instance
   */
  static build(rawContent: string, rawFile: RawFile): FileDiff {
    const filePath = rawFile.to !== NULL_PATH ? rawFile.to : rawFile.from
    return new FileDiff({
      rawContent: rawContent,
      oldPath: rawFile.from,
      newPath: rawFile.to,
      isRenamed: rawFile.from !== rawFile.to,
      isNew: rawFile.from === NULL_PATH,
      isDeleted: rawFile.to === NULL_PATH,
      language: detectLanguage(rawFile.to !== NULL_PATH ? rawFile.to : rawFile.from),
      hunks: rawFile.chunks.map((c: RawChunk) => Hunk.build(c.changes, filePath)),
    })
  }

  /**
   * @param lines     - The lines to add to the hunk
   * @param hunkData  - The hunk data to update
   * @param direction - The direction of the hunk
   * @returns           A new FileDiff instance with the updated hunk
   */
  public withContext(lines: LineDiff[], hunkData: { prev?: Hunk; curr: Hunk }, direction: HunkDirection): FileDiff {
    const { prev, curr } = hunkData
    if (!prev && !curr) return this

    // The 'out' direction requires merging two hunks with the new context lines between them.
    if (direction === 'out' && prev && curr) {
      return this.mergeHunks(lines, prev, curr)
    }

    const hunkToUpdate = this.findHunkFor(direction, hunkData)
    if (hunkToUpdate) return this.addContext(lines, hunkToUpdate)

    // For 'in' direction or other unhandled cases, return the original object.
    return this
  }

  private findHunkFor(direction: HunkDirection, hunkData: { prev?: Hunk; curr: Hunk }): Hunk | undefined {
    const { prev, curr } = hunkData
    switch (direction) {
      case 'up':
      case 'in_up':
      case 'down':
        return curr
      case 'in_down':
        return prev
      default:
        // 'out' is handled by the caller, 'in' results in no-op.
        return undefined
    }
  }

  private addContext(lines: LineDiff[], hunkToUpdate: Hunk): FileDiff {
    const newHunk = hunkToUpdate.addChanges(lines)
    const newHunks = [...this.hunks]
    const hunkIndex = newHunks.indexOf(hunkToUpdate)
    if (hunkIndex !== -1) {
      newHunks.splice(hunkIndex, 1, newHunk)
    } else {
      // Should not happen, but as a safeguard, return the original object.
      return this
    }
    return new FileDiff({ ...this, hunks: newHunks })
  }

  private mergeHunks(lines: LineDiff[], prev: Hunk, curr: Hunk): FileDiff {
    const changesToMerge = [...lines, ...curr.changes]
    const mergedHunk = prev.addChanges(changesToMerge)

    const newHunks = [...this.hunks]
    const prevIndex = newHunks.indexOf(prev)
    if (prevIndex !== -1) {
      newHunks.splice(prevIndex, 1, mergedHunk)
    }

    const currIndex = newHunks.indexOf(curr)
    if (currIndex !== -1) {
      newHunks.splice(currIndex, 1)
    }

    return new FileDiff({ ...this, hunks: newHunks })
  }
}
