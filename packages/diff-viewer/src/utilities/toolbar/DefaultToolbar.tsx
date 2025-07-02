import { css } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useContext, useMemo } from 'react'
import { useCodePanelConfig } from '../../code-panel/providers/code-panel-context'
import { ThemeContext } from '../../shared/providers/theme-context'
import { ActionButtons } from './ActionButtons'
import { ProgressIndicator } from './ProgressIndicator'
import { CustomButton, DefaultToolbarProps } from './types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: ${theme.spacing.xs};
      min-height: 2rem;
      background-color: ${theme.colors.backgroundPrimary};
      border-top: 1px solid ${theme.colors.border};
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
    `,

    skeleton: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      min-height: 2rem;
      padding: ${theme.spacing.xs};
      background-color: ${theme.colors.backgroundPrimary};
      border-top: 1px solid ${theme.colors.border};
      width: 100%;
    `,

    rightCluster: css`
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      margin-left: auto;
      align-items: center;
      gap: ${theme.spacing.md};
    `,

    leftCluster: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${theme.spacing.md};
    `,
  }
}

export const Toolbar: React.FC<DefaultToolbarProps> = (props) => {
  const { addDefaultButtons = true, additionalWidget: additionalComponents = [] } = props
  const styles = useStyles()
  const { viewedFiles, allFileKeys, setCollapsedFiles, setViewedFiles } = useCodePanelConfig()

  const builtInButtons: CustomButton[] = useMemo(
    () => [
      {
        key: 'collapse-all',
        label: 'Collapse',
        tooltipText: 'Collapse all files',
        onClick: () => setCollapsedFiles(allFileKeys),
        side: 'right',
      },
      {
        key: 'expand-all',
        label: 'Expand',
        tooltipText: 'Expand all files',
        onClick: () => setCollapsedFiles([]),
        side: 'right',
      },
      {
        key: 'mark-all-viewed',
        label: viewedFiles.length === allFileKeys.length ? 'Unview' : 'Viewed',
        tooltipText: 'Mark all files as viewed',
        onClick: () => {
          if (viewedFiles.length === allFileKeys.length) {
            setViewedFiles([])
          } else {
            setViewedFiles(allFileKeys)
          }
        },
        side: 'right',
      },
    ],
    [viewedFiles.length, allFileKeys, setCollapsedFiles, setViewedFiles],
  )

  const allButtons = [...(props.customButtons || []), ...(addDefaultButtons ? builtInButtons : [])]

  // Filter additional components by side
  const leftComponents = additionalComponents.filter((comp) => comp.side === 'left')
  const rightComponents = additionalComponents.filter((comp) => comp.side === 'right')

  if (props.loading) {
    return (
      <div css={styles.skeleton}>
        <Skeleton active title={false} paragraph={{ rows: 2 }} />
      </div>
    )
  }

  return (
    <div css={styles.container}>
      {/* Left cluster */}
      {leftComponents.length > 0 && (
        <div css={styles.leftCluster}>
          {leftComponents.map(({ key, component }) => (
            <React.Fragment key={key}>{component}</React.Fragment>
          ))}
        </div>
      )}

      {/* Header */}
      {props.header && props.header}

      {/* Right cluster */}
      <div css={styles.rightCluster}>
        <ActionButtons buttons={allButtons} />
        <ProgressIndicator current={viewedFiles.length} total={allFileKeys.length} suffix="files viewed" />
        {rightComponents.length > 0 && (
          <>
            {rightComponents.map(({ key, component }) => (
              <React.Fragment key={key}>{component}</React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
