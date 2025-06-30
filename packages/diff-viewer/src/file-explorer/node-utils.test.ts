import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { buildTree, highlightText, listDirPaths, listFilesIn, nodeComparator } from './node-utils'
import { SAMPLE_FILE_DIFFS } from '../__fixtures__/file-diffs'
import { DirectoryNode, FileNode } from './types'

/**
 * Convenience helper that builds a fresh tree before every assertion
 */
const buildDefaultTree = (collapsePackages?: boolean) => buildTree(SAMPLE_FILE_DIFFS, collapsePackages)

describe('file-explorer/node-utils', () => {
  describe('buildTree()', () => {
    it('creates the expected top-level directories and files', () => {
      const tree = buildDefaultTree()

      // root should contain exactly two first-level entries: "src" dir and "README.md" file
      const rootKeys = [...tree.children.keys()]
      expect(rootKeys).toEqual(expect.arrayContaining(['README.md', 'src']))

      // ensure README.md is a file node
      const readme = tree.children.get('README.md')
      expect(readme?.type).toBe('file')

      // ensure the src directory exists and has some children
      const src = tree.children.get('src') as DirectoryNode | undefined
      expect(src?.type).toBe('directory')
      expect(src?.children.size).toBeGreaterThan(0)
    })

    it('collapses single-child directories when the flag is enabled', () => {
      const collapsed = buildDefaultTree(true)
      const src = collapsed.children.get('src') as DirectoryNode

      // The "singlechild/inner" chain should be collapsed into one directory key
      const hasCollapsedDir = [...src.children.keys()].some((key) => key.includes('singlechild/inner'))
      expect(hasCollapsedDir).toBe(true)
    })
  })

  describe('nodeComparator()', () => {
    it('sorts directories before files', () => {
      const dir: DirectoryNode = { name: 'a', type: 'directory', children: new Map() }
      const file: FileNode = { name: 'b.txt', type: 'file', file: SAMPLE_FILE_DIFFS[0] }

      expect(nodeComparator(dir, file)).toBeLessThan(0)
      expect(nodeComparator(file, dir)).toBeGreaterThan(0)
    })

    it('sorts alphabetically within the same node type', () => {
      const dirA: DirectoryNode = { name: 'a', type: 'directory', children: new Map() }
      const dirB: DirectoryNode = { name: 'b', type: 'directory', children: new Map() }

      expect(nodeComparator(dirA, dirB)).toBeLessThan(0)
      expect(nodeComparator(dirB, dirA)).toBeGreaterThan(0)
    })
  })

  describe('highlightText()', () => {
    it('wraps all case-insensitive matches with a span.highlighted-text', () => {
      const highlighted = highlightText('Hello WORLD, world!', 'world')
      const html = renderToStaticMarkup(React.createElement(React.Fragment, null, highlighted))

      expect(html).toBe(
        'Hello <span class="highlighted-text">WORLD</span>, <span class="highlighted-text">world</span>!',
      )
    })

    it('returns the original text when highlight string is empty', () => {
      const res = highlightText('No highlight here', '')
      expect(res).toBe('No highlight here')
    })

    it('returns the original text when there is no match', () => {
      const res = highlightText('Nothing matches', 'foo')
      expect(res).toEqual(['Nothing matches'])
    })
  })

  describe('listFilesIn()', () => {
    it('collects all files under a directory (DFS)', () => {
      const tree = buildDefaultTree()
      const files = listFilesIn(tree)

      expect(files.length).toBe(SAMPLE_FILE_DIFFS.length)
      // Sanity-check that every diff we put in the fixture is present
      const filePaths = files.map((f) => f.newPath || f.oldPath)
      SAMPLE_FILE_DIFFS.forEach((diff) => {
        const path = diff.newPath || diff.oldPath
        expect(filePaths).toContain(path)
      })
    })
  })

  describe('listDirPaths()', () => {
    it('returns all directory paths except the root', () => {
      const tree = buildDefaultTree()
      const dirs = listDirPaths(tree)

      // root path (empty string) should not be present
      expect(dirs.has('')).toBe(false)

      // a few known directories must be present
      ;['src', 'src/components', 'src/hooks', 'src/utils'].forEach((dir) => {
        expect(dirs.has(dir)).toBe(true)
      })
    })
  })
})
