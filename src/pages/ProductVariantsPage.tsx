import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Search, Filter, Package, Edit2, Trash2, RefreshCw, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Button } from '../components/Button'
import VariantForm from '../components/VariantForm'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import FilterPanel from '../components/FilterPanel'
import { Variant } from '../types'
import { variantsApi } from '../services/api'
import { BRANCH_OPTIONS } from '@/common/enums'

const ProductVariantsPage: React.FC = () => {
  const { product_uid } = useParams<{ product_uid: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter states - selected vs applied
  const [selectedBranch, setSelectedBranch] = useState('')
  const [appliedBranch, setAppliedBranch] = useState('')
  
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)
  const [isClearingFilters, setIsClearingFilters] = useState(false)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Variant | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Variant | null>(null)
  const [mutationError, setMutationError] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

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

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms debounce
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch variants for specific product
  const { data: variants = [], isLoading, error, refetch, isFetching } = useQuery(
    ['product-variants', product_uid, { 
      branch: appliedBranch, 
      search: debouncedSearchTerm,
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage
    }],
    () => variantsApi.getAllVariants({
      product_uid: product_uid,
      branch: appliedBranch || undefined,
      search: debouncedSearchTerm || undefined,
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      order: -1, // -1 for desc, 1 for asc
      sort: 'updatedAt'
    }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!product_uid, // Only fetch if product_uid is available
    }
  )

  // Use predefined branch options instead of getting from database
  const branches = BRANCH_OPTIONS

  const filteredItems = variants
  const paginatedItems = filteredItems
  
  // For server-side pagination, we use the variants directly (already paginated by server)
  const totalItems = paginatedItems.length * currentPage // Rough estimate
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  // Reset to first page when filters or search change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [appliedBranch, debouncedSearchTerm])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
  }

  // const getStatusBadge = (quantity: number) => {
  //   if (quantity === 0) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Out of Stock</span>
  //   return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">In Stock</span>
  // }

  const handleAddVariant = () => {
    setEditingItem(null)
    setIsAddModalOpen(true)
  }

  const handleEditVariant = (item: Variant) => {
    setEditingItem(item)
    setIsAddModalOpen(true)
  }

  const handleDeleteVariant = (item: Variant) => {
    setItemToDelete(item)
    setDeleteModalOpen(true)
  }

  // Create variant mutation  
  const createVariantMutation = useMutation(
    (variantData: any) => {
      // Transform variantData to match backend expectations
      const { id, _id, uid, profit_margin, profitMargin, createdAt, updatedAt, created_at, updated_at, __v, count, ...dataWithoutId } = variantData;
      
      const cleanedData: any = {
        product_uid: dataWithoutId.product_uid || product_uid, // Use current product_uid if not provided
        product_name: dataWithoutId.product_name,
        description: dataWithoutId.description,
        imei: dataWithoutId.imei,
        category: dataWithoutId.category,
        brand: dataWithoutId.brand,
        branch: dataWithoutId.branch,
        cost_price: Number(dataWithoutId.cost_price),
        quantity: Number(dataWithoutId.quantity) || 0,
      };
      
      // Add optional fields only if they have values
      if (dataWithoutId.title && dataWithoutId.title.trim()) {
        cleanedData.title = dataWithoutId.title;
      }
      if (dataWithoutId.supplier && dataWithoutId.supplier.trim()) {
        cleanedData.supplier = dataWithoutId.supplier;
      }
      if (dataWithoutId.selling_price) {
        cleanedData.selling_price = Number(dataWithoutId.selling_price);
      }
      if (dataWithoutId.image && dataWithoutId.image.trim()) {
        cleanedData.image = dataWithoutId.image;
      }
      if (dataWithoutId.notes && dataWithoutId.notes.trim()) {
        cleanedData.notes = dataWithoutId.notes;
      }
      if (dataWithoutId.warranty !== undefined && dataWithoutId.warranty !== null) {
        cleanedData.warranty = Number(dataWithoutId.warranty);
      }
      if (dataWithoutId.attributes) {
        cleanedData.attributes = dataWithoutId.attributes;
      }
      
      return variantsApi.createVariant(cleanedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('product-variants');
        queryClient.invalidateQueries('variants'); // Also invalidate main variants list
        setIsAddModalOpen(false);
        setMutationError('');
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
      const { id, _id, uid, profit_margin, profitMargin, createdAt, updatedAt, created_at, updated_at, __v, count, title, ...dataWithoutId } = variantData;
      const variantUid = uid || _id || id;
      
      const cleanedData: any = {
        product_uid: dataWithoutId.product_uid || product_uid,
        product_name: dataWithoutId.product_name,
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
      if (dataWithoutId.image && dataWithoutId.image.trim()) {
        cleanedData.image = dataWithoutId.image;
      }
      if (dataWithoutId.notes && dataWithoutId.notes.trim()) {
        cleanedData.notes = dataWithoutId.notes;
      }
      if (dataWithoutId.quantity !== undefined) {
        cleanedData.quantity = Number(dataWithoutId.quantity);
      }
      if (dataWithoutId.warranty !== undefined && dataWithoutId.warranty !== null) {
        cleanedData.warranty = Number(dataWithoutId.warranty);
      }
      if (dataWithoutId.attributes) {
        cleanedData.attributes = dataWithoutId.attributes;
      }
      
      return variantsApi.updateVariant(variantUid, cleanedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('product-variants');
        queryClient.invalidateQueries('variants'); // Also invalidate main variants list
        setIsAddModalOpen(false);
        setMutationError('');
        refetch();
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to update variant');
      },
    }
  );

  // Delete variant mutation
  const deleteVariantMutation = useMutation(
    (variantId: string) => variantsApi.deleteVariant(variantId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('product-variants');
        queryClient.invalidateQueries('variants'); // Also invalidate main variants list
        setMutationError('');
        refetch();
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to delete variant');
      },
    }
  );

  const confirmDeleteVariant = async () => {
    if (itemToDelete && (itemToDelete.uid || itemToDelete._id)) {
      setMutationError('');
      const variantUid = itemToDelete.uid || itemToDelete._id;
      deleteVariantMutation.mutate(variantUid!);
      setItemToDelete(null);
    }
    setDeleteModalOpen(false);
  }

  const handleSaveVariant = async (variantData: any) => {
    setMutationError('');
    const isEdit = !!variantData.id || !!variantData._id;
    
    if (isEdit) {
      updateVariantMutation.mutate(variantData);
    } else {
      createVariantMutation.mutate(variantData);
    }
  }

  // Check if there are changes to apply (either new filters selected or existing filters cleared)
  const hasFilterChanges = selectedBranch !== appliedBranch
  const shouldEnableApply = hasFilterChanges

  const applyFilters = async () => {
    // Only apply if there are actually changes to apply
    if (!shouldEnableApply) return;
    
    setIsApplyingFilters(true)
    setAppliedBranch(selectedBranch)
    setCurrentPage(1)
    
    setTimeout(() => {
      setIsApplyingFilters(false)
      setShowFilterPanel(false)
      refetch()
    }, 100)
  }

  const clearFilters = async () => {
    setIsClearingFilters(true)
    setSelectedBranch('')
    setAppliedBranch('')
    setCurrentPage(1)
    
    setTimeout(() => {
      setIsClearingFilters(false)
      setShowFilterPanel(false)
      refetch()
    }, 100)
  }

  // Filter panel configuration
  const filterFields = [
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
    if (key === 'branch') {
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
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Center: Results info */}
      <div className="text-sm text-gray-600">
        {totalItems > 0 ? `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} records` : '0 to 0 of 0 records'}
      </div>

      {/* Right: Pagination controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || totalPages === 0}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || totalPages === 0}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
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
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
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

  // Get product name from first variant (since all variants have same product_name)
  const product_name = variants.length > 0 ? variants[0].product_name : 'Product'


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant="secondary" 
            onClick={() => {
              const state = location.state as any;
              if (state?.returnTab) {
                // Navigate back with preserved state
                navigate('/variants', { 
                  state: { 
                    activeTab: state.returnTab,
                    filters: state.returnFilters,
                    searchTerm: state.returnSearch
                  }
                });
              } else {
                navigate('/variants');
              }
            }}
            className="inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Variants
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product_name} Variants</h1>
            <p className="text-gray-600">Manage all variants for this product</p>
          </div>
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
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search variants..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center"
              title="Refresh data from server"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowFilterPanel(true)}
              className="inline-flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {appliedBranch && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">
                  Active
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex flex-col h-[calc(100vh-350px)] min-h-[500px]">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI/Variant Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price (₹)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RAM (GB)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage (GB)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battery Life (hrs)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty (yrs)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (g)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/variant/${item._id}`)}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.branch}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.imei}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.brand}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.cost_price}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.attributes?.color || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.attributes?.ram || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.attributes?.storage || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.attributes?.battery_life || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.attributes?.os || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.attributes?.processor || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.warranty || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.attributes?.material || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.attributes?.weight || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVariant(item);
                              }}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                              title="Delete Variant"
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
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No variants found</h3>
                <p className="text-gray-500 mb-4">
                  {debouncedSearchTerm || appliedBranch
                    ? 'Try adjusting your search or filters'
                    : 'No variants available for this product'
                  }
                </p>
                <Button onClick={handleAddVariant}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Variant
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Pagination - Fixed */}
        {filteredItems.length > 0 && (
          <div className="flex-shrink-0 mt-4">
            <PaginationControls />
          </div>
        )}
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
        isApplyDisabled={!shouldEnableApply}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteVariant}
        title="Delete Variant"
        itemName={`${itemToDelete?.imei || itemToDelete?.description} (Quantity: ${itemToDelete?.quantity || 0})`}
        description="Are you sure you want to delete this variant? This action cannot be undone and will permanently remove the variant from your inventory."
      />
    </div>
  )
}

export default ProductVariantsPage
