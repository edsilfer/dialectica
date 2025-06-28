import { useEffect, useState, useContext } from 'react'
import { getConnectorPaths } from './tree-utils'
import { Node, TreeSkeletonProps } from './types'
import { css } from '@emotion/react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import { useFileExplorerContext } from '../provider/file-explorer-context'

const ROOT_PATH = 'root'

const toNode = (el: Element, parentRect: DOMRect): Node | null => {
  const level = Number(el.getAttribute('data-node-level'))
  const path = el.getAttribute('data-node-path')
  if (isNaN(level) || !path) return null
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

const buildNodeMap = (rows: NodeListOf<Element>, parentRect: DOMRect): Map<string, Node[]> => {
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

type ConnectorStyle = 'solid' | 'dashed' | 'none'

const useStyles = (connector: ConnectorStyle) => {
  const theme = useContext(ThemeContext)

  return {
    svg: css`
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1000;
    `,
    line: css`
      stroke: ${theme.colors.borderBg};
      stroke-width: 1;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      ${connector === 'dashed' ? 'stroke-dasharray: 4 2;' : ''};
      ${connector === 'none' ? 'stroke: transparent;' : ''};
    `,
  }
}

function TreeSkeleton({ containerRef }: TreeSkeletonProps) {
  const { expandedDirs, config } = useFileExplorerContext()
  const connector: ConnectorStyle = config.nodeConnector ?? 'solid'
  const radius = config.roundedConnectors ? 6 : 0
  const [nodeMap, setNodeMap] = useState<Map<string, Node[]>>(new Map())
  const [size, setSize] = useState({ width: 0, height: 0 })
  const styles = useStyles(connector)

  useEffect(() => {
    const container = containerRef?.current
    if (!container) return

    const parentRect = container.getBoundingClientRect()
    const rows = container.querySelectorAll('[data-fs-node-row]')

    setNodeMap(buildNodeMap(rows, parentRect))
    setSize({ width: parentRect.width, height: parentRect.height })
  }, [containerRef, expandedDirs])

  const paths = connector === 'none' ? [] : getConnectorPaths(nodeMap, radius)

  return (
    <svg width={size.width} height={size.height} css={styles.svg}>
      {paths.map((d, index) => (
        <path key={`p-${index}`} d={d} css={styles.line} />
      ))}
    </svg>
  )
}

export default TreeSkeleton
