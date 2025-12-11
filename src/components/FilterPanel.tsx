import React from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface FilterOption {
  label: string
  value: string
}

interface FilterField {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'dateRange'
  options?: FilterOption[]
  value: string | string[] | { start: string; end: string }
  placeholder?: string
}

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fields: FilterField[]
  onFieldChange: (key: string, value: string | string[] | { start: string; end: string }) => void
  onApply: () => void
  onClear: () => void
  isApplying?: boolean
  isClearing?: boolean
  isApplyDisabled?: boolean
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  title,
  fields,
  onFieldChange,
  onApply,
  onClear,
  isApplying = false,
  isClearing = false,
  isApplyDisabled = false,
}) => {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                </label>
                {field.type === 'select' && (
                  <select
                    value={field.value as string}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="">{field.placeholder || `All ${field.label}`}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === 'multiselect' && (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {field.options?.map((option) => {
                      const values = field.value as string[]
                      const isSelected = values.includes(option.value)
                      return (
                        <label
                          key={option.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const currentValues = field.value as string[]
                              let newValues: string[]
                              if (e.target.checked) {
                                newValues = [...currentValues, option.value]
                              } else {
                                newValues = currentValues.filter(v => v !== option.value)
                              }
                              onFieldChange(field.key, newValues)
                            }}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
                {field.type === 'dateRange' && (
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                      <input
                        type="date"
                        value={(field.value as { start: string; end: string }).start}
                        onChange={(e) => onFieldChange(field.key, {
                          start: e.target.value,
                          end: (field.value as { start: string; end: string }).end
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                      <input
                        type="date"
                        value={(field.value as { start: string; end: string }).end}
                        onChange={(e) => onFieldChange(field.key, {
                          start: (field.value as { start: string; end: string }).start,
                          end: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onClear}
              loading={isClearing}
              className="flex-1"
            >
              Clear Filters
            </Button>
            <Button
              onClick={onApply}
              loading={isApplying}
              disabled={isApplyDisabled && !isApplying}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default FilterPanel