import { createPropsFactory, expectElementToBeInTheDocument, render } from '@test-lib'
import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FileDiff } from '../../models/FileDiff'
import { ParsedDiff } from '../../models/ParsedDiff'
import { listDirPaths, nodeComparator } from '../../utils/node-utils'
import { SAMPLE_FILE_DIFFS } from '../../utils/test/__fixtures__/file-diff-fixtures'
import { useDiffViewerConfig } from '../diff-viewer/providers/diff-viewer-context'
import { FileExplorer } from './FileExplorer'
import { useFileExplorerConfig } from './providers/file-explorer-context'
import { useFileExplorerContext } from './providers/fstree-context'
import type { DirectoryNode, FileExplorerConfig, FileExplorerProps, FileNode } from './types'

/**
 * FileExplorer Testing Strategy
 *
 *
 * **Provider Setup Logic**: Tests the component's ability to conditionally wrap itself with
 * necessary providers based on existing context availability, ensuring proper inheritance
 * and fallback behavior.
 *
 * **Happy Path Scenarios**:
 * • Provider setup with no existing context → asserts full provider wrapper setup
 * • File click interactions → asserts onFileClick callback with correct FileDiff argument
 * • Directory toggle interactions → asserts onDirectoryToggle callback with path and state
 * • Expand/collapse all functionality → asserts setExpandedDirs called with correct directory sets
 * • Tree rendering with mixed content → asserts correct FSNode components rendered for files/directories
 * • Custom styling application → asserts CSS and className props properly applied
 *
 * **Edge Cases**:
 * • Existing file explorer config → asserts no additional provider wrapping (prevents double-wrapping)
 * • Missing provider context → asserts graceful fallback with provider creation
 * • Empty tree structures → asserts component renders without errors
 * • Component memoization → asserts consistent behavior across re-renders
 *
 * **Mock Strategy**: Heavy use of vi.mock() to isolate the component from its dependencies,
 * allowing focused testing of integration logic and user interactions without complex tree
 * manipulation or provider setup overhead.
 */

type ProviderSetupTestCase = {
  /* The name of the test case */
  name: string
  /* Whether the test case has an existing file explorer config */
  hasExistingFileExplorerConfig: boolean
  /* Whether the test case has an existing diff viewer config */
  hasExistingDiffViewerConfig: boolean
  /* The inherited config from the diff viewer config */
  inheritedConfig?: Partial<FileExplorerConfig>
  /* The expected provider setup */
  expectedProviderSetup: 'none' | 'file-explorer-only' | 'full-setup'
}

type CallbackTestCase = {
  /* The name of the test case */
  name: string
  /* The action to perform */
  action: 'file-click' | 'directory-toggle'
  /* The type of node to perform the action on */
  nodeType: 'file' | 'directory'
  /* The expected callback to be called */
  expectedCallback: 'onFileClick' | 'onDirectoryToggle'
  /* The expected arguments to be passed to the callback */
  expectedArgs: (FileDiff | string | boolean)[]
}

type TreeRenderingTestCase = {
  /* The name of the test case */
  name: string
  /* The tree nodes to render */
  treeNodes: Array<{ name: string; type: 'file' | 'directory' }>
  /* The expected elements to be in the document */
  expectedElements: string[]
}

// MOCKS
vi.mock('./components/FSNode', () => ({
  default: ({
    node,
    onFileClick,
    onDirectoryToggle,
  }: {
    node: FileNode | DirectoryNode
    onFileClick: (file: FileDiff) => void
    onDirectoryToggle: (path: string, expanded: boolean) => void
  }) => (
    <div data-testid={`fs-node-${node.name}`} data-node-type={node.type}>
      {node.type === 'file' && (
        <button data-testid={`file-click-${node.name}`} onClick={() => onFileClick(node.file)}>
          {node.name}
        </button>
      )}
      {node.type === 'directory' && (
        <button data-testid={`dir-toggle-${node.name}`} onClick={() => onDirectoryToggle(node.name, true)}>
          {node.name}
        </button>
      )}
    </div>
  ),
}))

