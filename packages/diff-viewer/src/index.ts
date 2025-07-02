/**
 * README
 * ------
 * - Defines the public API for the `@diff-viewer` package.
 * - Simplifies imports, providing a single entry point for consumers.
 * - Decouples the package's internal structure from its public interface.
 */

export * from './code-panel/CodePanel'
export { CodePanelConfigProvider, useCodePanelConfig } from './code-panel/providers/code-panel-context'
export type { CodePanelConfig } from './code-panel/providers/types'
export * from './file-explorer/FileExplorer'
export { FileExplorerConfigProvider, useFileExplorerConfig } from './file-explorer/provider/file-explorer-context'
export type { FileExplorerConfig } from './file-explorer/types'
export * from './main/DiffViewer'
export * from './main/providers/diff-viewer-context'
export type { CustomButton, ToolbarWidget, DefaultToolbarProps } from './utilities/toolbar/types'
export { Toolbar as DefaultToolbar } from './utilities/toolbar/DefaultToolbar'
export * from './shared/parsers/DiffParserAdapter'
export * from './shared/themes'
export * from './utilities/pull-request'
