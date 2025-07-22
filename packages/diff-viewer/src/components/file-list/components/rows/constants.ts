import { DiffLineType } from '../viewers/types'

export const PREFIX: Record<DiffLineType, string> = {
  add: '+',
  delete: '-',
  context: ' ',
  hunk: ' ',
  empty: ' ',
}
