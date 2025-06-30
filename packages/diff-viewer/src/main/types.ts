import { CodePanelConfig } from '../code-panel/providers/types'
import { FileExplorerConfig } from '../file-explorer/types'
import { ParsedDiff } from '../shared/parsers/types'
import { ThemeTokens } from '../shared/themes'

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
}
