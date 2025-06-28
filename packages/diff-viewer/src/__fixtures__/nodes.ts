import { DirectoryNode, TreeNode } from '../file-explorer/types'
import { SAMPLE_FILE_DIFFS } from './file-diffs'

export const MOCKED_NODE_TREE: DirectoryNode = {
  name: 'root',
  type: 'directory',
  children: new Map<string, TreeNode>([
    [
      'src',
      {
        name: 'src',
        type: 'directory',
        children: new Map<string, TreeNode>([
          [
            'components',
            {
              name: 'components',
              type: 'directory',
              children: new Map<string, TreeNode>([
                [
                  'Button.tsx',
                  {
                    name: 'Button.tsx',
                    type: 'file',
                    file: SAMPLE_FILE_DIFFS[0],
                  },
                ],
              ]),
            },
          ],
          [
            'hooks',
            {
              name: 'hooks',
              type: 'directory',
              children: new Map<string, TreeNode>([
                [
                  'useFetch.ts',
                  {
                    name: 'useFetch.ts',
                    type: 'file',
                    file: SAMPLE_FILE_DIFFS[1],
                  },
                ],
              ]),
            },
          ],
          [
            'utils',
            {
              name: 'utils',
              type: 'directory',
              children: new Map<string, TreeNode>([
                [
                  'helpers.ts',
                  {
                    name: 'helpers.ts',
                    type: 'file',
                    file: SAMPLE_FILE_DIFFS[3],
                  },
                ],
              ]),
            },
          ],
          [
            'legacy',
            {
              name: 'legacy',
              type: 'directory',
              children: new Map<string, TreeNode>([
                [
                  'api.js',
                  {
                    name: 'api.js',
                    type: 'file',
                    file: SAMPLE_FILE_DIFFS[4],
                  },
                ],
              ]),
            },
          ],
        ]),
      },
    ],
    [
      'README.md',
      {
        name: 'README.md',
        type: 'file',
        file: SAMPLE_FILE_DIFFS[2],
      },
    ],
  ]),
}
