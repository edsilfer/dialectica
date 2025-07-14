import { describe, expect, it } from 'vitest'
import { FixtureRegistry } from './fixture-registry'
import { COMMENTS } from './data/facebook/react/33665/comments'
import { DIFF } from './data/facebook/react/33665/diff'
import { METADATA } from './data/facebook/react/33665/metadata'

// HELPERS
const createRequestKey = (
  overrides: Partial<{
    type: string
    owner: string
    repo: string
    pullNumber: number
    [key: string]: unknown
  }> = {},
) => ({
  type: 'pr-diff',
  owner: 'facebook',
  repo: 'react',
  pullNumber: 33665,
  ...overrides,
})

const createFixtureRegistry = () => new FixtureRegistry()

const KEY_GENERATION_TEST_CASES = [
  {
    name: 'basic request without additional params',
    request: createRequestKey(),
    expectedKey: 'pr-diff:facebook/react#33665',
  },
  {
    name: 'request with single additional param',
    request: createRequestKey({ filePath: 'src/index.ts' }),
    expectedKey: 'pr-diff:facebook/react#33665?filePath=src/index.ts',
  },
  {
    name: 'request with multiple additional params',
    request: createRequestKey({
      filePath: 'src/index.ts',
      lineNumber: 42,
      page: 1,
    }),
    expectedKey: 'pr-diff:facebook/react#33665?filePath=src/index.ts&lineNumber=42&page=1',
  },
  {
    name: 'request with undefined and null params filtered out',
    request: createRequestKey({
      filePath: 'src/index.ts',
      undefinedParam: undefined,
      nullParam: null,
      validParam: 'value',
    }),
    expectedKey: 'pr-diff:facebook/react#33665?filePath=src/index.ts&validParam=value',
  },
  {
    name: 'request with params sorted alphabetically',
    request: createRequestKey({
      zebra: 'last',
      alpha: 'first',
      beta: 'second',
    }),
    expectedKey: 'pr-diff:facebook/react#33665?alpha=first&beta=second&zebra=last',
  },
]

