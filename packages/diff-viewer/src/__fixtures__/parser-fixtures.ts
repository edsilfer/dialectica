import { FileDiff, Hunk } from '../shared/parsers/types'

// Basic sample hunk with paired changes
export const SAMPLE_HUNK: Hunk = {
  content: '@@ -1,4 +1,4 @@',
  oldStart: 1,
  oldLines: 4,
  newStart: 1,
  newLines: 4,
  changes: [
    {
      type: 'context',
      content: 'function foo() {',
      lineNumberOld: 1,
      lineNumberNew: 1,
    },
    {
      type: 'delete',
      content: '  console.log("old")',
      lineNumberOld: 2,
      lineNumberNew: null,
    },
    {
      type: 'add',
      content: '  console.log("new")',
      lineNumberOld: null,
      lineNumberNew: 2,
    },
    {
      type: 'context',
      content: '}',
      lineNumberOld: 3,
      lineNumberNew: 3,
    },
  ],
}

export const SAMPLE_FILE_DIFF: FileDiff = new FileDiff({
  oldPath: 'test.js',
  newPath: 'test.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [SAMPLE_HUNK],
})

// Unpaired changes - delete only
export const UNPAIRED_HUNK: Hunk = {
  content: '@@ -1,3 +1,2 @@',
  oldStart: 1,
  oldLines: 3,
  newStart: 1,
  newLines: 2,
  changes: [
    {
      type: 'context',
      content: 'function test() {',
      lineNumberOld: 1,
      lineNumberNew: 1,
    },
    {
      type: 'delete',
      content: '  return false',
      lineNumberOld: 2,
      lineNumberNew: null,
    },
    {
      type: 'context',
      content: '}',
      lineNumberOld: 3,
      lineNumberNew: 2,
    },
  ],
}

export const UNPAIRED_FILE: FileDiff = new FileDiff({
  oldPath: 'test.js',
  newPath: 'test.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [UNPAIRED_HUNK],
})

// Unpaired changes - add only
export const ADD_ONLY_HUNK: Hunk = {
  content: '@@ -1,2 +1,3 @@',
  oldStart: 1,
  oldLines: 2,
  newStart: 1,
  newLines: 3,
  changes: [
    {
      type: 'context',
      content: 'function test() {',
      lineNumberOld: 1,
      lineNumberNew: 1,
    },
    {
      type: 'add',
      content: '  return true',
      lineNumberOld: null,
      lineNumberNew: 2,
    },
    {
      type: 'context',
      content: '}',
      lineNumberOld: 2,
      lineNumberNew: 3,
    },
  ],
}

export const ADD_ONLY_FILE: FileDiff = new FileDiff({
  oldPath: 'test.js',
  newPath: 'test.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [ADD_ONLY_HUNK],
})

// Multiple hunks
export const SECOND_HUNK: Hunk = {
  content: '@@ -10,3 +10,3 @@',
  oldStart: 10,
  oldLines: 3,
  newStart: 10,
  newLines: 3,
  changes: [
    {
      type: 'context',
      content: 'function bar() {',
      lineNumberOld: 10,
      lineNumberNew: 10,
    },
    {
      type: 'delete',
      content: '  return false',
      lineNumberOld: 11,
      lineNumberNew: null,
    },
    {
      type: 'add',
      content: '  return true',
      lineNumberOld: null,
      lineNumberNew: 11,
    },
    {
      type: 'context',
      content: '}',
      lineNumberOld: 12,
      lineNumberNew: 12,
    },
  ],
}

export const MULTI_HUNK_FILE: FileDiff = new FileDiff({
  oldPath: 'test.js',
  newPath: 'test.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [SAMPLE_HUNK, SECOND_HUNK],
})

// Edge cases
export const EMPTY_HUNK: Hunk = {
  content: '@@ -1,0 +1,0 @@',
  oldStart: 1,
  oldLines: 0,
  newStart: 1,
  newLines: 0,
  changes: [],
}

export const EMPTY_FILE: FileDiff = new FileDiff({
  oldPath: 'empty.js',
  newPath: 'empty.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [EMPTY_HUNK],
})

export const CONTEXT_ONLY_HUNK: Hunk = {
  content: '@@ -1,3 +1,3 @@',
  oldStart: 1,
  oldLines: 3,
  newStart: 1,
  newLines: 3,
  changes: [
    {
      type: 'context',
      content: 'line 1',
      lineNumberOld: 1,
      lineNumberNew: 1,
    },
    {
      type: 'context',
      content: 'line 2',
      lineNumberOld: 2,
      lineNumberNew: 2,
    },
    {
      type: 'context',
      content: 'line 3',
      lineNumberOld: 3,
      lineNumberNew: 3,
    },
  ],
}

export const CONTEXT_FILE: FileDiff = new FileDiff({
  oldPath: 'context.js',
  newPath: 'context.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [CONTEXT_ONLY_HUNK],
})

export const ADD_ONLY_EDGE_HUNK: Hunk = {
  content: '@@ -0,0 +1,3 @@',
  oldStart: 0,
  oldLines: 0,
  newStart: 1,
  newLines: 3,
  changes: [
    {
      type: 'add',
      content: 'new line 1',
      lineNumberOld: null,
      lineNumberNew: 1,
    },
    {
      type: 'add',
      content: 'new line 2',
      lineNumberOld: null,
      lineNumberNew: 2,
    },
    {
      type: 'add',
      content: 'new line 3',
      lineNumberOld: null,
      lineNumberNew: 3,
    },
  ],
}

export const ADD_ONLY_EDGE_FILE: FileDiff = new FileDiff({
  oldPath: 'add.js',
  newPath: 'add.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [ADD_ONLY_EDGE_HUNK],
})

export const DELETE_ONLY_HUNK: Hunk = {
  content: '@@ -1,3 +0,0 @@',
  oldStart: 1,
  oldLines: 3,
  newStart: 0,
  newLines: 0,
  changes: [
    {
      type: 'delete',
      content: 'old line 1',
      lineNumberOld: 1,
      lineNumberNew: null,
    },
    {
      type: 'delete',
      content: 'old line 2',
      lineNumberOld: 2,
      lineNumberNew: null,
    },
    {
      type: 'delete',
      content: 'old line 3',
      lineNumberOld: 3,
      lineNumberNew: null,
    },
  ],
}

export const DELETE_ONLY_FILE: FileDiff = new FileDiff({
  oldPath: 'delete.js',
  newPath: 'delete.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [DELETE_ONLY_HUNK],
})