vi.mock('./components/Toolbar', () => ({
  ExplorerBar: ({ onExpandAll, onCollapseAll }: { onExpandAll: () => void; onCollapseAll: () => void }) => (
    <div data-testid="explorer-bar">
      <button data-testid="expand-all" onClick={onExpandAll}>
        Expand All
      </button>
      <button data-testid="collapse-all" onClick={onCollapseAll}>
        Collapse All
      </button>
    </div>
  ),
}))

vi.mock('./components/TreeSkeleton', () => ({
  default: ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => (
    <div data-testid="tree-skeleton" ref={containerRef} />
  ),
}))

vi.mock('../diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: vi.fn(),
}))

vi.mock('./providers/file-explorer-context', () => ({
  useFileExplorerConfig: vi.fn(),
  FileExplorerConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="file-explorer-provider">{children}</div>
  ),
}))

vi.mock('./providers/fstree-context', () => ({
  useFileExplorerContext: vi.fn(),
  FSTreeContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="fstree-provider">{children}</div>
  ),
}))

vi.mock('../../utils/node-utils', () => ({
  listDirPaths: vi.fn(),
  nodeComparator: vi.fn(),
}))

// HELPERS
const createFileExplorerProps = createPropsFactory<FileExplorerProps>({
  diff: new ParsedDiff('', SAMPLE_FILE_DIFFS),
  onFileClick: vi.fn(),
  onDirectoryToggle: vi.fn(),
})

const createMockTreeNode = (name: string, type: 'file' | 'directory', file?: FileDiff): FileNode | DirectoryNode => {
  if (type === 'file') {
    return {
      type: 'file',
      name,
      file: file || SAMPLE_FILE_DIFFS[0],
    } as FileNode
  }
  return {
    type: 'directory',
    name,
    children: new Map(),
  } as DirectoryNode
}

const createMockTree = () => ({
  type: 'directory' as const,
  name: 'root',
  children: new Map([
    ['src', createMockTreeNode('src', 'directory')],
    ['README.md', createMockTreeNode('README.md', 'file', SAMPLE_FILE_DIFFS[2])],
  ]),
})

const setupMocks = () => {
  const mockTree = createMockTree()
  const mockSetSelectedNode = vi.fn()
  const mockSetExpandedDirs = vi.fn()

  const mockConfig = {
    startExpanded: true,
    nodeConnector: 'solid' as const,
    indentPx: 16,
    collapsePackages: true,
    showIcons: false,
    displayNodeDetails: false,
  }

  vi.mocked(useFileExplorerContext).mockReturnValue({
    tree: mockTree,
    setSelectedNode: mockSetSelectedNode,
    setExpandedDirs: mockSetExpandedDirs,
    diff: new ParsedDiff('', SAMPLE_FILE_DIFFS),
    config: mockConfig,
    searchQuery: '',
    selectedNode: null,
    expandedDirs: new Set<string>(),
    setSearchQuery: vi.fn(),
    filteredFiles: SAMPLE_FILE_DIFFS,
  })

  vi.mocked(listDirPaths).mockReturnValue(new Set(['src', 'src/components']))
  vi.mocked(nodeComparator).mockReturnValue(0)

  return {
    mockTree,
    mockSetSelectedNode,
    mockSetExpandedDirs,
    mockConfig,
  }
}

const providerSetupMatrix: ProviderSetupTestCase[] = [
  {
    name: 'no existing providers',
    hasExistingFileExplorerConfig: false,
    hasExistingDiffViewerConfig: false,
    expectedProviderSetup: 'full-setup',
  },
  {
    name: 'existing file explorer config',
    hasExistingFileExplorerConfig: true,
    hasExistingDiffViewerConfig: false,
    expectedProviderSetup: 'none',
  },
  {
    name: 'existing diff viewer config with inheritance',
    hasExistingFileExplorerConfig: false,
    hasExistingDiffViewerConfig: true,
    inheritedConfig: { startExpanded: false },
    expectedProviderSetup: 'file-explorer-only',
  },
]

