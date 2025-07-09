export interface HighlightTestCase {
  /** The language of the code */
  language: string
  /** The code to highlight */
  code: string
  /** The description of the test case */
  description: string
  /** Whether the code should be highlighted */
  expectsHighlighting: boolean
  /** The expected elements to be highlighted */
  expectedElements?: string[]
}

/**
 * Test cases for syntax highlighting functionality
 */
export const HIGHLIGHT_TEST_CASES: HighlightTestCase[] = [
  {
    language: 'typescript',
    code: 'const x = 1',
    description: 'TypeScript variable declaration',
    expectsHighlighting: true,
    expectedElements: ['span'],
  },
  {
    language: 'javascript',
    code: 'function hello() { return "world"; }',
    description: 'JavaScript function declaration',
    expectsHighlighting: true,
    expectedElements: ['span'],
  },
  {
    language: 'python',
    code: 'def hello():\n    return "world"',
    description: 'Python function definition',
    expectsHighlighting: true,
    expectedElements: ['span'],
  },
  {
    language: 'css',
    code: '.class { color: red; }',
    description: 'CSS rule',
    expectsHighlighting: true,
    expectedElements: ['span'],
  },
  {
    language: 'html',
    code: '<div class="test">Hello</div>',
    description: 'HTML element',
    expectsHighlighting: true,
    expectedElements: ['span'],
  },
  {
    language: 'json',
    code: '{"key": "value"}',
    description: 'JSON object',
    expectsHighlighting: true,
    expectedElements: ['span'],
  },
  {
    language: 'unknown_lang',
    code: '1 < 2',
    description: 'Unknown language with HTML entities',
    expectsHighlighting: false,
    expectedElements: [],
  },
  {
    language: 'fake',
    code: '<script>alert("xss")</script>',
    description: 'Unsupported language with XSS attempt',
    expectsHighlighting: false,
    expectedElements: [],
  },
]

/**
 * Test cases specifically for HTML escaping
 * NOTE: The actual escapeHtml function only escapes < and >, not &
 */
export const HTML_ESCAPE_TEST_CASES = [
  {
    input: '<script>alert("xss")</script>',
    expected: '&lt;script&gt;alert("xss")&lt;/script&gt;',
    description: 'script tag escaping',
  },
  {
    input: '1 < 2 & 3 > 1',
    expected: '1 &lt; 2 & 3 &gt; 1', // & is NOT escaped by the actual function
    description: 'comparison operators escaping',
  },
  {
    input: '"hello" & \'world\'',
    expected: '"hello" & \'world\'', // & is NOT escaped by the actual function
    description: 'quotes and ampersand escaping',
  },
  {
    input: 'normal text',
    expected: 'normal text',
    description: 'normal text without special characters',
  },
]

/**
 * Common code snippets for different languages
 */
export const CODE_SNIPPETS = {
  TYPESCRIPT: {
    SIMPLE: 'const x = 1',
    FUNCTION: 'function greet(name: string): string { return `Hello, ${name}!`; }',
    CLASS: 'class Person { constructor(private name: string) {} }',
    INTERFACE: 'interface User { id: number; name: string; }',
  },
  JAVASCRIPT: {
    SIMPLE: 'var x = 1',
    FUNCTION: 'function greet(name) { return "Hello, " + name + "!"; }',
    ARROW: 'const add = (a, b) => a + b',
    ASYNC: 'async function fetchData() { const response = await fetch("/api"); }',
  },
  CSS: {
    SIMPLE: '.class { color: red; }',
    COMPLEX: '.container { display: flex; justify-content: center; align-items: center; }',
    MEDIA_QUERY: '@media (max-width: 768px) { .mobile { display: block; } }',
  },
  HTML: {
    SIMPLE: '<div>Hello World</div>',
    WITH_ATTRIBUTES: '<div class="container" id="main">Content</div>',
    NESTED: '<ul><li><a href="#home">Home</a></li><li><a href="#about">About</a></li></ul>',
  },
  PYTHON: {
    SIMPLE: 'x = 1',
    FUNCTION: 'def greet(name):\n    return f"Hello, {name}!"',
    CLASS: 'class Person:\n    def __init__(self, name):\n        self.name = name',
  },
} as const

/**
 * Expected highlighting patterns for verification
 */
export const HIGHLIGHTING_PATTERNS = {
  CONTAINS_SPANS: /<span[^>]*>/,
  HAS_SYNTAX_CLASSES: /hljs-|highlight-/,
  NO_SCRIPT_TAGS: /<script[^>]*>/i,
  PROPERLY_ESCAPED: /&lt;|&gt;/, // Only < and > are escaped, not &
} as const
