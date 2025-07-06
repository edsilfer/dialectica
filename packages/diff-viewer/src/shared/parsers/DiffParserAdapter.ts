import type { RawChunk, RawFile, RawLine } from 'diffparser'
import diffparser from 'diffparser'
import { IDiffParser } from './types'
import { detectLanguage } from './language-utils'
import { Hunk } from '../models/Hunk'
import { File } from '../models/File'
import { DiffLine } from '../models/Line'
import { ParsedDiff } from '../models/ParsedDiff'

/**
 * - diffparse library's convention is to use `/dev/null` as the path for new or deleted files
 * - we use this constant to check for this specific path to determine the file's status.
 */
const NULL_PATH = '/dev/null'

export class DiffParserAdapter implements IDiffParser {
  parse(diffText: string): ParsedDiff {
    const raw = diffparser(diffText)

    const files: File[] = raw.map((rawFile: RawFile) => {
      // 1. Convert raw diffparser chunks → Hunk[]
      const hunks: Hunk[] = rawFile.chunks.map((chunk: RawChunk) => {
        const changes: DiffLine[] = chunk.changes.map((line: RawLine) => {
          const base = {
            content: line.content.substring(1), // strip diff prefix (+|-| )
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
              throw new Error('Unknown line type encountered')
          }
        })

        return new Hunk(
          chunk.content,
          chunk.oldStart,
          chunk.oldLines,
          chunk.newStart,
          chunk.newLines,
          changes,
          rawFile.to !== NULL_PATH ? rawFile.to : rawFile.from,
          'in', // placeholder, will be reassigned below
        )
      })

      /*
       * 2.  IMPORTANT – expandDirection & synthetic tail
       *     ------------------------------------------------
       *     Responsibility for determining the hunk expansion direction
       *     and adding the synthetic tail hunk has been moved into the
       *     `File` domain model.  The constructor of `File` will mutate the
       *     provided hunks list accordingly, so we intentionally do **not**
       *     perform that work here any more.
       */

      return new File({
        rawContent: diffText,
        oldPath: rawFile.from,
        newPath: rawFile.to,
        isRenamed: rawFile.from !== rawFile.to,
        isNew: rawFile.from === NULL_PATH,
        isDeleted: rawFile.to === NULL_PATH,
        language: detectLanguage(rawFile.to !== NULL_PATH ? rawFile.to : rawFile.from),
        hunks, // will be post-processed by File constructor
      })
    })

    // Return a strongly typed ParsedDiff object
    return new ParsedDiff(diffText, files)
  }
}
