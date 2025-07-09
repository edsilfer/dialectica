import { describe, it, expect } from 'vitest'
import { escapeHtml, highlightContent } from './highlight-utils'
import {
  HIGHLIGHT_TEST_CASES,
  HTML_ESCAPE_TEST_CASES,
  CODE_SNIPPETS,
  HIGHLIGHTING_PATTERNS,
} from './test/__fixtures__/highlight-fixtures'

describe('highlight-utils', () => {
  describe('escapeHtml', () => {
    HTML_ESCAPE_TEST_CASES.forEach(({ input, expected, description }) => {
      it(`given ${description}, when escaped, expect correct HTML entities`, () => {
        // WHEN
        const result = escapeHtml(input)

        // EXPECT
        expect(result).toBe(expected)
      })
    })

    it('given empty string, when escaped, expect empty string', () => {
      // GIVEN
      const input = ''

      // WHEN
      const result = escapeHtml(input)

      // EXPECT
      expect(result).toBe('')
    })
  })

  describe('highlightContent', () => {
    describe('supported languages', () => {
      HIGHLIGHT_TEST_CASES.filter((tc) => tc.expectsHighlighting).forEach(
        ({ language, code, description, expectedElements }) => {
          it(`given ${description}, when highlighted, expect spans with syntax highlighting`, () => {
            // WHEN
            const result = highlightContent(code, language)

            // EXPECT
            expect(result).toMatch(HIGHLIGHTING_PATTERNS.CONTAINS_SPANS)
            expectedElements?.forEach((element) => {
              expect(result).toContain(`<${element}`)
            })
          })
        },
      )
    })

    describe('unsupported languages', () => {
      HIGHLIGHT_TEST_CASES.filter((tc) => !tc.expectsHighlighting).forEach(({ language, code, description }) => {
        it(`given ${description}, when highlighted, expect escaped HTML without spans`, () => {
          // WHEN
          const result = highlightContent(code, language)

          // EXPECT
          expect(result).not.toMatch(HIGHLIGHTING_PATTERNS.CONTAINS_SPANS)
          if (code.includes('<') || code.includes('>')) {
            expect(result).toMatch(HIGHLIGHTING_PATTERNS.PROPERLY_ESCAPED)
          }
        })
      })
    })

    describe('comprehensive language support', () => {
      Object.entries(CODE_SNIPPETS).forEach(([language, snippets]) => {
        describe(`${language.toLowerCase()} language`, () => {
          Object.entries(snippets).forEach(([type, code]) => {
            it(`given ${type.toLowerCase()} ${language.toLowerCase()} code, when highlighted, expect proper formatting`, () => {
              // WHEN
              const result = highlightContent(code, language.toLowerCase())

              // EXPECT
              expect(result).toMatch(HIGHLIGHTING_PATTERNS.CONTAINS_SPANS)
              expect(result).not.toMatch(HIGHLIGHTING_PATTERNS.NO_SCRIPT_TAGS)
            })
          })
        })
      })
    })

    describe('edge cases', () => {
      it('given empty code, when highlighted, expect empty result', () => {
        // WHEN
        const result = highlightContent('', 'javascript')

        // EXPECT
        expect(result).toBe('')
      })

      it('given code with special characters, when highlighted with unsupported language, expect proper escaping', () => {
        // GIVEN
        const code = '<script>alert("test")</script>'
        const language = 'unknown'

        // WHEN
        const result = highlightContent(code, language)

        // EXPECT
        expect(result).toMatch(HIGHLIGHTING_PATTERNS.PROPERLY_ESCAPED)
        expect(result).not.toMatch(HIGHLIGHTING_PATTERNS.NO_SCRIPT_TAGS)
      })

      it('given very long code, when highlighted, expect performance to be reasonable', () => {
        // GIVEN
        const longCode = 'const x = 1;\n'.repeat(1000)
        const startTime = performance.now()

        // WHEN
        highlightContent(longCode, 'javascript')
        const endTime = performance.now()

        // EXPECT
        expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
      })
    })

    describe('security', () => {
      it('given malicious code, when highlighted, expect XSS prevention', () => {
        // GIVEN
        const maliciousCode = '<script>alert("xss")</script><img src="x" onerror="alert(1)">'

        // WHEN
        const result = highlightContent(maliciousCode, 'javascript')

        // EXPECT
        expect(result).toMatch(HIGHLIGHTING_PATTERNS.PROPERLY_ESCAPED)
        expect(result).not.toContain('<script>')
        expect(result).not.toContain('onerror=')
      })

      it('given script injection attempt, when highlighted with unknown language, expect safe escaping', () => {
        // GIVEN
        const code = '<script>document.body.innerHTML = "hacked"</script>'
        const language = 'unknown'

        // WHEN
        const result = highlightContent(code, language)

        // EXPECT
        expect(result).toBe('&lt;script&gt;document.body.innerHTML = "hacked"&lt;/script&gt;')
      })
    })
  })
})
