import {
  CommentState,
  getMoreLines,
  LineMetadata,
  LineRequest,
  LoadMoreLinesResult,
  ParsedDiff,
  PrKey,
} from '@diff-viewer'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CommentMetadataFactory } from '../models/CommentMetadataFactory'
import { WidgetFactory } from '../models/WidgetFactory'
import { useCommentContext } from '../provider/comment-provider'
import { useSettings } from '../provider/setttings-provider'
import { CURRENT_USER } from './comment-utils'
import { useCommentState } from './use-comment-state'
import { usePullRequestData } from './use-pull-request-data'

export function usePrViewModel(prKey?: PrKey) {
  const { githubPat: token, useMocks } = useSettings()

  const [dockedLine, setDockedLine] = useState<LineMetadata | undefined>()
  const { metadata, rawDiff, comments: existingComments, loading, errors } = usePullRequestData(prKey)
  const diff = useMemo(() => (rawDiff ? ParsedDiff.build(rawDiff) : undefined), [rawDiff])
  const { comments, onCommentEvent } = useCommentState()
  const { handle } = useCommentContext()
  const processedCommentsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (existingComments && existingComments.length > 0) {
      const newComments = existingComments.filter((c) => !processedCommentsRef.current.has(c.id))
      if (newComments.length > 0) {
        handle.addComments(
          newComments.map((githubComment) => {
            processedCommentsRef.current.add(githubComment.id)
            return CommentMetadataFactory.fromGitHubComment(githubComment)
          }),
        )
      }
    }
  }, [existingComments, handle])

  /**
   * Build the comment widgets from all managed comments.
   *
   * @returns The comment widgets.
   */
  const widgets = useMemo(() => {
    if (comments.size === 0) return []
    const groupedComments = handle.getCommentsGroupedByLocation()
    const isReviewing = handle.getComments(CommentState.SAVED_DRAFT).size > 0
    return WidgetFactory.build(groupedComments, CURRENT_USER, onCommentEvent, isReviewing)
  }, [comments, handle, onCommentEvent])

  /**
   * Handle the dock event from the DiffViewer overlay.
   *
   * @param lineMetadata - The line metadata for the docked line.
   */
  const onDock = useCallback((lineMetadata: LineMetadata) => {
    setDockedLine(lineMetadata)
  }, [])

  /**
   * Handle the click event of the add comment button.
   *
   * @param dockedLine - The line to add the comment to.
   */
  const onAddButton = useCallback(() => {
    if (!dockedLine || !dockedLine.lineNumber || !dockedLine.side || !dockedLine.filepath) return
    handle.addComment(CommentMetadataFactory.createDraft(dockedLine, CURRENT_USER))
  }, [dockedLine, handle])

  /**
   * Load more lines from the pull request.
   *
   * @param request - The request to load more lines.
   * @returns         The result of the load more lines request.
   */
  const loadMore = useCallback(
    async (request: LineRequest): Promise<LoadMoreLinesResult> => {
      if (!metadata?.base?.sha || !metadata?.head?.sha || !prKey) {
        throw new Error('Cannot load more lines: missing commit SHAs or PR key')
      }
      return getMoreLines(
        {
          prKey,
          token,
          useMocks,
          baseSha: metadata.base.sha,
          headSha: metadata.head.sha,
        },
        request,
      )
    },
    [metadata?.base?.sha, metadata?.head?.sha, prKey, token, useMocks],
  )

  return {
    metadata,
    loading,
    errors,
    diff,
    existingComments,
    commentWidgets: widgets,
    loadMore,
    onDock,
    onAddButton,
  }
}
