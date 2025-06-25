import diffparser from 'diffparser'
import type { IDiffParser, ParsedDiff, FileDiff, Hunk, DiffLine } from '../types/diff'
import type { RawFile, RawChunk, RawLine } from '../types/diffparser'

export class DiffParserAdapter implements IDiffParser {
  parse(diffText: string): ParsedDiff {
    const raw = diffparser(diffText)

    const files: FileDiff[] = raw.map((file: RawFile) => {
      const hunks: Hunk[] = file.chunks.map((chunk: RawChunk) => {
        const changes: DiffLine[] = chunk.changes.map((line: RawLine) => {
          const base = {
            content: line.content.substring(1),
            lineNumberOld: line.oldLine ?? null,
            lineNumberNew: line.newLine ?? null,
          }

          switch (line.type) {
            case 'add':
              return { ...base, type: 'add' }
            case 'del':
              return { ...base, type: 'delete' }
            case 'normal':
              return { ...base, type: 'context' }
            default:
              throw new Error(`Unknown line type: ${line.type}`)
          }
        })

        return {
          content: chunk.content,
          oldStart: chunk.oldStart,
          oldLines: chunk.oldLines,
          newStart: chunk.newStart,
          newLines: chunk.newLines,
          changes,
        }
      })

      return {
        oldPath: file.from,
        newPath: file.to,
        isRenamed: file.from !== file.to,
        hunks,
      }
    })

    return { files }
  }
}
