import { ActionButtons, CustomButton, ProgressIndicator, ThemeContext } from '@commons'
import { css, Interpolation, Theme } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useContext, useEffect, useMemo } from 'react'
import { FileDiff } from '../../models/FileDiff'
import { useDiffViewerConfig } from '../diff-viewer/providers/diff-viewer-context'
import { LineRange, LoadMoreLinesHandler, Overlay, Widget } from '../diff-viewer/types'
import FileViewer from './components/viewers/FileViewer'
import { CodePanelConfigProvider, useCodePanelConfig } from './providers/code-panel-context'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.md};
      overflow: hidden;
    `,

    skeletonContainer: css`
      flex: 1;
      border-radius: ${theme.spacing.xs};
      overflow: auto;
    `,

    diffContainer: css`
      display: flex;
      flex-direction: column;
      overflow: auto;
      gap: ${theme.spacing.md};
    `,

    header: css`
      display: flex;
      flex-direction: row;
      padding-right: 10px;
      justify-content: space-between;
      align-items: center;
      gap: ${theme.spacing.md};
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
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Array of widgets to display at specific line positions. */
  widgets?: Widget[]
  /** The line range to highlight. */
  highlightedLines?: LineRange

  /** Called when the user requests to load (expand) more lines for a specific file. */
  onLoadMoreLines?: LoadMoreLinesHandler
  /** Called when the user selects a line range. */
  onRangeSelected?: (range: LineRange) => void
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
  const { setAllFileKeys, fileStateMap, allFileKeys, setViewed, setCollapsed } = useCodePanelConfig()

  const viewedFilesCount = useMemo(
    () => Array.from(fileStateMap.values()).filter((s) => s.isViewed).length,
    [fileStateMap],
  )

  const controllers: CustomButton[] = useMemo(() => {
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
      <div css={styles.header}>
        <ProgressIndicator current={viewedFilesCount} total={allFileKeys.length} suffix="files viewed" />
        <ActionButtons buttons={controllers} />
      </div>

      <div css={styles.diffContainer}>
        {props.files.map((file) => (
          <FileViewer
            key={file.newPath || file.oldPath}
            id={`file-diff-${file.newPath || file.oldPath}`}
            file={file}
            onLoadMoreLines={props.onLoadMoreLines}
            maxLinesToFetch={props.maxLinesToFetch}
            overlays={props.overlays}
            widgets={props.widgets}
            highlightedLines={props.highlightedLines}
            onRangeSelected={props.onRangeSelected}
          />
        ))}
      </div>
    </div>
  )
}