describe('FixtureRegistry', () => {
  describe('Constructor and Default Registration', () => {
    it('given new instance, when created, expect default fixtures registered', () => {
      // GIVEN
      const registry = createFixtureRegistry()

      // WHEN
      const keys = registry.getAllKeys()

      // EXPECT
      expect(keys).toHaveLength(3)
      expect(keys).toContain('pr-diff:facebook/react#33665')
      expect(keys).toContain('pr-metadata:facebook/react#33665')
      expect(keys).toContain('inline-comments:facebook/react#33665')
    })

    it('given new instance, when created, expect default fixtures accessible', () => {
      // GIVEN
      const registry = createFixtureRegistry()

      // WHEN
      const diffFixture = registry.getFixture(createRequestKey({ type: 'pr-diff' }))
      const metadataFixture = registry.getFixture(createRequestKey({ type: 'pr-metadata' }))
      const commentsFixture = registry.getFixture(createRequestKey({ type: 'inline-comments' }))

      // EXPECT
      expect(diffFixture).toBe(DIFF)
      expect(metadataFixture).toBe(METADATA)
      expect(commentsFixture).toBe(COMMENTS)
    })
  })

  describe('Fixture Registration', () => {
    it('given empty registry, when fixture registered, expect fixture stored', () => {
      // GIVEN
      const registry = new FixtureRegistry()
      registry.clear()
      const request = createRequestKey({ type: 'custom-type' })
      const fixture = { test: 'data' }

      // WHEN
      registry.registerFixture(request, fixture)

      // EXPECT
      expect(registry.getFixture(request)).toBe(fixture)
      expect(registry.hasFixture(request)).toBe(true)
    })

    it('given existing fixture, when same key registered again, expect fixture overwritten', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey()
      const originalFixture = { original: 'data' }
      const newFixture = { new: 'data' }

      // WHEN
      registry.registerFixture(request, originalFixture)
      registry.registerFixture(request, newFixture)

      // EXPECT
      expect(registry.getFixture(request)).toBe(newFixture)
      expect(registry.getFixture(request)).not.toBe(originalFixture)
    })

    it('given multiple fixtures, when registered, expect all accessible', () => {
      // GIVEN
      const registry = new FixtureRegistry()
      registry.clear()
      const fixtures = [
        { request: createRequestKey({ type: 'type1' }), data: 'data1' },
        { request: createRequestKey({ type: 'type2' }), data: 'data2' },
        { request: createRequestKey({ type: 'type3' }), data: 'data3' },
      ]

      // WHEN
      fixtures.forEach(({ request, data }) => {
        registry.registerFixture(request, data)
      })

      // EXPECT
      fixtures.forEach(({ request, data }) => {
        expect(registry.getFixture(request)).toBe(data)
        expect(registry.hasFixture(request)).toBe(true)
      })
    })
  })

  describe('Fixture Retrieval', () => {
    it('given registered fixture, when retrieved, expect correct fixture returned', () => {
      // GIVEN
      const registry = new FixtureRegistry()
      registry.clear()
      const request = createRequestKey({ type: 'test-type' })
      const fixture = { complex: { nested: 'data' } }
      registry.registerFixture(request, fixture)

      // WHEN
      const retrieved = registry.getFixture(request)

      // EXPECT
      expect(retrieved).toBe(fixture)
      expect(retrieved).toEqual({ complex: { nested: 'data' } })
    })

    it('given non-existent fixture, when retrieved, expect undefined returned', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey({ type: 'non-existent' })

      // WHEN
      const retrieved = registry.getFixture(request)

      // EXPECT
      expect(retrieved).toBeUndefined()
    })

    it('given fixture with complex data, when retrieved, expect type safety maintained', () => {
      // GIVEN
      const registry = new FixtureRegistry()
      registry.clear()
      const request = createRequestKey({ type: 'complex-type' })
      const complexFixture = {
        array: [1, 2, 3],
        object: { nested: true },
        string: 'test',
        number: 42,
      }
      registry.registerFixture(request, complexFixture)

      // WHEN
      const retrieved = registry.getFixture<typeof complexFixture>(request)

      // EXPECT
      expect(retrieved).toBeDefined()
      expect(retrieved?.array).toEqual([1, 2, 3])
      expect(retrieved?.object.nested).toBe(true)
      expect(retrieved?.string).toBe('test')
      expect(retrieved?.number).toBe(42)
    })
  })

  describe('Fixture Existence Checking', () => {
    it('given registered fixture, when checked for existence, expect true returned', () => {
      // GIVEN
      const registry = new FixtureRegistry()
      registry.clear()
      const request = createRequestKey({ type: 'exists' })
      registry.registerFixture(request, 'test')

      // WHEN
      const exists = registry.hasFixture(request)

      // EXPECT
      expect(exists).toBe(true)
    })

    it('given non-existent fixture, when checked for existence, expect false returned', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey({ type: 'non-existent' })

      // WHEN
      const exists = registry.hasFixture(request)

      // EXPECT
      expect(exists).toBe(false)
    })

    it('given cleared registry, when checked for existence, expect false returned', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey()
      registry.clear()

      // WHEN
      const exists = registry.hasFixture(request)

      // EXPECT
      expect(exists).toBe(false)
    })
  })

  describe('Key Generation', () => {
    KEY_GENERATION_TEST_CASES.forEach(({ name, request, expectedKey }) => {
      it(`given ${name}, when key generated, expect correct format`, () => {
        // GIVEN
        const registry = createFixtureRegistry()
        const fixture = 'test-data'

        // WHEN
        registry.registerFixture(request, fixture)
        const retrieved = registry.getFixture(request)

        // EXPECT
        expect(retrieved).toBe(fixture)
        expect(registry.getAllKeys()).toContain(expectedKey)
      })
    })

    it('given request with special characters, when key generated, expect properly encoded', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey({
        filePath: 'src/components/Button.tsx',
        query: 'search?param=value&other=123',
      })

      // WHEN
      registry.registerFixture(request, 'test')
      const keys = registry.getAllKeys()

      // EXPECT
      expect(keys).toContain(
        'pr-diff:facebook/react#33665?filePath=src/components/Button.tsx&query=search?param=value&other=123',
      )
    })
  })

  describe('Registry Management', () => {
    it('given populated registry, when cleared, expect all fixtures removed', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey({ type: 'test' })
      registry.registerFixture(request, 'test-data')

      // WHEN
      registry.clear()

      // EXPECT
      expect(registry.getAllKeys()).toHaveLength(0)
      expect(registry.getFixture(request)).toBeUndefined()
      expect(registry.hasFixture(request)).toBe(false)
    })

    it('given cleared registry, when new fixtures added, expect only new fixtures present', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      registry.clear()
      const newRequest = createRequestKey({ type: 'new-type' })

      // WHEN
      registry.registerFixture(newRequest, 'new-data')

      // EXPECT
      expect(registry.getAllKeys()).toHaveLength(1)
      expect(registry.getAllKeys()).toContain('new-type:facebook/react#33665')
      expect(registry.getFixture(newRequest)).toBe('new-data')
    })

    it('given registry with fixtures, when getAllKeys called, expect all keys returned', () => {
      // GIVEN
      const registry = new FixtureRegistry()
      registry.clear()
      const fixtures = [
        { request: createRequestKey({ type: 'type1' }), key: 'type1:facebook/react#33665' },
        { request: createRequestKey({ type: 'type2' }), key: 'type2:facebook/react#33665' },
        { request: createRequestKey({ type: 'type3' }), key: 'type3:facebook/react#33665' },
      ]

      fixtures.forEach(({ request }) => {
        registry.registerFixture(request, 'data')
      })

      // WHEN
      const keys = registry.getAllKeys()

      // EXPECT
      expect(keys).toHaveLength(3)
      fixtures.forEach(({ key }) => {
        expect(keys).toContain(key)
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('given request with empty string values, when processed, expect handled gracefully', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey({
        type: '',
        owner: '',
        repo: '',
        pullNumber: 0,
      })

      // WHEN
      registry.registerFixture(request, 'test')
      const retrieved = registry.getFixture(request)

      // EXPECT
      expect(retrieved).toBe('test')
      expect(registry.hasFixture(request)).toBe(true)
    })

    it('given request with very large numbers, when processed, expect handled correctly', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey({
        pullNumber: Number.MAX_SAFE_INTEGER,
        largeParam: Number.MAX_VALUE,
      })

      // WHEN
      registry.registerFixture(request, 'test')
      const retrieved = registry.getFixture(request)

      // EXPECT
      expect(retrieved).toBe('test')
      expect(registry.hasFixture(request)).toBe(true)
    })

    it('given request with object values, when processed, expect stringified correctly', () => {
      // GIVEN
      const registry = createFixtureRegistry()
      const request = createRequestKey({
        objectParam: { nested: 'value' },
        arrayParam: [1, 2, 3],
      })

      // WHEN
      registry.registerFixture(request, 'test')
      const keys = registry.getAllKeys()

      // EXPECT
      expect(keys).toContain('pr-diff:facebook/react#33665?arrayParam=1,2,3&objectParam=[object Object]')
    })

    it('given multiple registries, when used independently, expect no interference', () => {
      // GIVEN
      const registry1 = new FixtureRegistry()
      const registry2 = new FixtureRegistry()
      const request = createRequestKey({ type: 'shared' })

      // WHEN
      registry1.registerFixture(request, 'data1')
      registry2.registerFixture(request, 'data2')

      // EXPECT
      expect(registry1.getFixture(request)).toBe('data1')
      expect(registry2.getFixture(request)).toBe('data2')
      expect(registry1.getFixture(request)).not.toBe(registry2.getFixture(request))
    })
  })

  describe('Type Safety', () => {
    it('given typed fixture, when retrieved with correct type, expect type safety maintained', () => {
      // GIVEN
      const registry = new FixtureRegistry()
      registry.clear()
      const request = createRequestKey({ type: 'typed' })
      const typedFixture: { id: number; name: string; active: boolean } = {
        id: 1,
        name: 'test',
        active: true,
      }

      // WHEN
      registry.registerFixture(request, typedFixture)
      const retrieved = registry.getFixture<typeof typedFixture>(request)

      // EXPECT
      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(1)
      expect(retrieved?.name).toBe('test')
      expect(retrieved?.active).toBe(true)
    })

    it('given fixture with generic type, when retrieved, expect type inference works', () => {
      // GIVEN
      const registry = new FixtureRegistry()
      registry.clear()
      const request = createRequestKey({ type: 'generic' })
      const genericFixture = ['array', 'of', 'strings']

      // WHEN
      registry.registerFixture(request, genericFixture)
      const retrieved = registry.getFixture<string[]>(request)

      // EXPECT
      expect(retrieved).toEqual(['array', 'of', 'strings'])
      expect(Array.isArray(retrieved)).toBe(true)
    })
  })
})
