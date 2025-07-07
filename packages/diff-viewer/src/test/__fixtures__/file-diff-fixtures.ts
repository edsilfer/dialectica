import { FileDiff } from '../../models/FileDiff'

/**
 * A representative list of FileDiff objects covering the main diff scenarios
 * we need for testing the file-explorer utilities:
 *  • regular edits
 *  • file creation (isNew)
 *  • file deletion (isDeleted)
 *  • file rename (isRenamed)
 *  • deeply nested paths (used to exercise directory collapsing)
 */
export const SAMPLE_FILE_DIFFS: FileDiff[] = [
  new FileDiff({
    oldPath: 'src/components/Button.tsx',
    newPath: 'src/components/Button.tsx',
    hunks: [],
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
    rawContent: '',
  }),
  new FileDiff({
    oldPath: 'src/hooks/useFetch.ts',
    newPath: 'src/hooks/useFetch.ts',
    hunks: [],
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
    rawContent: '',
  }),
  new FileDiff({
    oldPath: 'README.md',
    newPath: 'README.md',
    hunks: [],
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'markdown',
    rawContent: '',
  }),
  // New file (added)
  new FileDiff({
    oldPath: '/dev/null',
    newPath: 'src/utils/helpers.ts',
    hunks: [],
    isRenamed: false,
    isNew: true,
    isDeleted: false,
    language: 'typescript',
    rawContent: '',
  }),
  // Deleted file
  new FileDiff({
    oldPath: 'src/legacy/api.js',
    newPath: '/dev/null',
    hunks: [],
    isRenamed: false,
    isNew: false,
    isDeleted: true,
    language: 'javascript',
    rawContent: '',
  }),
  // Deeply nested path to test collapse logic (single-child directories)
  new FileDiff({
    oldPath: 'src/singlechild/inner/Icon.tsx',
    newPath: 'src/singlechild/inner/Icon.tsx',
    hunks: [],
    isRenamed: false,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
    rawContent: '',
  }),
  // Rename scenario
  new FileDiff({
    oldPath: 'src/oldName.tsx',
    newPath: 'src/newName.tsx',
    hunks: [],
    isRenamed: true,
    isNew: false,
    isDeleted: false,
    language: 'typescript',
    rawContent: '',
  }),
]
