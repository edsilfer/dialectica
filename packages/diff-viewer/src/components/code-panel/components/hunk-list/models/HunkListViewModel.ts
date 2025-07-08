import { FileDiff } from '../../../../../models/FileDiff'
import { Hunk, HunkRelation } from '../../../../../models/Hunk'
import { LineDiff } from '../../../../../models/LineDiff'
import { LoadMoreLinesResult } from '../../../../diff-viewer/types'
import { LineParser, LineParserFactory } from '../parser/parser'
import { DisplayType, HunkDirection } from '../types'
import { LinePair } from './LinePair'

interface HunkInfo {
  /* The previous hunk, if any */
  prev?: Hunk
  /* The current hunk */
  curr: Hunk
  /* The last line number of the previous hunk, if any */
  prevHunkLastLine?: number
}

export interface RangePair {
  /* The range of lines to load for the left file */
  leftRange: Range
  /* The range of lines to load for the right file */
  rightRange: Range
}

export class HunkListViewModel {
  private readonly fileDiff: FileDiff
  private hunks: Hunk[] = []
  private hunkInfoCache = new Map<LinePair, HunkInfo>()
  private readonly displayMode: DisplayType
  private readonly maxLinesToFetch: number
  private _linePairs?: LinePair[]
  private readonly parser: LineParser

  constructor(fileDiff: FileDiff, displayMode: DisplayType, maxLinesToFetch: number, linePairs?: LinePair[]) {
    this.fileDiff = fileDiff
    this.hunks = fileDiff.hunks
    this.displayMode = displayMode
    this.maxLinesToFetch = maxLinesToFetch
    this._linePairs = linePairs
    this.parser = LineParserFactory.build(this.displayMode)
  }

  get filePath(): string {
    return this.fileDiff.key
  }

  get linePairs(): LinePair[] {
    if (!this._linePairs) this._linePairs = this.computeLinePairs()
    return this._linePairs
  }

  /**
   * Loads more context lines into the hunk.
   *
   * @param hunkLine  - The based line used to find the hunk to update
   * @param result    - The lines to load from both old and new file versions
   * @param direction - The direction of the hunk
   * @returns         - A new HunkListViewModel instance with the updated file diff
   */
  public loadLines(hunkLine: LinePair, result: LoadMoreLinesResult, direction: HunkDirection): HunkListViewModel {
    const parsedLines = this.buildContextLines(result.leftLines, result.rightLines)
    const hunkInfo = this.hunkInfoCache.get(hunkLine)
    if (!hunkInfo) return this
    const rightFileDiff = this.fileDiff.withContext(parsedLines, hunkInfo, direction)
    if (rightFileDiff === this.fileDiff) return this
    return new HunkListViewModel(rightFileDiff, this.displayMode, this.maxLinesToFetch)
  }

  /**
   * Builds context lines for both old and new line maps.
   *
   * @param leftLines  - Lines from the old file version
   * @param rightLines - Lines from the new file version
   * @returns          - Array of LineDiff objects representing context lines
   */
  private buildContextLines(leftLines: Map<number, string>, rightLines: Map<number, string>): LineDiff[] {
    const contextLines: LineDiff[] = []
    const allLeftLineNum = Array.from(leftLines.keys()).sort((a, b) => a - b)
    const allRightLineNum = Array.from(rightLines.keys()).sort((a, b) => a - b)
    // The content should be the same on both sides
    const processedLines = new Set<string>()

    for (const rightLineNum of allLeftLineNum) {
      const leftContent = leftLines.get(rightLineNum) ?? ''
      const matchingRightLineNum = this.searchRightLine(rightLineNum, rightLines, leftContent)

      // The content should be identical (or very similar) for context lines. Use left line num as ref.
      const lineDiff = new LineDiff(leftContent, 'empty', rightLineNum, matchingRightLineNum ?? rightLineNum)
      contextLines.push(lineDiff)

      // Mark as processed to avoid duplicates
      if (matchingRightLineNum) {
        processedLines.add(`new:${matchingRightLineNum}`)
      }
      processedLines.add(`old:${rightLineNum}`)
    }

    // Process remaining new lines that weren't matched with old lines
    for (const rightLineNum of allRightLineNum) {
      if (processedLines.has(`new:${rightLineNum}`)) continue
      const newContent = rightLines.get(rightLineNum) ?? ''
      // A line that exists in the right but not in the left. Can happen when files diverged significantly.
      const lineDiff = new LineDiff(newContent, 'empty', null, rightLineNum)
      contextLines.push(lineDiff)
    }

    // Sort by line number (prioritizing left)
    contextLines.sort((a, b) => {
      const aRef = a.lineNumberOld ?? a.lineNumberNew ?? 0
      const bRef = b.lineNumberOld ?? b.lineNumberNew ?? 0
      return aRef - bRef
    })

    return contextLines
  }

