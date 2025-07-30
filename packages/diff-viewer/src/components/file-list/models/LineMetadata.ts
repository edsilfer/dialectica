import { DiffLineType } from '../../../models/LineDiff'
import { HunkDirection } from './types'

/**
 * - The parses will read a parsed diff line and populate this object.
 * - The row view model will use this object to feed the row components.
 */
export class LineMetadata {
  /** Left-hand side information (original file). */
  typeLeft: DiffLineType | null
  /** The content of the line */
  contentLeft: string | null
  /** The line number of the left side of the hunk. If null, the line number is not shown. */
  lineNumberLeft: number | null
  /** Right-hand side information (modified file). */
  typeRight: DiffLineType | null
  /** The content of the line */
  contentRight: string | null
  /** The line number of the right side of the hunk. If null, the line number is not shown. */
  lineNumberRight: number | null
  /** Direction for LoadMoreLines component when this is a hunk header */
  hunkDirection?: HunkDirection
  /** The language for syntax highlighting */
  language: string

  constructor(
    typeLeft: DiffLineType | null,
    contentLeft: string | null,
    lineNumberLeft: number | null,
    typeRight: DiffLineType | null,
    contentRight: string | null,
    lineNumberRight: number | null,
    language: string,
    hunkDirection?: HunkDirection,
  ) {
    this.typeLeft = typeLeft
    this.contentLeft = contentLeft
    this.lineNumberLeft = lineNumberLeft
    this.typeRight = typeRight
    this.contentRight = contentRight
    this.lineNumberRight = lineNumberRight
    this.hunkDirection = hunkDirection
    this.language = language
  }
  /**
   * Builds a LinePair with proper defaults.
   *
   * @param language - The language for syntax highlighting
   * @param input    - The input to build the LinePair from
   * @returns          The built LinePair
   */
  static build(
    language: string,
    input: Partial<LineMetadata> & {
      typeLeft: DiffLineType | null
      typeRight: DiffLineType | null
    },
  ): LineMetadata {
    const empty = LineMetadata.EMPTY

    return new LineMetadata(
      input.typeLeft,
      input.contentLeft ?? empty.contentLeft,
      input.lineNumberLeft ?? empty.lineNumberLeft,
      input.typeRight,
      input.contentRight ?? empty.contentRight,
      input.lineNumberRight ?? empty.lineNumberRight,
      language,
      input.hunkDirection ?? empty.hunkDirection,
    )
  }

  /**
   * Builds a hunk header LinePair
   *
   * @param content - The content of the hunk header
   * @param language - The language for syntax highlighting
   * @returns         A hunk header LinePair
   */
  static buildHunkLine(content: string, language: string): LineMetadata {
    return new LineMetadata('hunk', content, null, 'hunk', content, null, language, undefined)
  }

  /**
   * Creates an empty LinePair with all null values
   */
  private static get EMPTY(): LineMetadata {
    return new LineMetadata(null, null, null, null, null, null, 'text', undefined)
  }

  /**
   * Compares this LineMetadata instance with another for equality
   *
   * @param other - The other LineMetadata instance to compare with
   * @returns true if both instances have the same values, false otherwise
   */
  equals(other: LineMetadata | null): boolean {
    if (!other) return false

    return (
      this.typeLeft === other.typeLeft &&
      this.contentLeft === other.contentLeft &&
      this.lineNumberLeft === other.lineNumberLeft &&
      this.typeRight === other.typeRight &&
      this.contentRight === other.contentRight &&
      this.lineNumberRight === other.lineNumberRight &&
      this.hunkDirection === other.hunkDirection &&
      this.language === other.language
    )
  }
}
