import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCodePanelConfig } from '../..'
import {
  createAntdMocks,
  createCustomButton,
  createMockCodePanelConfig,
  createToolbarComponentMocks,
  createToolbarWidget,
} from '../../utils/test/antd-utils'
import { Toolbar } from './DefaultToolbar'

// MOCKS
vi.mock('../..', () => ({
  useCodePanelConfig: vi.fn(),
}))

vi.mock('./ActionButtons', () => ({
  ActionButtons: createToolbarComponentMocks().ActionButtons,
}))

vi.mock('./ProgressIndicator', () => ({
  ProgressIndicator: createToolbarComponentMocks().ProgressIndicator,
}))

vi.mock('antd', () => createAntdMocks())

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useCodePanelConfig).mockReturnValue(createMockCodePanelConfig())
})

type ButtonActionTestCase = {
  /** The name of the test case */
  name: string
  /** The test ID of the button to click */
  buttonTestId: string
  /** The name of the mock function to call */
  mockFunctionName: 'setCollapsed' | 'setViewed'
  /** The expected value of the mock function */
  expectedValue: boolean
  /** The files to setup */
  setupFiles?: string[]
  /** The states to setup */
  setupStates?: Array<{ isViewed: boolean; isCollapsed: boolean }>
}

type RenderingTestCase = {
  /** The name of the test case */
  name: string
  /** The props to pass to the component */
  props: Record<string, unknown>
  /** The expectations for the test case */
  expectations: Array<{
    /** The selector to query */
    selector: string
    assertion: 'toBeInTheDocument' | 'not.toBeInTheDocument'
    content?: string
  }>
  /** The setup function to run before the test */
  setup?: () => void
}

type FileStateTestCase = {
  /** The name of the test case */
  name: string
  /** The files to setup */
  files: string[]
  /** The states to setup */
  states: Array<{ isViewed: boolean; isCollapsed: boolean }>
  /** The expected progress text */
  expectedProgress: string
}

const buttonActionMatrix: ButtonActionTestCase[] = [
  {
    name: 'collapse all button clicked',
    buttonTestId: 'action-button-collapse-all',
    mockFunctionName: 'setCollapsed',
    expectedValue: true,
    setupFiles: ['file1.tsx', 'file2.tsx'],
  },
  {
    name: 'expand all button clicked',
    buttonTestId: 'action-button-expand-all',
    mockFunctionName: 'setCollapsed',
    expectedValue: false,
    setupFiles: ['file1.tsx', 'file2.tsx'],
  },
  {
    name: 'mark viewed clicked with some unviewed files',
    buttonTestId: 'action-button-mark-all-viewed',
    mockFunctionName: 'setViewed',
    expectedValue: true,
    setupFiles: ['file1.tsx', 'file2.tsx'],
    setupStates: [
      { isViewed: false, isCollapsed: false },
      { isViewed: true, isCollapsed: false },
    ],
  },
]

const renderingTestMatrix: RenderingTestCase[] = [
  {
    name: 'default props',
    props: {},
    setup: () => {
      vi.mocked(useCodePanelConfig).mockReturnValue(
        createMockCodePanelConfig({
          allFileKeys: ['file1.tsx', 'file2.tsx'],
          fileStateMap: new Map([
            ['file1.tsx', { isViewed: false, isCollapsed: false }],
            ['file2.tsx', { isViewed: true, isCollapsed: false }],
          ]),
        }),
      )
    },
    expectations: [
      { selector: '[data-testid="action-buttons"]', assertion: 'toBeInTheDocument' },
      { selector: '[data-testid="progress-indicator"]', assertion: 'toBeInTheDocument', content: '1 / 2 files viewed' },
      { selector: '[data-testid="action-button-collapse-all"]', assertion: 'toBeInTheDocument', content: 'Collapse' },
      { selector: '[data-testid="action-button-expand-all"]', assertion: 'toBeInTheDocument', content: 'Expand' },
      { selector: '[data-testid="action-button-mark-all-viewed"]', assertion: 'toBeInTheDocument', content: 'Viewed' },
    ],
  },
  {
    name: 'loading state',
    props: { loading: true },
    expectations: [
      { selector: '[data-testid="skeleton"]', assertion: 'toBeInTheDocument' },
      { selector: '[data-testid="action-buttons"]', assertion: 'not.toBeInTheDocument' },
    ],
  },
  {
    name: 'custom header',
    props: { header: <div data-testid="custom-header">Custom Header</div> },
    expectations: [
      { selector: '[data-testid="custom-header"]', assertion: 'toBeInTheDocument', content: 'Custom Header' },
    ],
  },
  {
    name: 'addDefaultButtons false',
    props: { addDefaultButtons: false },
    expectations: [
      { selector: '[data-testid="action-button-collapse-all"]', assertion: 'not.toBeInTheDocument' },
      { selector: '[data-testid="action-button-expand-all"]', assertion: 'not.toBeInTheDocument' },
      { selector: '[data-testid="action-button-mark-all-viewed"]', assertion: 'not.toBeInTheDocument' },
    ],
  },
]

const fileStateMatrix: FileStateTestCase[] = [
  {
    name: 'mixed viewed state',
    files: ['file1.tsx', 'file2.tsx', 'file3.tsx'],
    states: [
      { isViewed: true, isCollapsed: false },
      { isViewed: false, isCollapsed: false },
      { isViewed: true, isCollapsed: false },
    ],
    expectedProgress: '2 / 3 files viewed',
  },
  {
    name: 'empty file list',
    files: [],
    states: [],
    expectedProgress: '0 / 0 files viewed',
  },
  {
    name: 'all files viewed',
    files: ['file1.tsx', 'file2.tsx'],
    states: [
      { isViewed: true, isCollapsed: false },
      { isViewed: true, isCollapsed: false },
    ],
    expectedProgress: '2 / 2 files viewed',
  },
]

