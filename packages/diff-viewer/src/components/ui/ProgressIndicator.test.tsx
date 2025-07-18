import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/test/render'
import { ProgressIndicator } from './ProgressIndicator'
import { createProgressProps } from '../../utils/test/antd-utils'

// Only mock env utils to ensure consistent test behavior
vi.mock('../../utils/env-utils', () => ({
  isProduction: () => false,
}))

describe('ProgressIndicator', () => {
  describe.each([
    {
      name: 'normal values',
      current: 25,
      total: 100,
      suffix: 'files',
      expectedPercent: '25',
      expectedText: '25 / 100 files',
    },
    {
      name: 'zero total (infinite progress)',
      current: 5,
      total: 0,
      suffix: 'items',
      expectedPercent: '100',
      expectedText: 'infinite (total 0)',
    },
    {
      name: 'current greater than total (clamped)',
      current: 150,
      total: 100,
      suffix: 'tasks',
      expectedPercent: '100',
      expectedText: '100 / 100 tasks',
    },
    {
      name: 'decimal percentage (rounded)',
      current: 1,
      total: 3,
      suffix: 'steps',
      expectedPercent: '33',
      expectedText: '1 / 3 steps',
    },
    {
      name: 'negative current value (clamped to 0)',
      current: -10,
      total: 100,
      suffix: 'points',
      expectedPercent: '0',
      expectedText: '0 / 100 points',
    },
    {
      name: 'negative total value (infinite progress)',
      current: 10,
      total: -50,
      suffix: 'units',
      expectedPercent: '100',
      expectedText: 'infinite (total -50)',
    },
    {
      name: 'zero current and total (infinite progress)',
      current: 0,
      total: 0,
      suffix: 'records',
      expectedPercent: '100',
      expectedText: 'infinite (total 0)',
    },
    {
      name: 'complete progress',
      current: 100,
      total: 100,
      suffix: 'downloads',
      expectedPercent: '100',
      expectedText: '100 / 100 downloads',
    },
    {
      name: 'empty suffix',
      current: 75,
      total: 200,
      suffix: '',
      expectedPercent: '38',
      expectedText: '75 / 200',
    },
    {
      name: 'undefined suffix',
      current: 75,
      total: 200,
      suffix: undefined,
      expectedPercent: '38',
      expectedText: '75 / 200',
    },
    {
      name: 'large numbers',
      current: 1234567,
      total: 10000000,
      suffix: 'bytes',
      expectedPercent: '12',
      expectedText: '1234567 / 10000000 bytes',
    },
  ])('$name', ({ current, total, suffix, expectedPercent, expectedText }) => {
    it('should render correct text format and percentage', () => {
      // GIVEN
      const props = createProgressProps(current, total, suffix)

      // WHEN
      render(<ProgressIndicator {...props} />)

      // EXPECT
      expect(screen.getByText(expectedText)).toBeInTheDocument()
      expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-percent', expectedPercent)
    })
  })

  // Separate test for Ant Design props since it tests different aspects
  it('should render progress bar with correct antd props', () => {
    // GIVEN
    const props = createProgressProps(50, 100, 'tests')

    // WHEN
    render(<ProgressIndicator {...props} />)

    // EXPECT
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveAttribute('data-percent', '50')
    expect(progressBar).toHaveAttribute('data-size', 'small')
  })

  // Test defensive programming features
  describe('defensive programming', () => {
    it('should handle edge cases gracefully', () => {
      // Test multiple edge cases that should be handled by sanitization
      const edgeCases = [
        {
          current: -100,
          total: -1,
          expected: { text: 'infinite (total -1)', percent: 100 },
        },
        {
          current: 1000,
          total: 10,
          expected: { text: '10 / 10 items', percent: 100 },
        },
        {
          current: 0,
          total: 0,
          expected: { text: 'infinite (total 0)', percent: 100 },
        },
      ]

      edgeCases.forEach(({ current, total, expected }) => {
        const props = createProgressProps(current, total, 'items')
        const { unmount } = render(<ProgressIndicator {...props} />)

        expect(screen.getByText(expected.text)).toBeInTheDocument()
        expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-percent', expected.percent.toString())
        unmount()
      })
    })

    it('should work without suffix', () => {
      // GIVEN
      const props = createProgressProps(25, 100)

      // WHEN
      render(<ProgressIndicator {...props} />)

      // EXPECT
      expect(screen.getByText('25 / 100')).toBeInTheDocument()
    })
  })
})
