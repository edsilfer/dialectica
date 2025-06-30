/**
 * README
 * ------
 * - Defines the public API for the `@diff-viewer` package.
 * - Simplifies imports, providing a single entry point for consumers.
 * - Decouples the package's internal structure from its public interface.
 */

export * from './code-panel/CodePanel'
export type { CodePanelConfig } from './code-panel/providers/types'
export type { FileExplorerConfig } from './file-explorer/types'
export * from './file-explorer/FileExplorer'
export * from './shared/parsers/DiffParserAdapter'
export * from './shared/themes'
export * from './main/providers/diff-viewer-context'
export * from './main/DiffViewer'
