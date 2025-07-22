/**
 * README
 * ------
 * - Defines the public API for the `@diff-viewer` package.
 * - Simplifies imports, providing a single entry point for consumers.
 * - Decouples the package's internal structure from its public interface.
 */
import '../../commons/src/themes/styles/highlight-themes.css'

export * from '../../commons/src/themes'
export * from './components/file-list/FileList'
export { CodePanelConfigProvider, useCodePanelConfig } from './components/file-list/providers/code-panel-context'
export type { CodePanelConfig } from './components/file-list/providers/types'
export * from './components/diff-viewer/DiffViewer'
export * from './components/diff-viewer/providers/diff-viewer-context'
export type {
  LineMetadata,
  LineRange,
  LineRequest,
  LoadMoreLinesHandler,
  LoadMoreLinesResult,
  Overlay,
  Widget,
} from './components/diff-viewer/types'
export * from './components/file-explorer/FileExplorer'
export {
  FileExplorerConfigProvider,
  useFileExplorerConfig,
} from './components/file-explorer/providers/file-explorer-context'
export type { FileExplorerConfig } from './components/file-explorer/types'
export type { FileDiff } from './models/FileDiff'
export { ParsedDiff } from './models/ParsedDiff'
