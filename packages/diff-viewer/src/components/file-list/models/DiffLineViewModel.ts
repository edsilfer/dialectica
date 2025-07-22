import { DiffLineType, LineDiff } from '../../../models/LineDiff'
import { highlightContent } from '../../../../../commons/src/utils/highlight-utils'
import { HunkDirection } from '../components/viewers/types'

/**
 * - For the unified viewer only the "left" fields are populated
 *   (the right side stays `null` so renderers can safely ignore it)
 * - For the split viewer both the left and right sides may be populated.
 */
export class DiffLineViewModel {
  /** Left-hand side information (original file). */
  typeLeft: DiffLineType | null
  /** The content of the line */
  contentLeft: string | null
  /** The highlighted content of the line */
  highlightedContentLeft: string | null
  /** The line number of the left side of the hunk. If null, the line number is not shown. */
  lineNumberLeft: number | null
  /** Right-hand side information (modified file). */
  typeRight: DiffLineType | null
  /** The content of the line */
  contentRight: string | null
  /** The highlighted content of the line */
  highlightedContentRight: string | null
  /** The line number of the right side of the hunk. If null, the line number is not shown. */
  lineNumberRight: number | null
  /** Direction for LoadMoreLines component when this is a hunk header */
  hunkDirection?: HunkDirection

  constructor(
    typeLeft: DiffLineType | null,
    contentLeft: string | null,
    highlightedContentLeft: string | null,
    lineNumberLeft: number | null,
    typeRight: DiffLineType | null,
    contentRight: string | null,
    highlightedContentRight: string | null,
    lineNumberRight: number | null,
    hunkDirection?: HunkDirection,
  ) {
    this.typeLeft = typeLeft
    this.contentLeft = contentLeft
    this.highlightedContentLeft = highlightedContentLeft
    this.lineNumberLeft = lineNumberLeft
    this.typeRight = typeRight
    this.contentRight = contentRight
    this.highlightedContentRight = highlightedContentRight
    this.lineNumberRight = lineNumberRight
    this.hunkDirection = hunkDirection
  }
  /**
   * Builds a LinePair from a change with proper defaults and highlighting.
   *
   * @param change   - The change to build a LinePair for
   * @param language - The language to highlight the change in
   * @param input    - The input to build the LinePair from
   * @returns          The built LinePair
   */
  static build(
    change: LineDiff,
    language: string,
    input: Partial<DiffLineViewModel> & {
      typeLeft: DiffLineType | null
      typeRight: DiffLineType | null
    },
  ): DiffLineViewModel {
    const highlighted = highlightContent(change.content, language)
    const empty = DiffLineViewModel.EMPTY

    return new DiffLineViewModel(
      input.typeLeft,
      input.contentLeft ?? empty.contentLeft,
      input.highlightedContentLeft ?? (input.contentLeft ? highlighted : null),
      input.lineNumberLeft ?? empty.lineNumberLeft,
      input.typeRight,
      input.contentRight ?? empty.contentRight,
      input.highlightedContentRight ?? (input.contentRight ? highlighted : null),
      input.lineNumberRight ?? empty.lineNumberRight,
      input.hunkDirection ?? empty.hunkDirection,
    )
  }

  /**
   * Builds a hunk header LinePair
   *
   * @param content - The content of the hunk header
   * @returns         A hunk header LinePair
   */
  static buildHunkLine(content: string): DiffLineViewModel {
    return new DiffLineViewModel('hunk', content, content, null, 'hunk', content, content, null, undefined)
  }

  /**
   * Creates an empty LinePair with all null values
   */
  private static get EMPTY(): DiffLineViewModel {
    return new DiffLineViewModel(null, null, null, null, null, null, null, null, undefined)
  }
}
