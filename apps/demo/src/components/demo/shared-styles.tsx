import { ThemeTokens } from '@commons'
import { css } from '@emotion/react'

const useSharedStyles = (theme: ThemeTokens) => {
  return {
    slide: css`
      scroll-snap-align: start;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      background-color: ${theme.colors.backgroundPrimary};
    `,

    title: css`
      margin: 0 !important;
      margin-bottom: ${theme.spacing.sm} !important;
      font-size: 80px;
      font-weight: 700;
      color: ${theme.colors.textPrimary};

      @media (max-width: 768px) {
        font-size: 60px;
      }
    `,

    subtitle: css`
      margin: 0 !important;
      font-size: 20px;
      color: ${theme.colors.textContainerPlaceholder};

      @media (max-width: 768px) {
        font-size: 16px;
      }
    `,

    featureSlide: css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      flex-direction: row;
      background-color: ${theme.colors.backgroundPrimary};

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
      padding: ${theme.spacing.md};
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
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      width: ${width};
      height: 80%;
      overflow: hidden;

      @media (max-width: 768px) {
        width: 100%;
        height: 100%;
      }
    `,

    pillButton: css`
      border-radius: 999px;
      padding: 0 16px;
      height: 40px;
      min-width: 180px;
    `,

    scrollingRow: css`
      position: relative;
      z-index: 2;
      background-color: ${theme.colors.backgroundPrimary};
    `,
  }
}

export default useSharedStyles
