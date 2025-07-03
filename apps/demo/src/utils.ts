import { ParsedPR } from './components/search-form/types'

/**
 * Set the URL to the given PR.
 *
 * @param pr - The PR to set the URL to.
 */
export const setURL = (pr: ParsedPR | null): void => {
  if (!pr) return
  const params = new URLSearchParams()
  params.set('owner', pr.owner)
  params.set('repo', pr.repo)
  params.set('pull', String(pr.prNumber))
  const newUrl = `${window.location.pathname}?${params.toString()}`
  window.history.pushState({}, '', newUrl)
}

/**
 * Parse the URL to get the PR.
 *
 * @returns The PR from the URL.
 */
export const parseURL = (): ParsedPR | null => {
  const params = new URLSearchParams(window.location.search)
  const owner = params.get('owner')
  const repo = params.get('repo')
  const pullStr = params.get('pull')
  if (owner && repo && pullStr) {
    const prNumber = Number(pullStr)
    if (!Number.isNaN(prNumber)) {
      return { owner, repo, prNumber }
    }
  }
  return null
}
