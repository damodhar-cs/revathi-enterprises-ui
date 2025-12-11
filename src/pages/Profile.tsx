import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { User, Edit, Save, X, Mail, Calendar, Shield } from 'lucide-react'

interface ProfileFormData {
  name: string
}

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

const Profile: React.FC = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // TODO: Implement profile update API call
      console.log('Profile update data:', data)
      
      // Simulate API call
      setTimeout(() => {
        setSuccess('Profile updated successfully!')
        setIsEditing(false)
        setIsLoading(false)
      }, 1000)
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Profile update failed')
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setSuccess('')
    setError('')
    const fullName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : ''
    reset({ name: fullName })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSuccess('')
    setError('')
    const fullName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : ''
    reset({ name: fullName })
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.firstName) return 'U'
    const firstInitial = user.firstName[0]
    const lastInitial = user.lastName?.[0] || ''
    return (firstInitial + lastInitial).toUpperCase()
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                  {getUserInitials()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user ? `${user.firstName} ${user.lastName || ''}`.trim() : ''}</h1>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
              </div>
              {!isEditing ? (
                <Button onClick={handleEdit} variant="secondary" className="inline-flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCancel}
                    variant="secondary"
                    className="inline-flex items-center"
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Profile Information
            </h3>

            {!isEditing ? (
              /* View Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{user ? `${user.firstName} ${user.lastName || ''}`.trim() : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-500">Cannot be changed</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <p className="mt-1 text-sm text-gray-900">Administrator</p>
                      <p className="text-xs text-gray-500">Cannot be changed</p>
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
            ) : (
              /* Edit Mode */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <Input
                    {...register('name')}
                    type="text"
                    label="Full Name"
                    placeholder="Enter your full name"
                    error={errors.name?.message}
                    isRequired
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value="Administrator"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Role cannot be changed</p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-600">{error}</div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={isLoading}
                    className="inline-flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {success && (
              <div className="mt-4 rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-600">{success}</div>
              </div>
            )}
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
                  {user?._id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', {
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
      </div>
    </div>
  )
}

export default Profile 