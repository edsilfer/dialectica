import { CodePanelConfig } from '../code-panel/providers/types'
import { FileExplorerConfig } from '../file-explorer/types'
import { ParsedDiff } from '../shared/parsers/types'
import { ThemeTokens } from '../shared/themes'
import React from 'react'
import { DrawerContent } from './components/drawer/types'

export interface DiffViewerProps {
  /** The parsed diff to visualize. */
  diff: ParsedDiff
  /** The theme to use for the diff viewer. */
  theme?: ThemeTokens
  /** The configuration for the code panel. */
  codePanelConfig?: Omit<CodePanelConfig, 'theme'>
  /** The configuration for the file explorer. */
  fileExplorerConfig?: Omit<FileExplorerConfig, 'theme'>
  /** The storage to use for the diff viewer. */
  storage?: 'in-memory' | 'local'
  /** An optional title to display in the DiffViewer's Toolbar. */
  title?: React.ReactNode
  /** An optional subtitle to display under the title. */
  subtitle?: React.ReactNode
  /** Whether the metadata (header information, file list, etc.) is still loading. */
  isMetadataLoading?: boolean
  /** Whether the diff (file content changes) is still loading. */
  isDiffLoading?: boolean
  /** Whether to show the file explorer panel. Defaults to true. */
  enableFileExplorer?: boolean
  /** Additional drawer contents to be displayed alongside the built-in file explorer. */
  additionalDrawerContents?: DrawerContent[]
}
