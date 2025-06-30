import { DiffViewer, DiffParserAdapter, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Typography } from 'antd'
import { useMemo } from 'react'
import { TEN_FILES_DIFF } from './__fixtures__/sample-diffs'
import AppToolbar from './components/AppToolbar'
import PixelHeartIcon from './components/icons/PixelHeartIcon'

const { Text } = Typography

const createStyles = (theme: ReturnType<typeof useDiffViewerConfig>['theme']) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.md};
    background-color: ${theme.colors.hunkViewerBg};
    overflow: hidden;
  `,
  content: css`
    flex: 1;
    overflow: hidden;
  `,
  footer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    * {
      font-size: 0.8rem !important;
    }
  `,
})

export default function App() {
  const { theme } = useDiffViewerConfig()

  // Memoize style object so Emotion doesn't recompute the classes on every drag frame
  const styles = useMemo(() => createStyles(theme), [theme])

  const parsedDiff = useMemo(() => new DiffParserAdapter().parse(TEN_FILES_DIFF), [])

  return (
    <div css={styles.container}>
      <AppToolbar />

      <div css={styles.content}>
        <DiffViewer diff={parsedDiff} />
      </div>

      <div css={styles.footer}>
        <Text>
          Made with
          <PixelHeartIcon size={14} />
          by edsilfer
        </Text>
      </div>
    </div>
  )
}
