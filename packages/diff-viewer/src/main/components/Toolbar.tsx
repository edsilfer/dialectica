import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { css, keyframes } from '@emotion/react'
import { Progress, Tooltip, Typography } from 'antd'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-context'
import { useDiffViewerConfig } from '../providers/diff-viewer-context'
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
      align-items: center;
      padding: ${theme.spacing.sm};
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

    progressContainer: css`
      margin-left: auto;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      width: 150px; /* adjust as necessary */
    `,

    progressText: css`
      color: ${theme.colors.textPrimary};
      font-size: 0.75rem;
      cursor: default;
    `,
  }
}

export const Toolbar: React.FC<ToolbarProps> = ({ totalFiles, drawerOpen, onToggleDrawer }) => {
  const styles = useStyles()
  const { viewedFiles } = useDiffViewerConfig()
  const percent = totalFiles > 0 ? Math.round((viewedFiles.length / totalFiles) * 100) : 0

  const handleToggleDrawer = () => {
    onToggleDrawer(!drawerOpen)
  }

  return (
    <div css={styles.container}>
      <Tooltip title={drawerOpen ? 'Close drawer' : 'Open drawer'}>
        {drawerOpen ? (
          <MenuFoldOutlined css={[styles.closeDrawer, styles.iconSlideInLeft]} onClick={handleToggleDrawer} />
        ) : (
          <MenuUnfoldOutlined css={[styles.closeDrawer, styles.iconSlideInRight]} onClick={handleToggleDrawer} />
        )}
      </Tooltip>

      <div css={styles.progressContainer}>
        <Text css={styles.progressText}>{`${viewedFiles.length} / ${totalFiles} files viewed`}</Text>
        <Progress percent={percent} size="small" showInfo={false} />
      </div>
    </div>
  )
}
