import type { RawChunk, RawFile, RawLine } from 'diffparser'
import diffparser from 'diffparser'
import { DiffLine, FileDiff, Hunk, IDiffParser, ParsedDiff } from './types'

/**
 * - diffparse library's convention is to use `/dev/null` as the path for new or deleted files
 * - we use this constant to check for this specific path to determine the file's status.
 */
const NULL_PATH = '/dev/null'

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
        isNew: file.from === NULL_PATH,
        isDeleted: file.to === NULL_PATH,
        hunks,
      }
    })

    return { files }
  }
}
