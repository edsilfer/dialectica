/**
 * Concatenates a list of class names into a single string.
 * ø
 * @param classes - The class names to concatenate.
 * @returns         The concatenated class names.
 */
export const classes = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}
