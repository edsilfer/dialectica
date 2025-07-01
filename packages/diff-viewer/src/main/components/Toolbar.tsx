import { css, keyframes } from '@emotion/react'
import { Button, Progress, Space, Tooltip, Typography } from 'antd'
import React, { useContext } from 'react'
import { useCodePanelConfig } from '../../code-panel/providers/code-panel-context'
import { ThemeContext } from '../../shared/providers/theme-context'
import { ToolbarProps } from './types'

const { Text } = Typography

// Slide-in animations for the toolbar icons
const slideInFromLeft = keyframes`
  0% {
    transform: translateX(-50%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`

const slideInFromRight = keyframes`
  0% {
    transform: translateX(50%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`

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

    closeDrawer: css`
      color: ${theme.colors.textPrimary};
      font-size: 1.25rem;
    `,

    iconSlideInLeft: css`
      animation: ${slideInFromLeft} 0.3s ease-in-out;
    `,

    iconSlideInRight: css`
      animation: ${slideInFromRight} 0.3s ease-in-out;
    `,

    titleContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.xs};
    `,

    titleText: css`
      color: ${theme.colors.textPrimary};
      font-size: ${theme.typography.regularFontSize}px;
      font-weight: 600;
      margin: 0; /* reset Typography margin */
    `,

    subtitleText: css`
      color: ${theme.colors.textPrimary};
      font-size: ${theme.typography.regularFontSizeSM}px;
      opacity: 0.8;
      margin: 0;
    `,

    rightCluster: css`
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      margin-left: auto;
      align-items: center;
      gap: ${theme.spacing.md};
    `,

    progressContainer: css`
      display: flex;
      flex-direction: column;
      width: 110px;
      align-items: center;
    `,

    progressText: css`
      color: ${theme.colors.textPrimary};
      font-size: 0.75rem;
      cursor: default;
    `,
  }
}

export const Toolbar: React.FC<ToolbarProps> = ({ totalFiles, title, subtitle }) => {
  const styles = useStyles()
  const { viewedFiles, allFileKeys, setCollapsedFiles, setViewedFiles } = useCodePanelConfig()
  const percent = totalFiles > 0 ? Math.round((viewedFiles.length / totalFiles) * 100) : 0

  const handleCollapseAll = () => {
    setCollapsedFiles(allFileKeys)
  }

  const handleExpandAll = () => {
    setCollapsedFiles([])
  }

  const handleMarkAllViewed = () => {
    if (viewedFiles.length === allFileKeys.length) {
      setViewedFiles([])
    } else {
      setViewedFiles(allFileKeys)
    }
  }

  return (
    <div css={styles.container}>
      {(title || subtitle) && (
        <div css={styles.titleContainer}>
          {title &&
            (typeof title === 'string' ? (
              <Text css={styles.titleText} ellipsis={{ tooltip: title }}>
                {title}
              </Text>
            ) : (
              <>{title}</>
            ))}

          {subtitle &&
            (typeof subtitle === 'string' ? (
              <Text css={styles.subtitleText} ellipsis={{ tooltip: subtitle }}>
                {subtitle}
              </Text>
            ) : (
              <>{subtitle}</>
            ))}
        </div>
      )}

      <div css={styles.rightCluster}>
        <Space.Compact>
          <Tooltip title="Collapse all files">
            <Button size="small" onClick={handleCollapseAll}>
              Collapse
            </Button>
          </Tooltip>

          <Tooltip title="Expand all files">
            <Button size="small" onClick={handleExpandAll}>
              Expand
            </Button>
          </Tooltip>

          <Tooltip title="Mark all files as viewed">
            <Button size="small" onClick={handleMarkAllViewed}>
              {viewedFiles.length === allFileKeys.length ? 'Unview' : 'Viewed'}
            </Button>
          </Tooltip>
        </Space.Compact>

        <div css={styles.progressContainer}>
          <Text css={styles.progressText}>{`${viewedFiles.length} / ${totalFiles} files viewed`}</Text>
          <Progress percent={percent} size="small" showInfo={false} />
        </div>
      </div>
    </div>
  )
}
