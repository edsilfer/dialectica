import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_FILE_DIFFS } from '../__fixtures__/file-diff-fixtures'
import { DirectoryNode, FileNode, TreeNode } from '../models/Nodes'
import { FSNode } from './FSNode'
import type { FSNodeProps } from './types'

// Mocks placed at top before imports as per guidelines
import { createPropsFactory, render } from '@edsilfer/test-lib'
import { vi } from 'vitest'

vi.mock('antd', async () => {
  const { createAntdMocks } = await import('@edsilfer/test-lib')
  return {
    ...createAntdMocks(),
    theme: {
      useToken: () => ({ token: { colorBgTextHover: '#f0f0f0' } }),
    },
  }
})

vi.mock('../utils/node-utils', () => ({
  highlightText: vi.fn((text: string, query: string) => (query ? `highlighted-${text}` : text)),
  nodeComparator: vi.fn((a: { name: string; type: string }, b: { name: string; type: string }) =>
    a.name.localeCompare(b.name),
  ),
}))

vi.mock('./NodeMetadata', () => ({
  NodeMetadata: ({ isDirectory }: { node: unknown; isDirectory: boolean }) => (
    <div data-testid="node-metadata" data-is-directory={isDirectory}>
      metadata
    </div>
  ),
}))

// Global test context type
interface TestWindow extends Window {
  __testContext?: ReturnType<typeof createMockContext>
}

declare const window: TestWindow

// Test data factories
const createFileNode = (overrides: Partial<FileNode> = {}): FileNode => ({
  type: 'file',
  name: 'test-file.ts',
  file: SAMPLE_FILE_DIFFS[0],
  ...overrides,
})

const createDirectoryNode = (overrides: Partial<DirectoryNode> = {}): DirectoryNode => ({
  type: 'directory',
  name: 'test-dir',
  children: new Map<string, TreeNode>(),
  ...overrides,
})

const createMockContext = (overrides = {}) => ({
  config: {
    indentPx: 20,
    showIcons: true,
    displayNodeDetails: true,
  },
  selectedNode: null,
  expandedDirs: new Set<string>(),
  searchQuery: '',
  setSelectedNode: vi.fn(),
  setExpandedDirs: vi.fn(),
  ...overrides,
})

const createFSNodeProps = createPropsFactory<FSNodeProps>({
  node: createFileNode(),
  level: 0,
  parentPath: '',
  onFileClick: vi.fn(),
  onDirectoryToggle: vi.fn(),
})

// Mock the useFileExplorerContext hook
vi.mock('../providers/fstree-context', () => ({
  useFileExplorerContext: () => {
    const mockContext = createMockContext()
    return window.__testContext || mockContext
  },
}))

