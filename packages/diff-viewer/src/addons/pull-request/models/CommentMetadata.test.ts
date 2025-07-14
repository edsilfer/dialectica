import { describe, expect, it } from 'vitest'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { CommentMetadata, CommentState } from './CommentMetadata'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type CommentMetadataParams = ConstructorParameters<typeof CommentMetadata>[0]

const createCommentMetadataArgs = createPropsFactory<CommentMetadataParams>({
  id: 1,
  author: {
    login: 'alice',
    avatar_url: 'https://example.com/avatar.png',
    html_url: 'https://example.com/alice',
  },
  created_at: '2024-01-01T00:00:00Z',
  url: 'https://example.com/comment/1',
  body: 'initial comment',
  reactions: new Map<string, number>([['THUMBS_UP', 1]]),
  path: 'src/file.ts',
  line: 10,
  side: 'RIGHT',
  state: CommentState.DRAFT,
})

const createCommentMetadata = (overrides: Partial<CommentMetadataParams> = {}): CommentMetadata =>
  new CommentMetadata(createCommentMetadataArgs(overrides))

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('CommentMetadata model', () => {
  it('given identical metadata, when getKey called, expect same key', () => {
    // GIVEN
    const meta1 = createCommentMetadata()
    const meta2 = createCommentMetadata()

    // WHEN
    const key1 = meta1.getKey()
    const key2 = meta2.getKey()

    // EXPECT
    expect(key1).toBe(key2)
  })

  it('given body updated, when getKey called, expect same key', () => {
    // GIVEN
    const original = createCommentMetadata()
    const updated = original.withBody('updated body')

    // WHEN
    const originalKey = original.getKey()
    const updatedKey = updated.getKey()

    // EXPECT
    expect(updatedKey).toBe(originalKey)
  })

  it('given line number changed, when getKey called, expect different key', () => {
    // GIVEN
    const original = createCommentMetadata({ line: 5 })
    const moved = original.with({ line: 6 })

    // WHEN
    const originalKey = original.getKey()
    const movedKey = moved.getKey()

    // EXPECT
    expect(movedKey).not.toBe(originalKey)
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

  it('given withReactions called, when new map provided, expect reactions replaced', () => {
    // GIVEN
    const original = createCommentMetadata()
    const newReactions = new Map<string, number>([
      ['THUMBS_UP', 2],
      ['HEART', 1],
    ])

    // WHEN
    const updated = original.withReactions(newReactions)

    // EXPECT
    expect(updated.reactions).toBe(newReactions)
    expect(original.reactions).not.toBe(newReactions)
  })

  it('given withState called, when state updated, expect state changed in new instance only', () => {
    // GIVEN
    const original = createCommentMetadata({ state: CommentState.DRAFT })

    // WHEN
    const published = original.withState(CommentState.PUBLISHED)

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
