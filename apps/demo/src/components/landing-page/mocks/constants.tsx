import { GitHubUser, PrKey } from '@github'
import { FileMetadata } from '@file-explorer'

export const MOCKED_USER_1 = {
  id: 1,
  name: 'Albert Smith',
  login: 'albert-smith',
  avatar_url: 'https://avatars.githubusercontent.com/u/1',
} as GitHubUser

export const MOCKED_USER_2 = {
  id: 2,
  name: 'John Doe',
  login: 'john-doe',
  avatar_url: 'https://avatars.githubusercontent.com/u/2',
} as GitHubUser

export const MOCKED_PR = {
  owner: 'facebook',
  repo: 'react',
  pullNumber: 33665,
} as PrKey

/**
 * Simplified file path to language mapping
 */
const FILE_PATHS_TO_LANGUAGES = new Map<string, string>([
  // Root level files
  ['README.md', 'markdown'],
  ['package.json', 'json'],
  ['tsconfig.json', 'json'],
  ['.gitignore', 'gitignore'],
  ['Dockerfile', 'dockerfile'],

  // Source code directory
  ['src/index.ts', 'typescript'],
  ['src/types.ts', 'typescript'],

  // Components directory
  ['src/components/Button.tsx', 'typescript'],
  ['src/components/Modal.tsx', 'typescript'],
  ['src/components/Header.tsx', 'typescript'],
  ['src/components/Footer.tsx', 'typescript'],
  ['src/components/ui/Icon.tsx', 'typescript'],

  // Hooks directory
  ['src/hooks/useFetch.ts', 'typescript'],
  ['src/hooks/useLocalStorage.ts', 'typescript'],
  ['src/hooks/useDebounce.ts', 'typescript'],
])

/**
 * Convert file path map to FileMetadata array with random isNew/isDeleted values
 */
export const MOCKED_FILES: FileMetadata[] = Array.from(FILE_PATHS_TO_LANGUAGES.entries()).map(([path, language]) => {
  const isNew = Math.random() < 0.1 // 10% chance of being new
  const isDeleted = Math.random() < 0.05 // 5% chance of being deleted

  return new FileMetadata({
    oldPath: path,
    newPath: path,
    isRenamed: false,
    isNew,
    isDeleted,
    language,
    isBinary: language === 'binary',
  })
})
