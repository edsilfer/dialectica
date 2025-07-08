import { LineDiff } from '../../../../../models/LineDiff'
import { LinePair } from '../../hunk-list/models/LinePair'
import { LineParser } from './parser'

/**
 * Abstract base class for parsers that provides common parsing logic.
 * Extends LineParser and implements shared functionality for both unified and split parsers.
 */
export abstract class CommonParser implements LineParser {
  /** {@inheritDoc LineParser.parse} */
  parse(lines: LineDiff[], language: string): LinePair[] {
    const linePairs: LinePair[] = []

    lines.forEach((line) => {
      this.processLine(line, linePairs, language)
    })

    return linePairs
  }

  /**
   * @param change   - The change to process
   * @param rows     - The list of rows to process
   * @param language - The language to highlight the changes in
   */
  protected abstract processLine(change: LineDiff, rows: LinePair[], language: string): void
}
