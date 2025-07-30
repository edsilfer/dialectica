import { LineRange } from '@diff-viewer'
import { PrKey } from '@github'
import { useEffect, useState } from 'react'

/**
 * A hook that handles operations on the URL.
 *
 * @param files - The list of files to use for the line range.
 */
export const useUrl = (files: string[]) => {
  const [pr, setPr] = useState(parseURL)
  const [range, setRange] = useState(() => readLineRange(files))

  useEffect(() => {
    const sync = () => {
      setPr(parseURL())
      setRange(readLineRange(files))
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [files])

  // recompute line range whenever the available file list changes
  useEffect(() => {
    setRange(readLineRange(files))
  }, [files])

  return {
    pr,
    range,
    setPrUrl: setURL,
    setLineUrl: (r: LineRange) => setLineURL(r, files),
  }
}

// PRIVATE HELPERS -------------------------------------------------------------
const qs = () => new URLSearchParams(window.location.search)
const push = (p: URLSearchParams) => window.history.pushState({}, '', `${window.location.pathname}?${p}`)

const setURL = (pr: PrKey | null) => {
  if (!pr) return
  const params = new URLSearchParams()
  params.set('owner', pr.owner)
  params.set('repo', pr.repo)
  params.set('pull', String(pr.pullNumber))
  push(params)
}

const parseURL = (): PrKey | undefined => {
  const params = qs()
  const owner = params.get('owner')
  const repo = params.get('repo')
  const pullStr = params.get('pull')
  const pullNumber = pullStr ? Number(pullStr) : NaN
  return owner && repo && !isNaN(pullNumber) ? { owner, repo, pullNumber } : undefined
}

const setLineURL = ({ side, start, end, filepath }: LineRange, files: string[]) => {
  const params = qs()
  const prefix = side === 'left' ? 'L' : 'R'
  params.set('line', start === end ? `${prefix}${start}` : `${prefix}${start}-${prefix}${end}`)
  params.set('file', files.indexOf(filepath).toString())
  push(params)
}

const readLineRange = (files: string[]): LineRange | undefined => {
  const params = qs()
  const rawLine = params.get('line')
  const fileIndexStr = params.get('file')
  const fileIndex = fileIndexStr ? Number(fileIndexStr) : NaN

  if (!rawLine || Number.isNaN(fileIndex) || fileIndex < 0 || fileIndex >= files.length) return

  const filepath = files[fileIndex]
  const match = rawLine.match(/^([LR])(\d+)(?:-\1(\d+))?$/)
  if (!match) return

  const [, sideLetter, startStr, endStr] = match

  return {
    side: sideLetter === 'L' ? 'left' : 'right',
    start: Number(startStr),
    end: Number(endStr ?? startStr),
    filepath,
  }
}
