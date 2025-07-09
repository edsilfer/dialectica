import { RefObject } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPropsFactory, mockElementProperty } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { useFileExplorerContext } from '../providers/fstree-context'
import TreeSkeleton from './TreeSkeleton'
import { buildNodeMap, getConnectorPaths } from './tree-utils'
import type { ConnectorStyle, Node, TreeSkeletonProps } from './types'

/**
 * # TreeSkeleton Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **tree-utils**: Mocked to isolate component logic from complex tree processing algorithms
 * - **fstree-context**: Mocked to provide predictable context state without external dependencies
 * - **DOM APIs**: getBoundingClientRect, querySelectorAll mocked for testable DOM interactions
 * - **Element properties**: scrollWidth, scrollHeight mocked to test size calculation logic
 *
 * ## Testing Approach
 *
 * **Happy Path**: Container with valid ref → DOM queries executed → SVG rendered with correct paths and dimensions
 * **Edge Cases**:
 * - Null container ref → No DOM queries, no SVG rendered
 * - Empty NodeList → SVG rendered but no paths
 * - Hi-DPI screens → Size calculation uses container height when scrollHeight difference < 1px
 * - Different connector styles → SVG paths and styling adapt accordingly
 *
 * **Assertions**: Verify DOM method calls, SVG attributes, path elements, and effect re-runs
 */

// MOCKS
vi.mock('./tree-utils', () => ({
  buildNodeMap: vi.fn(),
  getConnectorPaths: vi.fn(),
}))

vi.mock('../providers/fstree-context', () => ({
  useFileExplorerContext: vi.fn(),
}))

// Helper functions
const createTreeSkeletonProps = createPropsFactory<TreeSkeletonProps>({
  containerRef: { current: null },
})

const createMockElement = (attributes: Record<string, string>, rect: Partial<DOMRect> = {}): Element => {
  const element = document.createElement('div')
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })

  const mockRect: DOMRect = {
    left: 0,
    top: 0,
    width: 20,
    height: 20,
    right: 20,
    bottom: 20,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  }

  Object.defineProperty(element, 'getBoundingClientRect', {
    value: vi.fn().mockReturnValue(mockRect),
    writable: true,
  })
  return element
}

const createMockContainer = (
  scrollDimensions: { scrollWidth: number; scrollHeight: number } = { scrollWidth: 400, scrollHeight: 600 },
  boundingRect: Partial<DOMRect> = { width: 400, height: 500 },
): HTMLDivElement => {
  const container = document.createElement('div')

  mockElementProperty(container, 'scrollWidth', scrollDimensions.scrollWidth)
  mockElementProperty(container, 'scrollHeight', scrollDimensions.scrollHeight)

  const mockRect: DOMRect = {
    left: 0,
    top: 0,
    width: 400,
    height: 500,
    right: 400,
    bottom: 500,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...boundingRect,
  }

  Object.defineProperty(container, 'getBoundingClientRect', {
    value: vi.fn().mockReturnValue(mockRect),
    writable: true,
  })
  Object.defineProperty(container, 'querySelectorAll', {
    value: vi.fn().mockReturnValue([] as unknown as NodeListOf<Element>),
    writable: true,
  })

  return container
}

const createMockNodeMap = (): Map<string, Node[]> => {
  return new Map([
    [
      'root',
      [
        { cx: 0, cy: 10, level: 0, parentPath: 'root', path: 'src', type: 'directory', collapsed: false },
        { cx: 0, cy: 30, level: 0, parentPath: 'root', path: 'README.md', type: 'file', collapsed: false },
      ],
    ],
    ['src', [{ cx: 20, cy: 50, level: 1, parentPath: 'src', path: 'src/file.ts', type: 'file', collapsed: false }]],
  ])
}

type ConnectorTestCase = {
  name: string
  connectorStyle: ConnectorStyle
  roundedConnectors: boolean
  expectedPaths: string[]
}

type SizeCalculationTestCase = {
  name: string
  scrollDimensions: { scrollWidth: number; scrollHeight: number }
  containerRect: { width: number; height: number }
  expectedSize: { width: number; height: number }
}

