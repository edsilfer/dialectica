import { ThemeTokens } from '@commons'
import { css } from '@emotion/react'

const useSharedStyles = (theme: ThemeTokens) => {
  return {
    slide: css`
      scroll-snap-align: start;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `,

    title: css`
      margin: 0 !important;
      margin-bottom: ${theme.spacing.sm} !important;
      font-size: 80px;
      font-weight: 700;
      color: ${theme.colors.textPrimary};
    `,

    subtitle: css`
      margin: 0 !important;
      font-size: 20px;
      color: ${theme.colors.textContainerPlaceholder};
    `,

    featureSlide: css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      flex-direction: row;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    `,

    featureText: (width: string = '30%', paint: boolean = true) => css`
      display: flex;
      flex-direction: column;
      width: ${width};
      height: 100%;
      justify-content: center;
      gap: ${theme.spacing.sm};
      padding: ${theme.spacing.xl};
      ${paint && `background-color: ${theme.colors.backgroundContainer};`}
      z-index: 1;

      @media (max-width: 768px) {
        width: 100%;
        height: auto;
      }
    `,

    featureComponent: (width: string = '70%') => css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.sm};
      align-items: center;
      justify-content: center;
      padding: ${theme.spacing.sm} ${theme.spacing.xl};
      width: ${width};
      height: 80%;
      overflow: hidden;
    `,

    pillButton: css`
      border-radius: 999px;
      padding: 0 24px;
      height: 40px;
      min-width: 200px;
    `,
  }
}

export default useSharedStyles
