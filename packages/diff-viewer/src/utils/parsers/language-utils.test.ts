import { describe, expect, it } from 'vitest'
import { detectLanguage } from './language-utils'

const createFilePath = (fileName: string): string => `path/to/${fileName}`

describe('detectLanguage', () => {
  const testCases: [string, string, string][] = [
    // [description, fileName, expectedLanguage]
    ['javascript file', 'app.js', 'javascript'],
    ['jsx file', 'component.jsx', 'javascript'],
    ['typescript file', 'module.ts', 'typescript'],
    ['tsx file', 'component.tsx', 'typescript'],
    ['python file', 'script.py', 'python'],
    ['markdown file', 'readme.md', 'markdown'],
    ['yaml file', 'config.yaml', 'yaml'],
    ['yml file', 'config.yml', 'yaml'],
    ['unknown extension', 'file.unknown', 'text'],
    ['file without extension', 'README', 'text'],
    ['file with multiple dots', 'file.min.js', 'javascript'],
    ['file ending with dot', 'file.', 'text'],
    ['empty string', '', 'text'],
    ['uppercase extension', 'file.JS', 'text'],
  ]

  it.each(testCases)('given %s, when detecting language, expect %s', (description, fileName, expectedLanguage) => {
    // GIVEN
    const filePath = fileName === '' ? fileName : createFilePath(fileName)

    // WHEN
    const result = detectLanguage(filePath)

    // EXPECT
    expect(result).toBe(expectedLanguage)
  })
})
