import { css } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useContext, useMemo } from 'react'
import { useCodePanelConfig } from '../..'
import { ThemeContext } from '../../themes/providers/theme-context'
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
  const { fileStateMap, allFileKeys, setViewed, setCollapsed } = useCodePanelConfig()

  const viewedFilesCount = useMemo(
    () => Array.from(fileStateMap.values()).filter((s) => s.isViewed).length,
    [fileStateMap],
  )

  const builtInButtons: CustomButton[] = useMemo(() => {
    const collapseAll = () => {
      allFileKeys.forEach((key) => setCollapsed(key, true))
    }

    const expandAll = () => {
      allFileKeys.forEach((key) => setCollapsed(key, false))
    }

    const toggleAllViewed = () => {
      const markViewed = viewedFilesCount !== allFileKeys.length
      allFileKeys.forEach((key) => setViewed(key, markViewed))
    }

    return [
      {
        key: 'collapse-all',
        label: 'Collapse',
        tooltipText: 'Collapse all files',
        onClick: collapseAll,
        side: 'right',
      },
      {
        key: 'expand-all',
        label: 'Expand',
        tooltipText: 'Expand all files',
        onClick: expandAll,
        side: 'right',
      },
      {
        key: 'mark-all-viewed',
        label: viewedFilesCount === allFileKeys.length ? 'Unview' : 'Viewed',
        tooltipText: 'Toggle viewed state for all files',
        onClick: toggleAllViewed,
        side: 'right',
      },
    ]
  }, [allFileKeys, viewedFilesCount, setViewed, setCollapsed])

  const allButtons = [...(props.customButtons || []), ...(addDefaultButtons ? builtInButtons : [])]
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
        <ProgressIndicator current={viewedFilesCount} total={allFileKeys.length} suffix="files viewed" />
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
