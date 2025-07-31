import { ThemeContext } from '@commons'
import { css } from '@emotion/react'
import { Avatar, Tag, Typography } from 'antd'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { PullRequestMetadata } from '../models/pull-request-metadata'

const { Title, Text, Link } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: row;
    `,

    header: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.sm};
      white-space: nowrap;
      flex: 1 1 auto;
      min-width: 0;

      /* Reset margin/padding for the typography title inside this row */
      .ant-typography {
        margin: 0 !important;
        padding: 0 !important;
      }
    `,

    subheader: css`
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: ${theme.spacing.xs};
    `,

    tag: css`
      line-height: 0.65rem;
      padding: 2px 4px;
      font-size: 0.75rem;
      margin-right: ${theme.spacing.xxs};
    `,

    stateTag: css`
      margin-top: ${theme.spacing.xxs};
    `,

    scrollingRow: css`
      position: relative;
      overflow: hidden;
      white-space: nowrap;
      box-sizing: border-box;
      flex: 1 1 auto; /* let row fill available space */
      min-width: 0; /* allow the row to shrink so overflow can occur */

      .scrolling-content {
        display: inline-flex;
        align-items: center;
        gap: ${theme.spacing.xs};
        padding-left: 0;
        animation: none;
      }

      &.scrolling-enabled .scrolling-content {
        padding-left: 100%;
        animation: scroll-left 10s linear infinite;
      }

      @keyframes scroll-left {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-100%);
        }
      }
    `,
  }
}

export interface StatTagProps {
  /** The value to display */
  value: number | string
  /** The label to display */
  label: string
  /** The color of the tag */
  color: string
}

function StatTag({ value, label, color }: StatTagProps) {
  const styles = useStyles()

  return (
    <Tag color={color} css={styles.tag}>
      {value} {label}
    </Tag>
  )
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

/**
 * A component that displays the header of a pull request.
 *
 * @param pr           - The pull request metadata.
 * @returns A React component that displays the header of a pull request.
 */
export const Header: React.FC<{ pr: PullRequestMetadata }> = ({ pr }) => {
  const styles = useStyles()
  const stateTag = getStateTag(pr)

  const headerContainerRef = useRef<HTMLDivElement>(null)
  const headerContentRef = useRef<HTMLDivElement>(null)
  const subContainerRef = useRef<HTMLDivElement>(null)
  const subContentRef = useRef<HTMLDivElement>(null)

  const [headerScroll, setHeaderScroll] = useState(false)
  const [subScroll, setSubScroll] = useState(false)

  useEffect(() => {
    const measure = () => {
      const hc = headerContainerRef.current
      const hct = headerContentRef.current
      if (hc && hct) {
        setHeaderScroll(hct.scrollWidth > hc.clientWidth)
      }

      const sc = subContainerRef.current
      const sct = subContentRef.current
      if (sc && sct) {
        setSubScroll(sct.scrollWidth > sc.clientWidth)
      }
    }

    measure() // initial check
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [pr])

  return (
    <div css={styles.container}>
      <div css={styles.stateTag}>{stateTag}</div>

      <div>
        {/* Title and state */}
        <div css={styles.header}>
          <div ref={headerContainerRef} css={styles.scrollingRow} className={headerScroll ? 'scrolling-enabled' : ''}>
            <div ref={headerContentRef} className="scrolling-content">
              <Link href={pr.html_url} target="_blank" rel="noreferrer">
                <Title level={4}>{pr.title}</Title>
              </Link>
            </div>
          </div>
        </div>

        {/* Author + sentence */}
        <div ref={subContainerRef} css={styles.scrollingRow} className={subScroll ? 'scrolling-enabled' : ''}>
          <div ref={subContentRef} className="scrolling-content" css={styles.subheader}>
            <Avatar src={pr.user.avatar_url} size={24} alt={pr.user.login} />
            <Link href={pr.user.html_url} target="_blank" rel="noreferrer">
              {pr.user.login}
            </Link>
            <Text>opened</Text>
            <Text type="secondary">#{pr.number}</Text>
            <Text>to merge</Text>
            <StatTag label="commits" value={pr.commits} color="blue" />
            <Text>with</Text>
            <StatTag label="files" value={pr.changed_files} color="geekblue" />
            <Text>from</Text>
            <StatTag color="gold" value={pr.head_ref} label="head" />
            <Text>into</Text>
            <StatTag color="gold" value={pr.base_ref} label="base" />
          </div>
        </div>
      </div>
    </div>
  )
}
