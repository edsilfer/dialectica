import React from 'react'
import { ThemeContext } from '@commons'
import { css } from '@emotion/react'
import { useContext, useEffect, useState } from 'react'
import { useFileExplorerContext } from '../providers/fstree-context'
import { buildNodeMap, getConnectorPaths } from './tree-utils'
import { ConnectorStyle, Node, TreeSkeletonProps } from './types'

const useStyles = (connector: ConnectorStyle) => {
  const theme = useContext(ThemeContext)

  return {
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 10;
    `,
    line: css`
      stroke: ${theme.colors.textPrimary};
      stroke-width: 1;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      ${connector === 'dashed' ? 'stroke-dasharray: 4 2;' : ''};
      ${connector === 'none' ? 'stroke: transparent;' : ''};
    `,
  }
}

export const TreeSkeleton: React.FC<TreeSkeletonProps> = ({ containerRef }) => {
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

    /*
     * The SVG needs to cover the full scrollable area so that the connector lines remain
     * visible while the user scrolls. Using the container's bounding-box height only
     * accounts for the visible viewport. Instead we rely on the `scrollHeight`/`scrollWidth`
     * values so the SVG is tall/wide enough to span the entire content area.
     *
     * However, `scrollHeight` is an integer whereas `getBoundingClientRect().height` may
     * include sub-pixel values (e.g. 483.53 px). On Hi-DPI screens this can cause
     * `scrollHeight` to be rounded **up** by up to one pixel, resulting in the SVG being
     * slightly taller than its container and triggering an unnecessary scrollbar.
     *
     * To avoid that, we check if the difference is less than 1px. If so, we use the
     * container's bounding-box height, which has sub-pixel precision. Otherwise,
     * we use `scrollHeight` to ensure the SVG is tall enough to cover all content.
     */
    const { scrollHeight, scrollWidth } = container
    const containerHeight = parentRect.height
    const height = scrollHeight - containerHeight < 1 ? containerHeight : scrollHeight
    setSize({ width: scrollWidth, height })
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
