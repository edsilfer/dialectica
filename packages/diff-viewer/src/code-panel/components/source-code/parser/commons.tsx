import { DiffLine } from '../../../../shared/models/Line'
import { Hunk } from '../../../../shared/models/Hunk'
import { File as FileDiff } from '../../../../shared/models/File'
import { DiffLineType, LinePair } from '../../file-viewer/types'
import { HunkDirection } from '../models/HunkHeaderViewModel'
import { highlightContent } from '../highlight-utils'
import { HunkHeaderViewModel } from '../models/HunkHeaderViewModel'

const EMPTY_LINE_PAIR: LinePair = {
  typeLeft: null,
  contentLeft: null,
  highlightedContentLeft: null,
  lineNumberLeft: null,
  typeRight: null,
  contentRight: null,
  highlightedContentRight: null,
  lineNumberRight: null,
  hunkDirection: undefined,
}

/**
 * Interface for parsing FileDiff objects into LinePair arrays for UI rendering.
 */
export interface LineParser {
  /**
   * Parses a FileDiff object and converts it into an array of LinePair objects
   *
   * @param fileDiff - The file diff object to parse
   * @returns          An array of LinePair objects representing the diff in a format suitable for UI rendering
   */
  parse(fileDiff: FileDiff): LinePair[]
}

/**
 * Abstract base class for parsers that provides common parsing logic.
 * Extends LineParser and implements shared functionality for both unified and split parsers.
 */
export abstract class CommonParser implements LineParser {
  /** {@inheritDoc LineParser.parse} */
  parse(fileDiff: FileDiff): LinePair[] {
    const linePairs: LinePair[] = []

    fileDiff.hunks.forEach((hunk, hunkIndex) => {
      const hunkLines = this.processHunk(hunk, hunkIndex, fileDiff.hunks, fileDiff.language)
      linePairs.push(...hunkLines)
    })

    return linePairs
  }

  /**
   * @param hunk      - The hunk to process
   * @param hunkIndex - The index of the hunk
   * @param hunks     - The list of hunks
   * @param language  - The language to highlight the changes in
   * @returns           The list of paired rows
   */
  protected processHunk = (hunk: Hunk, hunkIndex: number, hunks: Hunk[], language: string): LinePair[] => {
    // Synthetic tail hunk: render *only* the downward expander placeholder and exit early.
    if (hunk.changes.length === 0) {
      return [LinePairBuilder.placeholder('down')]
    }

    const rows: LinePair[] = [HunkHeaderViewModel.build(hunk, hunkIndex, hunks).toLinePair()]
    hunk.changes.filter((c) => !!c.content.trim()).forEach((change) => this.processChange(change, rows, language))

    // Add synthetic trailing expander, if needed, when this is the last hunk.
    if (hunks.length > 0 && hunkIndex === hunks.length - 1) {
      const hunkHeaders = hunks.map((h) => new HunkHeaderViewModel(h.content, ''))
      const lastDirection = HunkHeaderViewModel.parseDirection(hunkIndex, hunkHeaders)
      if (lastDirection !== 'down') {
        rows.push(LinePairBuilder.placeholder('down'))
      }
    }
    return rows
  }

  /**
   * @param change   - The change to process
   * @param rows     - The list of rows to process
   * @param language - The language to highlight the changes in
   */
  protected abstract processChange(change: DiffLine, rows: LinePair[], language: string): void
}

/**
 * Builder class for creating LinePair objects with proper defaults and highlighting.
 */
export class LinePairBuilder {
  /**
   * @param change   - The change to build a LinePair for
   * @param language - The language to highlight the change in
   * @param input    - The input to build the LinePair from
   * @returns          The built LinePair
   */
  static build(
    change: DiffLine,
    language: string,
    input: Partial<LinePair> & {
      typeLeft: DiffLineType | null
      typeRight: DiffLineType | null
    },
  ): LinePair {
    const highlighted = highlightContent(change.content, language)

    return {
      ...EMPTY_LINE_PAIR,
      ...input,
      // Only set highlighted content if not explicitly provided in input
      highlightedContentLeft: input.highlightedContentLeft ?? (input.contentLeft ? highlighted : null),
      highlightedContentRight: input.highlightedContentRight ?? (input.contentRight ? highlighted : null),
    }
  }

  /**
   * Builds a placeholder LinePair for dummy lines (like expander placeholders)
   *
   * @param direction - The direction for the hunk expander
   * @returns           A placeholder LinePair
   */
  static placeholder(direction: HunkDirection): LinePair {
    return {
      typeLeft: 'hunk',
      contentLeft: '',
      highlightedContentLeft: '',
      lineNumberLeft: null,
      typeRight: 'hunk',
      contentRight: '',
      highlightedContentRight: '',
      lineNumberRight: null,
      hunkDirection: direction,
    }
  }
}