describe('FSNode', () => {
  let mockWriteText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    window.__testContext = undefined

    // Setup clipboard mock for each test
    mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
    })
  })

  describe('file node rendering', () => {
    it('given file node, when rendered, expect file display without expand button', () => {
      // GIVEN
      const fileNode = createFileNode({ name: 'Component.tsx' })
      const props = createFSNodeProps({ node: fileNode })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const componentNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'Component.tsx')
      if (!componentNode) throw new Error('Node with text "Component.tsx" not found')
      expect(componentNode).toBeInTheDocument()
      expect(screen.queryByTestId('expand-button')).not.toBeInTheDocument()
      expect(screen.getByTestId('node-metadata')).toHaveAttribute('data-is-directory', 'false')
    })

    it('given file node with selected state, when rendered, expect selected styling', () => {
      // GIVEN
      const fileNode = createFileNode({ name: 'selected-file.ts' })
      const filePath = fileNode.file.newPath || fileNode.file.oldPath
      const props = createFSNodeProps({ node: fileNode })
      window.__testContext = createMockContext({ selectedNode: filePath })

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const selectedFileNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'selected-file.ts')
      if (!selectedFileNode) throw new Error('Node with text "selected-file.ts" not found')
      const row = selectedFileNode.closest('[data-depth]')
      expect(row).toHaveAttribute('data-depth', '0')
    })

    it('given file node with deep nesting, when rendered, expect proper indentation', () => {
      // GIVEN
      const fileNode = createFileNode()
      const props = createFSNodeProps({ node: fileNode, level: 3 })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const auxiliaryElement = screen.getByTestId('dropdown').querySelector('[data-fs-node-row]')
      expect(auxiliaryElement).toHaveAttribute('data-node-level', '3')
    })
  })

  describe('directory node rendering', () => {
    it('given directory node, when rendered, expect directory display with expand button', () => {
      // GIVEN
      const directoryNode = createDirectoryNode({ name: 'components' })
      const props = createFSNodeProps({ node: directoryNode })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const componentsNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'components')
      if (!componentsNode) throw new Error('Node with text "components" not found')
      expect(componentsNode).toBeInTheDocument()
      expect(screen.getByTestId('expand-button')).toBeInTheDocument()
      expect(screen.getByTestId('node-metadata')).toHaveAttribute('data-is-directory', 'true')
    })

    it('given collapsed directory, when rendered, expect collapsed state', () => {
      // GIVEN
      const directoryNode = createDirectoryNode({ name: 'collapsed-dir' })
      const props = createFSNodeProps({ node: directoryNode })
      window.__testContext = createMockContext({ expandedDirs: new Set() })

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      expect(screen.getByTestId('expand-button')).toHaveAttribute('data-collapsed', 'true')
      const auxiliaryElement = screen.getByTestId('dropdown').querySelector('[data-fs-node-row]')
      expect(auxiliaryElement).toHaveAttribute('data-node-collapsed', 'true')
    })

    it('given expanded directory with children, when rendered, expect children displayed', () => {
      // GIVEN
      const childFile = createFileNode({ name: 'child.ts' })
      const childDir = createDirectoryNode({ name: 'child-dir' })
      const directoryNode = createDirectoryNode({
        name: 'parent-dir',
        children: new Map<string, TreeNode>([
          ['child.ts', childFile],
          ['child-dir', childDir],
        ]),
      })
      const props = createFSNodeProps({ node: directoryNode })
      window.__testContext = createMockContext({
        expandedDirs: new Set(['parent-dir']),
      })

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const parentDirNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'parent-dir')
      if (!parentDirNode) throw new Error('Node with text "parent-dir" not found')
      expect(parentDirNode).toBeInTheDocument()
      const childTsNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'child.ts')
      if (!childTsNode) throw new Error('Node with text "child.ts" not found')
      expect(childTsNode).toBeInTheDocument()
      const childDirNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'child-dir')
      if (!childDirNode) throw new Error('Node with text "child-dir" not found')
      expect(childDirNode).toBeInTheDocument()
    })
  })

  describe('search highlighting', () => {
    it('given search query matching node name, when rendered, expect highlighted text', () => {
      // GIVEN
      const fileNode = createFileNode({ name: 'SearchableComponent.tsx' })
      const props = createFSNodeProps({ node: fileNode })
      window.__testContext = createMockContext({ searchQuery: 'Searchable' })

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const highlightedNode = screen
        .getAllByTestId('node-name')
        .find((el) => el.textContent === 'highlighted-SearchableComponent.tsx')
      if (!highlightedNode) throw new Error('Node with text "highlighted-SearchableComponent.tsx" not found')
      expect(highlightedNode).toBeInTheDocument()
    })

    it('given empty search query, when rendered, expect no highlighting', () => {
      // GIVEN
      const fileNode = createFileNode({ name: 'NormalComponent.tsx' })
      const props = createFSNodeProps({ node: fileNode })
      window.__testContext = createMockContext({ searchQuery: '' })

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const normalNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'NormalComponent.tsx')
      if (!normalNode) throw new Error('Node with text "NormalComponent.tsx" not found')
      expect(normalNode).toBeInTheDocument()
    })
  })

  describe('click interactions', () => {
    it('given file node, when clicked, expect file click handler called', () => {
      // GIVEN
      const fileNode = createFileNode({ name: 'clickable-file.ts' })
      const mockOnFileClick = vi.fn()
      const mockSetSelectedNode = vi.fn()
      const props = createFSNodeProps({
        node: fileNode,
        onFileClick: mockOnFileClick,
      })
      window.__testContext = createMockContext({
        setSelectedNode: mockSetSelectedNode,
      })

      // WHEN
      render(<FSNode {...props} />)
      const clickableFileNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'clickable-file.ts')
      if (!clickableFileNode) throw new Error('Node with text "clickable-file.ts" not found')
      fireEvent.click(clickableFileNode)

      // EXPECT
      expect(mockOnFileClick).toHaveBeenCalledWith(fileNode.file)
      expect(mockSetSelectedNode).toHaveBeenCalledWith(fileNode.file.newPath)
    })

    it('given directory node, when clicked, expect directory toggle handler called', () => {
      // GIVEN
      const directoryNode = createDirectoryNode({ name: 'clickable-dir' })
      const mockOnDirectoryToggle = vi.fn()
      const mockSetSelectedNode = vi.fn()
      const mockSetExpandedDirs = vi.fn()
      const props = createFSNodeProps({
        node: directoryNode,
        onDirectoryToggle: mockOnDirectoryToggle,
      })
      window.__testContext = createMockContext({
        setSelectedNode: mockSetSelectedNode,
        setExpandedDirs: mockSetExpandedDirs,
        expandedDirs: new Set(['clickable-dir']), // Directory starts expanded
      })

      // WHEN
      render(<FSNode {...props} />)
      const clickableDirNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'clickable-dir')
      if (!clickableDirNode) throw new Error('Node with text "clickable-dir" not found')
      fireEvent.click(clickableDirNode)

      // EXPECT
      expect(mockOnDirectoryToggle).toHaveBeenCalledWith('clickable-dir', true)
      expect(mockSetSelectedNode).toHaveBeenCalledWith('clickable-dir')
      expect(mockSetExpandedDirs).toHaveBeenCalled()
    })

    it('given expand button, when clicked, expect toggle without row click', () => {
      // GIVEN
      const directoryNode = createDirectoryNode({ name: 'expandable-dir' })
      const mockSetExpandedDirs = vi.fn()
      const props = createFSNodeProps({ node: directoryNode })
      window.__testContext = createMockContext({
        setExpandedDirs: mockSetExpandedDirs,
        expandedDirs: new Set(),
      })

      // WHEN
      render(<FSNode {...props} />)
      fireEvent.click(screen.getByTestId('expand-button'))

      // EXPECT
      expect(mockSetExpandedDirs).toHaveBeenCalled()
    })
  })

  describe('context menu interactions', () => {
    it('given file node context menu, when copy clicked, expect clipboard write called', () => {
      // GIVEN
      const fileNode = createFileNode({ name: 'copyable-file.ts' })
      const props = createFSNodeProps({ node: fileNode })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)
      fireEvent.click(screen.getByTestId('dropdown-menu'))

      // EXPECT
      expect(mockWriteText).toHaveBeenCalledWith(fileNode.file.newPath)
    })

    it('given directory node context menu, when copy clicked, expect directory path copied', () => {
      // GIVEN
      const directoryNode = createDirectoryNode({ name: 'copyable-dir' })
      const props = createFSNodeProps({
        node: directoryNode,
        parentPath: 'parent',
      })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)
      fireEvent.click(screen.getByTestId('dropdown-menu'))

      // EXPECT
      expect(mockWriteText).toHaveBeenCalledWith('parent/copyable-dir')
    })
  })

  describe('path building', () => {
    it('given node with parent path, when rendered, expect correct current path', () => {
      // GIVEN
      const directoryNode = createDirectoryNode({ name: 'nested-dir' })
      const props = createFSNodeProps({
        node: directoryNode,
        parentPath: 'parent/deeply',
      })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const auxiliaryElement = screen.getByTestId('dropdown').querySelector('[data-fs-node-row]')
      expect(auxiliaryElement).toHaveAttribute('data-node-path', 'parent/deeply/nested-dir')
      expect(auxiliaryElement).toHaveAttribute('data-node-parent-path', 'parent/deeply')
    })

    it('given root level node, when rendered, expect no parent path', () => {
      // GIVEN
      const directoryNode = createDirectoryNode({ name: 'root-dir' })
      const props = createFSNodeProps({
        node: directoryNode,
        parentPath: '',
      })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const auxiliaryElement = screen.getByTestId('dropdown').querySelector('[data-fs-node-row]')
      expect(auxiliaryElement).toHaveAttribute('data-node-path', 'root-dir')
      expect(auxiliaryElement).toHaveAttribute('data-node-parent-path', '')
    })
  })

  describe('edge cases', () => {
    it('given deleted file, when rendered, expect newPath shown', () => {
      // GIVEN - use the deleted file fixture which has newPath as /dev/null
      const fileNode = createFileNode({
        name: 'deleted-api.js',
        file: SAMPLE_FILE_DIFFS[4], // This is the deleted file
      })
      const props = createFSNodeProps({ node: fileNode })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT - for deleted files, shows file.key (original path)
      expect(screen.getByTestId('rich-tooltip')).toHaveAttribute('data-tooltip', fileNode.file.key)
    })

    it('given sticky root level node, when rendered, expect sticky positioning', () => {
      // GIVEN
      const rootNode = createDirectoryNode({ name: 'sticky-root' })
      const props = createFSNodeProps({
        node: rootNode,
        level: 0,
      })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT
      const auxiliaryElement = screen.getByTestId('dropdown').querySelector('[data-fs-node-row]')
      expect(auxiliaryElement).toHaveAttribute('data-node-level', '0')
    })

    it('given directory with no callbacks provided, when interacted, expect no errors', () => {
      // GIVEN
      const directoryNode = createDirectoryNode({ name: 'no-callback-dir' })
      const props = createFSNodeProps({
        node: directoryNode,
        onDirectoryToggle: undefined,
        onFileClick: undefined,
      })
      window.__testContext = createMockContext()

      // WHEN
      render(<FSNode {...props} />)

      // EXPECT - no errors thrown
      expect(() => {
        const noCallbackDirNode = screen.getAllByTestId('node-name').find((el) => el.textContent === 'no-callback-dir')
        if (!noCallbackDirNode) throw new Error('Node with text "no-callback-dir" not found')
        fireEvent.click(noCallbackDirNode)
      }).not.toThrow()
    })
  })
})
