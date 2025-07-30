import { render, renderWithContext } from '@test-lib'
import { act, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SAMPLE_FILE_DIFFS } from '../__fixtures__/file-diff-fixtures'
import { buildTree, listDirPaths } from '../utils/node-utils'
import { filterFiles, listExpandedDirs } from './context-utils'
import { FileExplorerConfigProvider } from './file-explorer-context'
import { FileExplorerConfig, FSTreeContextProvider, useFileExplorerContext } from './fstree-context'

const BASE_CFG: FileExplorerConfig = {
  indentPx: 16,
  collapsePackages: false,
  startExpanded: false,
}

const TestWrapper: React.FC<{ children?: React.ReactNode; config: Partial<FileExplorerConfig> }> = ({
  children,
  config,
}) => (
  <FileExplorerConfigProvider config={{ ...BASE_CFG, ...config }}>
    <FSTreeContextProvider files={SAMPLE_FILE_DIFFS}>{children}</FSTreeContextProvider>
  </FileExplorerConfigProvider>
)

const renderCtx = (config: Partial<FileExplorerConfig> = {}) => {
  return renderWithContext(TestWrapper, useFileExplorerContext, { config, children: null })
}

describe('FileExplorerProvider', () => {
  it('respects startExpanded', async () => {
    const getCtxExpanded = await renderCtx({ startExpanded: true })
    const expected = listDirPaths(buildTree(SAMPLE_FILE_DIFFS))
    expect(getCtxExpanded().expandedDirs).toEqual(expected)

    const getCtxCollapsed = await renderCtx({ startExpanded: false })
    expect(getCtxCollapsed().expandedDirs.size).toBe(0)
  })

  it('merges search-driven expansion with manual expansion', async () => {
    const getCtx = await renderCtx()
    act(() => getCtx().setSearchQuery('Button'))

    await waitFor(() => {
      expect(getCtx().expandedDirs.size > 0).toBe(true)
    })

    const expectedDirs = listExpandedDirs(buildTree(filterFiles(SAMPLE_FILE_DIFFS, 'Button')))
    expect(getCtx().expandedDirs).toEqual(expectedDirs)
    expect(getCtx().filteredFiles).toEqual(filterFiles(SAMPLE_FILE_DIFFS, 'Button'))
  })

  it('throws if hook is used without provider', () => {
    const Consumer = () => {
      useFileExplorerContext()
      return null
    }
    // Suppress console.error for this test because we expect a throw
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => ({}))
    expect(() => render(<Consumer />)).toThrow(/useFileExplorerContext/)
    consoleErrorSpy.mockRestore()
  })
})