const connectorTestMatrix: ConnectorTestCase[] = [
  {
    name: 'solid connector with rounded corners',
    connectorStyle: 'solid',
    roundedConnectors: true,
    expectedPaths: ['M 10 20 V 40 Q 10 50 16 50 H 20'],
  },
  {
    name: 'dashed connector without rounded corners',
    connectorStyle: 'dashed',
    roundedConnectors: false,
    expectedPaths: ['M 10 20 V 50 H 20'],
  },
  {
    name: 'none connector style',
    connectorStyle: 'none',
    roundedConnectors: false,
    expectedPaths: [],
  },
]

const sizeCalculationMatrix: SizeCalculationTestCase[] = [
  {
    name: 'scroll dimensions larger than container',
    scrollDimensions: { scrollWidth: 500, scrollHeight: 700 },
    containerRect: { width: 400, height: 500 },
    expectedSize: { width: 500, height: 700 },
  },
  {
    name: 'scroll height within 1px of container height',
    scrollDimensions: { scrollWidth: 400, scrollHeight: 500.8 },
    containerRect: { width: 400, height: 500.5 },
    expectedSize: { width: 400, height: 500.5 },
  },
  {
    name: 'scroll dimensions equal to container',
    scrollDimensions: { scrollWidth: 400, scrollHeight: 500 },
    containerRect: { width: 400, height: 500 },
    expectedSize: { width: 400, height: 500 },
  },
]

