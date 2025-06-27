/**
 * Returns an array of numbers from x to y
 * @param x - The start of the range
 * @param y - The end of the range
 * @returns An array of numbers from x to y
 */
function range(x: number, y: number): number[] {
  const length = y - x + 1
  return Array.from({ length }, (_, i) => x + i)
}
