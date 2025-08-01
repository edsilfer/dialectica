import { ThemeContext, ThemeTokens, useIsMobile } from '@edsilfer/commons'
import { LineRange } from '@edsilfer/diff-viewer'
import { css } from '@emotion/react'
import { Button, Typography } from 'antd'
import { useContext, useEffect, useRef, useState } from 'react'
import { SlideWrapper } from '../../pages/Welcome'
import { MockedFileViewer } from './mocks/MockedFileViewer'
import useSharedStyles from './shared-styles'

const { Title, Paragraph } = Typography

const useStyles = (theme: ThemeTokens) => {
  return {
    container: css`
      background: linear-gradient(
        to bottom,
        ${theme.colors.backgroundContainer} 50%,
        ${theme.colors.backgroundPrimary} 50%
      );

      @media (max-width: 768px) {
        background: linear-gradient(
          to bottom,
          ${theme.colors.backgroundPrimary} 50%,
          ${theme.colors.backgroundContainer} 50%
        );
      }
    `,

    viewerStyle: (isFront: boolean, isPrimaryFront: boolean) => css`
      // Positioning
      position: absolute;
      top: 50%;
      left: 50%;
      transform: ${isPrimaryFront === isFront
        ? 'translate(-50%, -50%) translate(-5%, 0)'
        : 'translate(-50%, -50%) translate(7%, 100px)'};

      // Sizing
      width: 80%;
      height: 80%;

      @media (min-width: 1920px) {
        max-height: 750px;
        max-width: 1000px;
      }

      transition:
        transform 0.8s cubic-bezier(0.65, 0, 0.35, 1),
        z-index 0.8s,
        width 0.8s,
        height 0.8s,
        filter 0.8s;

      z-index: ${isPrimaryFront === isFront ? 2 : 1};

      filter: ${isPrimaryFront === isFront ? 'blur(0px)' : 'blur(2px)'};
      overflow: hidden;
    `,

    mobileContentWrapper: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    `,

    largeScreenContentWrapper: css`
      position: relative;
    `,
  }
}

export default function FileViewerSlide() {
  const theme = useContext(ThemeContext)
  const styles = useStyles(theme)
  const sharedStyles = useSharedStyles(theme)
  const isMobile = useIsMobile()

  const highlightedLines: LineRange = {
    start: 4,
    end: 6,
    side: 'left',
    filepath: 'packages/react-server/src/ReactFlightServer.js',
  }

  return (
    <SlideWrapper>
      <div css={[sharedStyles.featureSlide('primary'), styles.container]}>
        <div css={sharedStyles.featureLeft('30%', 'secondary', { bottomLeft: isMobile, bottomRight: true })}>
          <Title css={sharedStyles.title}>Split & Unified Views</Title>
          <Paragraph css={sharedStyles.subtitle}>
            Toggle between split and unified modes. Built-in line highlighting and virtual scrolling for fast navigation
            — even on large diffs.
          </Paragraph>
        </div>

        {isMobile && <SmallScreenContent highlightedLines={highlightedLines} />}

        {!isMobile && <LargeScreenContent highlightedLines={highlightedLines} />}
      </div>
    </SlideWrapper>
  )
}

function SmallScreenContent({ highlightedLines }: { highlightedLines: LineRange }) {
  const theme = useContext(ThemeContext)
  const styles = useStyles(theme)
  const sharedStyles = useSharedStyles(theme)
  const [mode, setMode] = useState<'split' | 'unified'>('split')

  return (
    <div
      css={[
        sharedStyles.featureRight('100%', 'primary', {
          topLeft: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
        }),
        styles.mobileContentWrapper,
      ]}
    >
      <Button
        type="primary"
        css={sharedStyles.pillButton}
        style={{ margin: `${theme.spacing.sm} 0` }}
        onClick={() => setMode(mode === 'split' ? 'unified' : 'split')}
      >
        View Mode {mode === 'split' ? 'Unified' : 'Split'}
      </Button>
      <MockedFileViewer mode={mode} highlightedLines={highlightedLines} />
    </div>
  )
}

function LargeScreenContent({ highlightedLines }: { highlightedLines: LineRange }) {
  const theme = useContext(ThemeContext)
  const styles = useStyles(theme)
  const sharedStyles = useSharedStyles(theme)

  const [isPrimaryFront, setIsPrimaryFront] = useState(true)
  const backRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const [backHoverEnabled, setBackHoverEnabled] = useState(true)
  const [frontHoverEnabled, setFrontHoverEnabled] = useState(true)

  const handleFrontHover = () => {
    if (!isPrimaryFront && frontHoverEnabled) {
      setIsPrimaryFront(true)
      setFrontHoverEnabled(false)
    }
  }

  const handleBackHover = () => {
    if (!isPrimaryFront && backHoverEnabled) return
    setIsPrimaryFront(false)
    setBackHoverEnabled(false)
  }

  useEffect(() => {
    const backEl = backRef.current
    const frontEl = frontRef.current

    const setListeners = (remove: boolean = false) => {
      if (remove) {
        backEl?.removeEventListener('transitionend', handleTransitionEnd)
        frontEl?.removeEventListener('transitionend', handleTransitionEnd)
      } else {
        backEl?.addEventListener('transitionend', handleTransitionEnd)
        frontEl?.addEventListener('transitionend', handleTransitionEnd)
      }
    }

    const handleTransitionEnd = () => {
      if (isPrimaryFront && !backHoverEnabled) setBackHoverEnabled(true)
      if (!isPrimaryFront && !frontHoverEnabled) setFrontHoverEnabled(true)
    }

    setListeners()
    return () => {
      setListeners(true)
    }
  }, [isPrimaryFront, backHoverEnabled, frontHoverEnabled])

  const frontStyle = styles.viewerStyle(true, isPrimaryFront)
  const backStyle = styles.viewerStyle(false, isPrimaryFront)

  return (
    <div css={[sharedStyles.featureRight('70%', 'primary', { topLeft: true }), styles.largeScreenContentWrapper]}>
      <div ref={frontRef} css={frontStyle} onMouseEnter={frontHoverEnabled ? handleFrontHover : undefined}>
        <MockedFileViewer mode="unified" />
      </div>

      <div ref={backRef} css={backStyle} onMouseEnter={backHoverEnabled ? handleBackHover : undefined}>
        <MockedFileViewer mode="split" highlightedLines={highlightedLines} />
      </div>
    </div>
  )
}
