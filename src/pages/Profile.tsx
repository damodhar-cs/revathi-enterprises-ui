import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { User, Mail, Calendar, Shield, Key, CheckCircle } from 'lucide-react'
import { authService } from '../services/authService'

const Profile: React.FC = () => {
  const { user } = useAuth()
  
  // Password reset states
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState('')
  const [isResetting, setIsResetting] = useState(false)

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
    setResetSuccess(false)

    try {
      // Backend gets email from JWT token automatically and sends email via Contentstack
      await authService.resetPassword()
      setResetSuccess(true)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send password reset email. Please try again.'
      setResetError(errorMessage)
    } finally {
      setIsResetting(false)
    }
  }

  const openResetModal = () => {
    setShowResetModal(true)
    setResetSuccess(false)
    setResetError('')
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    setResetSuccess(false)
    setResetError('')
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
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                {/* Header */}
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  {/* Success State */}
                  {resetSuccess ? (
                    <div className="text-center py-4">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Email Sent Successfully!
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        A password reset link has been sent to:
                      </p>
                      <p className="text-sm font-semibold text-primary-600 mb-4">
                        {user?.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Please check your email inbox (and spam folder) for the reset link.
                        <br />
                        The link will expire in 1 hour.
                      </p>
                      <div className="mt-6">
                        <Button
                          type="button"
                          onClick={closeResetModal}
                          className="w-full"
                        >
                          Got it, Close
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Initial/Error State */}
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
                        A password reset email will be sent to: <strong>{user?.email}</strong>
                      </p>

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
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleResetPassword}
                          loading={isResetting}
                          disabled={isResetting}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Reset Email
                        </Button>
                      </div>
                    </>
                  )}
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
