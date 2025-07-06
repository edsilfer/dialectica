// Represents a line change in a diff, which can be a context, addition, or deletion.
export type DiffLine = ContextLine | AddLine | DeleteLine

// Base interface for a line in a diff, containing common properties.
export interface BaseLine {
  /** The content of the line. */
  content: string
  /** The line number in the original file, or null if not applicable. */
  lineNumberOld: number | null
  /** The line number in the new file, or null if not applicable. */
  lineNumberNew: number | null
}

// Represents a context line in a diff, which is unchanged between the old and new files.
export interface ContextLine extends BaseLine {
  /** The type of line, which is 'context' for unchanged lines. */
  type: 'context'
}

// Represents an added line in a diff.
export interface AddLine extends BaseLine {
  /** The type of line, which is 'add' for added lines. */
  type: 'add'
}

// Represents a deleted line in a diff.
export interface DeleteLine extends BaseLine {
  /** The type of line, which is 'delete' for deleted lines. */
  type: 'delete'
}
