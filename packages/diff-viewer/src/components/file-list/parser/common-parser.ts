import { DiffLine } from '../../../models/LineDiff'
import { LineMetadata } from '../models/LineMetadata'
import { LineParser } from './parser'

/**
 * Abstract base class for parsers that provides common parsing logic.
 * Extends LineParser and implements shared functionality for both unified and split parsers.
 */
export abstract class CommonParser implements LineParser {
  /** {@inheritDoc LineParser.parse} */
  parse(lines: DiffLine[], language: string): LineMetadata[] {
    const linePairs: LineMetadata[] = []

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
  protected abstract processLine(change: DiffLine, rows: LineMetadata[], language: string): void
}
