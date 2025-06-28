import { css } from '@emotion/react'
import { Input, Tag } from 'antd'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import { useFileExplorerContext } from '../provider/file-explorer-context'

const { Search } = Input

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

    // Didn't work via token override in the theme provider
    search: css`
      .ant-input-search-button .ant-btn-icon svg {
        color: ${theme.colors.placeholderText};
      }
    `,
  }
}

export const ExplorerBar = () => {
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
