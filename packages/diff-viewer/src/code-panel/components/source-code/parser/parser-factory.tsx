import { LineParser } from './commons'
import { UnifiedParser } from './unified-parser'
import { SplitParser } from './split-parser'

/**
 * Factory class for creating parser instances based on the desired view type.
 */
export class ParserFactory {
  /**
   * Builds and returns a parser instance based on the specified type.
   *
   * @param type - The type of parser to build ('unified' or 'split')
   * @returns      A parser instance that implements the LineParser interface
   * @throws       Error if an invalid parser type is provided
   */
  static build(type: 'unified' | 'split'): LineParser {
    switch (type) {
      case 'unified':
        return new UnifiedParser()
      case 'split':
        return new SplitParser()
      default:
        throw new Error(`Invalid parser type: ${type as string}. Must be 'unified' or 'split'.`)
    }
  }
}
