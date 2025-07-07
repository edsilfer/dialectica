import { LineDiff } from './LineDiff'
import type { RawLine } from 'diffparser'

export type HunkRelation = 'adjacent' | 'start-of-file' | 'small-gap' | 'large-gap'

// Represents a hunk of changes in a file, including the context and line changes.
export class Hunk {
  /** The starting line number in the original file where the hunk begins. */
  public oldStart: number
  /** The number of lines in the original file affected by the hunk. */
  public oldLines: number
  /** The starting line number in the new file where the hunk begins. */
  public newStart: number
  /** The number of lines in the new file affected by the hunk. */
  public newLines: number
  /** An array of line changes within the hunk. */
  private _changes: LineDiff[]
  /** The file path this hunk belongs to. */
  public filePath: string
  /** The dynamically built header for this hunk. */
  public get header(): string {
    return this.buildHeader()
  }

  public get changes(): LineDiff[] {
    return this._changes
  }

  constructor(
    oldStart: number,
    oldLines: number,
    newStart: number,
    newLines: number,
    changes: LineDiff[],
    filePath: string = '',
  ) {
    this.oldStart = oldStart
    this.oldLines = oldLines
    this.newStart = newStart
    this.newLines = newLines
    this._changes = changes
    this.filePath = filePath
  }

  /**
   * Adds new changes to the hunk.
   *
   * @param newChanges - The new changes to add
   * @returns          - A new Hunk instance with the updated changes
   */
  addChanges(newChanges: LineDiff[]): Hunk {
    const allChanges = [...this._changes, ...newChanges]

    allChanges.sort((a, b) => {
      const lineA = a.lineNumberOld ?? a.lineNumberNew ?? -1
      const lineB = b.lineNumberOld ?? b.lineNumberNew ?? -1
      return lineA - lineB
    })

    const firstChange = allChanges[0]
    const lastChange = allChanges[allChanges.length - 1]

    const oldStart = firstChange.lineNumberOld ?? this.oldStart
    const newStart = firstChange.lineNumberNew ?? this.newStart

    const lastOld = lastChange.lineNumberOld ?? oldStart
    const lastNew = lastChange.lineNumberNew ?? newStart

    const oldLines = lastOld - oldStart + 1
    const newLines = lastNew - newStart + 1

    return new Hunk(oldStart, oldLines, newStart, newLines, allChanges, this.filePath)
  }

  /**
   * Computes the relation of this hunk to the previous hunk.
   *
   * @param prevHunk - The previous hunk
   * @returns        - The relation of this hunk to the previous hunk
   */
  public getRelationTo(prevHunk?: Hunk): HunkRelation {
    if (!prevHunk) {
      return this.oldStart <= 1 ? 'adjacent' : 'start-of-file'
    }

    const gap = this.oldStart - (prevHunk.oldStart + prevHunk.oldLines)

    if (gap <= 1) {
      return 'adjacent'
    }
    if (gap <= 10) {
      return 'small-gap'
    }
    return 'large-gap'
  }

  /**
   * Gets the content of the hunk as an array of strings, combining the header and body lines.
   * @returns An array containing the header and all body lines (excluding existing @@ lines).
   */
  get contentLines(): string[] {
    const body = this._changes.map((line) => line.content).filter((line) => !line.startsWith('@@'))
    return [this.header, ...body]
  }

  /**
   * Creates a new Hunk instance from a list of RawLine objects.
   *
   * @param rawLines - Array of RawLine objects representing the changes in this hunk
   * @param filePath - The file path this hunk belongs to
   * @returns        - A new Hunk instance
   */
  static build(rawLines: RawLine[], filePath: string = ''): Hunk {
    if (!rawLines.length) {
      throw new Error('Cannot build a hunk with no changes')
    }

    const changes: LineDiff[] = rawLines.map((line: RawLine) => LineDiff.build(line))
    const firstOldLine = changes.find((line) => line.lineNumberOld !== null)?.lineNumberOld ?? 1
    const firstNewLine = changes.find((line) => line.lineNumberNew !== null)?.lineNumberNew ?? 1

    let oldLines = 0
    let newLines = 0

    for (const line of changes) {
      switch (line.type) {
        case 'context':
          oldLines++
          newLines++
          break
        case 'add':
          newLines++
          break
        case 'delete':
          oldLines++
          break
      }
    }

    return new Hunk(firstOldLine, oldLines, firstNewLine, newLines, changes, filePath)
  }

  private buildHeader(): string {
    if (!this._changes.length) return '' // synthetic tail

    const firstLine = this._changes[0]
    const firstText = firstLine.content
    const hasHeader = firstText.startsWith('@@')

    /*
     * Omit header when the hunk already starts at the very top of the file
     * *and* the first displayed line is merely context (unchanged). In that
     * case there is no useful range information to communicate.
     */
    if (!hasHeader && this.oldStart === 1 && firstText.startsWith(' ')) {
      return ''
    }

    const context = hasHeader ? (firstText.split('@@').pop()?.trim() ?? '') : firstText.trim()
    return `@@ -${this.oldStart},${this.oldLines} +${this.newStart},${this.newLines} @@ ${context}`
  }
}
