import {
  DirectoryActivitySummaryProps,
  FileActivitySummaryProps,
} from '../../../../../components/activity-summary/types'
import { SAMPLE_FILE_DIFFS } from '../../../../test/__fixtures__/file-diff-fixtures'
import { createPropsFactory } from '../../../../../../../commons/src/test/generic-test-utils'

/**
 * Creates a mock FileActivitySummaryProps with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock FileActivitySummaryProps with default values and optional overrides
 */
export const createFileActivitySummaryProps = createPropsFactory<FileActivitySummaryProps>({
  file: SAMPLE_FILE_DIFFS[0],
})

/**
 * Creates a mock DirectoryActivitySummaryProps with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock DirectoryActivitySummaryProps with default values and optional overrides
 */
export const createDirectoryActivitySummaryProps = createPropsFactory<DirectoryActivitySummaryProps>({
  files: SAMPLE_FILE_DIFFS,
})
