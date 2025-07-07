import { css } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useContext, useEffect } from 'react'
import { useDiffViewerConfig } from '../diff-viewer/providers/diff-viewer-context'
import { ThemeContext } from '../../themes/providers/theme-context'
import HunkList from './components/hunk-list/HunkList'
import { CodePanelConfigProvider, useCodePanelConfig } from './providers/code-panel-context'
import type { FileListProps } from './types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.md};
    `,
    skeletonContainer: css`
      flex: 1;
      border-radius: ${theme.spacing.xs};
      overflow: auto;
    `,
  }
}

export const CodePanel: React.FC<FileListProps> = (props) => {
  let hasSpecificProvider = true
  try {
    void useCodePanelConfig()
  } catch {
    hasSpecificProvider = false
  }

  let inheritedConfig
  try {
    const diffViewerConfig = useDiffViewerConfig()
    inheritedConfig = diffViewerConfig.codePanelConfig
  } catch {
    inheritedConfig = undefined
  }

  const diffViewer = <CodePanelContent {...props} />

  if (hasSpecificProvider) {
    return diffViewer
  }

  // Otherwise create a provider, seeding it with any config we could inherit.
  return <CodePanelConfigProvider config={inheritedConfig}>{diffViewer}</CodePanelConfigProvider>
}

const CodePanelContent: React.FC<FileListProps> = (props) => {
  const styles = useStyles()
  const { setAllFileKeys } = useCodePanelConfig()

  // Populate allFileKeys when diff changes
  useEffect(() => {
    const fileKeys = props.files.map((file) => file.key)
    setAllFileKeys(fileKeys)
  }, [props.files, setAllFileKeys])

  useEffect(() => {
    if (props.scrollTo) {
      const element = document.getElementById(`file-diff-${props.scrollTo}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [props.scrollTo])

  // Show skeleton when loading
  if (props.isLoading) {
    return (
      <div css={[styles.skeletonContainer, props.css]} className={props.className}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    )
  }

  return (
    <div css={[styles.container, props.css]} className={props.className}>
      {props.files.map((file) => (
        <HunkList
          key={file.newPath || file.oldPath}
          id={`file-diff-${file.newPath || file.oldPath}`}
          file={file}
          onLoadMoreLines={props.onLoadMoreLines}
          maxLinesToFetch={props.maxLinesToFetch}
        />
      ))}
    </div>
  )
}
