import { PlusOutlined } from '@ant-design/icons'
import { css, Interpolation, Theme } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../providers/theme-context'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    button: css`
      width: 20px;
      height: 20px;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      border: none;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      background-color: ${theme.colors.hunkViewerAddCommentBg};

      /* Smooth scaling animation */
      transition:
        transform 250ms ease-in-out,
        background-color 0.15s ease-in-out;

      /* Ensure the button scales from its own center while remaining anchored on the border */
      transform-origin: center;

      /* Initial transform keeps the button centered on the border */
      transform: translate(-50%, -50%) scale(1);

      &:hover {
        transform: translate(-50%, -50%) scale(1.1);
      }
    `,
  }
}

const AddButton: React.FC<{
  className?: string
  // Kept to make typescript happy
  css?: Interpolation<Theme>
  onClick?: () => void
}> = ({ className, css: _css, onClick }) => {
  const styles = useStyles()
  return (
    <button css={styles.button} className={className} onClick={onClick}>
      <PlusOutlined />
    </button>
  )
}

export default AddButton
