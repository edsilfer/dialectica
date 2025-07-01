import { css } from '@emotion/react'
import { Avatar, Tag, Typography } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../main/providers/diff-viewer-context'
import type { PullRequestMetadata, StatTagProps } from './types'

const { Title, Text, Link } = Typography

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: ${theme.spacing.xs};
      gap: ${theme.spacing.sm};

      .ant-tag {
        margin-inline-end: 0 !important;
      }
    `,

    header: css`
      display: flex;
      align-items: baseline;
      gap: ${theme.spacing.sm};

      /* Reset margin/padding for the typography title inside this row */
      .ant-typography {
        margin: 0 !important;
        padding: 0 !important;
      }
    `,

    subheader: css`
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${theme.spacing.sm};
    `,
  }
}

function getStateTag(pr: PullRequestMetadata) {
  switch (pr.state) {
    case 'merged':
      return <Tag color="purple">merged</Tag>
    case 'closed':
      return <Tag color="red">closed</Tag>
    default:
      return <Tag color="green">open</Tag>
  }
}

function StatTag({ value, label, color }: StatTagProps) {
  return (
    <Tag color={color}>
      {value} {label}
    </Tag>
  )
}

/**
 * A component that displays the header of a pull request.
 *
 * @param pr           - The pull request metadata.
 * @returns A React component that displays the header of a pull request.
 */
export const PullRequestHeader: React.FC<{ pr: PullRequestMetadata }> = ({ pr }) => {
  const styles = useStyles()
  const stateTag = getStateTag(pr)

  return (
    <div css={styles.container}>
      {/* Title and state */}
      <div css={styles.header}>
        {stateTag}
        <Title level={4}>{pr.title}</Title>
      </div>

      {/* Author + sentence */}
      <div css={styles.subheader}>
        <Avatar src={pr.user.avatar_url} size={24} alt={pr.user.login} />
        <Link href={pr.user.html_url} target="_blank" rel="noreferrer">
          {pr.user.login}
        </Link>
        <Text>opened PR</Text>
        <Text type="secondary">#{pr.number}</Text>
        <Text>to merge</Text>
        <StatTag label="commits" value={pr.commits} color="blue" />
        <Text>with</Text>
        <StatTag label="files" value={pr.changed_files} color="geekblue" />
        <Text>from</Text>
        <Tag color="gold">{pr.head_ref}</Tag>
        <Text>into</Text>
        <Tag color="gold">{pr.base_ref}</Tag>
      </div>
    </div>
  )
}
