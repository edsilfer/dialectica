import {
  getMoreLines,
  InlineComment as InlineCommentComponent,
  InlineCommentData,
  LineMetadata,
  LineRequest,
  LoadMoreLinesResult,
  ParsedDiff,
  PrKey,
} from '@diff-viewer'
import React, { useCallback, useMemo, useState } from 'react'
import { mapInlineComment } from '../components/mappers'
import { useSettings } from '../provider/setttings-provider'
import { usePullRequestData } from './use-pull-request-data'

export function usePrViewModel(prKey?: PrKey) {
  const { githubPat: token, useMocks } = useSettings()
  const { metadata, rawDiff, comments, loading, errors } = usePullRequestData(prKey)
  const diff = useMemo(() => (rawDiff ? ParsedDiff.build(rawDiff) : undefined), [rawDiff])

  /**
   * Build the comment widgets.
   *
   * @returns The comment widgets.
   */
  const commentWidgets = useMemo(() => {
    const widgets: Array<{
      content: React.ReactNode
      line: number
      side: 'left' | 'right'
      position: 'bottom'
      filepath: string
    }> = []

    if (comments && diff) {
      const commentGroups = new Map<string, InlineCommentData[]>()

      comments
        .filter((comment) => comment.line && comment.path)
        .forEach((comment) => {
          const file = diff.files.find((f) => f.newPath === comment.path || f.oldPath === comment.path)
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

      const currentUser = {
        login: 'current-user',
        avatar_url: 'https://github.com/github.png',
      }

      commentGroups.forEach((groupComments, key) => {
        const [filepath, lineStr, side] = key.split(':')
        const line = parseInt(lineStr, 10)

        widgets.push({
          content: (
            <InlineCommentComponent
              comments={groupComments}
              currentUser={currentUser}
              onReplySubmit={(replyText: string) => {
                console.log('Reply submitted:', replyText)
              }}
            />
          ),
          line,
          side: side as 'left' | 'right',
          position: 'bottom',
          filepath,
        })
      })
    }

    return widgets
  }, [comments, diff])

  const [dockedLine, setDockedLine] = useState<LineMetadata | undefined>()

  /**
   * Handle the click event of the add comment button.
   *
   * @param dockedLine - The line to add the comment to.
   */
  const onAddButton = useCallback(() => {
    console.log('Add comment to line:', dockedLine)
  }, [dockedLine])

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
    commentWidgets,
    loadMore,
    setDockedLine,
    onAddButton,
  }
}
