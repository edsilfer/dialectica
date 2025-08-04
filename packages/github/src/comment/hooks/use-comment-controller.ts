import { LineMetadata } from '@dialectica-org/diff-viewer'
import { CommentMetadata, GitHubUser, PrKey } from '@github'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CommentEventHandler, CommentEventProcessorImpl } from '../data/CommentEventProcessor'
import { CommentLocalStore } from '../data/CommentLocalStore'
import { CommentRemoteStore } from '../data/CommentRemoteStore'
import { CommentRepository } from '../data/CommentRepository'

/**
 * Hook that creates a comment controller.
 *
 * @param user     - The user to use for the comment controller.
 * @param prKey    - The pull request key to use for the comment controller.
 * @param token    - The token to use for the comment controller.
 * @param useMocks - Whether to use mocks for the comment controller.
 * @param onDock   - The function to call when a line is docked.
 * @returns The comment controller.
 */
export function useCommentController(user: GitHubUser, prKey?: PrKey, token?: string, useMocks?: boolean) {
  const [dockedLine, setDockedLine] = useState<LineMetadata | undefined>()
  const [comments, setComments] = useState<Map<number, CommentMetadata>>(new Map())

  const localDs = useMemo(() => new CommentLocalStore(comments, setComments), [comments])
  const remoteDs = useMemo(() => new CommentRemoteStore(prKey, token, useMocks), [prKey, token, useMocks])
  const repository = useMemo(() => new CommentRepository(localDs, remoteDs, user), [localDs, remoteDs, user])

  useEffect(() => {
    void remoteDs.listAsync().then((comments) => {
      setComments(comments)
    })
  }, [remoteDs])

  // Comment Event Processor ---------------------------------------------------------------------------
  const eventProcessor = useMemo(
    () => new CommentEventProcessorImpl(repository, () => dockedLine),
    [repository, dockedLine],
  )

  const onCommentEvent = useCallback<CommentEventHandler>(
    (event, metadata, data) => {
      eventProcessor.process(event, metadata, data)
    },
    [eventProcessor],
  )

  // Load comments from GitHub ---------------------------------------------------------------------------
  return {
    commentDs: repository,
    onLineDock: useCallback(setDockedLine, []),
    onCommentEvent,
  }
}