  /**
   * Finds the corresponding new line number on the right based on the left line number.
   *
   * @param left        - The left file line number
   * @param rightLines  - Map of new file lines
   * @param leftContent - Content of the left line
   * @returns           - The corresponding new line number, or null if not found
   */
  private searchRightLine(left: number, rightLines: Map<number, string>, leftContent: string): number | null {
    // Search for the right line within a small range of the left line
    const searchRange = 5

    const matches = (line: number) => rightLines.has(line) && rightLines.get(line) === leftContent

    if (matches(left)) return left

    for (let offset = 1; offset <= searchRange; offset++) {
      const lineAbove = left - offset
      if (matches(lineAbove)) return lineAbove

      const lineBelow = left + offset
      if (matches(lineBelow)) return lineBelow
    }

    return null
  }

  /**
   * Computes the range of lines to load based on the base line and direction.
   *
   * @param baseLine  - The base line used to find the reference hunk
   * @param direction - Where the user wants to load more lines
   * @returns         - The ranges of lines to load for both old and new files
   */
  public getLoadRange(baseLine: LinePair, direction: HunkDirection): RangePair {
    const currOld = baseLine.lineNumberLeft ?? 0
    const currNew = baseLine.lineNumberRight ?? 0
    const hunkInfo = this.hunkInfoCache.get(baseLine)
    const prevHunk = hunkInfo?.prev

    switch (direction) {
      case 'up': {
        const oldStart = Math.max(currOld - this.maxLinesToFetch, 1)
        const oldEnd = Math.max(currOld - 1, 1)
        const newStart = Math.max(currNew - this.maxLinesToFetch, 1)
        const newEnd = Math.max(currNew - 1, 1)
        return {
          leftRange: { start: oldStart, end: oldEnd },
          rightRange: { start: newStart, end: newEnd },
        }
      }

      case 'down': {
        const oldStart = currOld + 1
        const oldEnd = currOld + this.maxLinesToFetch
        const newStart = currNew + 1
        const newEnd = currNew + this.maxLinesToFetch
        return {
          leftRange: { start: oldStart, end: oldEnd },
          rightRange: { start: newStart, end: newEnd },
        }
      }

      case 'in_down': {
        const prevHunkLastOld = prevHunk ? prevHunk.oldStart + prevHunk.oldLines - 1 : 0
        const prevHunkLastNew = prevHunk ? prevHunk.newStart + prevHunk.newLines - 1 : 0
        const oldStart = prevHunkLastOld + 1
        const oldEnd = Math.min(prevHunkLastOld + this.maxLinesToFetch, currOld - 1)
        const newStart = prevHunkLastNew + 1
        const newEnd = Math.min(prevHunkLastNew + this.maxLinesToFetch, currNew - 1)
        return {
          leftRange: { start: oldStart, end: Math.max(oldEnd, oldStart) },
          rightRange: { start: newStart, end: Math.max(newEnd, newStart) },
        }
      }

      case 'in_up': {
        const oldStart = Math.max(currOld - this.maxLinesToFetch, 1)
        const oldEnd = currOld - 1
        const newStart = Math.max(currNew - this.maxLinesToFetch, 1)
        const newEnd = currNew - 1
        return {
          leftRange: { start: oldStart, end: Math.max(oldEnd, oldStart) },
          rightRange: { start: newStart, end: Math.max(newEnd, newStart) },
        }
      }

      case 'out': {
        const prevHunkLastOld = prevHunk ? prevHunk.oldStart + prevHunk.oldLines - 1 : 0
        const prevHunkLastNew = prevHunk ? prevHunk.newStart + prevHunk.newLines - 1 : 0
        const oldStart = prevHunkLastOld + 1
        const oldEnd = currOld - 1
        const newStart = prevHunkLastNew + 1
        const newEnd = currNew - 1
        return {
          leftRange: { start: oldStart, end: Math.max(oldEnd, oldStart) },
          rightRange: { start: newStart, end: Math.max(newEnd, newStart) },
        }
      }
      default:
        throw new Error(`Invalid direction: ${direction}`)
    }
  }

