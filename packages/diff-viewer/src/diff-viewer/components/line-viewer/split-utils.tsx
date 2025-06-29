/**
 * Measure the width of the first table cell (line-number column).
 *
 * @param table - The table element to measure.
 * @returns     - The width of the first table cell.
 */
export const measurePrefixWidth = (table: HTMLTableElement | null): number => {
  if (!table) return 0
  const firstRow = table.querySelector('tbody tr')
  if (!firstRow) return 0
  const firstCell = firstRow.children[0] as HTMLElement | undefined
  return firstCell ? firstCell.getBoundingClientRect().width : 0
}
