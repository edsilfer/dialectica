import { css, SerializedStyles } from '@emotion/react'
import React, { useCallback, useContext, useMemo, useRef } from 'react'
import { useHasHorizontalSpace } from '../hooks'
import { ThemeContext } from '../themes'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    marqueeContainer: css`
      display: flex;
      flex-direction: row;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
    `,

    marqueeContentWrapper: (duration: string) => css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.sm};
      flex-shrink: 0;
      min-width: max-content;
      animation: marquee ${duration} linear infinite;
      animation-delay: 3s;

      &:hover {
        animation-play-state: paused;
      }

      @keyframes marquee {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-50%);
        }
      }

      & > * {
        display: inline-block !important;
        white-space: nowrap !important;
      }
    `,
  }
}

interface MarqueeProps {
  /** The CSS to apply to the container */
  css?: SerializedStyles
  /** The class name to apply to the container */
  className?: string
  /** The children to render */
  children: React.ReactNode
}

export function Marquee({ children, css, className }: MarqueeProps) {
  const styles = useStyles()
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const hasSpace = useHasHorizontalSpace(containerRef, [children])

  const scrollSpeed = 50 // px per second

  const animationDuration = useMemo(() => {
    if (!contentRef.current) return '0s'
    const width = contentRef.current.offsetWidth
    return `${width / scrollSpeed}s`
  }, [children]) // eslint-disable-line react-hooks/exhaustive-deps

  const content = useCallback(() => {
    if (hasSpace) {
      return children
    } else {
      return (
        <div ref={contentRef} css={styles.marqueeContentWrapper(animationDuration)}>
          {children}
          {children} {/* second copy intentional for loop effect */}
        </div>
      )
    }
  }, [children, hasSpace, animationDuration, styles])

  return (
    <div ref={containerRef} css={[styles.marqueeContainer, css]} className={className}>
      {content()}
    </div>
  )
}
