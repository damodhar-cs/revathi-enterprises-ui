import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Users as UsersIcon, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, UserPlus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../components/Button'
import { Input, PasswordInput } from '../components/Input'
import { Modal } from '../components/Modal'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import FilterPanel from '../components/FilterPanel'
import { User } from '../types'
import { userService } from '../services/userService'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../common/constants'

// Form data interfaces
interface CreateUserFormData {
  firstName: string
  lastName?: string
  email: string
  password: string
  confirmPassword: string
}

interface UpdateUserFormData {
  firstName: string
  lastName?: string
  email: string
  password?: string
  confirmPassword?: string
}

const createUserSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().optional(),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const updateUserSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().optional(),
    email: z.string().email('Invalid email address'),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => {
    if (data.password || data.confirmPassword) {
      return data.password === data.confirmPassword && (data.password?.length || 0) >= 6
    }
    return true
  }, {
    message: "Passwords don't match or password too short",
    path: ['confirmPassword'],
  })

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const Users: React.FC = () => {
  // Search state (instant)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // 300ms debounce
  
  // Filter states (with Apply button)
  const [selectedRole, setSelectedRole] = useState('')
  const [appliedRole, setAppliedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)
  const [isClearingFilters, setIsClearingFilters] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<User | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<User | null>(null)
  const [mutationError, setMutationError] = useState('')
  
  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE)
  const [sortField, setSortField] = useState<'firstName' | 'email' | 'updatedAt'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const queryClient = useQueryClient()

  // Auto-dismiss error after 2 seconds
  useEffect(() => {
    if (mutationError) {
      const timer = setTimeout(() => {
        setMutationError('')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [mutationError])

  // Fetch all users for filter options (no filters applied)
  const { data: allUsersForFilters } = useQuery(
    ['all-users-for-filters'],
    () => userService.searchUsers({ page: 1, limit: 1000 }), // Get a large number to get all roles
    {
      staleTime: 10 * 60 * 1000, // 10 minutes (longer cache for filter options)
    }
  )

  // Fetch users with server-side pagination, sorting, and filtering
  const { data: usersData, isLoading, error, refetch, isFetching } = useQuery(
    ['users-search', {
      search: debouncedSearchTerm, // Instant search
      role: appliedRole, // Applied filters
      status: appliedStatus, // Applied filters
      page: currentPage,
      limit: itemsPerPage,
      sortField,
      sortOrder
    }],
    () => userService.searchUsers({
      search: debouncedSearchTerm || undefined,
      role: appliedRole || undefined,
      status: appliedStatus || undefined,
      page: currentPage,
      limit: itemsPerPage,
      sortField,
      sortOrder
    }),
    {
      keepPreviousData: true,
      staleTime: 30 * 1000, // 30 seconds
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to fetch users')
      },
    }
  )

  const users = usersData?.data || []
  const totalItems = usersData?.total || 0
  const totalPages = usersData?.totalPages || 0

  // Get unique roles from ALL users (not filtered ones)
  const roles = React.useMemo(() => {
    const allUsers = allUsersForFilters?.data || []
    const roleList = [...new Set(allUsers.map(u => u.role))].filter(Boolean)
    return roleList.sort()
  }, [allUsersForFilters])

  const handleAddUser = () => {
    setEditingItem(null)
    setIsAddModalOpen(true)
  }

  const handleEditUser = (item: User) => {
    setEditingItem(item)
    setIsAddModalOpen(true)
  }

  // Create user mutation
  const createUserMutation = useMutation(
    (userData: CreateUserFormData) => {
      // Exclude confirmPassword from backend payload
      const { confirmPassword, ...backendData } = userData as any
      return userService.createUser(backendData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users-search')
        setIsAddModalOpen(false)
        setMutationError('')
        // Reset sort to show newest first
        setSortField('updatedAt')
        setSortOrder('desc')
        refetch()
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to create user')
      },
    }
  )

  // Update user mutation
  const updateUserMutation = useMutation(
    ({ id, userData }: { id: string; userData: UpdateUserFormData }) => {
      // Exclude confirmPassword and empty password from backend payload  
      const { confirmPassword, password, ...backendData } = userData as any
      if (password && password.trim()) {
        backendData.password = password
      }
      return userService.updateUser(id, backendData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users-search')
        setIsAddModalOpen(false)
        setMutationError('')
        // Reset sort to show newest first
        setSortField('updatedAt')
        setSortOrder('desc')
        refetch()
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to update user')
      },
    }
  )

  // Delete user mutation
  const deleteUserMutation = useMutation(userService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users-search')
      setMutationError('')
      refetch()
    },
    onError: (err: any) => {
      setMutationError(err.response?.data?.message || 'Failed to delete user')
    },
  })

  // Form for create user
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: errorsCreate },
    reset: resetCreate,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  })

  // Form for update user
  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { errors: errorsUpdate },
    reset: resetUpdate,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  })

  const onSubmitCreate = async (data: CreateUserFormData) => {
    createUserMutation.mutate(data)
  }
  
  const onSubmitUpdate = async (data: UpdateUserFormData) => {
    if (editingItem) {
      updateUserMutation.mutate({ id: editingItem._id, userData: data })
    }
  }

  const handleDeleteUser = (item: User) => {
    setItemToDelete(item)
    setDeleteModalOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (itemToDelete) {
      setMutationError('')
      deleteUserMutation.mutate(itemToDelete._id)
      setItemToDelete(null)
    }
    setDeleteModalOpen(false)
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false)
    resetCreate()
    resetUpdate()
    setMutationError('')
    setEditingItem(null)
  }

  // Prefill form when editing
  useEffect(() => {
    if (editingItem && isAddModalOpen) {
      resetUpdate({
        firstName: editingItem.firstName,
        lastName: editingItem.lastName || '',
        email: editingItem.email,
        password: '',
        confirmPassword: ''
      })
    }
  }, [editingItem, isAddModalOpen, resetUpdate])

  const applyFilters = async () => {
    setIsApplyingFilters(true)
    setAppliedRole(selectedRole)
    setAppliedStatus(selectedStatus)
    setCurrentPage(1) // Reset to first page when applying filters
    
    // Wait a bit for UI feedback and force refetch
    setTimeout(() => {
      setIsApplyingFilters(false)
      setShowFilterPanel(false)
      refetch() // Force refetch to ensure fresh data
    }, 100)
  }

  const clearFilters = async () => {
    setIsClearingFilters(true)
    setSelectedRole('')
    setSelectedStatus('')
    setAppliedRole('')
    setAppliedStatus('')
    setCurrentPage(1)
    
    // Wait a bit for UI feedback and force refetch
    setTimeout(() => {
      setIsClearingFilters(false)
      setShowFilterPanel(false)
      refetch() // Force refetch to ensure fresh data
    }, 100)
  }

  const handleSort = (field: 'firstName' | 'email' | 'updatedAt') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
    
    // Force a small delay to ensure state is updated before query runs
    setTimeout(() => {
      refetch()
    }, 50)
  }

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Filter panel configuration
  const filterFields = [
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      value: selectedRole,
      options: roles.map(role => ({ label: role, value: role })),
      placeholder: 'All Roles'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      value: selectedStatus,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ],
      placeholder: 'All Status'
    }
  ]

  const handleFilterFieldChange = (key: string, value: string | string[] | { start: string; end: string }) => {
    if (key === 'role') {
      setSelectedRole(value as string)
    } else if (key === 'status') {
      setSelectedStatus(value as string)
    }
  }

  // Pagination component
  const PaginationControls = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

    return (
      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg">
        {/* Left: Items per page */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Showing</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white"
          >
            {PAGE_SIZE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Center: Results info */}
        <div className="text-sm text-gray-600">
          {totalItems > 0 ? `${startIndex + 1} to ${endIndex} of ${totalItems} records` : '0 to 0 of 0 records'}
        </div>

        {/* Right: Pagination controls */}
        <div className="flex items-center space-x-1">
          {/* First page */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || totalPages === 0}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || totalPages === 0}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Current page dropdown */}
          <select
            value={totalPages > 0 ? currentPage : 1}
            onChange={(e) => handlePageChange(Number(e.target.value))}
            disabled={totalPages <= 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[60px] disabled:bg-gray-100 disabled:text-gray-500"
          >
            {totalPages > 0 ? (
              Array.from({ length: totalPages }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))
            ) : (
              <option value={1}>1</option>
            )}
          </select>

          {/* Next page */}
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their access</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="inline-flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleAddUser} 
            className="inline-flex items-center"
            disabled={createUserMutation.isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Instant Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email... (instant search)"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {/* Refresh Button */}
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center"
              title="Refresh data from server"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            {/* Filter Toggle */}
            <Button
              variant="secondary"
              onClick={() => setShowFilterPanel(true)}
              className="inline-flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(appliedRole || appliedStatus) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">
                  Active
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {mutationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{mutationError}</p>
        </div>
      )}

      {/* Table Container with Fixed Layout */}
      <div className="flex flex-col h-[calc(100vh-350px)] min-h-[500px]">
        {/* Table View - Scrollable */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Error loading users.</p>
              </div>
            </div>
          ) : users.length > 0 ? (
            <div className="h-full overflow-x-auto">
              <div className="h-full overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('firstName')}
                      >
                        <div className="flex items-center">
                          First Name
                          {sortField === 'firstName' && (
                            <span className="ml-1">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email
                          {sortField === 'email' && (
                            <span className="ml-1">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <div className="flex items-center">
                          Updated At
                          {sortField === 'updatedAt' && (
                            <span className="ml-1">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.firstName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.updatedAt).toLocaleDateString()} {new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.updatedBy || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">
                  {debouncedSearchTerm || appliedRole || appliedStatus
                    ? 'Try adjusting your search or filters'
                    : 'No users available'
                  }
                </p>
                {!debouncedSearchTerm && !appliedRole && !appliedStatus && (
                  <Button onClick={handleAddUser}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First User
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Pagination - Fixed */}
        <div className="flex-shrink-0 mt-4">
          <PaginationControls />
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        title="Filter Users"
        fields={filterFields}
        onFieldChange={handleFilterFieldChange}
        onApply={applyFilters}
        onClear={clearFilters}
        isApplying={isApplyingFilters}
        isClearing={isClearingFilters}
      />

      {/* Create/Update User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Update User" : "Add New User"}
        size="lg"
      >
        <div className="flex items-center mb-4">
          <UserPlus className="h-5 w-5 text-primary-600 mr-2" />
          <p className="text-sm text-gray-600">
            {editingItem ? "Update user information." : "Create a new user account with secure access credentials."}
          </p>
        </div>

        <form onSubmit={editingItem ? handleSubmitUpdate(onSubmitUpdate) : handleSubmitCreate(onSubmitCreate)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              {...(editingItem ? registerUpdate('firstName') : registerCreate('firstName'))}
              type="text"
              label="First Name"
              placeholder="Enter first name"
              error={editingItem ? errorsUpdate.firstName?.message : errorsCreate.firstName?.message}
              isRequired
              noMargin
            />
            <Input
              {...(editingItem ? registerUpdate('lastName') : registerCreate('lastName'))}
              type="text"
              label="Last Name"
              placeholder="Enter last name"
              error={editingItem ? errorsUpdate.lastName?.message : errorsCreate.lastName?.message}
              isRequired={false}
              noMargin
            />
          </div>

          <Input
            {...(editingItem ? registerUpdate('email') : registerCreate('email'))}
            type="email"
            label="Email Address"
            placeholder="Enter email address"
            error={editingItem ? errorsUpdate.email?.message : errorsCreate.email?.message}
            isRequired
            noMargin
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordInput
              {...(editingItem ? registerUpdate('password') : registerCreate('password'))}
              label="Password"
              placeholder={editingItem ? "Leave blank to keep current" : "Enter password"}
              error={editingItem ? errorsUpdate.password?.message : errorsCreate.password?.message}
              isRequired={!editingItem}
              noMargin
            />
            <PasswordInput
              {...(editingItem ? registerUpdate('confirmPassword') : registerCreate('confirmPassword'))}
              label="Confirm Password"
              placeholder={editingItem ? "Confirm new password" : "Confirm password"}
              error={editingItem ? errorsUpdate.confirmPassword?.message : errorsCreate.confirmPassword?.message}
              isRequired={!editingItem}
              noMargin
            />
          </div>

          {mutationError && (
            <div className="rounded-md bg-red-50 p-3">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {editingItem ? "Failed to update user" : "Failed to create user"}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{mutationError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={editingItem ? updateUserMutation.isLoading : createUserMutation.isLoading}
            >
              {editingItem ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        itemName={`${itemToDelete?.firstName} ${itemToDelete?.lastName || ''}`.trim()}
        description="Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user's access to the system."
      />
    </div>
  )
}

export default Users