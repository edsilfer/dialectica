import { css } from '@emotion/react'
import { Input, Tag, Button } from 'antd'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import { useFileExplorerContext } from '../provider/fstree-context'

const { Search } = Input

type ExplorerBarProps = {
  onExpandAll?: () => void
  onCollapseAll?: () => void
}

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    searchContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.xs};
    `,

    searchSummary: css`
      display: flex;
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
        color: ${theme.colors.placeholderText};
      }
    `,
  }
}

export const ExplorerBar: React.FC<ExplorerBarProps> = ({ onExpandAll, onCollapseAll }) => {
  const styles = useStyles()
  const {
    searchQuery: searchText,
    setSearchQuery: setSearchText,
    filteredFiles,
  } = useFileExplorerContext()

  return (
    <div css={styles.searchContainer}>
      <Search
        placeholder="Filter / Search Files"
        allowClear
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        css={styles.search}
      />

      <div css={styles.actions}>
        <Button type="default" onClick={onExpandAll} size="small" data-testid="expand-all-btn">
          Expand All
        </Button>
        <Button type="default" onClick={onCollapseAll} size="small" data-testid="collapse-all-btn">
          Collapse All
        </Button>
      </div>

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
    </div>
  )
}
