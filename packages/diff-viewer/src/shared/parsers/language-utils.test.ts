import { describe, it, expect } from 'vitest'
import { detectLanguage } from './language-utils'

// A sample of extensions to validate language detection works as expected
const cases: Array<[string, string]> = [
  ['index.js', 'javascript'],
  ['Component.jsx', 'javascript'],
  ['utils.ts', 'typescript'],
  ['App.tsx', 'typescript'],
  ['script.py', 'python'],
  ['Main.java', 'java'],
  ['program.c', 'c'],
  ['engine.cpp', 'cpp'],
  ['server.go', 'go'],
  ['task.rb', 'ruby'],
  ['lib.rs', 'rust'],
  ['index.php', 'php'],
  ['build.sh', 'bash'],
  ['styles.css', 'css'],
  ['index.html', 'html'],
  ['layout.xml', 'xml'],
  ['data.json', 'json'],
  ['README.md', 'markdown'],
  ['config.yaml', 'yaml'],
  ['docker-compose.yml', 'yaml'],
  ['App.scala', 'scala'],
]

describe('detectLanguage()', () => {
  it.each(cases)('returns %s language for %s', (filePath, expected) => {
    expect(detectLanguage(filePath)).toBe(expected)
  })

  it('returns text for unknown extensions', () => {
    expect(detectLanguage('unknown.xyz')).toBe('text')
  })

  it('returns text for files without an extension', () => {
    expect(detectLanguage('LICENSE')).toBe('text')
  })
})
