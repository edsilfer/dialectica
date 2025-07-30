import { Node } from './types'

const ROOT_PATH = 'root'

/**
 * Builds SVG path definitions that connect each node to its parent.
 *
 * @param nodes  - The nodes to search through.
 * @param radius - The radius of the rounded corners.
 * @returns      - The connector path definitions for the tree.
 */
export function getConnectorPaths(nodes: Map<string, Node[]>, radius = 0): string[] {
  const paths: string[] = []

  const offsetX = 11
  const offsetY = 8

  const allNodes = [...nodes.values()].flat()
  const pathToNode = new Map(allNodes.map((node) => [node.path, node]))

  for (const node of allNodes) {
    if (node.parentPath === 'root') continue

    const parentNode = pathToNode.get(node.parentPath)
    if (!parentNode) continue

    const startX = parentNode.cx + offsetX
    const startY = parentNode.cy + (parentNode.type === 'directory' ? offsetY : 0)

    const r = Math.max(0, radius)
    const endX = node.cx + (node.type === 'directory' ? 4 : 0)

    // When radius is zero, draw a sharp 90° angle using two straight segments.
    if (r === 0) {
      paths.push(`M ${startX} ${startY} V ${node.cy} H ${endX}`)
      continue
    }

    // Ensure the radius does not exceed the vertical distance
    const verticalDistance = Math.abs(node.cy - startY)
    const effectiveR = Math.min(r, verticalDistance / 2)
    const verticalEndY = node.cy - effectiveR

    // If nodes are too close for a curve, fall back to straight connector
    if (verticalEndY <= startY) {
      paths.push(`M ${startX} ${startY} L ${endX} ${node.cy}`)
      continue
    }

    const path = [
      `M ${startX} ${startY}`,
      `V ${verticalEndY}`,
      `Q ${startX} ${node.cy} ${startX + effectiveR} ${node.cy}`,
      `H ${endX}`,
    ].join(' ')

    paths.push(path)
  }

  return paths
}

/**
 * Builds a map of nodes by their parent path.
 *
 * @param rows       - The rows to search through.
 * @param parentRect - The parent rectangle.
 * @returns          - The map of nodes by their parent path.
 */
export const buildNodeMap = (rows: NodeListOf<Element>, parentRect: DOMRect): Map<string, Node[]> => {
  const map = new Map<string, Node[]>()
  rows.forEach((el) => {
    const node = toNode(el, parentRect)
    if (!node) return
    const list = map.get(node.parentPath) ?? []
    list.push(node)
    map.set(node.parentPath, list)
  })
  return map
}

/**
 * Converts an element to a node.
 *
 * @param el         - The element to convert.
 * @param parentRect - The parent rectangle.
 * @returns          - The node.
 */
const toNode = (el: Element, parentRect: DOMRect): Node | null => {
  const levelAttr = el.getAttribute('data-node-level')
  const path = el.getAttribute('data-node-path')

  // Check if level attribute exists and is a valid number
  if (!levelAttr || !path) return null

  const level = Number(levelAttr)
  if (isNaN(level)) return null

  const rect = el.getBoundingClientRect()
  return {
    cx: rect.left - parentRect.left,
    cy: rect.top - parentRect.top + rect.height / 2,
    level,
    parentPath: el.getAttribute('data-node-parent-path') || ROOT_PATH,
    path,
    type: el.getAttribute('data-node-type') === 'file' ? 'file' : 'directory',
    collapsed: el.getAttribute('data-node-collapsed') === 'true',
  }
}
