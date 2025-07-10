/**
 * README
 * ------
 * - Defines the public API for the `@diff-viewer` package.
 * - Simplifies imports, providing a single entry point for consumers.
 * - Decouples the package's internal structure from its public interface.
 */
import './themes/styles/highlight-themes.css'

export * from './components/code-panel/FileList'
export { CodePanelConfigProvider, useCodePanelConfig } from './components/code-panel/providers/code-panel-context'
export type { CodePanelConfig } from './components/code-panel/providers/types'
export * from './components/file-explorer/FileExplorer'
export {
  FileExplorerConfigProvider,
  useFileExplorerConfig,
} from './components/file-explorer/providers/file-explorer-context'
export type { FileExplorerConfig } from './components/file-explorer/types'
export * from './components/diff-viewer/DiffViewer'
export * from './components/diff-viewer/providers/diff-viewer-context'
export type { LineRequest, LoadMoreLinesResult, LoadMoreLinesHandler } from './components/diff-viewer/types'
export { ParsedDiff } from './models/ParsedDiff'
export * from './addons/pull-request'
export { Toolbar as DefaultToolbar } from './addons/toolbar/DefaultToolbar'
export type { CustomButton, DefaultToolbarProps, ToolbarWidget } from './addons/toolbar/types'
export type { Overlay } from './components/diff-viewer/types'
export { AddButton } from './addons/ui/AddButton'
export * from './themes'
