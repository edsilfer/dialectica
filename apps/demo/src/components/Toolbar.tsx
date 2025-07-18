import { SearchOutlined, SettingOutlined } from '@ant-design/icons'
import {
  GitHubPullRequest,
  GitHubToolbar,
  PrHeader,
  PrKey,
  ReviewButton,
  ReviewPayload,
  useDiffViewerConfig,
} from '@diff-viewer'
import { css } from '@emotion/react'
import { Button } from 'antd'
import React, { useMemo, useState } from 'react'
import { CommentDatastore } from '../hooks/data/use-comment-datastore'
import { ReviewDatastore } from '../hooks/data/use-review-datastore'
import { useReview } from '../hooks/state/use-review-state'
import { useSettings } from '../provider/setttings-provider'
import { mapPullRequestMetadata } from './mappers'
import SearchModal from './settings/modals/SearchModal'
import SettingsModal from './settings/modals/SettingsModal'

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      display: flex;
      flex-direction: row;
      border-bottom: 1px solid ${theme.colors.border};
    `,

    settings: css`
      display: flex;
      flex-direction: row;
      margin-left: auto;
    `,

    settingsButton: css`
      display: flex;
      align-items: center;

      /* Smooth rotation animation for the icon */
      .anticon {
        transition: transform 0.3s ease;
      }

      /* Rotate the cog when the button is hovered */
      &:hover .anticon {
        transform: rotate(90deg);
      }
    `,
  }
}

interface AppToolbarProps {
  /** Whether the toolbar is in a loading state and should show skeleton */
  loading: boolean
  /** The pull request metadata */
  pr: GitHubPullRequest
  /** The review datastore */
  reviewDatastore: ReviewDatastore
  /** The comment datastore */
  commentDatastore: CommentDatastore

  /** Callback to search for a pull request */
  onSearch: (pr: PrKey) => void
}

const Toolbar: React.FC<AppToolbarProps> = (props) => {
  const styles = useStyles()
  const { currentUser } = useSettings()

  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { isPosting, comments, onSubmitReview } = useReview(props.reviewDatastore, props.commentDatastore)

  const isPrAuthor = useMemo(() => {
    return props.pr?.user?.login === currentUser?.login
  }, [props.pr?.user?.login, currentUser?.login])

  return (
    <div css={styles.container}>
      <GitHubToolbar
        loading={props.loading}
        header={props.pr ? <PrHeader pr={mapPullRequestMetadata(props.pr)} /> : undefined}
        additionalWidget={[
          {
            key: 'review-button',
            component: (
              <ReviewButton
                commitId={props.pr?.head?.sha}
                isPosting={isPosting}
                comments={comments}
                isAuthor={isPrAuthor}
                onSubmitReview={(payload: ReviewPayload) => {
                  void onSubmitReview(payload)
                }}
              />
            ),
            side: 'right',
          },
          {
            key: 'search-button',
            component: (
              <Button
                css={styles.settingsButton}
                type="default"
                icon={<SearchOutlined />}
                onClick={() => setSearchOpen(true)}
              />
            ),
            side: 'right',
          },
          {
            key: 'settings-button',
            component: (
              <Button
                css={styles.settingsButton}
                type="default"
                icon={<SettingOutlined />}
                onClick={() => setSettingsOpen(true)}
              />
            ),
            side: 'right',
          },
        ]}
      />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onSearch={props.onSearch} />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default Toolbar
