import { DiffLine } from './Line'

// Represents the direction a hunk can be expanded
export type ExpandDirection = 'up' | 'down' | 'in' | 'out'

// Represents a hunk of changes in a file, including the context and line changes.
export class Hunk {
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
  /** The direction this hunk can be expanded. */
  expandDirection: ExpandDirection
  /** The file path this hunk belongs to. */
  filePath: string
  /** The dynamically built header for this hunk. */
  header: string

  constructor(
    content: string,
    oldStart: number,
    oldLines: number,
    newStart: number,
    newLines: number,
    changes: DiffLine[],
    filePath: string = '',
    expandDirection: ExpandDirection = 'in',
  ) {
    this.content = content
    this.oldStart = oldStart
    this.oldLines = oldLines
    this.newStart = newStart
    this.newLines = newLines
    this.changes = changes
    this.filePath = filePath
    this.expandDirection = expandDirection
    this.header = this.buildHeader()
  }

  /**
   * Gets the content of the hunk as an array of strings, combining the header and body lines.
   * @returns An array containing the header and all body lines (excluding existing @@ lines).
   */
  get contentLines(): string[] {
    const body = this.changes.map((line) => line.content).filter((line) => !line.startsWith('@@'))
    return [this.header, ...body]
  }

  private buildHeader(): string {
    if (!this.changes.length) return '' // synthetic tail

    const firstLine = this.changes[0]
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

    const bodyCount = this.changes.map((line) => line.content).filter((line) => !line.startsWith('@@')).length
    const context = hasHeader ? (firstText.split('@@').pop()?.trim() ?? '') : firstText.trim()
    return `@@ -${this.oldStart},${bodyCount} +${this.newStart},${bodyCount} @@ ${context}`
  }
}
