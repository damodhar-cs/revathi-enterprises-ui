import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Search, Filter, Package, Eye, Calendar, TrendingUp, DollarSign, ShoppingCart, Phone, User, RefreshCw, Download, X } from 'lucide-react'
import { Button } from '../components/Button'
import FilterPanel from '../components/FilterPanel'
import { salesApi } from '../services/api'
import { BRANCH_OPTIONS, BRAND_OPTIONS } from '../common/enums'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../common/constants'

// Sale interface - CMS schema only
interface Sale {
  uid: string; // CMS unique identifier
  variant_uid: string;
  product_name?: string;
  title?: string;
  sku?: string;
  category?: string;
  brand?: string;
  branch?: string;
  cost_price?: number;
  selling_price: number;
  profit_margin?: number;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  payment_method?: string;
  receipt_number?: string;
  notes?: string;
  color?: string;
  ram?: number;
  storage?: number;
  created_at: string;
  updated_at: string;
  locale?: string;
  created_by?: string;
  updated_by?: string;
  _version?: number;
  tags?: string[];
  _in_progress?: boolean;
  ACL?: any;
}

const SalesPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter states - selected vs applied
  const [selectedBranch, setSelectedBranch] = useState('')
  const [appliedBranch, setAppliedBranch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [appliedBrand, setAppliedBrand] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' })
  const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' })
  
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [isApplyingFilters, setIsApplyingFilters] = useState(false)
  const [isClearingFilters, setIsClearingFilters] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE)

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch sales from API with applied filters
  const { data: salesResponse, isLoading, error, refetch } = useQuery(
    ['sales', { 
      branch: appliedBranch,
      brand: appliedBrand,
      dateRange: appliedDateRange
    }],
    () => {
      const filters: any = {
        branch: appliedBranch || undefined,
        brand: appliedBrand || undefined,
      };

      // Date range filter in CMS format (as object, not stringified)
      if (appliedDateRange.start && appliedDateRange.end) {
        filters.created_at = {
          $gte: new Date(appliedDateRange.start).toISOString(),
          $lte: new Date(appliedDateRange.end).toISOString()
        };
      }

      return salesApi.getAllSales(filters);
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Error fetching sales:', error)
      }
    }
  )

  // Fetch sales statistics
  const { data: statistics } = useQuery(
    ['sales-statistics', { 
      branch: appliedBranch,
      brand: appliedBrand,
      dateRange: appliedDateRange
    }],
    () => {
      const filters: any = {
        branch: appliedBranch || undefined,
        brand: appliedBrand || undefined,
      };

      // Date range filter for statistics (as object, not stringified)
      if (appliedDateRange.start && appliedDateRange.end) {
        filters.created_at = {
          $gte: new Date(appliedDateRange.start).toISOString(),
          $lte: new Date(appliedDateRange.end).toISOString()
        };
      }

      return salesApi.getSalesStatistics(filters);
    },
    {
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Error fetching sales statistics:', error)
      }
    }
  )

  // Extract sales items and count from response
  const sales = salesResponse?.items || []
  const totalSalesCount = salesResponse?.count || 0

  // Sort sales by date (newest first)
  const sortedSales = [...sales].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });
  
  const filteredItems = sortedSales.filter((sale: Sale) => {
    const searchLower = searchTerm.toLowerCase();
    const title = (sale.title || sale.product_name || '').toLowerCase();
    const sku = (sale.sku || '').toLowerCase();
    const brand = (sale.brand || '').toLowerCase();
    const customerName = (sale.customer?.name || '').toLowerCase();
    const customerPhone = sale.customer?.phone || '';
    
    return title.includes(searchLower) ||
           sku.includes(searchLower) ||
           brand.includes(searchLower) ||
           customerName.includes(searchLower) ||
           customerPhone.includes(searchTerm);
  })

  // Pagination
  const totalItems = filteredItems.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage)
  const paginationOptions = PAGE_SIZE_OPTIONS

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  // Apply filters
  const applyFilters = async () => {
    setIsApplyingFilters(true)
    
    // Small delay for better UX
    setTimeout(() => {
      setAppliedBranch(selectedBranch)
      setAppliedBrand(selectedBrand)
      setAppliedDateRange(selectedDateRange)
      setCurrentPage(1) // Reset to first page when filters change
      setShowFilterPanel(false)
      setIsApplyingFilters(false)
      refetch()
    }, 100)
  }

  // Clear filters
  const clearFilters = async () => {
    setIsClearingFilters(true)
    
    setTimeout(() => {
      setSelectedBranch('')
      setSelectedBrand('')
      setAppliedBranch('')
      setAppliedBrand('')
      setSelectedDateRange({ start: '', end: '' })
      setAppliedDateRange({ start: '', end: '' })
      setCurrentPage(1)
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
      options: BRANCH_OPTIONS.map(branch => ({ label: branch, value: branch })),
      placeholder: 'All Branches'
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
      label: 'Sale Date Range',
      type: 'dateRange' as const,
      value: selectedDateRange,
      placeholder: 'Select date range'
    }
  ]

  const handleFilterFieldChange = (key: string, value: string | string[] | { start: string; end: string }) => {
    if (key === 'branch') {
      setSelectedBranch(value as string)
    } else if (key === 'brand') {
      setSelectedBrand(value as string)
    } else if (key === 'dateRange') {
      setSelectedDateRange(value as { start: string; end: string })
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Handle export
  const handleExport = async () => {
    if (!recipientEmail) {
      setExportMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      setExportMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    setIsExporting(true)
    setExportMessage(null)

    try {
      const exportData: any = {
        recipientEmail,
        branch: appliedBranch || undefined,
        brand: appliedBrand || undefined,
      };

      // Date range filter for export (as object, not stringified)
      if (appliedDateRange.start && appliedDateRange.end) {
        exportData.created_at = {
          $gte: new Date(appliedDateRange.start).toISOString(),
          $lte: new Date(appliedDateRange.end).toISOString()
        };
      }

      await salesApi.exportSales(exportData)
      
      setExportMessage({ 
        type: 'success', 
        text: `Sales export will be sent to ${recipientEmail} shortly!` 
      })
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowExportModal(false)
        setRecipientEmail('')
        setExportMessage(null)
      }, 2000)
    } catch (error: any) {
      console.error('Export error:', error)
      setExportMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to export sales data. Please try again.' 
      })
    } finally {
      setIsExporting(false)
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
          {paginationOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Center: Results info */}
      <div className="text-sm text-gray-600">
        {totalItems > 0 ? `${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems} records` : '0 to 0 of 0 records'}
      </div>

      {/* Right: Pagination controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || totalPages === 0}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || totalPages === 0}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          Previous
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
          Next
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Last page"
        >
          Last
        </button>
      </div>
    </div>
  )


  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
              <p className="text-sm text-gray-500">Track and manage all sales transactions</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Sales</p>
                  <p className="text-2xl font-bold text-blue-900">{totalSalesCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mr-3">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(statistics.totalRevenue)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Profit</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(statistics.totalProfit)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sales..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {/* Export Button */}
              <Button
                variant="primary"
                onClick={() => setShowExportModal(true)}
                disabled={isLoading || totalSalesCount === 0}
                className="inline-flex items-center"
                title="Export sales data to Excel"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              {/* Refresh Button */}
              <Button
                variant="secondary"
                onClick={() => refetch()}
                disabled={isLoading}
                className="inline-flex items-center"
                title="Refresh data from server"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              {/* Filter Toggle */}
              <Button
                variant="secondary"
                onClick={() => setShowFilterPanel(true)}
                className="inline-flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {(appliedBranch || appliedBrand || appliedDateRange.start || appliedDateRange.end) && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full">
                    Active
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container with Fixed Layout */}
      <div className="flex flex-col h-[calc(100vh-350px)] min-h-[500px] p-6">
        {/* Table View - Scrollable */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Loading sales...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading sales</h3>
                <p className="text-gray-500 mb-4">Please try again later.</p>
                <Button onClick={() => refetch()} variant="primary">
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || appliedBranch || appliedBrand || appliedDateRange.start || appliedDateRange.end
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "No sales have been recorded yet."}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-x-auto">
              <div className="h-full overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((sale: Sale) => (
                      <tr key={sale.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {sale.title || sale.product_name || `Sale #${sale.uid.slice(-8)}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {sale.sku ? `${sale.sku} • ` : ''}{sale.brand || sale.variant_uid}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-3">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{sale.customer.name}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {sale.customer.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(sale.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(sale.selling_price)}</div>
                          <div className="text-xs text-gray-500">Cost: {formatCurrency(sale.cost_price)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {sale.payment_method || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/sales/${sale.uid}`)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                              title="View Sale Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        title="Filter Sales"
        fields={filterFields}
        onFieldChange={handleFilterFieldChange}
        onApply={applyFilters}
        onClear={clearFilters}
        isApplying={isApplyingFilters}
        isClearing={isClearingFilters}
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
              onClick={() => !isExporting && setShowExportModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-3">
                      <Download className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Export Sales Data</h3>
                      <p className="text-sm text-gray-500">Send sales report to your email</p>
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

                {/* Export details */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Export Details:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Total Records: {totalSalesCount}</li>
                    {appliedBranch && <li>• Branch: {appliedBranch}</li>}
                    {appliedBrand && <li>• Brand: {appliedBrand}</li>}
                    {appliedDateRange.start && <li>• Start Date: {new Date(appliedDateRange.start).toLocaleDateString('en-IN')}</li>}
                    {appliedDateRange.end && <li>• End Date: {new Date(appliedDateRange.end).toLocaleDateString('en-IN')}</li>}
                    {!appliedBranch && !appliedBrand && !appliedDateRange.start && !appliedDateRange.end && <li>• No filters applied (All sales data)</li>}
                  </ul>
                </div>

                {/* Email input */}
                <div className="mb-4">
                  <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    id="recipientEmail"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    disabled={isExporting}
                  />
                </div>

                {/* Success/Error message */}
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
                  disabled={isExporting || !recipientEmail}
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
                      Export & Send
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowExportModal(false)}
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

export default SalesPage
