import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Package, Edit2, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Button } from '../components/Button'
import FilterPanel from '../components/FilterPanel'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { Product } from '../types'
import { productsApi } from '../services/api'
import ProductForm from '../components/ProductForm'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../common/constants'
import { BRAND_OPTIONS, CATEGORY_OPTIONS } from '../common/enums'
import { capitalizeFirst } from '../utils/textUtils'

const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter states - selected vs applied
  const [selectedCategory, setSelectedCategory] = useState('')
  const [appliedCategory, setAppliedCategory] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [appliedBrand, setAppliedBrand] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' })
  const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' })
  
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)
  const [isClearingFilters, setIsClearingFilters] = useState(false)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null)
  const [mutationError, setMutationError] = useState('')
  
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

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms debounce
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch products with applied filters
  const { data: products = [], isLoading, error, refetch, isFetching } = useQuery(
    ['products', { 
      category: appliedCategory,
      brand: appliedBrand,
      dateRange: appliedDateRange,
      search: debouncedSearchTerm,
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage
    }],
    () => {
      const filters: any = {
        category: appliedCategory || undefined,
        brand: appliedBrand || undefined,
        search: debouncedSearchTerm || undefined,
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        order: -1,
        sort: 'updated_at'
      };

      // Date range filter in CMS format (as object, not stringified)
      if (appliedDateRange.start && appliedDateRange.end) {
        filters.created_at = {
          $gte: new Date(appliedDateRange.start).toISOString(),
          $lte: new Date(appliedDateRange.end).toISOString()
        };
      }

      return productsApi.getAllProducts(filters);
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  )

  const filteredItems = products
  const paginatedItems = filteredItems
  
  // For server-side pagination, we use the products directly
  const totalItems = paginatedItems.length * currentPage // Rough estimate
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Reset to first page when filters or search change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [appliedCategory, appliedBrand, appliedDateRange, debouncedSearchTerm])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
  }

  const handleAddProduct = () => {
    setEditingItem(null)
    setIsAddModalOpen(true)
  }

  const handleEditProduct = (item: Product) => {
    setEditingItem(item)
    setIsAddModalOpen(true)
  }

  const handleDeleteProduct = (item: Product) => {
    setItemToDelete(item)
    setDeleteModalOpen(true)
  }

  // Create product mutation  
  const createProductMutation = useMutation(
    (productData: any) => {
      const cleanedData: any = {
        title: productData.title,
        brand: productData.brand,
        category: productData.category,
      }
      
      return productsApi.createProduct(cleanedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setIsAddModalOpen(false);
        setMutationError('');
        refetch();
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to create product');
      },
    }
  );

  // Update product mutation
  const updateProductMutation = useMutation(
    (productData: any) => {
      const { uid, _id, ...dataWithoutId } = productData;
      const productUid = uid || _id; // Use uid if available, fallback to _id
      
      const cleanedData: any = {
        title: dataWithoutId.title,
        brand: dataWithoutId.brand,
        category: dataWithoutId.category,
      };
      
      return productsApi.updateProduct(productUid, cleanedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setIsAddModalOpen(false);
        setMutationError('');
        refetch();
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to update product');
      },
    }
  );

  // Delete product mutation
  const deleteProductMutation = useMutation(
    (productUid: string) => productsApi.deleteProduct(productUid),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setMutationError('');
        refetch();
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to delete product');
      },
    }
  );

  const confirmDeleteProduct = async () => {
    if (itemToDelete) {
      setMutationError('');
      const uid = itemToDelete.uid || itemToDelete._id;
      if (uid) {
        deleteProductMutation.mutate(uid);
      }
      setItemToDelete(null);
    }
    setDeleteModalOpen(false);
  }

  const handleSaveProduct = async (productData: any) => {
    setMutationError('');
    const isEdit = !!(productData.uid || productData._id);
    
    if (isEdit) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
  }

  const applyFilters = async () => {
    setIsApplyingFilters(true)
    setAppliedCategory(selectedCategory)
    setAppliedBrand(selectedBrand)
    setAppliedDateRange(selectedDateRange)
    setCurrentPage(1)
    
    setTimeout(() => {
      setIsApplyingFilters(false)
      setShowFilterPanel(false)
      refetch()
    }, 100)
  }

  const clearFilters = async () => {
    setIsClearingFilters(true)
    setSelectedCategory('')
    setSelectedBrand('')
    setSelectedDateRange({ start: '', end: '' })
    setAppliedCategory('')
    setAppliedBrand('')
    setAppliedDateRange({ start: '', end: '' })
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
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      value: selectedCategory,
      options: CATEGORY_OPTIONS.map(cat => ({ label: cat, value: cat })),
      placeholder: 'All Categories'
    },
    {
      key: 'brand',
      label: 'Brand',
      type: 'select' as const,
      value: selectedBrand,
      options: BRAND_OPTIONS.map(brand => ({ label: brand, value: brand })),
      placeholder: 'All Brands'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange' as const,
      value: selectedDateRange,
      placeholder: 'Select date range'
    }
  ]

  const handleFilterFieldChange = (key: string, value: string | string[] | { start: string; end: string }) => {
    if (key === 'category') {
      setSelectedCategory(value as string)
    } else if (key === 'brand') {
      setSelectedBrand(value as string)
    } else if (key === 'dateRange') {
      setSelectedDateRange(value as { start: string; end: string })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage parent products (name, brand, category)</p>
        </div>
        <Button 
          onClick={handleAddProduct} 
          className="inline-flex items-center"
          disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
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
                placeholder="Search by product title..."
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
              {(appliedCategory || appliedBrand || appliedDateRange.start || appliedDateRange.end) && (
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

      {/* Table Container */}
      <div className="flex flex-col h-[calc(100vh-350px)] min-h-[500px]">
        {/* Table View - Scrollable */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Loading products...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Error loading products.</p>
              </div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="h-full overflow-x-auto">
              <div className="h-full overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((item) => (
                      <tr key={item.uid || item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{capitalizeFirst(item.title)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.brand}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.createdAt || item.created_at || '').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditProduct(item)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                              title="Delete Product"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">
                  {debouncedSearchTerm || appliedCategory
                    ? 'Try adjusting your search or filters'
                    : 'No products available'
                  }
                </p>
                {!debouncedSearchTerm && !appliedCategory && (
                  <Button onClick={handleAddProduct}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Product
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
        title="Filter Products"
        fields={filterFields}
        onFieldChange={handleFilterFieldChange}
        onApply={applyFilters}
        onClear={clearFilters}
        isApplying={isApplyingFilters}
        isClearing={isClearingFilters}
      />

      {/* Add/Edit Modal */}
      <ProductForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        item={editingItem}
        onSave={handleSaveProduct}
        error={mutationError}
        isLoading={createProductMutation.isLoading || updateProductMutation.isLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        itemName={itemToDelete?.title}
        description="Are you sure you want to delete this product? This action cannot be undone and will permanently remove the product from your catalog."
      />
    </div>
  )
}
export default Products