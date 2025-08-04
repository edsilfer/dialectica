/**
 * README
 * ------
 * - Defines the public API for the `@diff-viewer` package.
 * - Simplifies imports, providing a single entry point for consumers.
 * - Decouples the package's internal structure from its public interface.
 */
import './utils/styles/highlight-themes.css'

export * from '@dialectica-org/file-explorer'
export * from './components'
export * from './DiffViewer'
export * from './hooks'
export * from './models'
export * from './providers'
