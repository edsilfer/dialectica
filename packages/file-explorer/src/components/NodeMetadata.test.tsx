import { createPropsFactory, render } from '@edsilfer/test-lib'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SAMPLE_FILE_DIFFS } from '../__fixtures__/file-diff-fixtures'
import { MOCKED_NODE_TREE } from '../__fixtures__/fstree-fixtures'
import { DirectoryNode, FileNode } from '../models/Nodes'
import { NodeMetadata } from './NodeMetadata'
import type { NodeMetadataProps } from './types'

// Mock the listFilesIn utility
vi.mock('../utils/node-utils', async () => {
  const actual = await vi.importActual('../utils/node-utils')
  return {
    ...actual,
    listFilesIn: vi.fn(),
  }
})

// Import the mocked module
import { listFilesIn } from '../utils/node-utils'

const createNodeMetadataProps = createPropsFactory<NodeMetadataProps>({
  node: MOCKED_NODE_TREE.children.get('README.md') as FileNode,
  isDirectory: false,
  showIcons: true,
  displayDetails: true,
})

const createFileNode = (isNew = false, isDeleted = false): FileNode => ({
  type: 'file',
  name: 'test-file.ts',
  file: isNew ? SAMPLE_FILE_DIFFS[3] : isDeleted ? SAMPLE_FILE_DIFFS[4] : SAMPLE_FILE_DIFFS[0],
})

const createDirectoryNode = (): DirectoryNode => ({
  type: 'directory',
  name: 'test-dir',
  children: new Map(),
})

