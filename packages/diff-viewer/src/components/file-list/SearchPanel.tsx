import { DownOutlined, QuestionCircleOutlined, UpOutlined } from '@ant-design/icons'
import { ThemeContext, useIsMobile } from '@edsilfer/commons'
import { css } from '@emotion/react'
import { Input, Tooltip, Typography } from 'antd'
import { debounce } from 'lodash'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useDiffSearch } from '../../providers/diff-search-provider'

const { Search } = Input
const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: row;
      width: 100%;
      flex-grow: 1;
      align-items: center;
      gap: ${theme.spacing.xs};
      overflow: hidden;

      * {
        color: ${theme.colors.textPrimary};
      }
    `,

    button: css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      box-sizing: border-box;
      flex-shrink: 0;
      &:hover {
        color: white;
        background-color: ${theme.colors.accent};
      }

      transition: all 0.2s ease-in-out;

      .anticon {
        font-size: 0.75rem;
        line-height: 1;
      }
    `,

    search: css`
      width: 100%;
      flex-grow: 1;
    `,

    status: css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
    `,
  }
}

export default function SearchPanel() {
  const styles = useStyles()
  const { currentIndex, totalMatches, nextMatch, previousMatch, search } = useDiffSearch()
  const [searchText, setSearchText] = useState('')
  const isMobile = useIsMobile()
  const helpText = `
  We rely on row virtualization to render large diffs. This means that
  search via brower's native search will not work as not all content is
  available in the DOM. This search panel is provided to help searching
  through the diff viewer.
  `

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        search(value)
      }, 150),
    [search],
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchText(value)
      debouncedSearch(value)
    },
    [debouncedSearch],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && totalMatches > 0) {
        nextMatch()
      }
    },
    [totalMatches, nextMatch],
  )

  return (
    <div css={styles.container}>
      {!isMobile && (
        <Tooltip title={helpText.trim()} placement="bottom">
          <QuestionCircleOutlined />
        </Tooltip>
      )}

      <Search
        placeholder="Search diff..."
        allowClear
        value={searchText}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        css={styles.search}
      />

      {searchText && (
        <div css={styles.status}>
          <Text type="secondary">
            {currentIndex + 1} / {totalMatches}
          </Text>
        </div>
      )}

      <div css={styles.button}>
        <Tooltip title="Previous match">
          <DownOutlined onClick={nextMatch} />
        </Tooltip>
      </div>

      <div css={styles.button}>
        <Tooltip title="Next match">
          <UpOutlined onClick={previousMatch} />
        </Tooltip>
      </div>
    </div>
  )
}
