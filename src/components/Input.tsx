import React, { forwardRef, useState } from 'react'
import { clsx } from 'clsx'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  noMargin?: boolean
  isRequired?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, noMargin = false, isRequired = false, ...props }, ref) => {
    return (
      <div className={clsx(!noMargin && "mb-4")}>
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
            {!isRequired && <span className="text-gray-400 ml-1 text-xs">(optional)</span>}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500',
            {
              'border-red-300 focus:ring-red-500 focus:border-red-500': error,
            },
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// New PasswordInput component with eye icon toggle
interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showToggle?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helperText, className, showToggle = true, noMargin = false, isRequired = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    return (
      <div className={clsx(!noMargin && "mb-4")}>
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
            {!isRequired && <span className="text-gray-400 ml-1 text-xs">(optional)</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={clsx(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500',
              {
                'border-red-300 focus:ring-red-500 focus:border-red-500': error,
                'pr-10': showToggle, // Add padding for the icon
              },
              className
            )}
            {...props}
          />
          {showToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput' 