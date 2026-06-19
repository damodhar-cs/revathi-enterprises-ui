import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Search, Filter, Package, Eye, Edit2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Download, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Button } from '../components/Button'
import VariantForm from '../components/VariantForm'
import FilterPanel from '../components/FilterPanel'
import { Variant } from '../types'
import api, { variantsApi } from '../services/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/common/constants'
import { BRANCH_OPTIONS, BRAND_OPTIONS, CATEGORY_OPTIONS } from '@/common/enums'
import { capitalizeFirst } from '../utils/textUtils'

const Variants: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter states - selected vs applied
  const [selectedCategory, setSelectedCategory] = useState('')
  const [appliedCategory, setAppliedCategory] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [appliedBrand, setAppliedBrand] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [appliedBranch, setAppliedBranch] = useState('')
  
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)
  const [isClearingFilters, setIsClearingFilters] = useState(false)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Variant | null>(null)
  const [mutationError, setMutationError] = useState('')

  // Export state
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportEmail, setExportEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE)

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

  // Restore state when navigating back from ProductVariantsPage
  useEffect(() => {
    const state = location.state as any;
    if (state?.searchTerm) {
      setSearchTerm(state.searchTerm);
    }
    if (state?.filters) {
      if (state.filters.category) {
        setSelectedCategory(state.filters.category);
        setAppliedCategory(state.filters.category);
      }
      if (state.filters.brand) {
        setSelectedBrand(state.filters.brand);
        setAppliedBrand(state.filters.brand);
      }
      if (state.filters.branch) {
        setSelectedBranch(state.filters.branch);
        setAppliedBranch(state.filters.branch);
      }
    }
    // Clear the state to prevent re-applying on subsequent renders
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state])


  // Fetch all variants from API with applied filters using findAllVariants
  const { data: variantsResponse = { items: [], count: 0 }, isLoading, error, refetch, isFetching } = useQuery(
    ['variants', { 
      category: appliedCategory,
      brand: appliedBrand,
      branch: appliedBranch, 
      search: searchTerm,
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage
    }],
    async () => {
      const filters = {
        category: appliedCategory || undefined,
        brand: appliedBrand || undefined,
        branch: appliedBranch || undefined,
        search: searchTerm || undefined,
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        order: -1, // -1 for desc, 1 for asc
        sort: 'updated_at'
      };
      
      const response = await api.post("/variants/search", filters);
      // Backend returns { items: [...], count: number }
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
  
  const variants = variantsResponse.items || []
  const totalItems = variantsResponse.count || 0

  // Use predefined enum options for all filters (consistent across all pages)
  const categories = CATEGORY_OPTIONS
  const brands = BRAND_OPTIONS
  const branches = BRANCH_OPTIONS

  // All variants are fetched, no additional filtering needed
  const filteredItems = variants

  // For server-side pagination, we use the variants directly (already paginated by server)
  const paginatedItems = filteredItems
  
  // Total pages calculated from backend response
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [appliedCategory, appliedBrand, appliedBranch, searchTerm])

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
  }

  const handleAddVariant = () => {
    setEditingItem(null)
    setIsAddModalOpen(true)
  }

  const handleExport = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!exportEmail || !emailRegex.test(exportEmail)) {
      setExportMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    setIsExporting(true)
    setExportMessage(null)

    try {
      await variantsApi.exportVariants({
        recipientEmail: exportEmail,
        search: searchTerm || undefined,
        category: appliedCategory || undefined,
        brand: appliedBrand || undefined,
        branch: appliedBranch || undefined,
      })
      setExportMessage({ type: 'success', text: `Variants export will be sent to ${exportEmail} shortly!` })
      setTimeout(() => {
        setShowExportModal(false)
        setExportEmail('')
        setExportMessage(null)
      }, 2000)
    } catch (error: any) {
      setExportMessage({ type: 'error', text: error.response?.data?.message || 'Failed to export variants. Please try again.' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleEditVariant = (item: Variant) => {
    // Navigate to variant detail page
    const variantUid = item.uid || item._id
    navigate(`/variant/${variantUid}`, { 
      state: { 
        returnFilters: {
          category: appliedCategory,
          brand: appliedBrand,
          branch: appliedBranch
        },
        returnSearch: searchTerm
      } 
    })
  }

  // Create variant mutation  
  const createVariantMutation = useMutation(
    (variantData: any) => {
      // Transform variantData to match backend expectations - exclude all unwanted fields
      const { id, _id, uid, profit_margin, profitMargin, createdAt, updatedAt, created_at, updated_at, __v, count, ...dataWithoutId } = variantData;
      
      // Create clean data object with only allowed fields (matching backend CreateVariantInputDto)
      const cleanedData: any = {
        product_name: dataWithoutId.product_name,
        product_uid: dataWithoutId.product_uid,
        description: dataWithoutId.description,
        imei: dataWithoutId.imei,
        category: dataWithoutId.category,
        brand: dataWithoutId.brand,
        branch: dataWithoutId.branch,
        cost_price: Number(dataWithoutId.cost_price),
      };
      
      // Add optional fields only if they have values
      if (dataWithoutId.name && dataWithoutId.name.trim()) {
        cleanedData.name = dataWithoutId.name;
      }
      if (dataWithoutId.supplier && dataWithoutId.supplier.trim()) {
        cleanedData.supplier = dataWithoutId.supplier;
      }
      if (dataWithoutId.selling_price) {
        cleanedData.selling_price = Number(dataWithoutId.selling_price);
      }
      if (dataWithoutId.notes && dataWithoutId.notes.trim()) {
        cleanedData.notes = dataWithoutId.notes;
      }
      
      // Add warranty if provided
      if (dataWithoutId.warranty !== undefined && dataWithoutId.warranty !== null) {
        cleanedData.warranty = Number(dataWithoutId.warranty);
      }
      
      // Add attributes object if provided
      if (dataWithoutId.attributes) {
        cleanedData.attributes = dataWithoutId.attributes;
      }
      
      return variantsApi.createVariant(cleanedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('variants');
        setIsAddModalOpen(false);
        setMutationError('');
        // Refetch to get the latest aggregated data
        refetch();
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to create variant');
      },
    }
  );

  // Update variant mutation
  const updateVariantMutation = useMutation(
    (variantData: any) => {
      const { id, _id, uid, profit_margin, profitMargin, createdAt, updatedAt, created_at, updated_at, __v, count, ...dataWithoutId } = variantData;
      const variantUid = uid || _id || id; // Use uid first, fallback to _id or id

      const cleanedData: any = {
        product_name: dataWithoutId.product_name,
        product_uid: dataWithoutId.product_uid,
        description: dataWithoutId.description,
        imei: dataWithoutId.imei,
        category: dataWithoutId.category,
        brand: dataWithoutId.brand,
        branch: dataWithoutId.branch,
        cost_price: Number(dataWithoutId.cost_price),
      };
      
      // Add optional fields only if they have values
      if (dataWithoutId.supplier && dataWithoutId.supplier.trim()) {
        cleanedData.supplier = dataWithoutId.supplier;
      }
      if (dataWithoutId.selling_price) {
        cleanedData.selling_price = Number(dataWithoutId.selling_price);
      }
      if (dataWithoutId.notes && dataWithoutId.notes.trim()) {
        cleanedData.notes = dataWithoutId.notes;
      }
      
      // Add warranty if provided
      if (dataWithoutId.warranty !== undefined && dataWithoutId.warranty !== null) {
        cleanedData.warranty = Number(dataWithoutId.warranty);
      }
      
      // Add attributes object if provided
      if (dataWithoutId.attributes) {
        cleanedData.attributes = dataWithoutId.attributes;
      }
      
      return variantsApi.updateVariant(variantUid, cleanedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('variants');
        setIsAddModalOpen(false);
        setMutationError('');
        // Refetch to get the latest aggregated data
        refetch();
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to update variant');
      },
    }
  );

  const handleSaveVariant = async (variantData: any) => {
    setMutationError('');
    const isEdit = !!variantData.uid || !!variantData._id || !!variantData.id;
    
    if (isEdit) {
      updateVariantMutation.mutate(variantData);
    } else {
      createVariantMutation.mutate(variantData);
    }
  }

  const applyFilters = async () => {
    setIsApplyingFilters(true)
    setAppliedCategory(selectedCategory)
    setAppliedBrand(selectedBrand)
    setAppliedBranch(selectedBranch)
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
    setSelectedCategory('')
    setSelectedBrand('')
    setSelectedBranch('')
    setAppliedCategory('')
    setAppliedBrand('')
    setAppliedBranch('')
    setCurrentPage(1)
    
    // Wait a bit for UI feedback and force refetch
    setTimeout(() => {
      setIsClearingFilters(false)
      setShowFilterPanel(false)
      refetch() // Force refetch to ensure fresh data
    }, 100)
  }

  // Filter panel configuration
  const filterFields = [
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      value: selectedCategory,
      options: categories.map(cat => ({ label: cat, value: cat })),
      placeholder: 'All Categories'
    },
    {
      key: 'brand',
      label: 'Brand',
      type: 'select' as const,
      value: selectedBrand,
      options: brands.map(brand => ({ label: brand, value: brand })),
      placeholder: 'All Brands'
    },
    {
      key: 'branch',
      label: 'Branch',
      type: 'select' as const,
      value: selectedBranch,
      options: branches.map(branch => ({ label: branch, value: branch })),
      placeholder: 'All Branches'
    }
  ]

  const handleFilterFieldChange = (key: string, value: string | string[] | { start: string; end: string }) => {
    if (key === 'category') {
      setSelectedCategory(value as string)
    } else if (key === 'brand') {
      setSelectedBrand(value as string)
    } else if (key === 'branch') {
      setSelectedBranch(value as string)
    }
  }

  // Pagination component
  const PaginationControls = () => (
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
        {totalItems > 0 ? `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} records` : '0 to 0 of 0 records'}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Variants Management</h1>
          <p className="text-gray-600">Manage product variants with detailed specifications</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleAddVariant}
            className="inline-flex items-center"
            disabled={createVariantMutation.isLoading || updateVariantMutation.isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or IMEI..."
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
              {(appliedCategory || appliedBrand || appliedBranch) && (
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
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Loading variants...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Error loading variants.</p>
              </div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="h-full overflow-x-auto">
              <div className="h-full overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI/Variant Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RAM</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battery</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((item: Variant) => (
                      <tr key={item.uid || item._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/variant/${item.uid || item._id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{capitalizeFirst(item.name || item.product_name)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.imei}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.brand}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.branch}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.attributes?.ram ? `${item.attributes.ram} GB` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.attributes?.storage ? `${item.attributes.storage} GB` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.attributes?.color || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.attributes?.battery_life ? `${item.attributes.battery_life}h` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.createdAt || item.created_at || '').toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditVariant(item);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                              title="Edit Variant"
                            >
                              <Edit2 className="w-4 h-4" />
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
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No variants found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || appliedCategory || appliedBrand || appliedBranch
                    ? 'Try adjusting your search or filters'
                    : 'No variants available'
                  }
                </p>
                {!searchTerm && !appliedCategory && !appliedBrand && !appliedBranch && (
                  <Button onClick={handleAddVariant}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Variant
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
        title="Filter Variants"
        fields={filterFields}
        onFieldChange={handleFilterFieldChange}
        onApply={applyFilters}
        onClear={clearFilters}
        isApplying={isApplyingFilters}
        isClearing={isClearingFilters}
      />

      {/* Add/Edit Modal */}
      <VariantForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        item={editingItem as any}
        onSave={handleSaveVariant}
        error={mutationError}
        isLoading={createVariantMutation.isLoading || updateVariantMutation.isLoading}
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => !isExporting && setShowExportModal(false)}
            />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-3">
                      <Download className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Export Variants Data</h3>
                      <p className="text-sm text-gray-500">Send variants report to your email</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !isExporting && setShowExportModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                    disabled={isExporting}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Applied filters summary */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Export Details:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Total Records: {totalItems}</li>
                    {searchTerm && <li>• Search: {searchTerm}</li>}
                    {appliedCategory && <li>• Category: {appliedCategory}</li>}
                    {appliedBrand && <li>• Brand: {appliedBrand}</li>}
                    {appliedBranch && <li>• Branch: {appliedBranch}</li>}
                    {!searchTerm && !appliedCategory && !appliedBrand && !appliedBranch && (
                      <li>• No filters applied (all variants)</li>
                    )}
                  </ul>
                </div>

                {/* Email input */}
                <div className="mb-4">
                  <label htmlFor="exportEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="exportEmail"
                    value={exportEmail}
                    onChange={(e) => setExportEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    disabled={isExporting}
                    onKeyDown={(e) => e.key === 'Enter' && handleExport()}
                  />
                </div>

                {/* Success / Error message */}
                {exportMessage && (
                  <div className={`rounded-md p-4 mb-4 ${
                    exportMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <p className="text-sm font-medium">{exportMessage.text}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <Button
                  variant="primary"
                  onClick={handleExport}
                  disabled={isExporting || !exportEmail}
                  className="w-full sm:w-auto"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export &amp; Send
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setShowExportModal(false); setExportMessage(null); setExportEmail('') }}
                  disabled={isExporting}
                  className="w-full sm:w-auto mt-3 sm:mt-0"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Variants

