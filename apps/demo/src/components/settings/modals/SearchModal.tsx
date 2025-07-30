import { PrKey } from '@github'
import { Modal } from 'antd'
import React from 'react'
import SearchForm from '../../search-form'

interface SearchModalProps {
  /** Whether the modal is open */
  open: boolean

  /** Callback to close the modal */
  onClose: () => void
  /** Callback to search for a pull request */
  onSearch: (pr: PrKey) => void
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, onSearch }) => {
  return (
    <Modal open={open} onOk={onClose} onCancel={onClose} footer={null} title="Search">
      <SearchForm onSearch={onSearch} />
    </Modal>
  )
}

export default SearchModal
