import {
  AddButton,
  DefaultToolbar,
  DiffViewer,
  InlineComment,
  LineMetadata,
  LineRequest,
  LoadMoreLinesResult,
  ParsedDiff,
  PullRequestHeader,
} from '@diff-viewer'
import { useCallback, useRef } from 'react'

import useGetPrDiff from '../hooks/use-get-pr-diff'
import useGetPrMetadata from '../hooks/use-get-pr-metadata'
import ErrorCard from './ErrorCard'
import InfoCard from './InfoCard'
import mockComment from '../__fixtures__/mock-inline-comment'

interface CodeReviewProps {
  /** The error to display. */
  error: unknown
  /** The pull request metadata. */
  prMetadata: ReturnType<typeof useGetPrMetadata>
  /** The pull request diff. */
  prDiff: ReturnType<typeof useGetPrDiff>
  /** The displayed diff. */
  displayedDiff: ParsedDiff | undefined
  /** The function to load more lines. */
  loadMore: (request: LineRequest) => Promise<LoadMoreLinesResult>
}

export default function CodeReview({ error, prMetadata, prDiff, displayedDiff, loadMore }: CodeReviewProps) {
  const dockedLineRef = useRef<LineMetadata | null>(null)

  const handleAddButtonClick = useCallback(() => {
    console.log('Add comment to line:', dockedLineRef.current)
  }, [])

  const handleDocking = (line: LineMetadata) => {
    dockedLineRef.current = line
  }

  if (error) {
    const errorMessage = prMetadata.error || prDiff.error || 'Unknown error'
    return <ErrorCard error={typeof errorMessage === 'string' ? new Error(errorMessage) : errorMessage} />
  }

  if ((!prMetadata.loading && !prMetadata.data) || !prMetadata.data) {
    return (
      <InfoCard
        title="Load a Pull Request"
        description="Use the search bar above to load a GitHub Pull Request and explore its diff."
      />
    )
  }

  if (displayedDiff && prMetadata.data?.head_sha) {
    return (
      <DiffViewer
        diff={displayedDiff}
        toolbar={
          <DefaultToolbar
            loading={prMetadata.loading}
            header={prMetadata.data ? <PullRequestHeader pr={prMetadata.data} /> : undefined}
          />
        }
        isMetadataLoading={prMetadata.loading}
        isDiffLoading={prDiff.loading || !prDiff.data}
        maxLinesToFetch={10}
        onLoadMoreLines={loadMore}
        overlays={[
          {
            unifiedDockIdx: 2,
            splitDockIdx: 1,
            content: <AddButton key="add-button" onClick={handleAddButtonClick} />,
            onDock: handleDocking,
          },
        ]}
        widgets={[
          {
            content: <InlineComment comment={mockComment} />,
            line: 186,
            side: 'right',
            position: 'bottom',
            filepath: 'packages/react-client/src/ReactFlightClient.js',
          },
        ]}
      />
    )
  }

  return <InfoCard title="Loading Diff" description="Please wait while the diff is being loaded..." />
}
