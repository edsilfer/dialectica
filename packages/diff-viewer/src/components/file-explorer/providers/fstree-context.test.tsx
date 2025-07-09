import { act, waitFor } from '@testing-library/react'
import React, { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { SAMPLE_FILE_DIFFS } from '../../../test/__fixtures__/file-diff-fixtures'
import { render } from '../../../test/render'
import { buildTree, listDirPaths } from '../../../utils/node-utils'
import { FileExplorerConfig } from '../types'
import { filterFiles, listExpandedDirs } from './context-utils'
import { FileExplorerConfigProvider } from './file-explorer-context'
import { FSTreeContextProvider, useFileExplorerContext } from './fstree-context'

const DIFF = { files: SAMPLE_FILE_DIFFS }

const BASE_CFG: FileExplorerConfig = {
  indentPx: 16,
  collapsePackages: false,
  startExpanded: false,
}

const ContextSpy: React.FC<{
  cb: (ctx: ReturnType<typeof useFileExplorerContext>) => void
}> = ({ cb }) => {
  const ctx = useFileExplorerContext()
  useEffect(() => {
    cb(ctx)
  }, [ctx, cb])
  return null
}

const renderCtx = async (cfg: Partial<FileExplorerConfig> = {}) => {
  let latest: ReturnType<typeof useFileExplorerContext> | undefined
  render(
    <FileExplorerConfigProvider config={{ ...BASE_CFG, ...cfg }}>
      <FSTreeContextProvider diff={DIFF}>
        <ContextSpy
          cb={(c) => {
            latest = c
          }}
        />
      </FSTreeContextProvider>
    </FileExplorerConfigProvider>,
  )
  await waitFor(() => expect(latest).toBeDefined())
  return () => latest as ReturnType<typeof useFileExplorerContext>
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

    await waitFor(() => getCtx().expandedDirs.size > 0)

    const expectedDirs = listExpandedDirs(buildTree(filterFiles(SAMPLE_FILE_DIFFS, 'Button')))
    expect(getCtx().expandedDirs).toEqual(expectedDirs)
    expect(getCtx().filteredFiles).toEqual(filterFiles(SAMPLE_FILE_DIFFS, 'Button'))
  })

  it('throws if hook is used without provider', () => {
    const Consumer = () => {
      useFileExplorerContext()
      return null
    }
    expect(() => render(<Consumer />)).toThrow(/useFileExplorerContext/)
  })
})
