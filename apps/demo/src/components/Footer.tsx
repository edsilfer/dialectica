import { css } from '@emotion/react'
import { Typography } from 'antd'
import PixelHeartIcon from './icons/PixelHeartIcon'

const { Text } = Typography

const useStyles = () => ({
  footer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    * {
      font-size: 0.8rem !important;
    }
  `,
})

export default function Footer() {
  const styles = useStyles()

  return (
    <div css={styles.footer}>
      <Text>
        Made with
        <PixelHeartIcon size={14} />
        by edsilfer
      </Text>
    </div>
  )
}
