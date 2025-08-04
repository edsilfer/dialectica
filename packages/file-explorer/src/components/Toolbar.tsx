import { ThemeContext } from '@dialectica-org/commons'
import { css } from '@emotion/react'
import { Button, Input, Tag } from 'antd'
import React, { useContext } from 'react'
import { useFileExplorerContext } from '../providers/fstree-context'

const { Search } = Input

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    searchContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.xs};
      margin-bottom: ${theme.spacing.sm};
    `,

    searchSummary: css`
      display: flex;
      margin-top: ${theme.spacing.sm};
      gap: ${theme.spacing.xs};
    `,

    actions: css`
      display: flex;
      margin-top: ${theme.spacing.xs};
      gap: ${theme.spacing.xs};
    `,

    // Didn't work via token override in the theme provider
    search: css`
      .ant-input-search-button .ant-btn-icon svg {
        color: ${theme.colors.textPrimaryPlaceholder};
      }
    `,
  }
}

type ExplorerBarProps = {
  /** Called when the expand all button is clicked */
  onExpandAll?: () => void
  /** Called when the collapse all button is clicked */
  onCollapseAll?: () => void
}

export const ExplorerBar: React.FC<ExplorerBarProps> = ({ onExpandAll, onCollapseAll }) => {
  const styles = useStyles()
  const { searchQuery: searchText, setSearchQuery: setSearchText, filteredFiles } = useFileExplorerContext()

  return (
    <div css={styles.searchContainer}>
      <Search
        placeholder="Filter / Search Files"
        allowClear
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        css={styles.search}
      />

      {searchText && (
        <div css={styles.searchSummary}>
          {filteredFiles.length > 0 ? (
            <Tag>
              {filteredFiles.length} file{filteredFiles.length > 1 ? 's' : ''} found
            </Tag>
          ) : (
            <Tag>No matches for this query</Tag>
          )}
        </div>
      )}

      <div css={styles.actions}>
        <Button type="default" onClick={onExpandAll} size="small" data-testid="expand-all-btn">
          Expand All
        </Button>
        <Button type="default" onClick={onCollapseAll} size="small" data-testid="collapse-all-btn">
          Collapse All
        </Button>
      </div>
    </div>
  )
}
