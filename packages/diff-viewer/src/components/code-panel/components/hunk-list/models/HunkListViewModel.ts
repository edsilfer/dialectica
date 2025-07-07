import { FileDiff } from '../../../../../models/FileDiff'
import { Hunk, HunkRelation } from '../../../../../models/Hunk'
import { LineDiff } from '../../../../../models/LineDiff'
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
   * @param lines     - The lines to load
   * @param direction - The direction of the hunk
   * @returns         - A new HunkListViewModel instance with the updated file diff
   */
  public loadLines(hunkLine: LinePair, lines: Map<number, string>, direction: HunkDirection): HunkListViewModel {
    const parsedLines = Array.from(lines.entries()).map(([l, c]) => new LineDiff(c, 'empty', +l, +l))
    const hunkInfo = this.hunkInfoCache.get(hunkLine)
    if (!hunkInfo) return this
    const newFileDiff = this.fileDiff.withContext(parsedLines, hunkInfo, direction)
    if (newFileDiff === this.fileDiff) return this
    return new HunkListViewModel(newFileDiff, this.displayMode, this.maxLinesToFetch)
  }

  /**
   * Computes the range of lines to load based on the base line and direction.
   *
   * @param baseLine  - The base line used to find the reference hunk
   * @param direction - Where the user wants to load more lines
   * @returns         - The range of lines to load
   */
  public getLoadRange(baseLine: LinePair, direction: HunkDirection): [number, number] {
    const curr = baseLine.lineNumberLeft ?? baseLine.lineNumberRight ?? 0
    const prevLine = curr - 1
    const nextLine = curr + 1
    const hunkInfo = this.hunkInfoCache.get(baseLine)
    const prevHunkLastLine = hunkInfo?.prevHunkLastLine ?? 0
    switch (direction) {
      case 'up':
        return [Math.max(curr - this.maxLinesToFetch, 1), prevLine]
      case 'down':
        return [nextLine, nextLine + this.maxLinesToFetch]
      case 'in_down':
        return [prevHunkLastLine, prevHunkLastLine + this.maxLinesToFetch]
      case 'in_up':
        return [prevLine - this.maxLinesToFetch, prevLine]
      case 'out':
        return [prevHunkLastLine, curr - 1]
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
      const hunkFirstLine = hunk.oldStart
      const hunkHeaderPair = this.buildHunkHeader(hunkFirstLine, hunk, direction)
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
    const hunkLastLine = lastHunk.oldStart + lastHunk.oldLines - 1
    const footerPair = this.buildHunkHeader(hunkLastLine, lastHunk, 'down')
    this.hunkInfoCache.set(footerPair, { curr: lastHunk })
    return footerPair
  }

  private buildHunkHeader(number: number, hunk: Hunk, direction: HunkDirection): LinePair {
    const hunkLineDiff = new LineDiff(hunk.header, 'hunk', null, null)
    const hunkLinePair = this.parser.parse([hunkLineDiff])[0]
    hunkLinePair.hunkDirection = direction
    hunkLinePair.lineNumberLeft = number
    return hunkLinePair
  }
}