describe('TreeSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useFileExplorerContext).mockReturnValue({
      expandedDirs: new Set(['src']),
      config: {
        nodeConnector: 'solid',
        roundedConnectors: true,
        collapsePackages: false,
        startExpanded: false,
        showIcons: true,
        displayNodeDetails: true,
        indentPx: 24,
      },
      diff: { files: [], rawContent: '' },
      searchQuery: '',
      selectedNode: null,
      setSearchQuery: vi.fn(),
      setSelectedNode: vi.fn(),
      setExpandedDirs: vi.fn(),
      tree: { name: 'root', type: 'directory', children: new Map() },
      filteredFiles: [],
    })

    vi.mocked(buildNodeMap).mockReturnValue(createMockNodeMap())
    vi.mocked(getConnectorPaths).mockReturnValue(['M 10 20 V 40 Q 10 50 16 50 H 20'])
  })

  describe('Container Reference Handling', () => {
    it('given null container ref, when component renders, expect no DOM queries', () => {
      // GIVEN
      const props = createTreeSkeletonProps({ containerRef: { current: null } })

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      expect(buildNodeMap).not.toHaveBeenCalled()
    })

    it('given valid container ref, when component renders, expect DOM queries executed', () => {
      // GIVEN
      const container = createMockContainer()
      const querySelectorAllSpy = vi.spyOn(container, 'querySelectorAll')
      const getBoundingClientRectSpy = vi.spyOn(container, 'getBoundingClientRect')
      const props = createTreeSkeletonProps({ containerRef: { current: container } })

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      expect(querySelectorAllSpy).toHaveBeenCalledWith('[data-fs-node-row]')
      expect(getBoundingClientRectSpy).toHaveBeenCalled()
      expect(buildNodeMap).toHaveBeenCalled()
    })
  })

  describe('SVG Rendering', () => {
    it('given valid container and paths, when component renders, expect SVG with correct paths', () => {
      // GIVEN
      const container = createMockContainer()
      const props = createTreeSkeletonProps({ containerRef: { current: container } })

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '400')
      expect(svg).toHaveAttribute('height', '600')

      const paths = svg!.querySelectorAll('path')
      expect(paths).toHaveLength(1)
      expect(paths[0]).toHaveAttribute('d', 'M 10 20 V 40 Q 10 50 16 50 H 20')
    })

    it('given no paths from connector generation, when component renders, expect empty SVG', () => {
      // GIVEN
      const container = createMockContainer()
      const props = createTreeSkeletonProps({ containerRef: { current: container } })
      vi.mocked(getConnectorPaths).mockReturnValue([])

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      const paths = svg!.querySelectorAll('path')
      expect(paths).toHaveLength(0)
    })
  })

  describe('Connector Styles', () => {
    connectorTestMatrix.forEach(({ name, connectorStyle, roundedConnectors, expectedPaths }) => {
      it(`given ${name}, when component renders, expect appropriate styling and paths`, () => {
        // GIVEN
        const container = createMockContainer()
        const props = createTreeSkeletonProps({ containerRef: { current: container } })

        vi.mocked(useFileExplorerContext).mockReturnValue({
          expandedDirs: new Set(['src']),
          config: {
            nodeConnector: connectorStyle,
            roundedConnectors,
            collapsePackages: false,
            startExpanded: false,
            showIcons: true,
            displayNodeDetails: true,
            indentPx: 24,
          },
          diff: { files: [], rawContent: '' },
          searchQuery: '',
          selectedNode: null,
          setSearchQuery: vi.fn(),
          setSelectedNode: vi.fn(),
          setExpandedDirs: vi.fn(),
          tree: { name: 'root', type: 'directory', children: new Map() },
          filteredFiles: [],
        })

        const radius = roundedConnectors ? 6 : 0
        vi.mocked(getConnectorPaths).mockReturnValue(expectedPaths)

        // WHEN
        render(<TreeSkeleton {...props} />)

        // EXPECT
        if (connectorStyle === 'none') {
          // For 'none' style, getConnectorPaths is not called - paths is set to empty array
          expect(getConnectorPaths).not.toHaveBeenCalled()
        } else {
          expect(getConnectorPaths).toHaveBeenCalledWith(createMockNodeMap(), radius)
        }

        const svg = document.querySelector('svg')
        expect(svg).toBeInTheDocument()
        const paths = svg!.querySelectorAll('path')
        expect(paths).toHaveLength(expectedPaths.length)

        if (expectedPaths.length > 0) {
          expect(paths[0]).toHaveAttribute('d', expectedPaths[0])
          // Note: CSS-in-JS styles are harder to test directly, but the logic is covered
        }
      })
    })
  })

  describe('Size Calculation', () => {
    sizeCalculationMatrix.forEach(({ name, scrollDimensions, containerRect, expectedSize }) => {
      it(`given ${name}, when component renders, expect correct SVG dimensions`, () => {
        // GIVEN
        const container = createMockContainer(scrollDimensions, containerRect)
        const props = createTreeSkeletonProps({ containerRef: { current: container } })

        // WHEN
        render(<TreeSkeleton {...props} />)

        // EXPECT
        const svg = document.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('width', expectedSize.width.toString())
        expect(svg).toHaveAttribute('height', expectedSize.height.toString())
      })
    })
  })

  describe('Effect Dependencies', () => {
    it('given expandedDirs change, when component re-renders, expect effect to re-run', () => {
      // GIVEN
      const container = createMockContainer()
      const props = createTreeSkeletonProps({ containerRef: { current: container } })

      const { rerender } = render(<TreeSkeleton {...props} />)
      vi.clearAllMocks()

      // Update the context to return different expandedDirs
      vi.mocked(useFileExplorerContext).mockReturnValue({
        expandedDirs: new Set(['src', 'components']),
        config: {
          nodeConnector: 'solid',
          roundedConnectors: true,
          collapsePackages: false,
          startExpanded: false,
          showIcons: true,
          displayNodeDetails: true,
          indentPx: 24,
        },
        diff: { files: [], rawContent: '' },
        searchQuery: '',
        selectedNode: null,
        setSearchQuery: vi.fn(),
        setSelectedNode: vi.fn(),
        setExpandedDirs: vi.fn(),
        tree: { name: 'root', type: 'directory', children: new Map() },
        filteredFiles: [],
      })

      // WHEN
      rerender(<TreeSkeleton {...props} />)

      // EXPECT
      expect(buildNodeMap).toHaveBeenCalled()
    })

    it('given containerRef change, when component re-renders, expect effect to re-run', () => {
      // GIVEN
      const container1 = createMockContainer()
      const container2 = createMockContainer({ scrollWidth: 500, scrollHeight: 700 })
      const getBoundingClientRectSpy = vi.spyOn(container2, 'getBoundingClientRect')
      const ref1: RefObject<HTMLDivElement> = { current: container1 }
      const ref2: RefObject<HTMLDivElement> = { current: container2 }

      const { rerender } = render(<TreeSkeleton containerRef={ref1} />)
      vi.clearAllMocks()

      // WHEN
      rerender(<TreeSkeleton containerRef={ref2} />)

      // EXPECT
      expect(buildNodeMap).toHaveBeenCalled()
      expect(getBoundingClientRectSpy).toHaveBeenCalled()
    })
  })

  describe('Node Processing', () => {
    it('given container with fs-node-row elements, when component renders, expect elements processed', () => {
      // GIVEN
      const element1 = createMockElement({ 'data-fs-node-row': 'true' }, { left: 10, top: 20 })
      const element2 = createMockElement({ 'data-fs-node-row': 'true' }, { left: 30, top: 40 })
      const elements = [element1, element2] as unknown as NodeListOf<Element>

      const container = createMockContainer()
      Object.defineProperty(container, 'querySelectorAll', {
        value: vi.fn().mockReturnValue(elements),
        writable: true,
      })

      const props = createTreeSkeletonProps({ containerRef: { current: container } })

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      expect(buildNodeMap).toHaveBeenCalledWith(elements, expect.any(Object))
    })

    it('given container with no fs-node-row elements, when component renders, expect empty processing', () => {
      // GIVEN
      const container = createMockContainer()
      const emptyNodeList = [] as unknown as NodeListOf<Element>
      Object.defineProperty(container, 'querySelectorAll', {
        value: vi.fn().mockReturnValue(emptyNodeList),
        writable: true,
      })

      const props = createTreeSkeletonProps({ containerRef: { current: container } })

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      expect(buildNodeMap).toHaveBeenCalledWith(emptyNodeList, expect.any(Object))
    })
  })

  describe('Default Configuration', () => {
    it('given undefined nodeConnector config, when component renders, expect solid connector as default', () => {
      // GIVEN
      const container = createMockContainer()
      const props = createTreeSkeletonProps({ containerRef: { current: container } })

      vi.mocked(useFileExplorerContext).mockReturnValue({
        expandedDirs: new Set(),
        config: {
          nodeConnector: undefined,
          roundedConnectors: false,
          collapsePackages: false,
          startExpanded: false,
          showIcons: true,
          displayNodeDetails: true,
          indentPx: 24,
        },
        diff: { files: [], rawContent: '' },
        searchQuery: '',
        selectedNode: null,
        setSearchQuery: vi.fn(),
        setSelectedNode: vi.fn(),
        setExpandedDirs: vi.fn(),
        tree: { name: 'root', type: 'directory', children: new Map() },
        filteredFiles: [],
      })

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      expect(getConnectorPaths).toHaveBeenCalledWith(expect.any(Map), 0)
    })

    it('given roundedConnectors true, when component renders, expect radius of 6', () => {
      // GIVEN
      const container = createMockContainer()
      const props = createTreeSkeletonProps({ containerRef: { current: container } })

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      expect(getConnectorPaths).toHaveBeenCalledWith(expect.any(Map), 6)
    })

    it('given roundedConnectors false, when component renders, expect radius of 0', () => {
      // GIVEN
      const container = createMockContainer()
      const props = createTreeSkeletonProps({ containerRef: { current: container } })

      vi.mocked(useFileExplorerContext).mockReturnValue({
        expandedDirs: new Set(),
        config: {
          nodeConnector: 'solid',
          roundedConnectors: false,
          collapsePackages: false,
          startExpanded: false,
          showIcons: true,
          displayNodeDetails: true,
          indentPx: 24,
        },
        diff: { files: [], rawContent: '' },
        searchQuery: '',
        selectedNode: null,
        setSearchQuery: vi.fn(),
        setSelectedNode: vi.fn(),
        setExpandedDirs: vi.fn(),
        tree: { name: 'root', type: 'directory', children: new Map() },
        filteredFiles: [],
      })

      // WHEN
      render(<TreeSkeleton {...props} />)

      // EXPECT
      expect(getConnectorPaths).toHaveBeenCalledWith(expect.any(Map), 0)
    })
  })
})
