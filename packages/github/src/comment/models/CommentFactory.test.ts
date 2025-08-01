import { LineMetadata } from '@edsilfer/diff-viewer'
import { describe, expect, it } from 'vitest'
import { GitHubInlineComment, GitHubUser } from '../../api/models'
import { CommentFactory } from './CommentFactory'
import { CommentAuthor, CommentMetadata, CommentState } from './CommentMetadata'

// TEST UTILITIES
const createMockLineMetadata = (overrides: Partial<LineMetadata> = {}): LineMetadata => ({
  lineNumber: 10,
  side: 'right',
  content: 'test line content',
  filepath: 'src/test.ts',
  ...overrides,
})

const createMockCommentAuthor = (overrides: Partial<CommentAuthor> = {}): CommentAuthor => ({
  login: 'testuser',
  avatar_url: 'https://example.com/avatar.jpg',
  html_url: 'https://github.com/testuser',
  ...overrides,
})

const createMockGitHubUser = (overrides: Partial<GitHubUser> = {}): GitHubUser => ({
  login: 'githubuser',
  avatar_url: 'https://github.com/avatar.jpg',
  html_url: 'https://github.com/githubuser',
  id: 123,
  node_id: 'MDQ6VXNlcjEyMw==',
  gravatar_id: '',
  url: 'https://api.github.com/users/githubuser',
  type: 'User',
  site_admin: false,
  followers_url: 'https://api.github.com/users/githubuser/followers',
  following_url: 'https://api.github.com/users/githubuser/following{/other_user}',
  gists_url: 'https://api.github.com/users/githubuser/gists{/gist_id}',
  starred_url: 'https://api.github.com/users/githubuser/starred{/owner}{/repo}',
  subscriptions_url: 'https://api.github.com/users/githubuser/subscriptions',
  organizations_url: 'https://api.github.com/users/githubuser/orgs',
  repos_url: 'https://api.github.com/users/githubuser/repos',
  events_url: 'https://api.github.com/users/githubuser/events{/privacy}',
  received_events_url: 'https://api.github.com/users/githubuser/received_events',
  ...overrides,
})

const createMockGitHubInlineComment = (overrides: Partial<GitHubInlineComment> = {}): GitHubInlineComment => ({
  url: 'https://api.github.com/repos/owner/repo/pulls/comments/123',
  pull_request_review_id: 456,
  id: 123,
  node_id: 'MDEyOkNvbW1lbnQxMjM=',
  diff_hunk: '@@ -10,1 +10,1 @@\n-old line\n+new line',
  path: 'src/test.ts',
  position: 1,
  original_position: 1,
  commit_id: 'abc123',
  original_commit_id: 'abc123',
  in_reply_to_id: null,
  body: 'Test comment body',
  user: createMockGitHubUser(),
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  html_url: 'https://github.com/owner/repo/pull/1#discussion_r123',
  pull_request_url: 'https://api.github.com/repos/owner/repo/pulls/1',
  author_association: 'CONTRIBUTOR',
  _links: {
    self: { href: 'https://api.github.com/repos/owner/repo/pulls/comments/123' },
    html: { href: 'https://github.com/owner/repo/pull/1#discussion_r123' },
    pull_request: { href: 'https://api.github.com/repos/owner/repo/pulls/1' },
  },
  reactions: {
    url: 'https://api.github.com/repos/owner/repo/pulls/comments/123/reactions',
    total_count: 2,
    '+1': 1,
    '-1': 0,
    laugh: 0,
    hooray: 0,
    confused: 0,
    heart: 1,
    rocket: 0,
    eyes: 0,
  },
  start_line: null,
  original_start_line: null,
  start_side: null,
  line: 10,
  original_line: 10,
  side: 'RIGHT',
  subject_type: 'line',
  ...overrides,
})

