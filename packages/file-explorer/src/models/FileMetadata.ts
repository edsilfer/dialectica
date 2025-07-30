/**
 * Minimal file class for the file-explorer package.
 * This decouples the file-explorer from the diff-viewer's FileDiff model.
 */
export class FileMetadata {
  /** The original path of the file before changes */
  oldPath: string
  /** The new path of the file after changes */
  newPath: string
  /** Indicates if the file was renamed */
  isRenamed: boolean
  /** Indicates if the file is new */
  isNew?: boolean
  /** Indicates if the file is deleted */
  isDeleted: boolean
  /** The programming language of the file */
  language: string
  /** Indicates if the file is binary */
  isBinary?: boolean

  constructor(properties: {
    oldPath: string
    newPath: string
    isRenamed: boolean
    isNew?: boolean
    isDeleted: boolean
    language: string
    isBinary?: boolean
  }) {
    this.oldPath = properties.oldPath
    this.newPath = properties.newPath
    this.isRenamed = properties.isRenamed
    this.isNew = properties.isNew
    this.isDeleted = properties.isDeleted
    this.language = properties.language
    this.isBinary = properties.isBinary
  }

  /**
   * @returns The key for this file.
   */
  get key(): string {
    return this.newPath && this.newPath !== '/dev/null' ? this.newPath : this.oldPath
  }
}
