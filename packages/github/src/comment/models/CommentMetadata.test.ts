import { createPropsFactory } from '@dialectica-org/test-lib'
import { describe, expect, it } from 'vitest'
import { CommentMetadata, CommentState } from './CommentMetadata'

type CommentMetadataParams = {
  serverId?: number
  author: {
    login: string
    avatar_url: string
    html_url: string
  }
  createdAt: string
  updatedAt?: string
  url: string
  body: string
  reactions: Map<string, number>
  path: string
  line: number
  side: 'LEFT' | 'RIGHT'
  state: CommentState
  wasPublished: boolean
}

const createCommentMetadataArgs = createPropsFactory<CommentMetadataParams>({
  author: {
    login: 'alice',
    avatar_url: 'https://example.com/avatar.png',
    html_url: 'https://example.com/alice',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: undefined,
  url: 'https://example.com/comment/1',
  body: 'initial comment',
  reactions: new Map<string, number>([['THUMBS_UP', 1]]),
  path: 'src/file.ts',
  line: 10,
  side: 'RIGHT',
  state: CommentState.DRAFT,
  wasPublished: false,
})

const createCommentMetadata = (overrides: Partial<CommentMetadataParams> = {}): CommentMetadata =>
  new CommentMetadata(createCommentMetadataArgs(overrides))

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('CommentMetadata model', () => {
  it('given no id provided, when constructed, expect serverId to be undefined', () => {
    // GIVEN
    const data = createCommentMetadataArgs()

    // WHEN
    const metadata = new CommentMetadata(data)

    // EXPECT
    expect(metadata.serverId).toBeUndefined()
  })

  it('given id provided, when constructed, expect provided id', () => {
    // GIVEN
    const providedId = 12345
    const data = createCommentMetadataArgs({ serverId: providedId })

    // WHEN
    const metadata = new CommentMetadata(data)

    // EXPECT
    expect(metadata.serverId).toBe(providedId)
  })

  it('given identical content, when constructed multiple times, expect both serverIds to be undefined', () => {
    // GIVEN
    const data1 = createCommentMetadataArgs()
    const data2 = createCommentMetadataArgs()

    // WHEN
    const meta1 = new CommentMetadata(data1)
    const meta2 = new CommentMetadata(data2)

    // EXPECT
    expect(meta1.serverId).toBeUndefined()
    expect(meta2.serverId).toBeUndefined()
  })

  it('given different body, when constructed, expect both serverIds to be undefined', () => {
    // GIVEN
    const data1 = createCommentMetadataArgs({ body: 'comment 1' })
    const data2 = createCommentMetadataArgs({ body: 'comment 2' })

    // WHEN
    const meta1 = new CommentMetadata(data1)
    const meta2 = new CommentMetadata(data2)

    // EXPECT
    expect(meta1.serverId).toBeUndefined()
    expect(meta2.serverId).toBeUndefined()
  })

  it('given different path, when constructed, expect both serverIds to be undefined', () => {
    // GIVEN
    const data1 = createCommentMetadataArgs({ path: 'src/file1.ts' })
    const data2 = createCommentMetadataArgs({ path: 'src/file2.ts' })

    // WHEN
    const meta1 = new CommentMetadata(data1)
    const meta2 = new CommentMetadata(data2)

    // EXPECT
    expect(meta1.serverId).toBeUndefined()
    expect(meta2.serverId).toBeUndefined()
  })

  it('given with called, when property updated, expect new instance and original untouched', () => {
    // GIVEN
    const original = createCommentMetadata()
    const updated = original.with({ body: 'new comment text' })

    // WHEN
    // (no explicit action—construction already performed)

    // EXPECT
    expect(updated).not.toBe(original)
    expect(original.body).toBe('initial comment')
    expect(updated.body).toBe('new comment text')
  })

  it('given with called with reactions, when new map provided, expect reactions replaced', () => {
    // GIVEN
    const original = createCommentMetadata()
    const newReactions = new Map<string, number>([
      ['THUMBS_UP', 2],
      ['HEART', 1],
    ])

    // WHEN
    const updated = original.with({ reactions: newReactions })

    // EXPECT
    expect(updated.reactions).toBe(newReactions)
    expect(original.reactions).not.toBe(newReactions)
  })

  it('given with called with state, when state updated, expect state changed in new instance only', () => {
    // GIVEN
    const original = createCommentMetadata({ state: CommentState.DRAFT })

    // WHEN
    const published = original.with({ state: CommentState.PUBLISHED })

    // EXPECT
    expect(published.state).toBe(CommentState.PUBLISHED)
    expect(original.state).toBe(CommentState.DRAFT)
  })

  it('given partial update via with, when path updated, expect only path changed', () => {
    // GIVEN
    const originalPath = 'src/old.ts'
    const newPath = 'src/new.ts'
    const original = createCommentMetadata({ path: originalPath })

    // WHEN
    const updated = original.with({ path: newPath })

    // EXPECT
    expect(updated.path).toBe(newPath)
    expect(updated.line).toBe(original.line)
    expect(updated.author).toBe(original.author)
  })
})
