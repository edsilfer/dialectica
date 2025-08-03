import { ThemeContext } from '@edsilfer/diff-viewer'
import { css } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useContext } from 'react'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      gap: ${theme.spacing.xs};
      width: 100%;
      align-items: center;
      padding: ${theme.spacing.xs};
      min-height: 2rem;
      background-color: ${theme.colors.backgroundPrimary};
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
    `,

    skeleton: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      min-height: 2rem;
      padding: ${theme.spacing.xs};
      background-color: ${theme.colors.backgroundPrimary};
      border-top: 1px solid ${theme.colors.border};
      width: 100%;
    `,

    rightCluster: css`
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      margin-left: auto;
      align-items: center;
      gap: ${theme.spacing.xs};
    `,

    leftCluster: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${theme.spacing.xs};
    `,

    headerContainer: css`
      flex: 1 1 auto;
      min-width: 0; /* let header shrink inside flexbox */
      display: flex;
      overflow: hidden; /* clip if needed—header component handles scrolling */
    `,
  }
}

export interface ToolbarWidget {
  /** Unique identifier for the component */
  key: string
  /** The React component to render */
  component: React.ReactNode
  /** Which side of the toolbar to render this component */
  side: 'left' | 'right'
}

export interface ToolbarProps {
  /** An optional content to display at the center of the toolbar */
  header?: React.ReactNode
  /** Whether the toolbar is in a loading state and should show skeleton */
  loading?: boolean
  /** Additional widgets to render on the left or right side of the toolbar */
  additionalWidget?: ToolbarWidget[]
}

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const { additionalWidget: additionalComponents = [] } = props
  const styles = useStyles()

  const leftComponents = additionalComponents.filter((comp) => comp.side === 'left')
  const rightComponents = additionalComponents.filter((comp) => comp.side === 'right')

  if (props.loading) {
    return (
      <div css={styles.skeleton} data-testid="skeleton">
        <Skeleton active title={false} paragraph={{ rows: 2 }} />
      </div>
    )
  }

  return (
    <div css={styles.container} data-testid="toolbar-container">
      {/* Left cluster */}
      {leftComponents.length > 0 && (
        <div css={styles.leftCluster}>
          {leftComponents.map(({ key, component }) => (
            <React.Fragment key={key}>{component}</React.Fragment>
          ))}
        </div>
      )}

      {/* Header */}
      {props.header && <div css={styles.headerContainer}>{props.header}</div>}

      {/* Right cluster */}
      <div css={styles.rightCluster}>
        {rightComponents.length > 0 && (
          <>
            {rightComponents.map(({ key, component }) => (
              <React.Fragment key={key}>{component}</React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
