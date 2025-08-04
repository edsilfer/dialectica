import type { LineRequest } from '@dialectica-org/diff-viewer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFileContent } from './get-file-content'
import { getMoreLines } from './get-more-lines'
import type { GetMoreLinesRequest } from './types'

// MOCK
vi.mock('./get-file-content', () => ({
  getFileContent: vi.fn(),
}))

describe('getMoreLines', () => {
  const mockGetFileContent = vi.mocked(getFileContent)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test data factories
  const createPrKey = (overrides?: Partial<GetMoreLinesRequest['prKey']>) => ({
    owner: 'test-owner',
    repo: 'test-repo',
    pullNumber: 123,
    ...overrides,
  })

  const createGetMoreLinesRequest = (overrides?: Partial<GetMoreLinesRequest>): GetMoreLinesRequest => ({
    prKey: createPrKey(),
    baseSha: 'base-sha-123',
    headSha: 'head-sha-456',
    token: 'test-token',
    ...overrides,
  })

  const createLineRequest = (overrides?: Partial<LineRequest>): LineRequest => ({
    fileKey: 'src/test.ts',
    leftRange: { start: 1, end: 10 },
    rightRange: { start: 1, end: 10 },
    ...overrides,
  })

  const createFileContent = (lines: string[]): string => lines.join('\n')

  describe('validation scenarios', () => {
    it('given missing prKey.owner, when called, expect empty result', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest({
        prKey: createPrKey({ owner: '' }),
      })
      const lineRequest = createLineRequest()

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result).toEqual({ leftLines: new Map(), rightLines: new Map() })
      expect(mockGetFileContent).not.toHaveBeenCalled()
    })

    it('given missing prKey.repo, when called, expect empty result', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest({
        prKey: createPrKey({ repo: '' }),
      })
      const lineRequest = createLineRequest()

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result).toEqual({ leftLines: new Map(), rightLines: new Map() })
      expect(mockGetFileContent).not.toHaveBeenCalled()
    })

    it('given missing prKey.pullNumber, when called, expect empty result', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest({
        prKey: createPrKey({ pullNumber: 0 }),
      })
      const lineRequest = createLineRequest()

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result).toEqual({ leftLines: new Map(), rightLines: new Map() })
      expect(mockGetFileContent).not.toHaveBeenCalled()
    })

    it('given missing lineRequest.fileKey, when called, expect empty result', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest({ fileKey: '' })

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result).toEqual({ leftLines: new Map(), rightLines: new Map() })
      expect(mockGetFileContent).not.toHaveBeenCalled()
    })

    it('given missing baseSha, when called, expect error thrown', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest({ baseSha: '' })
      const lineRequest = createLineRequest()

      // WHEN & EXPECT
      await expect(getMoreLines(params, lineRequest)).rejects.toThrow(
        'Both base SHA and head SHA are required for loading more lines',
      )
      expect(mockGetFileContent).not.toHaveBeenCalled()
    })

    it('given missing headSha, when called, expect error thrown', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest({ headSha: '' })
      const lineRequest = createLineRequest()

      // WHEN & EXPECT
      await expect(getMoreLines(params, lineRequest)).rejects.toThrow(
        'Both base SHA and head SHA are required for loading more lines',
      )
      expect(mockGetFileContent).not.toHaveBeenCalled()
    })
  })

  describe('successful file content fetching', () => {
    it('given valid params and both files exist, when called, expect correct lines extracted', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest({
        leftRange: { start: 2, end: 4 },
        rightRange: { start: 2, end: 4 },
      })
      const leftContent = createFileContent(['line1', 'line2', 'line3', 'line4', 'line5'])
      const rightContent = createFileContent(['new1', 'new2', 'new3', 'new4', 'new5'])

      mockGetFileContent.mockResolvedValueOnce(leftContent).mockResolvedValueOnce(rightContent)

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(mockGetFileContent).toHaveBeenCalledTimes(2)
      expect(mockGetFileContent).toHaveBeenNthCalledWith(1, {
        ...params,
        filePath: lineRequest.fileKey,
        sha: params.baseSha,
      })
      expect(mockGetFileContent).toHaveBeenNthCalledWith(2, {
        ...params,
        filePath: lineRequest.fileKey,
        sha: params.headSha,
      })

      expect(result.leftLines).toEqual(
        new Map([
          [2, 'line2'],
          [3, 'line3'],
          [4, 'line4'],
        ]),
      )
      expect(result.rightLines).toEqual(
        new Map([
          [2, 'new2'],
          [3, 'new3'],
          [4, 'new4'],
        ]),
      )
    })

    it('given different ranges for left and right, when called, expect correct lines for each side', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest({
        leftRange: { start: 1, end: 3 },
        rightRange: { start: 5, end: 7 },
      })
      const leftContent = createFileContent(['line1', 'line2', 'line3', 'line4'])
      const rightContent = createFileContent(['new1', 'new2', 'new3', 'new4', 'new5', 'new6', 'new7'])

      mockGetFileContent.mockResolvedValueOnce(leftContent).mockResolvedValueOnce(rightContent)

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result.leftLines).toEqual(
        new Map([
          [1, 'line1'],
          [2, 'line2'],
          [3, 'line3'],
        ]),
      )
      expect(result.rightLines).toEqual(
        new Map([
          [5, 'new5'],
          [6, 'new6'],
          [7, 'new7'],
        ]),
      )
    })
  })

  describe('file content fetching failures', () => {
    it('given left file fetch fails, when called, expect empty left lines and successful right lines', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest()
      const rightContent = createFileContent(['new1', 'new2', 'new3'])

      mockGetFileContent.mockRejectedValueOnce(new Error('File not found')).mockResolvedValueOnce(rightContent)

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result.leftLines).toEqual(new Map())
      expect(result.rightLines).toEqual(
        new Map([
          [1, 'new1'],
          [2, 'new2'],
          [3, 'new3'],
        ]),
      )
    })

    it('given right file fetch fails, when called, expect successful left lines and empty right lines', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest()
      const leftContent = createFileContent(['line1', 'line2', 'line3'])

      mockGetFileContent.mockResolvedValueOnce(leftContent).mockRejectedValueOnce(new Error('File not found'))

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result.leftLines).toEqual(
        new Map([
          [1, 'line1'],
          [2, 'line2'],
          [3, 'line3'],
        ]),
      )
      expect(result.rightLines).toEqual(new Map())
    })

    it('given both file fetches fail, when called, expect empty result', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest()

      mockGetFileContent
        .mockRejectedValueOnce(new Error('Left file not found'))
        .mockRejectedValueOnce(new Error('Right file not found'))

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result).toEqual({ leftLines: new Map(), rightLines: new Map() })
    })
  })

  describe('edge cases', () => {
    it('given empty file content, when called, expect empty lines', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest()

      mockGetFileContent.mockResolvedValueOnce('').mockResolvedValueOnce('')

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result.leftLines).toEqual(new Map())
      expect(result.rightLines).toEqual(new Map())
    })

    it('given range beyond file content, when called, expect empty result', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest({
        leftRange: { start: 5, end: 10 },
        rightRange: { start: 5, end: 10 },
      })
      const content = createFileContent(['line1', 'line2', 'line3']) // Only 3 lines

      mockGetFileContent.mockResolvedValueOnce(content).mockResolvedValueOnce(content)

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result.leftLines).toEqual(new Map())
      expect(result.rightLines).toEqual(new Map())
    })

    it('given range partially within file content, when called, expect only available lines', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest({
        leftRange: { start: 2, end: 5 },
        rightRange: { start: 2, end: 5 },
      })
      const content = createFileContent(['line1', 'line2', 'line3']) // Only 3 lines

      mockGetFileContent.mockResolvedValueOnce(content).mockResolvedValueOnce(content)

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result.leftLines).toEqual(
        new Map([
          [2, 'line2'],
          [3, 'line3'],
        ]),
      )
      expect(result.rightLines).toEqual(
        new Map([
          [2, 'line2'],
          [3, 'line3'],
        ]),
      )
    })

    it('given single line range, when called, expect single line result', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest({
        leftRange: { start: 3, end: 3 },
        rightRange: { start: 3, end: 3 },
      })
      const content = createFileContent(['line1', 'line2', 'line3', 'line4'])

      mockGetFileContent.mockResolvedValueOnce(content).mockResolvedValueOnce(content)

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result.leftLines).toEqual(new Map([[3, 'line3']]))
      expect(result.rightLines).toEqual(new Map([[3, 'line3']]))
    })

    it('given range starting at 1, when called, expect correct line mapping', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest()
      const lineRequest = createLineRequest({
        leftRange: { start: 1, end: 2 },
        rightRange: { start: 1, end: 2 },
      })
      const content = createFileContent(['first', 'second', 'third'])

      mockGetFileContent.mockResolvedValueOnce(content).mockResolvedValueOnce(content)

      // WHEN
      const result = await getMoreLines(params, lineRequest)

      // EXPECT
      expect(result.leftLines).toEqual(
        new Map([
          [1, 'first'],
          [2, 'second'],
        ]),
      )
      expect(result.rightLines).toEqual(
        new Map([
          [1, 'first'],
          [2, 'second'],
        ]),
      )
    })
  })

  describe('integration with getFileContent', () => {
    it('given valid request, when called, expect getFileContent called with correct parameters', async () => {
      // GIVEN
      const params = createGetMoreLinesRequest({
        prKey: createPrKey({ owner: 'custom-owner', repo: 'custom-repo', pullNumber: 999 }),
        baseSha: 'custom-base-sha',
        headSha: 'custom-head-sha',
        token: 'custom-token',
      })
      const lineRequest = createLineRequest({ fileKey: 'custom/path/file.ts' })

      mockGetFileContent.mockResolvedValueOnce('content1').mockResolvedValueOnce('content2')

      // WHEN
      await getMoreLines(params, lineRequest)

      // EXPECT
      expect(mockGetFileContent).toHaveBeenCalledWith({
        prKey: { owner: 'custom-owner', repo: 'custom-repo', pullNumber: 999 },
        baseSha: 'custom-base-sha',
        headSha: 'custom-head-sha',
        token: 'custom-token',
        filePath: 'custom/path/file.ts',
        sha: 'custom-base-sha',
      })
      expect(mockGetFileContent).toHaveBeenCalledWith({
        prKey: { owner: 'custom-owner', repo: 'custom-repo', pullNumber: 999 },
        baseSha: 'custom-base-sha',
        headSha: 'custom-head-sha',
        token: 'custom-token',
        filePath: 'custom/path/file.ts',
        sha: 'custom-head-sha',
      })
    })
  })
})
