import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { User, Mail, Calendar, Shield, Key, Copy, Check } from 'lucide-react'
import { authService } from '../services/authService'

const Profile: React.FC = () => {
  const { user } = useAuth()
  
  // Password reset states
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U'
    const emailPrefix = user.email.split('@')[0]
    return emailPrefix[0].toUpperCase()
  }

  // Handle password reset
  const handleResetPassword = async () => {
    if (!user?.email) {
      setResetError('No email address found for your account')
      return
    }

    setIsResetting(true)
    setResetError('')
    setResetMessage('')
    setResetLink('')

    try {
      // Backend gets email from JWT token automatically
      const response = await authService.resetPassword()
      setResetMessage(response.message || 'Password reset link generated successfully')
      setResetLink(response.resetLink || '')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate password reset link. Please try again.'
      setResetError(errorMessage)
    } finally {
      setIsResetting(false)
    }
  }

  // Copy reset link to clipboard
  const handleCopyLink = async () => {
    if (resetLink) {
      try {
        await navigator.clipboard.writeText(resetLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const openResetModal = () => {
    setShowResetModal(true)
    setResetMessage('')
    setResetError('')
    setResetLink('')
    setCopied(false)
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    setResetMessage('')
    setResetError('')
    setResetLink('')
    setCopied(false)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                {getUserInitials()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.email?.split('@')[0] || 'User'}</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* User Information - Read Only */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      User ID
                    </label>
                    <p className="mt-1 text-sm font-mono text-gray-900">{user?._id || user?.uid || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <p className="mt-1 text-sm text-gray-900">Administrator</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Member Since
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Key className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Password</p>
                    <p className="text-sm text-gray-500">Generate a reset link for your password</p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={openResetModal}
                  className="inline-flex items-center"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Account Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                  {user?._id || user?.uid}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created At
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Reset Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
                onClick={closeResetModal}
              />

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                {/* Header */}
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
                    <button
                      onClick={closeResetModal}
                      className="text-gray-400 hover:text-gray-500 text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    A password reset link will be generated for: <strong>{user?.email}</strong>
                  </p>

                  {/* Success message with reset link */}
                  {resetMessage && resetLink && (
                    <div className="rounded-md bg-green-50 p-4 mb-4">
                      <p className="text-sm text-green-800 mb-3 font-medium">{resetMessage}</p>
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-green-900 mb-2">
                          Password Reset Link:
                        </label>
                        <div className="flex items-start space-x-2">
                          <textarea
                            value={resetLink}
                            readOnly
                            rows={3}
                            className="flex-1 px-3 py-2 text-xs border border-green-300 rounded-md bg-white text-gray-700 font-mono resize-none"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCopyLink}
                            className="inline-flex items-center flex-shrink-0"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                          📋 Copy this link and paste it in your browser to reset your password.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {resetError && (
                    <div className="rounded-md bg-red-50 p-4 mb-4">
                      <p className="text-sm text-red-800">{resetError}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-end space-x-3 mt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeResetModal}
                      disabled={isResetting}
                    >
                      {resetLink ? 'Close' : 'Cancel'}
                    </Button>
                    {!resetLink && (
                      <Button
                        type="button"
                        onClick={handleResetPassword}
                        loading={isResetting}
                        disabled={isResetting}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Generate Reset Link
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