describe('DefaultToolbar', () => {
  describe('Button Actions', () => {
    buttonActionMatrix.forEach(({ name, buttonTestId, mockFunctionName, expectedValue, setupFiles, setupStates }) => {
      it(`given ${name}, when action triggered, expect ${mockFunctionName} called correctly`, () => {
        // GIVEN
        const mockFunction = vi.fn()
        const fileStateMap = setupStates
          ? new Map(setupFiles!.map((file, index) => [file, setupStates[index]]))
          : new Map()

        vi.mocked(useCodePanelConfig).mockReturnValue(
          createMockCodePanelConfig({
            allFileKeys: setupFiles || [],
            fileStateMap,
            [mockFunctionName]: mockFunction,
          }),
        )

        render(<Toolbar />)

        // WHEN
        fireEvent.click(screen.getByTestId(buttonTestId))

        // EXPECT
        expect(mockFunction).toHaveBeenCalledTimes(setupFiles?.length || 0)
        setupFiles?.forEach((file) => {
          expect(mockFunction).toHaveBeenCalledWith(file, expectedValue)
        })
      })
    })

    it('given all files viewed, when mark viewed clicked, expect setViewed false and button text changes to Unview', () => {
      // GIVEN
      const mockSetViewed = vi.fn()
      vi.mocked(useCodePanelConfig).mockReturnValue(
        createMockCodePanelConfig({
          allFileKeys: ['file1.tsx', 'file2.tsx'],
          setViewed: mockSetViewed,
          fileStateMap: new Map([
            ['file1.tsx', { isViewed: true, isCollapsed: false }],
            ['file2.tsx', { isViewed: true, isCollapsed: false }],
          ]),
        }),
      )

      render(<Toolbar />)

      // WHEN
      fireEvent.click(screen.getByTestId('action-button-mark-all-viewed'))

      // EXPECT
      expect(screen.getByTestId('action-button-mark-all-viewed')).toHaveTextContent('Unview')
      expect(mockSetViewed).toHaveBeenCalledTimes(2)
      expect(mockSetViewed).toHaveBeenCalledWith('file1.tsx', false)
      expect(mockSetViewed).toHaveBeenCalledWith('file2.tsx', false)
    })
  })

  describe('Rendering Scenarios', () => {
    renderingTestMatrix.forEach(({ name, props, expectations, setup }) => {
      it(`given ${name}, when rendered, expect correct elements`, () => {
        // GIVEN
        setup?.()

        // WHEN
        render(<Toolbar {...props} />)

        // EXPECT
        expectations.forEach(({ selector, assertion, content }) => {
          const element = screen.queryByTestId(selector.replace('[data-testid="', '').replace('"]', ''))

          if (assertion === 'toBeInTheDocument') {
            expect(element).toBeInTheDocument()
            if (content) {
              expect(element).toHaveTextContent(content)
            }
          } else {
            expect(element).not.toBeInTheDocument()
          }
        })
      })
    })
  })

  describe('File State Calculations', () => {
    fileStateMatrix.forEach(({ name, files, states, expectedProgress }) => {
      it(`given ${name}, when rendered, expect correct progress indicator`, () => {
        // GIVEN
        const fileStateMap = new Map(files.map((file, index) => [file, states[index]]))

        vi.mocked(useCodePanelConfig).mockReturnValue(
          createMockCodePanelConfig({
            allFileKeys: files,
            fileStateMap,
          }),
        )

        // WHEN
        render(<Toolbar />)

        // EXPECT
        expect(screen.getByTestId('progress-indicator')).toHaveTextContent(expectedProgress)
      })
    })
  })

  describe('Custom Components', () => {
    it('given custom buttons, when rendered, expect custom buttons to be included and functional', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const customButtons = [
        createCustomButton({ key: 'custom-1', label: 'Custom 1', onClick: mockOnClick }),
        createCustomButton({ key: 'custom-2', label: 'Custom 2', side: 'right' }),
      ]

      render(<Toolbar customButtons={customButtons} />)

      // WHEN
      fireEvent.click(screen.getByTestId('action-button-custom-1'))

      // EXPECT
      expect(screen.getByTestId('action-button-custom-1')).toHaveTextContent('Custom 1')
      expect(screen.getByTestId('action-button-custom-2')).toHaveTextContent('Custom 2')
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('given left side additional widgets, when rendered, expect widgets in left cluster', () => {
      // GIVEN
      const leftWidget = createToolbarWidget({ key: 'left-widget', side: 'left' })

      // WHEN
      render(<Toolbar additionalWidget={[leftWidget]} />)

      // EXPECT
      expect(screen.getByTestId('test-widget')).toBeInTheDocument()
    })

    it('given right side additional widgets, when rendered, expect widgets in right cluster', () => {
      // GIVEN
      const rightWidget = createToolbarWidget({ key: 'right-widget', side: 'right' })

      // WHEN
      render(<Toolbar additionalWidget={[rightWidget]} />)

      // EXPECT
      expect(screen.getByTestId('test-widget')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('given loading true, when rendered, expect skeleton with correct attributes', () => {
      // WHEN
      render(<Toolbar loading={true} />)

      // EXPECT
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('data-active', 'true')
      expect(skeleton).toHaveAttribute('data-title', 'false')
      expect(skeleton).toHaveAttribute('data-rows', '2')
    })
  })
})
