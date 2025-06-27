import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import type { FileExplorerConfig } from '../types'
import { FSNodeProps } from './types'
import { highlightText } from '../utils'

const useStyles = (config: FileExplorerConfig) => {
  const theme = useContext(ThemeContext)

  return {
    row: (paddingLeft: number, isSelected?: boolean) => css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${theme.spacing.xs};
      padding: ${theme.spacing.sm};
      padding-left: ${paddingLeft}px;
      cursor: pointer;
      position: relative;
      color: ${theme.colors.textPrimary};

      .highlighted-text {
        background-color: ${theme.colors.textPrimary}20;
        border: 1px solid ${theme.colors.textPrimary}40;
        border-radius: 2px;
        padding: 1px 2px;
      }

      ${isSelected
        ? `
        border-radius: ${theme.spacing.sm};
        background-color: ${theme.colors.fileExplorerSelectedFileBg};

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 5px;
          height: 100%;
          background-color: ${theme.colors.accentColor};
          border-radius: ${theme.spacing.sm} 0 0 ${theme.spacing.sm};
        }

      `
        : ''}

      &:hover {
        border-radius: ${theme.spacing.sm};
        background-color: ${theme.colors.fileExplorerSelectedFileBg};
      }
    `,

    verticalConnector: (level: number, topOffset: number) => css`
      position: absolute;
      border-left: 1px solid ${theme.colors.fileExplorerlineConnectorBg};
      top: ${topOffset}px;
      height: 100%;
      z-index: 100;
      left: ${level * config.indentPx + 12}px;
    `,

    horizontalConnector: (level: number) => css`
      position: absolute;
      border-top: 1px solid ${theme.colors.fileExplorerlineConnectorBg};
      left: ${(level - 1) * config.indentPx + 12}px;
      width: ${level > 0 ? config.indentPx - 6 : 0}px;
      z-index: 100;
    `,
  }
}

const FSNode: React.FC<FSNodeProps> = (props) => {
  const styles = useStyles(props.config)
  const connectorCount = props.isLast ? props.level : props.level

  return (
    <div
      css={[styles.row(props.rowPaddingLeftExtra || 0, props.isSelected), props.css]}
      className={props.className}
      onClick={props.onClick}
    >
      {/* Vertical connector(s) */}
      {Array.from({ length: connectorCount }).map((_, index) => (
        <div key={index} css={styles.verticalConnector(index, props.verticalConnectorTop || -12)} />
      ))}

      {/* Horizontal connector */}
      <div css={styles.horizontalConnector(props.level)} />

      {/* Row content */}
      {props.children}

      {/* Node name */}
      {props.displayName && (
        <span>{highlightText(props.displayName, props.highlightString || '')}</span>
      )}
    </div>
  )
}

export default FSNode
