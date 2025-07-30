import type { GitHubPullRequest, GitHubUser } from '@github'
import { PullRequestMetadata } from '@github'
import { User } from '../hooks/use-settings'

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

export function mapUser(user: User | undefined): GitHubUser {
  return {
    login: user?.login ?? '',
    avatar_url: user?.avatar_url ?? '',
    html_url: user?.avatar_url ?? '',
  } as GitHubUser
}
