import { PlusOutlined } from '@ant-design/icons'
import { css, Interpolation, Theme } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../themes/providers/theme-context'

export interface AddButtonProps {
  className?: string
  // Kept to make typescript happy
  css?: Interpolation<Theme>

  // Callbacks ____________________________________________
  /** Optional click handler attached to the add button element */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    button: css`
      width: 18px;
      height: 18px;
      color: white;
      border-radius: 6px;
      display: flex;
      border: none;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      background-color: ${theme.colors.hunkViewerAddCommentBg};
      cursor: pointer;

      /* Smooth scaling animation */
      transition:
        transform 250ms ease-in-out,
        background-color 0.15s ease-in-out;

      /* Ensure the button scales from its own center while remaining anchored on the border */
      transform-origin: center;

      /* Initial transform keeps the button centered on the border */
      transform: translate(-50%, -50%) scale(1);

      &:hover {
        transform: translate(-50%, -50%) scale(1.25);
      }
    `,
  }
}

export const AddButton: React.FC<AddButtonProps> = ({ className, css: _css, onClick }) => {
  const styles = useStyles()
  return (
    <button css={styles.button} className={className} onClick={onClick}>
      <PlusOutlined />
    </button>
  )
}
