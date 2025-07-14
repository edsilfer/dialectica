import { PullRequestMetadata } from '@diff-viewer/src/addons/pull-request'
import type { GitHubPullRequest, GitHubInlineComment } from '@diff-viewer/src/addons/github/models'

/**
 * @param pr - The raw payload returned by GitHub's `GET /repos/:owner/:repo/pulls/:number` endpoint.
 * @returns     The `PullRequestMetadata` structure.
 */
export function mapPullRequestMetadata(pr: GitHubPullRequest): PullRequestMetadata {
  return {
    number: pr.number ?? 0,
    title: pr.title ?? '',
    body: pr.body ?? null,
    user: {
      login: pr.user?.login ?? 'unknown',
      avatar_url: pr.user?.avatar_url ?? '',
      html_url: pr.user?.html_url ?? '',
    },
    state: (pr.state ?? 'open') as PullRequestMetadata['state'],
    merged: Boolean(pr.merged_at),
    merged_at: pr.merged_at ?? null,
    commits: pr.commits ?? 0,
    changed_files: pr.changed_files ?? 0,
    additions: pr.additions ?? 0,
    deletions: pr.deletions ?? 0,
    html_url: pr.html_url ?? '',
    head_ref: pr.head?.ref ?? '',
    base_ref: pr.base?.ref ?? '',
    head_sha: pr.head?.sha ?? '',
    base_sha: pr.base?.sha ?? '',
  }
}

/**
 * @param comment - The raw payload returned by GitHub's `GET /repos/:owner/:repo/pulls/:number/comments` endpoint.
 * @returns     The `InlineCommentData` structure expected by DiffViewer.
 */
export function mapInlineComment(comment: GitHubInlineComment) {
  return {
    id: comment.id,
    body: comment.body,
    user: {
      login: comment.user.login,
      avatar_url: comment.user.avatar_url,
      html_url: comment.user.html_url,
      id: comment.user.id,
      node_id: comment.node_id,
      gravatar_id: '',
      url: `https://api.github.com/users/${comment.user.login}`,
      type: 'User',
      site_admin: false,
      followers_url: `https://api.github.com/users/${comment.user.login}/followers`,
      following_url: `https://api.github.com/users/${comment.user.login}/following{/other_user}`,
      gists_url: `https://api.github.com/users/${comment.user.login}/gists{/gist_id}`,
      starred_url: `https://api.github.com/users/${comment.user.login}/starred{/owner}{/repo}`,
      subscriptions_url: `https://api.github.com/users/${comment.user.login}/subscriptions`,
      organizations_url: `https://api.github.com/users/${comment.user.login}/orgs`,
      repos_url: `https://api.github.com/users/${comment.user.login}/repos`,
      events_url: `https://api.github.com/users/${comment.user.login}/events{/privacy}`,
      received_events_url: `https://api.github.com/users/${comment.user.login}/received_events`,
    },
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    html_url: comment.html_url,
    url: comment.url,
    pull_request_review_id: comment.pull_request_review_id ?? null,
    node_id: comment.node_id,
    diff_hunk: '', // We don't have this from the API
    path: comment.path,
    position: comment.position || 0,
    original_position: comment.original_position || 0,
    commit_id: comment.commit_id,
    original_commit_id: comment.original_commit_id,
    in_reply_to_id: comment.in_reply_to_id ?? null,
    pull_request_url: comment.pull_request_url,
    author_association: comment.author_association,
    _links: {
      self: { href: comment.url },
      html: { href: comment.html_url },
      pull_request: { href: comment.pull_request_url },
    },
    reactions: {
      url: `${comment.url}/reactions`,
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
    start_line: comment.start_line ?? null,
    original_start_line: comment.original_start_line ?? null,
    start_side: comment.start_side ?? null,
    line: comment.line ?? null,
    original_line: comment.original_line ?? null,
    side: comment.side ?? null,
    subject_type: comment.subject_type || 'line',
  }
}