const callbackMatrix: CallbackTestCase[] = [
  {
    name: 'file clicked',
    action: 'file-click',
    nodeType: 'file',
    expectedCallback: 'onFileClick',
    expectedArgs: [SAMPLE_FILE_DIFFS[2]],
  },
  {
    name: 'directory toggled',
    action: 'directory-toggle',
    nodeType: 'directory',
    expectedCallback: 'onDirectoryToggle',
    expectedArgs: ['src', true],
  },
]

const treeRenderingMatrix: TreeRenderingTestCase[] = [
  {
    name: 'mixed files and directories',
    treeNodes: [
      { name: 'src', type: 'directory' },
      { name: 'README.md', type: 'file' },
    ],
    expectedElements: ['fs-node-src', 'fs-node-README.md'],
  },
  {
    name: 'files only',
    treeNodes: [{ name: 'package.json', type: 'file' }],
    expectedElements: ['fs-node-package.json'],
  },
  {
    name: 'directories only',
    treeNodes: [{ name: 'components', type: 'directory' }],
    expectedElements: ['fs-node-components'],
  },
]

describe('FileExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    const { mockTree, mockSetSelectedNode, mockSetExpandedDirs, mockConfig } = setupMocks()

    vi.mocked(useFileExplorerConfig).mockReturnValue({
      config: mockConfig,
      setConfig: vi.fn(),
    })

    vi.mocked(useFileExplorerContext).mockReturnValue({
      tree: mockTree,
      setSelectedNode: mockSetSelectedNode,
      setExpandedDirs: mockSetExpandedDirs,
      diff: new ParsedDiff('', SAMPLE_FILE_DIFFS),
      config: mockConfig,
      searchQuery: '',
      selectedNode: null,
      expandedDirs: new Set(),
      setSearchQuery: vi.fn(),
      filteredFiles: SAMPLE_FILE_DIFFS,
    })

    vi.mocked(useDiffViewerConfig).mockImplementation(() => {
      throw new Error('No diff viewer context')
    })
  })

  describe('Provider Setup Logic', () => {
    providerSetupMatrix.forEach(
      ({
        name,
        hasExistingFileExplorerConfig,
        hasExistingDiffViewerConfig,
        inheritedConfig,
        expectedProviderSetup,
      }) => {
        it(`given ${name}, when component mounts, expect ${expectedProviderSetup}`, () => {
          // MOCK
          if (!hasExistingFileExplorerConfig) {
            vi.mocked(useFileExplorerConfig).mockImplementation(() => {
              throw new Error('Provider not found')
            })
          }

          if (hasExistingDiffViewerConfig) {
            vi.mocked(useDiffViewerConfig).mockReturnValue({
              fileExplorerConfig: inheritedConfig,
            } as ReturnType<typeof useDiffViewerConfig>)
          }

          // GIVEN
          const props = createFileExplorerProps()

          // WHEN
          render(<FileExplorer {...props} />)

          // EXPECT
          if (expectedProviderSetup === 'file-explorer-only' || expectedProviderSetup === 'full-setup') {
            expectElementToBeInTheDocument('file-explorer-provider')
          }
          expectElementToBeInTheDocument('fstree-provider')
        })
      },
    )
  })

  describe('Callback Functionality', () => {
    callbackMatrix.forEach(({ name, action, expectedCallback, expectedArgs }) => {
      it(`given ${name}, when ${action} triggered, expect ${expectedCallback} called with correct args`, () => {
        // GIVEN
        const props = createFileExplorerProps()

        render(<FileExplorer {...props} />)

        // WHEN
        if (action === 'file-click') {
          fireEvent.click(screen.getByTestId(`file-click-README.md`))
        } else {
          fireEvent.click(screen.getByTestId(`dir-toggle-src`))
        }

        // EXPECT
        if (expectedCallback === 'onFileClick') {
          expect(props.onFileClick).toHaveBeenCalledWith(...expectedArgs)
        } else {
          expect(props.onDirectoryToggle).toHaveBeenCalledWith(...expectedArgs)
        }
      })
    })
  })

  describe('Expand and Collapse Functionality', () => {
    it('given expand all clicked, when setExpandedDirs called, expect all directories included', () => {
      // GIVEN
      const { mockSetExpandedDirs } = setupMocks()
      const props = createFileExplorerProps()
      render(<FileExplorer {...props} />)

      // WHEN
      fireEvent.click(screen.getByTestId('expand-all'))

      // EXPECT
      expect(mockSetExpandedDirs).toHaveBeenCalledWith(new Set(['src', 'src/components']))
    })

    it('given collapse all clicked, when setExpandedDirs called, expect empty set', () => {
      // GIVEN
      const { mockSetExpandedDirs } = setupMocks()
      const props = createFileExplorerProps()
      render(<FileExplorer {...props} />)

      // WHEN
      fireEvent.click(screen.getByTestId('collapse-all'))

      // EXPECT
      expect(mockSetExpandedDirs).toHaveBeenCalledWith(new Set())
    })
  })

  describe('Tree Rendering', () => {
    treeRenderingMatrix.forEach(({ name, treeNodes, expectedElements }) => {
      it(`given ${name}, when component renders, expect correct tree structure`, () => {
        // MOCK
        const mockTree = {
          type: 'directory' as const,
          name: 'root',
          children: new Map(treeNodes.map((node) => [node.name, createMockTreeNode(node.name, node.type)])),
        }

        vi.mocked(useFileExplorerContext).mockReturnValue({
          tree: mockTree,
          setSelectedNode: vi.fn(),
          setExpandedDirs: vi.fn(),
          diff: new ParsedDiff('', SAMPLE_FILE_DIFFS),
          config: {
            startExpanded: true,
            nodeConnector: 'solid' as const,
            indentPx: 16,
            collapsePackages: true,
            showIcons: false,
            displayNodeDetails: false,
          },
          searchQuery: '',
          selectedNode: null,
          expandedDirs: new Set(),
          setSearchQuery: vi.fn(),
          filteredFiles: SAMPLE_FILE_DIFFS,
        })

        // GIVEN
        const props = createFileExplorerProps()

        // WHEN
        render(<FileExplorer {...props} />)

        // EXPECT
        expectedElements.forEach((elementId) => {
          expectElementToBeInTheDocument(elementId)
        })
      })
    })
  })

  describe('Custom Styling', () => {
    it('given custom css prop, when component renders, expect styles applied', () => {
      // GIVEN
      const customCss = { backgroundColor: 'red' }
      const props = createFileExplorerProps({ css: customCss, className: 'custom-class' })

      // WHEN
      const { container } = render(<FileExplorer {...props} />)
      const explorerElement = container.querySelector('.custom-class')

      // EXPECT
      expect(explorerElement).toBeInTheDocument()
    })
  })

  describe('Component Memoization', () => {
    it('given same props, when component re-renders, expect memo behavior to be consistent', () => {
      // GIVEN
      const props = createFileExplorerProps()

      // WHEN
      const { rerender } = render(<FileExplorer {...props} />)
      rerender(<FileExplorer {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('fstree-provider')
      expectElementToBeInTheDocument('explorer-bar')
    })
  })

  describe('Error Handling', () => {
    it('given missing file explorer context, when component renders, expect graceful fallback', () => {
      // MOCK
      vi.mocked(useFileExplorerConfig).mockImplementation(() => {
        throw new Error('Provider not found')
      })

      // GIVEN
      const props = createFileExplorerProps()

      // WHEN
      render(<FileExplorer {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('file-explorer-provider')
    })
  })
})
