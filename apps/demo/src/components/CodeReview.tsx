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
  type InlineCommentData,
} from '@diff-viewer'
import React, { useCallback, useMemo, useRef } from 'react'

import useGetPrDiff from '../hooks/use-get-pr-diff'
import useGetPrMetadata from '../hooks/use-get-pr-metadata'
import useListInlineComments from '../hooks/use-list-inline-comments'
import { mapInlineComment } from '../hooks/mappers'
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
  /** The inline comments. */
  inlineComments: ReturnType<typeof useListInlineComments>
  /** The displayed diff. */
  displayedDiff: ParsedDiff | undefined
  /** The function to load more lines. */
  loadMore: (request: LineRequest) => Promise<LoadMoreLinesResult>
}

export default function CodeReview({
  error,
  prMetadata,
  prDiff,
  inlineComments,
  displayedDiff,
  loadMore,
}: CodeReviewProps) {
  const dockedLineRef = useRef<LineMetadata | null>(null)

  const handleAddButtonClick = useCallback(() => {
    console.log('Add comment to line:', dockedLineRef.current)
  }, [])

  const handleDocking = (line: LineMetadata) => {
    dockedLineRef.current = line
  }

  // Convert GitHub inline comments to the format expected by DiffViewer widgets
  const commentWidgets = useMemo(() => {
    // Mock current user - in a real app this would come from auth context
    const currentUser = {
      login: 'current-user',
      avatar_url: 'https://github.com/github.png',
    }

    const widgets: Array<{
      content: React.ReactNode
      line: number
      side: 'left' | 'right'
      position: 'bottom'
      filepath: string
    }> = []
    const commentGroups = new Map<string, InlineCommentData[]>()

    // Add the placeholder comment to a group
    const mockKey = `packages/react-client/src/ReactFlightClient.js:14:right`
    commentGroups.set(mockKey, [mockComment])

    // Group fetched comments by line and filepath
    if (inlineComments.data && displayedDiff) {
      inlineComments.data
        .filter((comment) => comment.line && comment.path)
        .forEach((comment) => {
          const file = displayedDiff.files.find((f) => f.newPath === comment.path || f.oldPath === comment.path)
          if (!file) return

          const filepath = file.newPath || file.oldPath
          const side = comment.side === 'LEFT' ? 'left' : 'right'
          const key = `${filepath}:${comment.line}:${side}`

          const diffViewerComment = mapInlineComment(comment)
          if (!commentGroups.has(key)) {
            commentGroups.set(key, [])
          }
          commentGroups.get(key)!.push(diffViewerComment)
        })
    }

    // Create widgets for each group of comments
    commentGroups.forEach((comments, key) => {
      const [filepath, lineStr, side] = key.split(':')
      const line = parseInt(lineStr, 10)

      widgets.push({
        content: (
          <InlineComment
            comments={comments}
            currentUser={currentUser}
            onReplySubmit={(replyText: string) => {
              console.log('Reply submitted:', replyText)
              // TODO: Implement reply submission
            }}
          />
        ),
        line,
        side: side as 'left' | 'right',
        position: 'bottom' as const,
        filepath,
      })
    })

    return widgets
  }, [inlineComments.data, displayedDiff])

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
        widgets={commentWidgets}
      />
    )
  }

  return <InfoCard title="Loading Diff" description="Please wait while the diff is being loaded..." />
}
