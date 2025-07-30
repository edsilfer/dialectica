import { DiffLineType } from '../../models/types'

export const PREFIX: Record<DiffLineType, string> = {
  add: '+',
  delete: '-',
  context: ' ',
  hunk: ' ',
  empty: ' ',
}