describe('CommentFactory', () => {
  describe('create', () => {
    const testCases = [
      {
        description: 'right side line with default state',
        lineMetadata: createMockLineMetadata({ side: 'right' }),
        author: createMockCommentAuthor(),
        state: undefined,
        expectedSide: 'RIGHT',
        expectedState: CommentState.DRAFT,
      },
      {
        description: 'left side line with pending state',
        lineMetadata: createMockLineMetadata({ side: 'left' }),
        author: createMockCommentAuthor(),
        state: CommentState.PENDING,
        expectedSide: 'LEFT',
        expectedState: CommentState.PENDING,
      },
      {
        description: 'line with custom author and published state',
        lineMetadata: createMockLineMetadata(),
        author: createMockCommentAuthor({ login: 'customuser' }),
        state: CommentState.PUBLISHED,
        expectedSide: 'RIGHT',
        expectedState: CommentState.PUBLISHED,
      },
    ]

    testCases.forEach(({ description, lineMetadata, author, state, expectedSide, expectedState }) => {
      it(`given ${description}, when create called, expect correct comment metadata`, () => {
        // WHEN
        const result = CommentFactory.create(lineMetadata, author, state)

        // EXPECT
        expect(result).toBeInstanceOf(CommentMetadata)
        expect(result.author).toEqual(author)
        expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        expect(result.updatedAt).toBeUndefined()
        expect(result.url).toMatch(/^#comment-\d+$/)
        expect(result.body).toBe('')
        expect(result.reactions).toEqual(new Map())
        expect(result.path).toBe(lineMetadata.filepath)
        expect(result.line).toBe(lineMetadata.lineNumber)
        expect(result.side).toBe(expectedSide)
        expect(result.state).toBe(expectedState)
        expect(result.wasPublished).toBe(false)
        expect(result.serverId).toBeUndefined()
      })
    })

    it('given line metadata with undefined values, when create called, expect comment with undefined values', () => {
      // GIVEN
      const lineMetadata = createMockLineMetadata({
        lineNumber: undefined,
        side: undefined,
        filepath: undefined,
      })
      const author = createMockCommentAuthor()

      // WHEN
      const result = CommentFactory.create(lineMetadata, author)

      // EXPECT
      expect(result.line).toBeUndefined()
      expect(result.side).toBe('RIGHT') // Defaults to RIGHT when side is undefined
      expect(result.path).toBeUndefined()
    })

    it('given multiple calls to create, when called in sequence, expect valid URL format', () => {
      // GIVEN
      const lineMetadata = createMockLineMetadata()
      const author = createMockCommentAuthor()

      // WHEN
      const result1 = CommentFactory.create(lineMetadata, author)
      const result2 = CommentFactory.create(lineMetadata, author)

      // EXPECT
      expect(result1.url).toMatch(/^#comment-\d+$/)
      expect(result2.url).toMatch(/^#comment-\d+$/)
      // URLs should be valid comment anchors
      expect(result1.url).toContain('#comment-')
      expect(result2.url).toContain('#comment-')
    })
  })

  describe('fromGitHubComment', () => {
    const testCases = [
      {
        description: 'complete GitHub comment with all fields',
        githubComment: createMockGitHubInlineComment(),
        expectedReactions: new Map([
          ['+1', 1],
          ['-1', 0],
          ['laugh', 0],
          ['hooray', 0],
          ['confused', 0],
          ['heart', 1],
          ['rocket', 0],
          ['eyes', 0],
        ]),
      },
      {
        description: 'GitHub comment with missing optional fields',
        githubComment: createMockGitHubInlineComment({
          line: null,
          side: null,
          updated_at: undefined,
        }),
        expectedReactions: new Map([
          ['+1', 1],
          ['-1', 0],
          ['laugh', 0],
          ['hooray', 0],
          ['confused', 0],
          ['heart', 1],
          ['rocket', 0],
          ['eyes', 0],
        ]),
      },
      {
        description: 'GitHub comment with zero reactions',
        githubComment: createMockGitHubInlineComment({
          reactions: {
            url: 'https://api.github.com/repos/owner/repo/pulls/comments/123/reactions',
            total_count: 0,
            '+1': 0,
            '-1': 0,
            laugh: 0,
            hooray: 0,
            confused: 0,
            heart: 0,
            rocket: 0,
            eyes: 0,
          },
        }),
        expectedReactions: new Map([
          ['+1', 0],
          ['-1', 0],
          ['laugh', 0],
          ['hooray', 0],
          ['confused', 0],
          ['heart', 0],
          ['rocket', 0],
          ['eyes', 0],
        ]),
      },
    ]

    testCases.forEach(({ description, githubComment, expectedReactions }) => {
      it(`given ${description}, when fromGitHubComment called, expect correct comment metadata`, () => {
        // WHEN
        const result = CommentFactory.fromGitHubComment(githubComment)

        // EXPECT
        expect(result).toBeInstanceOf(CommentMetadata)
        expect(result.serverId).toBe(githubComment.id)
        expect(result.author).toEqual({
          login: githubComment.user.login,
          avatar_url: githubComment.user.avatar_url,
          html_url: githubComment.user.html_url,
        })
        expect(result.createdAt).toBe(githubComment.created_at)
        expect(result.updatedAt).toBe(githubComment.updated_at)
        expect(result.url).toBe(githubComment.html_url)
        expect(result.body).toBe(githubComment.body)
        expect(result.reactions).toEqual(expectedReactions)
        expect(result.path).toBe(githubComment.path)
        expect(result.line).toBe(githubComment.line || 0)
        expect(result.side).toBe(githubComment.side || 'RIGHT')
        expect(result.state).toBe(CommentState.PUBLISHED)
        expect(result.wasPublished).toBe(true)
      })
    })

    it('given GitHub comment with null line and side, when fromGitHubComment called, expect default values', () => {
      // GIVEN
      const githubComment = createMockGitHubInlineComment({
        line: null,
        side: null,
      })

      // WHEN
      const result = CommentFactory.fromGitHubComment(githubComment)

      // EXPECT
      expect(result.line).toBe(0)
      expect(result.side).toBe('RIGHT')
    })

    it('given GitHub comment with undefined updated_at, when fromGitHubComment called, expect undefined updatedAt', () => {
      // GIVEN
      const githubComment = createMockGitHubInlineComment({
        updated_at: undefined,
      })

      // WHEN
      const result = CommentFactory.fromGitHubComment(githubComment)

      // EXPECT
      expect(result.updatedAt).toBeUndefined()
    })

    it('given GitHub comment with custom user data, when fromGitHubComment called, expect correct author mapping', () => {
      // GIVEN
      const customUser = createMockGitHubUser({
        login: 'customuser',
        avatar_url: 'https://custom.com/avatar.png',
        html_url: 'https://github.com/customuser',
      })
      const githubComment = createMockGitHubInlineComment({
        user: customUser,
      })

      // WHEN
      const result = CommentFactory.fromGitHubComment(githubComment)

      // EXPECT
      expect(result.author).toEqual({
        login: 'customuser',
        avatar_url: 'https://custom.com/avatar.png',
        html_url: 'https://github.com/customuser',
      })
    })
  })

  describe('buildReactions', () => {
    it('given GitHub comment with all reaction types, when buildReactions called, expect complete reactions map', () => {
      // GIVEN
      const githubComment = createMockGitHubInlineComment({
        reactions: {
          url: 'https://api.github.com/repos/owner/repo/pulls/comments/123/reactions',
          total_count: 8,
          '+1': 1,
          '-1': 2,
          laugh: 3,
          hooray: 4,
          confused: 5,
          heart: 6,
          rocket: 7,
          eyes: 8,
        },
      })

      // WHEN
      const result = CommentFactory.fromGitHubComment(githubComment)

      // EXPECT
      expect(result.reactions).toEqual(
        new Map([
          ['+1', 1],
          ['-1', 2],
          ['laugh', 3],
          ['hooray', 4],
          ['confused', 5],
          ['heart', 6],
          ['rocket', 7],
          ['eyes', 8],
        ]),
      )
    })

    it('given GitHub comment with missing reaction properties, when buildReactions called, expect undefined values in map', () => {
      // GIVEN
      const githubComment = createMockGitHubInlineComment({
        reactions: {
          url: 'https://api.github.com/repos/owner/repo/pulls/comments/123/reactions',
          total_count: 0,
          '+1': undefined as unknown as number,
          '-1': undefined as unknown as number,
          laugh: undefined as unknown as number,
          hooray: undefined as unknown as number,
          confused: undefined as unknown as number,
          heart: undefined as unknown as number,
          rocket: undefined as unknown as number,
          eyes: undefined as unknown as number,
        },
      })

      // WHEN
      const result = CommentFactory.fromGitHubComment(githubComment)

      // EXPECT
      expect(result.reactions).toEqual(
        new Map([
          ['+1', undefined],
          ['-1', undefined],
          ['laugh', undefined],
          ['hooray', undefined],
          ['confused', undefined],
          ['heart', undefined],
          ['rocket', undefined],
          ['eyes', undefined],
        ]),
      )
    })
  })

  describe('integration scenarios', () => {
    it('given draft comment created then converted to GitHub format, when fromGitHubComment called, expect published comment', () => {
      // GIVEN
      const lineMetadata = createMockLineMetadata()
      const author = createMockCommentAuthor()
      const draftComment = CommentFactory.create(lineMetadata, author, CommentState.DRAFT)
      const githubComment = createMockGitHubInlineComment({
        id: 123,
        body: draftComment.body,
        path: draftComment.path,
        line: draftComment.line,
        side: draftComment.side,
        user: createMockGitHubUser({
          login: author.login,
          avatar_url: author.avatar_url,
          html_url: author.html_url,
        }),
      })

      // WHEN
      const publishedComment = CommentFactory.fromGitHubComment(githubComment)

      // EXPECT
      expect(publishedComment.state).toBe(CommentState.PUBLISHED)
      expect(publishedComment.wasPublished).toBe(true)
      expect(publishedComment.serverId).toBe(123)
      expect(publishedComment.author).toEqual(author)
    })

    it('given multiple GitHub comments with different reaction patterns, when fromGitHubComment called, expect correct reaction aggregation', () => {
      // GIVEN
      const comment1 = createMockGitHubInlineComment({
        id: 1,
        reactions: {
          url: 'https://api.github.com/repos/owner/repo/pulls/comments/1/reactions',
          total_count: 2,
          '+1': 1,
          '-1': 0,
          laugh: 0,
          hooray: 0,
          confused: 0,
          heart: 1,
          rocket: 0,
          eyes: 0,
        },
      })
      const comment2 = createMockGitHubInlineComment({
        id: 2,
        reactions: {
          url: 'https://api.github.com/repos/owner/repo/pulls/comments/2/reactions',
          total_count: 3,
          '+1': 0,
          '-1': 1,
          laugh: 2,
          hooray: 0,
          confused: 0,
          heart: 0,
          rocket: 0,
          eyes: 0,
        },
      })

      // WHEN
      const result1 = CommentFactory.fromGitHubComment(comment1)
      const result2 = CommentFactory.fromGitHubComment(comment2)

      // EXPECT
      expect(result1.reactions.get('+1')).toBe(1)
      expect(result1.reactions.get('heart')).toBe(1)
      expect(result2.reactions.get('-1')).toBe(1)
      expect(result2.reactions.get('laugh')).toBe(2)
    })
  })
})
