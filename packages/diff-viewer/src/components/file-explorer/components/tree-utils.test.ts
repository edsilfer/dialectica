import { describe, expect, it, vi } from 'vitest'
import { buildNodeMap, getConnectorPaths } from './tree-utils'
import type { Node } from './types'

// Helper functions for test data creation
const createNode = (overrides: Partial<Node> = {}): Node => ({
  cx: 0,
  cy: 0,
  level: 0,
  parentPath: 'root',
  path: 'test-path',
  type: 'file',
  collapsed: false,
  ...overrides,
})

const createMockElement = (attributes: Record<string, string | undefined>, rect: Partial<DOMRect> = {}): Element => {
  const element = document.createElement('div')
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined) {
      element.setAttribute(key, value)
    }
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

  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(mockRect)
  return element
}

const createNodeList = (elements: Element[]): NodeListOf<Element> => {
  const nodeList = {
    ...elements,
    length: elements.length,
    forEach: (callback: (value: Element, key: number, parent: NodeListOf<Element>) => void) => {
      for (let i = 0; i < elements.length; i++) {
        callback(elements[i], i, nodeList)
      }
    },
    item: (index: number) => elements[index] || null,
    [Symbol.iterator]: function* () {
      for (const element of elements) {
        yield element
      }
    },
  } as NodeListOf<Element>
  return nodeList
}

