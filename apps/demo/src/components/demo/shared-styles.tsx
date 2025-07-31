import { ThemeTokens } from '@commons'
import { css } from '@emotion/react'

export interface Border {
  bottomLeft?: boolean
  bottomRight?: boolean
  topLeft?: boolean
  topRight?: boolean
}

const useSharedStyles = (theme: ThemeTokens) => {
  const borderRadius = theme.spacing.xl

  return {
    slide: css`
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
      color: ${theme.colors.textPrimary};
      font-style: normal;
      font-family: 'Bitcount Single', system-ui;
      font-optical-sizing: auto;
      font-weight: 400 !important;

      @media (max-width: 768px) {
        font-size: 60px;
      }
    `,

    subtitle: css`
      margin: 0 !important;
      font-size: 20px;
      font-family: 'Noto Sans', sans-serif;
      font-optical-sizing: auto;
      color: ${theme.colors.textContainerPlaceholder};

      @media (max-width: 768px) {
        font-size: 16px;
      }
    `,

    featureSlide: (color: 'primary' | 'secondary' = 'primary') => css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      flex-direction: row;
      ${color === 'primary' && `background-color: ${theme.colors.backgroundPrimary};`}
      ${color === 'secondary' && `background-color: ${theme.colors.backgroundContainer};`}

      @media (max-width: 768px) {
        flex-direction: column;
      }
    `,

    featureLeft: (
      width: string = '30%',
      color: 'primary' | 'secondary' = 'primary',
      border: Border = { bottomLeft: false, bottomRight: false, topLeft: false, topRight: false },
    ) => css`
      display: flex;
      flex-direction: column;
      width: ${width};
      height: 100%;
      justify-content: center;
      gap: ${theme.spacing.sm};
      padding: ${theme.spacing.xl};

      ${color === 'primary' && `background-color: ${theme.colors.backgroundPrimary};`}
      ${color === 'secondary' && `background-color: ${theme.colors.backgroundContainer};`}
      z-index: 1;

      ${border.bottomLeft && `border-bottom-left-radius: ${borderRadius};`}
      ${border.bottomRight && `border-bottom-right-radius: ${borderRadius};`}
      ${border.topLeft && `border-top-left-radius: ${borderRadius};`}
      ${border.topRight && `border-top-right-radius: ${borderRadius};`}

      @media (max-width: 768px) {
        width: 100%;
        height: ${width};
        padding: ${theme.spacing.md};
      }
    `,

    featureRight: (
      width: string = '70%',
      color: 'primary' | 'secondary' = 'primary',
      border: Border = { bottomLeft: false, bottomRight: false, topLeft: false, topRight: false },
    ) => css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.sm};
      align-items: center;
      justify-content: center;
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      width: ${width};
      height: 100%;
      overflow: hidden;

      ${color === 'primary' && `background-color: ${theme.colors.backgroundPrimary};`}
      ${color === 'secondary' && `background-color: ${theme.colors.backgroundContainer};`}

      ${border.bottomLeft && `border-bottom-left-radius: ${borderRadius};`}
      ${border.bottomRight && `border-bottom-right-radius: ${borderRadius};`}
      ${border.topLeft && `border-top-left-radius: ${borderRadius};`}
      ${border.topRight && `border-top-right-radius: ${borderRadius};`}

      @media (max-width: 768px) {
        width: 100%;
        height: ${width};
      }
    `,

    pillButton: css`
      border-radius: 999px;
      padding: 0 16px;
      height: 40px;
      min-width: 180px;
      font-family: 'Noto Sans', sans-serif;
      font-optical-sizing: auto;
    `,

    scrollingRow: css`
      position: relative;
      z-index: 2;
      background-color: ${theme.colors.backgroundPrimary};
    `,
  }
}

export default useSharedStyles
