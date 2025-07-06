import { ParsedDiff } from '../models/ParsedDiff'

// Represents a parser for diff text, which converts raw diff text into a structured ParsedDiff object.
export interface IDiffParser {
  /**
   * Parses the given diff text and returns a structured ParsedDiff object.
   * @param diffText - The raw diff text to be parsed.
   * @returns A ParsedDiff object containing the parsed diff information.
   */
  parse(diffText: string): ParsedDiff
}
