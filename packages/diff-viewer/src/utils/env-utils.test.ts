import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Environment, getEnv, isDevelopment, isProduction, isTest } from './env-utils'

// MOCK
const mockProcess = vi.hoisted(() => ({
  env: {} as Record<string, string | undefined>,
}))

vi.stubGlobal('process', mockProcess)

describe('getEnv', () => {
  beforeEach(() => {
    mockProcess.env = {}
  })

  const environmentTestCases = [
    {
      nodeEnv: 'production',
      expected: Environment.PRODUCTION,
      description: 'NODE_ENV set to production',
    },
    {
      nodeEnv: 'test',
      expected: Environment.TEST,
      description: 'NODE_ENV set to test',
    },
    {
      nodeEnv: 'development',
      expected: Environment.DEVELOPMENT,
      description: 'NODE_ENV set to development',
    },
    {
      nodeEnv: undefined,
      expected: Environment.DEVELOPMENT,
      description: 'NODE_ENV is undefined',
    },
    {
      nodeEnv: 'staging',
      expected: Environment.DEVELOPMENT,
      description: 'NODE_ENV set to unknown value',
    },
    {
      nodeEnv: '',
      expected: Environment.DEVELOPMENT,
      description: 'NODE_ENV is empty string',
    },
  ]

  environmentTestCases.forEach(({ nodeEnv, expected, description }) => {
    it(`given ${description}, when getEnv called, expect ${expected}`, () => {
      // GIVEN
      if (nodeEnv !== undefined) {
        mockProcess.env.NODE_ENV = nodeEnv
      }

      // WHEN
      const result = getEnv()

      // EXPECT
      expect(result).toBe(expected)
    })
  })

  it('given process is undefined, when getEnv called, expect development environment', () => {
    // GIVEN
    vi.stubGlobal('process', undefined)

    // WHEN
    const result = getEnv()

    // EXPECT
    expect(result).toBe(Environment.DEVELOPMENT)

    // Cleanup
    vi.stubGlobal('process', mockProcess)
  })

  it('given process.env is undefined, when getEnv called, expect development environment', () => {
    // GIVEN
    vi.stubGlobal('process', { env: undefined })

    // WHEN
    const result = getEnv()

    // EXPECT
    expect(result).toBe(Environment.DEVELOPMENT)

    // Cleanup
    vi.stubGlobal('process', mockProcess)
  })
})

describe('isDevelopment', () => {
  beforeEach(() => {
    mockProcess.env = {}
  })

  const developmentTestCases = [
    {
      nodeEnv: 'development',
      expected: true,
      description: 'NODE_ENV is development',
    },
    {
      nodeEnv: 'production',
      expected: false,
      description: 'NODE_ENV is production',
    },
    {
      nodeEnv: 'test',
      expected: false,
      description: 'NODE_ENV is test',
    },
    {
      nodeEnv: undefined,
      expected: true,
      description: 'NODE_ENV is undefined',
    },
    {
      nodeEnv: 'staging',
      expected: true,
      description: 'NODE_ENV is unknown value',
    },
  ]

  developmentTestCases.forEach(({ nodeEnv, expected, description }) => {
    it(`given ${description}, when isDevelopment called, expect ${expected}`, () => {
      // GIVEN
      if (nodeEnv !== undefined) {
        mockProcess.env.NODE_ENV = nodeEnv
      }

      // WHEN
      const result = isDevelopment()

      // EXPECT
      expect(result).toBe(expected)
    })
  })
})

describe('isProduction', () => {
  beforeEach(() => {
    mockProcess.env = {}
  })

  const productionTestCases = [
    {
      nodeEnv: 'production',
      expected: true,
      description: 'NODE_ENV is production',
    },
    {
      nodeEnv: 'development',
      expected: false,
      description: 'NODE_ENV is development',
    },
    {
      nodeEnv: 'test',
      expected: false,
      description: 'NODE_ENV is test',
    },
    {
      nodeEnv: undefined,
      expected: false,
      description: 'NODE_ENV is undefined',
    },
    {
      nodeEnv: 'staging',
      expected: false,
      description: 'NODE_ENV is unknown value',
    },
  ]

  productionTestCases.forEach(({ nodeEnv, expected, description }) => {
    it(`given ${description}, when isProduction called, expect ${expected}`, () => {
      // GIVEN
      if (nodeEnv !== undefined) {
        mockProcess.env.NODE_ENV = nodeEnv
      }

      // WHEN
      const result = isProduction()

      // EXPECT
      expect(result).toBe(expected)
    })
  })
})

describe('isTest', () => {
  beforeEach(() => {
    mockProcess.env = {}
  })

  const testEnvironmentTestCases = [
    {
      nodeEnv: 'test',
      expected: true,
      description: 'NODE_ENV is test',
    },
    {
      nodeEnv: 'production',
      expected: false,
      description: 'NODE_ENV is production',
    },
    {
      nodeEnv: 'development',
      expected: false,
      description: 'NODE_ENV is development',
    },
    {
      nodeEnv: undefined,
      expected: false,
      description: 'NODE_ENV is undefined',
    },
    {
      nodeEnv: 'staging',
      expected: false,
      description: 'NODE_ENV is unknown value',
    },
  ]

  testEnvironmentTestCases.forEach(({ nodeEnv, expected, description }) => {
    it(`given ${description}, when isTest called, expect ${expected}`, () => {
      // GIVEN
      if (nodeEnv !== undefined) {
        mockProcess.env.NODE_ENV = nodeEnv
      }

      // WHEN
      const result = isTest()

      // EXPECT
      expect(result).toBe(expected)
    })
  })
})

describe('Environment enum', () => {
  it('given Environment enum, when accessed, expect correct string values', () => {
    // EXPECT
    expect(Environment.DEVELOPMENT).toBe('development')
    expect(Environment.PRODUCTION).toBe('production')
    expect(Environment.TEST).toBe('test')
  })
})
