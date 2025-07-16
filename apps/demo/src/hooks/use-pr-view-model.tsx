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
import { useCommentsContext } from '../provider/comments-provider'
import { useSettings } from '../provider/setttings-provider'
import { useCommentState } from './use-comment-state'
import { usePullRequestData } from './use-github-data'

export function usePrViewModel(prKey?: PrKey, refetchTrigger = 0) {
  const { githubPat: token, useMocks, currentUser } = useSettings()

  const [dockedLine, setDockedLine] = useState<LineMetadata | undefined>()
  const { metadata, rawDiff, comments: existingComments, loading, errors } = usePullRequestData(prKey, refetchTrigger)
  const diff = useMemo(() => (rawDiff ? ParsedDiff.build(rawDiff) : undefined), [rawDiff])
  const { comments, onCommentEvent } = useCommentState(prKey)
  const { handle } = useCommentsContext()
  const processedCommentsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (existingComments && existingComments.length > 0) {
      const newComments = existingComments.filter((c) => !processedCommentsRef.current.has(c.id))
      if (newComments.length > 0) {
        handle.add(
          newComments.map((githubComment) => {
            processedCommentsRef.current.add(githubComment.id)
            return CommentMetadataFactory.fromGitHubComment(githubComment)
          }),
        )
      }
    }
  }, [existingComments, handle])

  // Clear processed comments when comments are cleared from review provider
  useEffect(() => {
    if (comments.size === 0) {
      processedCommentsRef.current.clear()
    }
  }, [comments.size])

  /**
   * Determine if the current user is the author of the pull request.
   */
  const isPrAuthor = useMemo(() => {
    return metadata?.user?.login === currentUser?.login
  }, [metadata?.user?.login, currentUser?.login])

  /**
   * Build the comment widgets from all managed comments.
   *
   * @returns The comment widgets.
   */
  const widgets = useMemo(() => {
    if (comments.size === 0 || !currentUser) return []
    const groupedComments = handle.getThread()
    const isReviewing = handle.list(CommentState.PENDING).size > 0
    const commentAuthor = {
      login: currentUser.login!,
      avatar_url: currentUser.avatar_url!,
      html_url: currentUser.avatar_url!,
    }
    return WidgetFactory.build(groupedComments, commentAuthor, onCommentEvent, isReviewing)
  }, [comments, handle, onCommentEvent, currentUser])

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
    if (!dockedLine || !dockedLine.lineNumber || !dockedLine.side || !dockedLine.filepath || !currentUser) return
    const commentAuthor = {
      login: currentUser.login!,
      avatar_url: currentUser.avatar_url!,
      html_url: currentUser.avatar_url!,
    }
    handle.add(CommentMetadataFactory.createDraft(dockedLine, commentAuthor))
  }, [dockedLine, handle, currentUser])

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
    isPrAuthor,
    loadMore,
    onDock,
    onAddButton,
  }
}
