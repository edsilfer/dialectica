import { FileMetadata } from '../models/FileMetadata'

/**
 * A representative list of FileDiff objects covering the main diff scenarios
 * we need for testing the file-explorer utilities:
 *  • regular edits
 *  • file creation (isNew)
 *  • file deletion (isDeleted)
 *  • file rename (isRenamed)
 *  • deeply nested paths (used to exercise directory collapsing)
 */
export const SAMPLE_FILE_DIFFS: FileMetadata[] = [
  new FileMetadata({
    oldPath: 'src/components/Button.tsx',
    newPath: 'src/components/Button.tsx',
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
  }),
  new FileMetadata({
    oldPath: 'src/hooks/useFetch.ts',
    newPath: 'src/hooks/useFetch.ts',
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
  }),
  new FileMetadata({
    oldPath: 'README.md',
    newPath: 'README.md',
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'markdown',
  }),
  // New file (added)
  new FileMetadata({
    oldPath: '/dev/null',
    newPath: 'src/utils/helpers.ts',
    isRenamed: false,
    isNew: true,
    isDeleted: false,
    language: 'typescript',
  }),
  // Deleted file
  new FileMetadata({
    oldPath: 'src/legacy/api.js',
    newPath: '/dev/null',
    isRenamed: false,
    isNew: false,
    isDeleted: true,
    language: 'javascript',
  }),
  // Deeply nested path to test collapse logic (single-child directories)
  new FileMetadata({
    oldPath: 'src/singlechild/inner/Icon.tsx',
    newPath: 'src/singlechild/inner/Icon.tsx',
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
  }),
  // Rename scenario
  new FileMetadata({
    oldPath: 'src/oldName.tsx',
    newPath: 'src/newName.tsx',
    isRenamed: true,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
  }),
]
