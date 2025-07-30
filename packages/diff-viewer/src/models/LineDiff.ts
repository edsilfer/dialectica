// Represents a line change in a diff, which can be a context, addition, or deletion.
export type DiffLineType = 'context' | 'add' | 'delete' | 'hunk' | 'empty'

// Represents a line change in a diff, which can be a context, addition, or deletion.
export class DiffLine {
  /** The content of the line. */
  readonly content: string
  /** The line number in the original file, or null if not applicable. */
  readonly lineNumberOld: number | null
  /** The line number in the new file, or null if not applicable. */
  readonly lineNumberNew: number | null
  /** The type of line change. */
  readonly type: DiffLineType

  constructor(
    content: string,
    type: DiffLineType,
    lineNumberOld: number | null = null,
    lineNumberNew: number | null = null,
  ) {
    this.content = content
    this.type = type
    this.lineNumberOld = lineNumberOld
    this.lineNumberNew = lineNumberNew
  }

  /**
   * Creates a DiffLine from raw diffparser data.
   *
   * @param rawLine - The raw line from diffparser
   * @returns A new DiffLine instance
   */
  static build(rawLine: {
    content: string
    oldLine?: number
    newLine?: number
    type: 'add' | 'del' | 'normal'
  }): DiffLine {
    const content = rawLine.content.substring(1) // strip diff prefix (+|-| )
    const lineNumberOld = rawLine.oldLine ?? null
    const lineNumberNew = rawLine.newLine ?? null

    switch (rawLine.type) {
      case 'add':
        return new DiffLine(content, 'add', lineNumberOld, lineNumberNew)
      case 'del':
        return new DiffLine(content, 'delete', lineNumberOld, lineNumberNew)
      case 'normal':
        return new DiffLine(content, 'context', lineNumberOld, lineNumberNew)
      default:
        throw new Error('Unknown line type encountered')
    }
  }
}
