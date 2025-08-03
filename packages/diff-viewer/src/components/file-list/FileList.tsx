import { ActionButtons, CustomButton, ProgressIndicator, ThemeContext, useIsMobile } from '@edsilfer/commons'
import { css, Interpolation, Theme } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { FileDiff } from '../../models/FileDiff'
import { LineRange, LoadMoreLinesHandler, Overlay, Widget } from '../../models/LineExtensions'
import { DiffSearchProvider, useDiffSearch } from '../../providers/diff-search-provider'
import { useDiffViewerConfig } from '../../providers/diff-viewer-context'
import { FileListConfigProvider, useFileListConfig } from '../../providers/file-list-context'
import { FileViewer } from './components/viewers/FileViewer'
import SearchPanel from './SearchPanel'

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
      justify-content: space-between;
      align-items: center;
      gap: ${theme.spacing.sm};

      @media (max-width: 768px) {
        width: 100%;
      }
    `,

    rightHeaderContainer: css`
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      margin-left: auto;
      width: 100%;
      gap: ${theme.spacing.sm};
    `,

    leftHeaderContainer: css`
      display: flex;
      flex-direction: row;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: ${theme.spacing.sm};
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

export const FileList: React.FC<FileListProps> = (props) => {
  let hasSpecificProvider = true
  try {
    void useFileListConfig()
  } catch {
    hasSpecificProvider = false
  }

  let inheritedConfig
  try {
    const diffViewerConfig = useDiffViewerConfig()
    inheritedConfig = diffViewerConfig.fileListConfig
  } catch {
    inheritedConfig = undefined
  }

  const diffViewer = <FileListContent {...props} />

  if (hasSpecificProvider) {
    return <DiffSearchProvider files={props.files}>{diffViewer}</DiffSearchProvider>
  }

  // Otherwise create a provider, seeding it with any config we could inherit.
  return (
    <FileListConfigProvider config={inheritedConfig}>
      <DiffSearchProvider files={props.files}>{diffViewer}</DiffSearchProvider>
    </FileListConfigProvider>
  )
}

const FileListContent: React.FC<FileListProps> = (props) => {
  const styles = useStyles()
  const theme = useContext(ThemeContext)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const { focusedMatch } = useDiffSearch()
  const { config, fileStateMap, allFileKeys, setAllFileKeys, setViewed, setCollapsed } = useFileListConfig()
  const isMobile = useIsMobile()

  /*
   * - List of file keys that are too large to start open
   * - We keep it in FileList to avoid re-computing it on FileViewer when Virtuoso recycles the view
   */
  const [forceCollapse, setForceCollapse] = useState<Set<string>>(
    new Set(
      props.files
        .filter((f) => {
          return f.lineCount > config.maxFileLines
        })
        .map((f) => f.key),
    ),
  )

  const sortedFiles = useMemo(() => {
    return [...props.files].sort((a, b) => FileDiff.compare(a, b))
  }, [props.files])

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
        label: isMobile ? ' - ' : 'Collapse all',
        tooltipText: 'Collapse all files',
        onClick: collapseAll,
        side: 'right',
      },
      {
        key: 'expand-all',
        label: isMobile ? ' + ' : 'Expand all',
        tooltipText: 'Expand all files',
        onClick: expandAll,
        side: 'right',
      },
      ...(isMobile
        ? []
        : [
            {
              key: 'mark-all-viewed',
              label: viewedFilesCount === allFileKeys.length ? 'Unview' : 'Viewed',
              tooltipText: 'Toggle viewed state for all files',
              onClick: toggleAllViewed,
              side: 'right' as const,
            },
          ]),
    ]
  }, [isMobile, allFileKeys, viewedFilesCount, setViewed, setCollapsed])

  // EFFECTS ----------------------------------------------------------------
  useEffect(() => {
    const fileKeys = sortedFiles.map((file) => file.key)
    setAllFileKeys(fileKeys)
  }, [sortedFiles, setAllFileKeys])

  useEffect(() => {
    if (props.scrollTo && virtuosoRef.current) {
      const index = sortedFiles.findIndex((f) => (f.newPath || f.oldPath) === props.scrollTo)
      if (index >= 0) {
        virtuosoRef.current.scrollToIndex({
          index,
          align: 'start',
          behavior: 'smooth',
        })
      }
    }
  }, [props.scrollTo, sortedFiles])

  useEffect(() => {
    if (!focusedMatch || !virtuosoRef.current) return
    const { line } = focusedMatch
    const fileIndex = sortedFiles.findIndex((file) => file.key === line.file)
    if (fileIndex >= 0) {
      virtuosoRef.current.scrollToIndex({
        index: fileIndex,
        align: 'center',
        behavior: 'smooth',
      })
    }
  }, [focusedMatch, sortedFiles])

  const handleForceRender = useCallback((fileKey: string) => {
    setForceCollapse((prev) => {
      const next = new Set(prev)
      next.delete(fileKey)
      return next
    })
  }, [])

  // RENDER ----------------------------------------------------------------
  const LargeScreenHeader = (
    <div css={styles.header}>
      <ProgressIndicator current={viewedFilesCount} total={allFileKeys.length} suffix="files viewed" />
      <div css={styles.rightHeaderContainer}>
        <ActionButtons buttons={controllers} />
        <SearchPanel />
      </div>
    </div>
  )

  const MobileHeader = (
    <div css={styles.header}>
      <ProgressIndicator current={viewedFilesCount} total={allFileKeys.length} suffix="files viewed" />
      <SearchPanel />
      <ActionButtons buttons={controllers} />
    </div>
  )

  if (props.isLoading) {
    return (
      <div css={[styles.skeletonContainer, props.css]} className={props.className}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    )
  }

  return (
    <div css={[styles.container, props.css]} className={props.className}>
      {isMobile ? MobileHeader : LargeScreenHeader}

      <Virtuoso
        ref={virtuosoRef}
        increaseViewportBy={{ top: 500, bottom: 500 }}
        computeItemKey={(_, file) => file.key}
        style={{ height: '100%', overflow: 'auto' }}
        data={sortedFiles}
        itemContent={(_, file) => (
          <div style={{ marginBottom: theme.spacing.md }}>
            <FileViewer
              startCollapsed={forceCollapse.has(file.key)}
              onForceRender={handleForceRender}
              id={`file-diff-${file.newPath || file.oldPath}`}
              file={file}
              onLoadMoreLines={props.onLoadMoreLines}
              overlays={props.overlays}
              widgets={props.widgets}
              highlightedLines={props.highlightedLines}
              onRangeSelected={props.onRangeSelected}
            />
          </div>
        )}
      />
    </div>
  )
}