describe('NodeMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('visibility controls', () => {
    const testCases = [
      {
        description: 'showIcons false and displayDetails false',
        showIcons: false,
        displayDetails: false,
        expectVisible: false,
      },
      {
        description: 'showIcons true and displayDetails false',
        showIcons: true,
        displayDetails: false,
        expectVisible: true,
      },
      {
        description: 'showIcons false and displayDetails true',
        showIcons: false,
        displayDetails: true,
        expectVisible: true,
      },
      {
        description: 'showIcons true and displayDetails true',
        showIcons: true,
        displayDetails: true,
        expectVisible: true,
      },
    ]

    testCases.forEach(({ description, showIcons, displayDetails, expectVisible }) => {
      it(`given ${description}, when rendered, expect ${expectVisible ? 'content to be visible' : 'nothing to render'}`, () => {
        // GIVEN
        const props = createNodeMetadataProps({
          showIcons,
          displayDetails,
        })

        // WHEN
        const { container } = render(<NodeMetadata {...props} />)

        // EXPECT
        if (expectVisible) {
          expect(container.firstChild).not.toBeNull()
        } else {
          expect(container.firstChild).toBeNull()
        }
      })
    })
  })

  describe('file node rendering', () => {
    describe('file status indicators', () => {
      const statusTestCases = [
        {
          description: 'modified file',
          fileNode: createFileNode(false, false),
          expectedLabel: 'M',
          expectedTitle: 'Modified file',
        },
        {
          description: 'new file',
          fileNode: createFileNode(true, false),
          expectedLabel: 'A',
          expectedTitle: 'Added file',
        },
        {
          description: 'deleted file',
          fileNode: createFileNode(false, true),
          expectedLabel: 'D',
          expectedTitle: 'Deleted file',
        },
      ]

      statusTestCases.forEach(({ description, fileNode, expectedLabel, expectedTitle }) => {
        it(`given ${description}, when displayDetails enabled, expect correct status label and title`, () => {
          // GIVEN
          const props = createNodeMetadataProps({
            node: fileNode,
            isDirectory: false,
            showIcons: false,
            displayDetails: true,
          })

          // WHEN
          render(<NodeMetadata {...props} />)

          // EXPECT
          const statusElement = screen.getByText(expectedLabel)
          expect(statusElement).toBeInTheDocument()
          expect(statusElement).toHaveAttribute('title', expectedTitle)
        })
      })
    })

    it('given file node with showIcons enabled, when rendered, expect file icon displayed', () => {
      // GIVEN
      const props = createNodeMetadataProps({
        node: createFileNode(),
        isDirectory: false,
        showIcons: true,
        displayDetails: false,
      })

      // WHEN
      const { container } = render(<NodeMetadata {...props} />)

      // EXPECT
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('given file node with both options enabled, when rendered, expect both icon and status displayed', () => {
      // GIVEN
      const props = createNodeMetadataProps({
        node: createFileNode(),
        isDirectory: false,
        showIcons: true,
        displayDetails: true,
      })

      // WHEN
      const { container } = render(<NodeMetadata {...props} />)

      // EXPECT
      const icon = container.querySelector('svg')
      const status = screen.getByText('M')
      expect(icon).toBeInTheDocument()
      expect(status).toBeInTheDocument()
    })
  })

  describe('directory node rendering', () => {
    it('given directory with files and showIcons enabled, when rendered, expect directory icon displayed', () => {
      // MOCK
      vi.mocked(listFilesIn).mockReturnValue([SAMPLE_FILE_DIFFS[0], SAMPLE_FILE_DIFFS[1]])

      // GIVEN
      const props = createNodeMetadataProps({
        node: createDirectoryNode(),
        isDirectory: true,
        showIcons: true,
        displayDetails: false,
      })

      // WHEN
      const { container } = render(<NodeMetadata {...props} />)

      // EXPECT
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('given directory with multiple files and displayDetails enabled, when rendered, expect correct file count', () => {
      // MOCK
      vi.mocked(listFilesIn).mockReturnValue([SAMPLE_FILE_DIFFS[0], SAMPLE_FILE_DIFFS[1], SAMPLE_FILE_DIFFS[2]])

      // GIVEN
      const props = createNodeMetadataProps({
        node: createDirectoryNode(),
        isDirectory: true,
        showIcons: false,
        displayDetails: true,
      })

      // WHEN
      render(<NodeMetadata {...props} />)

      // EXPECT
      const countElement = screen.getByText('3')
      expect(countElement).toBeInTheDocument()
      expect(countElement).toHaveAttribute('title', '3 files')
    })

    it('given empty directory and displayDetails enabled, when rendered, expect zero file count', () => {
      // MOCK
      vi.mocked(listFilesIn).mockReturnValue([])

      // GIVEN
      const props = createNodeMetadataProps({
        node: createDirectoryNode(),
        isDirectory: true,
        showIcons: false,
        displayDetails: true,
      })

      // WHEN
      render(<NodeMetadata {...props} />)

      // EXPECT
      const countElement = screen.getByText('0')
      expect(countElement).toBeInTheDocument()
      expect(countElement).toHaveAttribute('title', '0 files')
    })

    it('given directory with single file and displayDetails enabled, when rendered, expect singular file text in title', () => {
      // MOCK
      vi.mocked(listFilesIn).mockReturnValue([SAMPLE_FILE_DIFFS[0]])

      // GIVEN
      const props = createNodeMetadataProps({
        node: createDirectoryNode(),
        isDirectory: true,
        showIcons: false,
        displayDetails: true,
      })

      // WHEN
      render(<NodeMetadata {...props} />)

      // EXPECT
      const countElement = screen.getByText('1')
      expect(countElement).toBeInTheDocument()
      expect(countElement).toHaveAttribute('title', '1 files')
    })

    it('given directory with both options enabled, when rendered, expect both icon and file count displayed', () => {
      // MOCK
      vi.mocked(listFilesIn).mockReturnValue([SAMPLE_FILE_DIFFS[0], SAMPLE_FILE_DIFFS[1]])

      // GIVEN
      const props = createNodeMetadataProps({
        node: createDirectoryNode(),
        isDirectory: true,
        showIcons: true,
        displayDetails: true,
      })

      // WHEN
      const { container } = render(<NodeMetadata {...props} />)

      // EXPECT
      const icon = container.querySelector('svg')
      const count = screen.getByText('2')
      expect(icon).toBeInTheDocument()
      expect(count).toBeInTheDocument()
    })
  })

  describe('integration with listFilesIn utility', () => {
    it('given directory node, when rendered with displayDetails, expect listFilesIn called with correct node', () => {
      // MOCK
      vi.mocked(listFilesIn).mockReturnValue([])

      // GIVEN
      const directoryNode = createDirectoryNode()
      const props = createNodeMetadataProps({
        node: directoryNode,
        isDirectory: true,
        displayDetails: true,
      })

      // WHEN
      render(<NodeMetadata {...props} />)

      // EXPECT
      expect(vi.mocked(listFilesIn)).toHaveBeenCalledWith(directoryNode)
    })

    it('given file node, when rendered, expect listFilesIn not called', () => {
      // GIVEN
      const props = createNodeMetadataProps({
        node: createFileNode(),
        isDirectory: false,
        displayDetails: true,
      })

      // WHEN
      render(<NodeMetadata {...props} />)

      // EXPECT
      expect(vi.mocked(listFilesIn)).not.toHaveBeenCalled()
    })
  })
})
