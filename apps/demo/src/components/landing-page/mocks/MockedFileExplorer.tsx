import { useTheme } from '@commons'
import { ParsedDiff } from '@diff-viewer'
import { css, SerializedStyles } from '@emotion/react'
import { FileExplorer, FileMetadata } from '@file-explorer'
import { usePullRequestStore } from '@github'
import { useMemo, useRef, useState } from 'react'

import { MOCKED_FILES, MOCKED_PR } from './constants'
import { useDemo, useIntersectionTrigger } from './use-demo'

import { Tag } from 'antd'

const USE_MOCKS = true
const MOCKED_TOKEN = 'mocked-token'

const useStyles = () => {
  const theme = useTheme()

  return {
    container: css`
      display: flex;
      flex-direction: column;
      overflow: auto;
      height: 100%;
      width: 100%;
      padding: ${theme.spacing.md};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.sm};

      * {
        font-size: 0.6rem;
      }
    `,
  }
}

interface MockedFileExplorerProps {
  /** Custom CSS styles to apply to the container */
  css?: SerializedStyles
  /** Custom class name to apply to the container */
  className?: string
  /** Called when a file is clicked */
  onFileClick?: (file: FileMetadata) => void
  /** Called when a directory is toggled */
  onDirectoryToggle?: (path: string, expanded: boolean) => void
}

export default function MockedFileExplorer(props: MockedFileExplorerProps) {
  const styles = useStyles()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [hasAnimated, setHasAnimated] = useState(false)
  useIntersectionTrigger(containerRef, hasAnimated, setHasAnimated)

  const pr = usePullRequestStore(MOCKED_PR, MOCKED_TOKEN, USE_MOCKS)
  const diff = useMemo(() => (pr.diff ? ParsedDiff.build(pr.diff) : undefined), [pr.diff])

  useDemo(containerRef, isPlaying && hasAnimated, 500, async (demo) => {
    while (true) {
      const input = demo.findElement<HTMLInputElement>('input[placeholder="Filter / Search Files"]')
      if (!input) break

      // Reset input state
      input.focus()
      demo.clearInput(input)

      // Demo clicks
      demo.clickElement('[data-testid="collapse-all-btn"]')
      await demo.sleep(750)
      demo.clickElement('[data-testid="expand-all-btn"]')
      await demo.sleep(750)
      demo.clickElement('[data-node-type="directory"]', 2)
      await demo.sleep(750)

      // Demo successful file search
      input.focus()
      await demo.typeInInput(input, 'non existing file')
      await demo.sleep(750)

      // Demo successful file search
      await demo.typeInInput(input, 'useLocalStorage')
      await demo.sleep(1000)
    }
  })

  if (!diff) return null

  return (
    <div
      ref={containerRef}
      css={[styles.container, props.css]}
      className={props.className}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {
        <div style={{ marginBottom: '8px', display: 'inline-block' }}>
          <Tag color={isPlaying ? 'green' : 'red'}>Animation {isPlaying ? 'Playing' : 'Paused'}</Tag>
        </div>
      }
      <FileExplorer files={MOCKED_FILES} onFileClick={props.onFileClick} onDirectoryToggle={props.onDirectoryToggle} />
    </div>
  )
}
