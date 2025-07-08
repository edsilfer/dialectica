export enum Environment {
  /** Development environment */
  DEVELOPMENT = 'development',
  /** Production environment */
  PRODUCTION = 'production',
  /** Test environment */
  TEST = 'test',
}

/**
 * Get the current environment based on NODE_ENV
 * @returns The current environment enum value
 */
export function getEnv(): Environment {
  // Check if we're in a Node.js environment where process is available
  const nodeEnv = typeof process !== 'undefined' && process.env?.NODE_ENV

  switch (nodeEnv) {
    case 'production':
      return Environment.PRODUCTION
    case 'test':
      return Environment.TEST
    case 'development':
    default:
      return Environment.DEVELOPMENT
  }
}

/**
 * Check if we're in development environment
 * @returns true if in development mode
 */
export function isDevelopment(): boolean {
  return getEnv() === Environment.DEVELOPMENT
}

/**
 * Check if we're in production environment
 * @returns true if in production mode
 */
export function isProduction(): boolean {
  return getEnv() === Environment.PRODUCTION
}

/**
 * Check if we're in test environment
 * @returns true if in test mode
 */
export function isTest(): boolean {
  return getEnv() === Environment.TEST
}
