import type { InlineCommentData } from '@diff-viewer'

const mockComment: InlineCommentData = {
  id: '123',
  body: 'This is a great improvement! The code is much cleaner now. Consider adding a comment here to explain the logic.',
  author: {
    login: 'alice',
    avatar_url: 'https://avatars.githubusercontent.com/u/123?v=4',
    html_url: 'https://github.com/alice',
  },
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  resolved: false,
  html_url: 'https://github.com/owner/repo/pull/123#discussion_r123',
}

export default mockComment