  private computeLinePairs(): LinePair[] {
    this.hunkInfoCache.clear()

    const linePairs: LinePair[] = []
    let prevHunk: Hunk | undefined = undefined

    for (const hunk of this.hunks) {
      linePairs.push(...this.getHunkLinePairs(hunk, prevHunk))
      prevHunk = hunk
    }

    const lastHunk = this.hunks.at(-1)
    if (lastHunk) {
      linePairs.push(this.buildFooterHunk(lastHunk))
    }

    return linePairs
  }

  private getHunkLinePairs(hunk: Hunk, prevHunk: Hunk | undefined): LinePair[] {
    const linePairs: LinePair[] = []
    const relation = hunk.getRelationTo(prevHunk)
    const direction = this.toDirection(relation)

    if (direction) {
      const hunkHeaderPair = this.buildHunkHeader(hunk, direction)
      const prevHunkLastLine = prevHunk ? prevHunk.oldStart + prevHunk.oldLines : undefined
      this.hunkInfoCache.set(hunkHeaderPair, { prev: prevHunk, curr: hunk, prevHunkLastLine })
      linePairs.push(hunkHeaderPair)
    }

    const lineDiffs = this.parser.parse(hunk.changes)
    linePairs.push(...lineDiffs)

    return linePairs
  }

  private toDirection(relation: HunkRelation): HunkDirection | undefined {
    switch (relation) {
      case 'start-of-file':
        return 'up'
      case 'small-gap':
        return 'out'
      case 'large-gap':
        return 'in'
      case 'adjacent':
      default:
        return undefined
    }
  }

  // We add an extra empty hunk to hold the load more button.
  private buildFooterHunk(lastHunk: Hunk): LinePair {
    const hunkLineDiff = new LineDiff(lastHunk.header, 'hunk', null, null)
    const hunkLinePair = this.parser.parse([hunkLineDiff])[0]
    hunkLinePair.hunkDirection = 'down'
    // Footer represents the line after the hunk ends
    hunkLinePair.lineNumberLeft = lastHunk.oldStart + lastHunk.oldLines
    hunkLinePair.lineNumberRight = lastHunk.newStart + lastHunk.newLines
    this.hunkInfoCache.set(hunkLinePair, { curr: lastHunk })
    return hunkLinePair
  }

  private buildHunkHeader(hunk: Hunk, direction: HunkDirection): LinePair {
    const hunkLineDiff = new LineDiff(hunk.header, 'hunk', null, null)
    const hunkLinePair = this.parser.parse([hunkLineDiff])[0]
    hunkLinePair.hunkDirection = direction
    hunkLinePair.lineNumberLeft = hunk.oldStart
    hunkLinePair.lineNumberRight = hunk.newStart
    return hunkLinePair
  }
}
