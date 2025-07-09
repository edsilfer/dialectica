import { describe, expect, it } from 'vitest'
import { SAMPLE_FILE_DIFFS } from '../../../utils/test/__fixtures__/file-diff-fixtures'
import { MOCKED_NODE_TREE } from '../../../utils/test/__fixtures__/fstree-fixtures'
import { DirectoryNode } from '../types'
import { filterFiles, listExpandedDirs } from './context-utils'

describe('filterFiles', () => {
  it('should return all files when search query is empty', () => {
    expect(filterFiles(SAMPLE_FILE_DIFFS, '')).toEqual(SAMPLE_FILE_DIFFS)
  })

  it('should filter files based on the search query', () => {
    const result = filterFiles(SAMPLE_FILE_DIFFS, 'src/components')
    expect(result).toEqual([SAMPLE_FILE_DIFFS[0]])
  })

  it('should be case-insensitive', () => {
    const result = filterFiles(SAMPLE_FILE_DIFFS, 'SRC/COMPONENTS')
    expect(result).toEqual([SAMPLE_FILE_DIFFS[0]])
  })

  it('should return an empty array if no file paths match the search query', () => {
    const result = filterFiles(SAMPLE_FILE_DIFFS, 'nonexistent-path')
    expect(result).toEqual([])
  })

  it('should filter based on the new path for added files', () => {
    const result = filterFiles(SAMPLE_FILE_DIFFS, 'helpers')
    expect(result).toEqual([SAMPLE_FILE_DIFFS[3]])
  })

  it('should filter based on the old path for deleted files', () => {
    const result = filterFiles(SAMPLE_FILE_DIFFS, 'legacy')
    expect(result).toEqual([SAMPLE_FILE_DIFFS[4]])
  })
})

describe('listExpandedDirs', () => {
  it('should list all directory paths from a nested tree structure', () => {
    const expected = new Set(['src', 'src/components', 'src/hooks', 'src/utils', 'src/legacy'])
    expect(listExpandedDirs(MOCKED_NODE_TREE)).toEqual(expected)
  })

  it('should return an empty set for a tree with no directories', () => {
    const tree: DirectoryNode = {
      ...MOCKED_NODE_TREE,
      children: new Map(),
    }
    const readmeFileNode = MOCKED_NODE_TREE.children.get('README.md')
    if (readmeFileNode) {
      tree.children.set('README.md', readmeFileNode)
    }

    expect(listExpandedDirs(tree)).toEqual(new Set())
  })

  it('should return an empty set for an empty tree', () => {
    const tree: DirectoryNode = {
      ...MOCKED_NODE_TREE,
      children: new Map(),
    }
    expect(listExpandedDirs(tree)).toEqual(new Set())
  })
})
