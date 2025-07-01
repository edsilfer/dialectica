import { Form, Input, message } from 'antd'
import React, { useEffect } from 'react'
import { parse as parsePR } from './search-utils'
import { SearchFormProps } from './types'
import debounce from 'lodash/debounce'

const SearchForm: React.FC<SearchFormProps> = ({ width = 300, onSearch }) => {
  const [form] = Form.useForm()
  const placeholderHelp = 'Enter a GitHub PR URL'
  const [helpMessage, setHelpMessage] = React.useState<string>(placeholderHelp)

  const performSearch = React.useCallback(
    (value: string) => {
      const result = parsePR(value)
      if (!result) {
        message.error('Please enter a valid GitHub PR URL (https://github.com/<owner>/<repo>/pull/<id>).')
        return
      }
      const { owner, repo, prNumber } = result
      message.info(`Fetching PR #${prNumber} from ${owner}/${repo}...`)

      // Fire external callback if provided
      onSearch?.(result)
    },
    [onSearch],
  )

  // Debounce to avoid spamming when users trigger searches rapidly
  const performSearchDebounced = React.useMemo(() => debounce(performSearch, 300), [performSearch])

  // Ensure we clean up the debounced function on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      performSearchDebounced.cancel()
    }
  }, [performSearchDebounced])

  // Handler triggered when user presses enter or clicks load
  const onSearchForm = React.useCallback(() => {
    form
      .validateFields()
      .then(({ search }: { search: string }) => {
        performSearchDebounced(search)
        setHelpMessage(placeholderHelp)
      })
      .catch(() => {
        const errors = form.getFieldError('search')
        if (errors.length) setHelpMessage(errors[0])
      })
  }, [form, performSearchDebounced, placeholderHelp])

  const handleFieldsChange = React.useCallback(() => {
    const errors = form.getFieldError('search')
    setHelpMessage(errors.length ? errors[0] : placeholderHelp)
  }, [form, placeholderHelp])

  return (
    <Form form={form} layout="inline" onFieldsChange={handleFieldsChange}>
      <Form.Item
        name="search"
        rules={[
          { required: true, message: 'Please enter a GitHub PR URL' },
          {
            validator: (_rule, value: string) => {
              if (!value) return Promise.resolve()
              return parsePR(value)
                ? Promise.resolve()
                : Promise.reject(new Error('Invalid format. Expected GitHub PR URL'))
            },
          },
        ]}
        validateStatus={helpMessage !== placeholderHelp && helpMessage ? 'error' : undefined}
        help={
          <span style={{ visibility: helpMessage !== placeholderHelp && helpMessage ? 'visible' : 'hidden' }}>
            {helpMessage}
          </span>
        }
      >
        <Input.Search
          placeholder="Load Pull Request"
          allowClear
          enterButton="Load"
          onSearch={onSearchForm}
          style={{ width }}
        />
      </Form.Item>
    </Form>
  )
}

export default SearchForm
