import { useIsMobile, useTheme } from '@edsilfer/commons'
import { FileExplorer, FileMetadata, ParsedDiff } from '@edsilfer/diff-viewer'
import { css, SerializedStyles } from '@emotion/react'
import { usePullRequestStore } from '@github'
import { useEffect, useMemo, useRef } from 'react'

import { useDemo, useVisibility } from '../../../hooks/use-demo'
import { MOCKED_FILES, MOCKED_PR } from './constants'

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
        font-size: 0.8rem;
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
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isMobile = useIsMobile()
  const isVisible = useVisibility(containerRef)

  const pr = usePullRequestStore(MOCKED_PR, MOCKED_TOKEN, USE_MOCKS, false)
  const diff = useMemo(() => (pr.diff ? ParsedDiff.build(pr.diff) : undefined), [pr.diff])
  const inputSelector = 'input[placeholder="Filter / Search Files"]'

  /** Whenever the animation state flips, (de)activate the keyboard */
  useEffect(() => {
    const input = inputRef.current ?? containerRef.current?.querySelector<HTMLInputElement>(inputSelector)
    if (!input) return
    inputRef.current = input
    input.readOnly = true
    input.setAttribute('inputmode', 'none')
  }, [inputSelector, diff])

  useDemo(containerRef, isVisible, 500, async (demo) => {
    while (true) {
      const input = demo.findElement<HTMLInputElement>(inputSelector)
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

  const classes = [isMobile ? 'mobile-blocker' : '', props.className].join(' ')

  if (!diff) return null

  return (
    <div ref={containerRef} css={[styles.container, props.css]} className={classes}>
      <div className="interaction-blocker" />
      {
        <div style={{ marginBottom: '8px', display: 'inline-block' }}>
          <Tag color={'green'}>Animation playing (interactions disabled)</Tag>
        </div>
      }
      <FileExplorer files={MOCKED_FILES} onFileClick={props.onFileClick} onDirectoryToggle={props.onDirectoryToggle} />
    </div>
  )
}