describe('tree-utils', () => {
  describe('getConnectorPaths', () => {
    describe('empty and single node scenarios', () => {
      const emptyAndSingleNodeCases = [
        {
          description: 'empty nodes map',
          nodes: new Map<string, Node[]>(),
          expectedPaths: [],
        },
        {
          description: 'single root node',
          nodes: new Map([['root', [createNode({ parentPath: 'root' })]]]),
          expectedPaths: [],
        },
      ]

      emptyAndSingleNodeCases.forEach(({ description, nodes, expectedPaths }) => {
        it(`given ${description}, when getting connector paths, expect ${expectedPaths.length} paths`, () => {
          // WHEN
          const paths = getConnectorPaths(nodes)

          // EXPECT
          expect(paths).toEqual(expectedPaths)
        })
      })
    })

    describe('radius-based path generation', () => {
      const radiusTestCases = [
        {
          description: 'zero radius',
          radius: 0,
          expectedPathPattern: /^M \d+ \d+ V \d+ H \d+$/,
        },
        {
          description: 'positive radius',
          radius: 5,
          expectedPathPattern: /^M \d+ \d+ V \d+ Q \d+ \d+ \d+ \d+ H \d+$/,
        },
        {
          description: 'negative radius treated as zero',
          radius: -5,
          expectedPathPattern: /^M \d+ \d+ V \d+ H \d+$/,
        },
      ]

      radiusTestCases.forEach(({ description, radius, expectedPathPattern }) => {
        it(`given ${description}, when generating paths, expect appropriate path format`, () => {
          // GIVEN
          const parentNode = createNode({ path: 'parent', cx: 10, cy: 10, type: 'directory' })
          const childNode = createNode({ path: 'parent/child', parentPath: 'parent', cx: 30, cy: 50 })
          const nodes = new Map([
            ['root', [parentNode]],
            ['parent', [childNode]],
          ])

          // WHEN
          const paths = getConnectorPaths(nodes, radius)

          // EXPECT
          expect(paths).toHaveLength(1)
          expect(paths[0]).toMatch(expectedPathPattern)
        })
      })
    })

    describe('parent-child relationships', () => {
      it('given multiple children with same parent, when getting paths, expect all children connected', () => {
        // GIVEN
        const parentNode = createNode({ path: 'parent', cx: 10, cy: 10, type: 'directory' })
        const child1 = createNode({ path: 'parent/child1', parentPath: 'parent', cx: 30, cy: 30 })
        const child2 = createNode({ path: 'parent/child2', parentPath: 'parent', cx: 30, cy: 50 })
        const nodes = new Map([
          ['root', [parentNode]],
          ['parent', [child1, child2]],
        ])

        // WHEN
        const paths = getConnectorPaths(nodes)

        // EXPECT
        expect(paths).toHaveLength(2)
      })

      it('given nested hierarchy, when getting paths, expect non-root nodes connected', () => {
        // GIVEN
        const root = createNode({ path: 'root', cx: 10, cy: 10, type: 'directory' })
        const level1 = createNode({ path: 'level1', parentPath: 'root', cx: 20, cy: 30, type: 'directory' })
        const level2 = createNode({ path: 'level1/level2', parentPath: 'level1', cx: 30, cy: 50 })
        const nodes = new Map([
          ['root', [root, level1]],
          ['level1', [level2]],
        ])

        // WHEN
        const paths = getConnectorPaths(nodes)

        // EXPECT
        expect(paths).toHaveLength(1) // Only level2 gets a path (nodes with parentPath 'root' are skipped)
      })

      it('given orphaned node with missing parent, when getting paths, expect node skipped', () => {
        // GIVEN
        const orphanNode = createNode({ path: 'orphan', parentPath: 'missing-parent', cx: 30, cy: 50 })
        const nodes = new Map([['root', [orphanNode]]])

        // WHEN
        const paths = getConnectorPaths(nodes)

        // EXPECT
        expect(paths).toHaveLength(0)
      })
    })

    describe('edge cases for curved paths', () => {
      it('given nodes too close for curve, when generating with radius, expect fallback to straight line', () => {
        // GIVEN
        const parentNode = createNode({ path: 'parent', cx: 10, cy: 10, type: 'directory' })
        const closeChild = createNode({ path: 'parent/child', parentPath: 'parent', cx: 30, cy: 12 })
        const nodes = new Map([
          ['root', [parentNode]],
          ['parent', [closeChild]],
        ])

        // WHEN
        const paths = getConnectorPaths(nodes, 10)

        // EXPECT
        expect(paths).toHaveLength(1)
        expect(paths[0]).toMatch(/^M \d+ \d+ L \d+ \d+$/)
      })

      it('given large radius exceeding vertical distance, when generating paths, expect effective radius clamped', () => {
        // GIVEN
        const parentNode = createNode({ path: 'parent', cx: 10, cy: 10, type: 'directory' })
        const childNode = createNode({ path: 'parent/child', parentPath: 'parent', cx: 30, cy: 30 })
        const nodes = new Map([
          ['root', [parentNode]],
          ['parent', [childNode]],
        ])

        // WHEN
        const paths = getConnectorPaths(nodes, 100)

        // EXPECT
        expect(paths).toHaveLength(1)
        expect(paths[0]).toContain('Q')
      })
    })

    describe('node type adjustments', () => {
      it('given directory parent, when connecting to child, expect directory offset applied', () => {
        // GIVEN
        const dirParent = createNode({ path: 'parent', cx: 10, cy: 10, type: 'directory' })
        const child = createNode({ path: 'parent/child', parentPath: 'parent', cx: 30, cy: 50, type: 'file' })
        const nodes = new Map([
          ['root', [dirParent]],
          ['parent', [child]],
        ])

        // WHEN
        const paths = getConnectorPaths(nodes)

        // EXPECT
        expect(paths).toHaveLength(1)
        expect(paths[0]).toContain('M 21 18') // 10+11 cx, 10+8 cy for directory
      })

      it('given directory child, when connecting from parent, expect child offset applied', () => {
        // GIVEN
        const parent = createNode({ path: 'parent', cx: 10, cy: 10, type: 'file' })
        const dirChild = createNode({ path: 'parent/child', parentPath: 'parent', cx: 30, cy: 50, type: 'directory' })
        const nodes = new Map([
          ['root', [parent]],
          ['parent', [dirChild]],
        ])

        // WHEN
        const paths = getConnectorPaths(nodes)

        // EXPECT
        expect(paths).toHaveLength(1)
        expect(paths[0]).toContain('H 34') // 30+4 for directory child
      })
    })
  })

  describe('buildNodeMap', () => {
    const mockParentRect: DOMRect = {
      left: 100,
      top: 50,
      width: 200,
      height: 300,
      right: 300,
      bottom: 350,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    }

    describe('valid element scenarios', () => {
      it('given elements with valid attributes, when building node map, expect correct nodes created', () => {
        // GIVEN
        const element1 = createMockElement(
          {
            'data-node-level': '1',
            'data-node-path': 'src',
            'data-node-parent-path': 'root',
            'data-node-type': 'directory',
            'data-node-collapsed': 'false',
          },
          { left: 120, top: 70, width: 20, height: 20 },
        )
        const element2 = createMockElement(
          {
            'data-node-level': '2',
            'data-node-path': 'src/file.tsx',
            'data-node-parent-path': 'src',
            'data-node-type': 'file',
            'data-node-collapsed': 'false',
          },
          { left: 140, top: 90, width: 20, height: 20 },
        )
        const nodeList = createNodeList([element1, element2])

        // WHEN
        const nodeMap = buildNodeMap(nodeList, mockParentRect)

        // EXPECT
        expect(nodeMap.size).toBe(2)
        expect(nodeMap.get('root')).toHaveLength(1)
        expect(nodeMap.get('src')).toHaveLength(1)

        const rootNode = nodeMap.get('root')![0]
        expect(rootNode).toEqual({
          cx: 20, // 120 - 100
          cy: 30, // 70 - 50 + 20/2
          level: 1,
          parentPath: 'root',
          path: 'src',
          type: 'directory',
          collapsed: false,
        })
      })

      it('given multiple elements with same parent, when building map, expect grouped correctly', () => {
        // GIVEN
        const element1 = createMockElement(
          {
            'data-node-level': '2',
            'data-node-path': 'src/file1.tsx',
            'data-node-parent-path': 'src',
            'data-node-type': 'file',
          },
          { left: 140, top: 90, width: 20, height: 20 },
        )
        const element2 = createMockElement(
          {
            'data-node-level': '2',
            'data-node-path': 'src/file2.tsx',
            'data-node-parent-path': 'src',
            'data-node-type': 'file',
          },
          { left: 140, top: 110, width: 20, height: 20 },
        )
        const nodeList = createNodeList([element1, element2])

        // WHEN
        const nodeMap = buildNodeMap(nodeList, mockParentRect)

        // EXPECT
        expect(nodeMap.size).toBe(1)
        expect(nodeMap.get('src')).toHaveLength(2)
      })
    })

    describe('invalid element scenarios', () => {
      const invalidElementCases = [
        {
          description: 'element missing level attribute',
          attributes: {
            'data-node-path': 'src',
            'data-node-parent-path': 'root',
            'data-node-type': 'directory',
          },
        },
        {
          description: 'element missing path attribute',
          attributes: {
            'data-node-level': '1',
            'data-node-parent-path': 'root',
            'data-node-type': 'directory',
          },
        },
        {
          description: 'element with invalid level',
          attributes: {
            'data-node-level': 'invalid',
            'data-node-path': 'src',
            'data-node-parent-path': 'root',
            'data-node-type': 'directory',
          },
        },
      ]

      invalidElementCases.forEach(({ description, attributes }) => {
        it(`given ${description}, when building node map, expect element skipped`, () => {
          // GIVEN
          const invalidElement = createMockElement(attributes)
          const validElement = createMockElement({
            'data-node-level': '1',
            'data-node-path': 'valid',
            'data-node-parent-path': 'root',
            'data-node-type': 'file',
          })
          const nodeList = createNodeList([invalidElement, validElement])

          // WHEN
          const nodeMap = buildNodeMap(nodeList, mockParentRect)

          // EXPECT
          expect(nodeMap.size).toBe(1)
          expect(nodeMap.get('root')).toHaveLength(1)
          expect(nodeMap.get('root')![0].path).toBe('valid')
        })
      })
    })

    describe('default values and edge cases', () => {
      it('given element without parent path attribute, when building map, expect root as default parent', () => {
        // GIVEN
        const element = createMockElement({
          'data-node-level': '1',
          'data-node-path': 'orphan',
          'data-node-type': 'file',
        })
        const nodeList = createNodeList([element])

        // WHEN
        const nodeMap = buildNodeMap(nodeList, mockParentRect)

        // EXPECT
        expect(nodeMap.get('root')).toHaveLength(1)
        expect(nodeMap.get('root')![0].parentPath).toBe('root')
      })

      it('given element with unknown type, when building map, expect default to directory', () => {
        // GIVEN
        const element = createMockElement({
          'data-node-level': '1',
          'data-node-path': 'unknown',
          'data-node-type': 'unknown-type',
        })
        const nodeList = createNodeList([element])

        // WHEN
        const nodeMap = buildNodeMap(nodeList, mockParentRect)

        // EXPECT
        expect(nodeMap.get('root')![0].type).toBe('directory')
      })

      it('given element without collapsed attribute, when building map, expect default to false', () => {
        // GIVEN
        const element = createMockElement({
          'data-node-level': '1',
          'data-node-path': 'test',
          'data-node-type': 'file',
        })
        const nodeList = createNodeList([element])

        // WHEN
        const nodeMap = buildNodeMap(nodeList, mockParentRect)

        // EXPECT
        expect(nodeMap.get('root')![0].collapsed).toBe(false)
      })

      it('given element with collapsed true, when building map, expect collapsed to be true', () => {
        // GIVEN
        const element = createMockElement({
          'data-node-level': '1',
          'data-node-path': 'test',
          'data-node-type': 'directory',
          'data-node-collapsed': 'true',
        })
        const nodeList = createNodeList([element])

        // WHEN
        const nodeMap = buildNodeMap(nodeList, mockParentRect)

        // EXPECT
        expect(nodeMap.get('root')![0].collapsed).toBe(true)
      })
    })

    describe('coordinate calculations', () => {
      it('given elements at different positions, when building map, expect relative coordinates calculated', () => {
        // GIVEN
        const element = createMockElement(
          {
            'data-node-level': '1',
            'data-node-path': 'positioned',
            'data-node-type': 'file',
          },
          { left: 150, top: 100, width: 30, height: 40 },
        )
        const nodeList = createNodeList([element])

        // WHEN
        const nodeMap = buildNodeMap(nodeList, mockParentRect)

        // EXPECT
        const node = nodeMap.get('root')![0]
        expect(node.cx).toBe(50) // 150 - 100
        expect(node.cy).toBe(70) // 100 - 50 + 40/2
      })
    })
  })
})
