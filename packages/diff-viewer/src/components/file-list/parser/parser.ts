import { DiffLine } from '../../../models/LineDiff'
import { LineMetadata } from '../models/LineMetadata'
import { DisplayType } from '../models/types'
import { SplitLineParser } from './split-parser'
import { UnifiedLineParser } from './unified-parser'

export interface LineParser {
  /**
   * @param lines - The array of LineDiff to parse
   * @param language - The language to highlight the changes in
   * @returns       An array of LinePair objects representing the diff in a format suitable for UI rendering
   */
  parse(lines: DiffLine[], language: string): LineMetadata[]
}

/**
 * Factory class for creating lightweight line parser instances based on the desired view type.
 */
export class LineParserFactory {
  /**
   * Builds and returns a parser instance based on the specified type.
   *
   * @param type - The type of parser to build ('unified' or 'split')
   * @returns      A parser instance that implements the LineParser interface
   * @throws       Error if an invalid parser type is provided
   */
  static build(type: DisplayType): LineParser {
    switch (type) {
      case 'unified':
        return new UnifiedLineParser()
      case 'split':
        return new SplitLineParser()
      default:
        throw new Error(`Invalid parser type: ${type as string}. Must be 'unified' or 'split'.`)
    }
  }
}
