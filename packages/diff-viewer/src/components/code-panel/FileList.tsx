import { css, Interpolation, Theme } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useContext, useEffect } from 'react'
import { FileDiff } from '../../models/FileDiff'
import { ThemeContext } from '../../themes/providers/theme-context'
import { useDiffViewerConfig } from '../diff-viewer/providers/diff-viewer-context'
import { LoadMoreLinesHandler } from '../diff-viewer/types'
import FileViewer from './components/FileViewer'
import { CodePanelConfigProvider, useCodePanelConfig } from './providers/code-panel-context'

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

export type FileListProps = {
  /** The files to display. */
  files: FileDiff[]
  /** The file to scroll to when the diff is loaded. */
  scrollTo?: string
  /** Whether the code panel is in a loading state. */
  isLoading?: boolean
  /** Kept to make typescript happy, but not used by emotion */
  css?: Interpolation<Theme>
  /** The content of css will be hashed and passed here */
  className?: string
  /** Number of lines to request when user clicks "load more". Defaults to 5. */
  maxLinesToFetch?: number

  /** Called when the user requests to load (expand) more lines for a specific file. */
  onLoadMoreLines?: LoadMoreLinesHandler
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
        <FileViewer
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
