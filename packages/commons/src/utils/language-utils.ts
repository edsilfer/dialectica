const languageMap: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.go': 'go',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.php': 'php',
  '.sh': 'bash',
  '.css': 'css',
  '.html': 'html',
  '.xml': 'xml',
  '.json': 'json',
  '.md': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.scala': 'scala',
}

/**
 * Gets the extension of a file path.
 *
 * @param filePath - The path of the file to get the extension of.
 * @returns        - The extension of the file.
 */
const getExtension = (filePath: string): string => {
  const lastDot = filePath.lastIndexOf('.')
  if (lastDot < 0) {
    return ''
  }
  return filePath.substring(lastDot)
}

/**
 * Detects the language of a file based on its extension.
 *
 * @param filePath - The path of the file to detect the language of.
 * @returns        - The language of the file, or 'text' for unknown extensions.
 */
export const detectLanguage = (filePath: string): string => {
  const extension = getExtension(filePath)

  // Return default for files without extension
  if (!extension) {
    return 'text'
  }

  // Return mapped language or default for unknown extensions
  return languageMap[extension] || 'text'
}
