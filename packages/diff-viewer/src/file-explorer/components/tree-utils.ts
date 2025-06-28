import { Node } from './types'

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
