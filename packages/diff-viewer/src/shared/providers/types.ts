import { ReactNode } from 'react'
import { DiffViewerConfig } from '../../diff-viewer/providers/types'
import { FileExplorerConfig } from '../../file-explorer/types'
import { ThemeTokens } from '../themes'

export interface DiffViewerGlobalConfigContextProps {
  /** The children of the diff viewer config provider */
  children: ReactNode
  /** The theme to use for the diff viewer */
  theme: ThemeTokens
  /** The configuration for the diff viewer*/
  diffViewerConfig?: Omit<DiffViewerConfig, 'theme'>
  /** The configuration for the file explorer */
  fileExplorerConfig?: Omit<FileExplorerConfig, 'theme'>
}

export interface DiffViewerGlobalConfigContextState {
  /** The configuration for the diff viewer */
  diffViewerConfig: DiffViewerConfig
  /** The configuration for the file explorer */
  fileExplorerConfig: FileExplorerConfig

  /** Set the configuration for the diff viewer */
  setDiffViewerConfig: React.Dispatch<React.SetStateAction<DiffViewerConfig>>
  /** Set the configuration for the file explorer */
  setFileExplorerConfig: React.Dispatch<React.SetStateAction<FileExplorerConfig>>
}

export interface ThemeProps {
  /** The children of the theme provider */
  children: React.ReactNode
  /** The theme to use for the diff viewer */
  theme: ThemeTokens
}
