import { Hunk } from '../shared/models/Hunk'
import { File } from '../shared/models/File'

// Basic sample hunk with paired changes
export const SAMPLE_HUNK: Hunk = new Hunk(
  '@@ -1,4 +1,4 @@',
  1,
  4,
  1,
  4,
  [
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
  'test.js',
)

export const SAMPLE_FILE_DIFF: File = new File({
  oldPath: 'test.js',
  newPath: 'test.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [SAMPLE_HUNK],
  rawContent: '@@ -1,4 +1,4 @@\nfunction foo() {\n-  console.log("old")\n+  console.log("new")\n}',
})

// Unpaired changes - delete only
export const UNPAIRED_HUNK: Hunk = new Hunk(
  '@@ -1,3 +1,2 @@',
  1,
  3,
  1,
  2,
  [
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
  'test.js',
)

export const UNPAIRED_FILE: File = new File({
  oldPath: 'test.js',
  newPath: 'test.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [UNPAIRED_HUNK],
  rawContent: '@@ -1,3 +1,2 @@\nfunction test() {\n-  return false\n}',
})

// Unpaired changes - add only
export const ADD_ONLY_HUNK: Hunk = new Hunk(
  '@@ -1,2 +1,3 @@',
  1,
  2,
  1,
  3,
  [
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
  'test.js',
)

export const ADD_ONLY_FILE: File = new File({
  oldPath: 'test.js',
  newPath: 'test.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [ADD_ONLY_HUNK],
  rawContent: '@@ -1,2 +1,3 @@\nfunction test() {\n+  return true\n}',
})

// Multiple hunks
export const SECOND_HUNK: Hunk = new Hunk(
  '@@ -10,3 +10,3 @@',
  10,
  3,
  10,
  3,
  [
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
  'test.js',
)

export const MULTI_HUNK_FILE: File = new File({
  oldPath: 'test.js',
  newPath: 'test.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [SAMPLE_HUNK, SECOND_HUNK],
  rawContent:
    '@@ -1,4 +1,4 @@\nfunction foo() {\n-  console.log("old")\n+  console.log("new")\n}\n@@ -10,3 +10,3 @@\nfunction bar() {\n-  return false\n+  return true\n}',
})

// Edge cases
export const EMPTY_HUNK: Hunk = new Hunk('@@ -1,0 +1,0 @@', 1, 0, 1, 0, [], 'empty.js')

export const EMPTY_FILE: File = new File({
  oldPath: 'empty.js',
  newPath: 'empty.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [EMPTY_HUNK],
  rawContent: '@@ -1,0 +1,0 @@',
})

export const CONTEXT_ONLY_HUNK: Hunk = new Hunk(
  '@@ -1,3 +1,3 @@',
  1,
  3,
  1,
  3,
  [
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
  'context.js',
)

export const CONTEXT_FILE: File = new File({
  oldPath: 'context.js',
  newPath: 'context.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [CONTEXT_ONLY_HUNK],
  rawContent: '@@ -1,3 +1,3 @@\n line 1\n line 2\n line 3',
})

export const ADD_ONLY_EDGE_HUNK: Hunk = new Hunk(
  '@@ -0,0 +1,3 @@',
  0,
  0,
  1,
  3,
  [
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
  'add.js',
)

export const ADD_ONLY_EDGE_FILE: File = new File({
  oldPath: 'add.js',
  newPath: 'add.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [ADD_ONLY_EDGE_HUNK],
  rawContent: '@@ -0,0 +1,3 @@\n+new line 1\n+new line 2\n+new line 3',
})

export const DELETE_ONLY_HUNK: Hunk = new Hunk(
  '@@ -1,3 +0,0 @@',
  1,
  3,
  0,
  0,
  [
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
  'delete.js',
)

export const DELETE_ONLY_FILE: File = new File({
  oldPath: 'delete.js',
  newPath: 'delete.js',
  isRenamed: false,
  language: 'javascript',
  hunks: [DELETE_ONLY_HUNK],
  rawContent: '@@ -1,3 +0,0 @@\n-old line 1\n-old line 2\n-old line 3',
})
