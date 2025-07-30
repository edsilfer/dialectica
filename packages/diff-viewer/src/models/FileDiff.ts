import type { RawChunk, RawFile } from 'diffparser'
import { detectLanguage } from '../../../commons/src/utils/language-utils'
import { HunkDirection } from '../components/file-list/models/types'
import { Hunk } from './Hunk'
import { DiffLine } from './LineDiff'

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
  isDeleted: boolean
  /** The programming language of the file. */
  language: string
  /** An array of hunks representing the changes in the file. */
  hunks: Hunk[]
  /** The raw content of the file diff. */
  rawContent: string
  /** Indicates if the file is binary. */
  isBinary?: boolean
  /** Optional file size in bytes. */
  bytes?: number

  constructor(properties: {
    oldPath: string
    newPath: string
    isRenamed: boolean
    isNew?: boolean
    isDeleted: boolean
    language: string
    hunks: Hunk[]
    rawContent: string
    isBinary?: boolean
    bytes?: number | string
  }) {
    this.oldPath = properties.oldPath
    this.newPath = properties.newPath
    this.isRenamed = properties.isRenamed
    this.isNew = properties.isNew
    this.isDeleted = properties.isDeleted
    this.language = properties.language
    this.hunks = properties.hunks
    this.rawContent = properties.rawContent
    this.isBinary = properties.isBinary
    if (properties.bytes !== undefined) {
      this.bytes = typeof properties.bytes === 'string' ? parseInt(properties.bytes, 10) : properties.bytes
    }
  }

  // A consistent key for the file, preferring the real file path over /dev/null.
  get key(): string {
    return this.isDeleted ? this.oldPath : this.newPath
  }

  get lineCount(): number {
    return this.rawContent.split('\n').length
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
    const isDeleted = rawFile.to === NULL_PATH
    const isBinary = FileDiff.checkIsBinary(rawContent, rawFile.from, rawFile.to)
    let bytes: number | undefined = undefined

    if (isBinary) {
      const gitBinaryPatchMatch = rawContent.match(/GIT binary patch[\s\S]*?literal (\d+)/)
      if (gitBinaryPatchMatch) bytes = parseInt(gitBinaryPatchMatch[1], 10)
    } else {
      // For text files, only extract the value if the diff gives it to us (e.g., a 'size' or similar line)
      const sizeLineMatch = rawContent.match(/# File size: (\d+) bytes/)
      if (sizeLineMatch) bytes = parseInt(sizeLineMatch[1], 10)
    }

    return new FileDiff({
      rawContent: rawContent,
      oldPath: rawFile.from,
      newPath: rawFile.to,
      isRenamed: rawFile.from !== rawFile.to,
      isNew: rawFile.from === NULL_PATH,
      isDeleted,
      language: detectLanguage(rawFile.to !== NULL_PATH ? rawFile.to : rawFile.from),
      hunks: rawFile.chunks.map((c: RawChunk) => Hunk.build(c.changes, filePath)),
      isBinary,
      bytes,
    })
  }

  /**
   * @param lines     - The lines to add to the hunk
   * @param hunkData  - The hunk data to update
   * @param direction - The direction of the hunk
   * @returns           A new FileDiff instance with the updated hunk
   */
  public withContext(lines: DiffLine[], hunkData: { prev?: Hunk; curr: Hunk }, direction: HunkDirection): FileDiff {
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

  /**
   * Compares two FileDiff instances for sorting.
   * - Files are sorted by their full path alphabetically
   * - The comparison considers the directory structure
   *
   * @param a - The first FileDiff to compare
   * @param b - The second FileDiff to compare
   * @returns - Negative if a should come before b, positive if b should come before a, 0 if equal
   */
  static compare(a: FileDiff, b: FileDiff): number {
    const segA = a.key.split('/')
    const segB = b.key.split('/')

    const lenA = segA.length
    const lenB = segB.length
    const minLen = Math.min(lenA, lenB)

    const isLast = (idx: number, seg: string[]) => {
      return idx === seg.length - 1
    }

    for (let i = 0; i < minLen; i++) {
      if (segA[i] === segB[i]) {
        continue
      } else {
        if (isLast(i, segA) && isLast(i, segB)) {
          return segA[i].localeCompare(segB[i])
        } else if (isLast(i, segA)) {
          return 1
        } else if (isLast(i, segB)) {
          return -1
        } else {
          return segA[i].localeCompare(segB[i])
        }
      }
    }
    return lenB - lenA
  }

  // PRIVATE METHODS ----------------------------------------------------------------------------------------
  private static checkIsBinary(rawContent: string, oldPath: string, newPath: string): boolean {
    const binaryDiffRegex = /^Binary files (.+) and (.+) differ$/gm
    let match
    while ((match = binaryDiffRegex.exec(rawContent)) !== null) {
      const left = match[1].replace(/^a\//, '')
      const right = match[2].replace(/^b\//, '')
      const oldNorm = oldPath.replace(/^a\//, '').replace(/^b\//, '')
      const newNorm = newPath.replace(/^a\//, '').replace(/^b\//, '')
      if ((left === oldNorm && right === newNorm) || (left === newNorm && right === oldNorm)) {
        return true
      }
    }
    // Also treat as binary if 'GIT binary patch' is present
    if (/GIT binary patch/.test(rawContent)) {
      return true
    }
    return false
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

  private addContext(lines: DiffLine[], hunkToUpdate: Hunk): FileDiff {
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

  private mergeHunks(lines: DiffLine[], prev: Hunk, curr: Hunk): FileDiff {
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
