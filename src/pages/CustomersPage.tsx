import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Search, Users as UsersIcon, Phone, ShoppingCart, DollarSign, RefreshCw, Eye } from 'lucide-react'
import { Button } from '../components/Button'
import { customersApi } from '../services/api'

interface Customer {
  name: string
  phone: string
  totalPurchases: number
  totalSpent: number
  averageOrderValue: number
  lastPurchaseDate: string
  firstPurchaseDate: string
}

const CustomersPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: customersData, isLoading, error, refetch, isFetching } = useQuery(
    ['customers', debouncedSearchTerm],
    () => customersApi.getAllCustomers(debouncedSearchTerm || undefined),
    {
      keepPreviousData: true,
      staleTime: 30 * 1000,
    }
  )

  const customers: Customer[] = customersData?.data || []
  const totalCustomers = customersData?.total || 0

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysSinceLastPurchase = (dateString: string): number => {
    const lastPurchase = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastPurchase.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getCustomerBadge = (customer: Customer) => {
    if (customer.totalPurchases >= 10) {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">VIP</span>
    }
    if (customer.totalPurchases >= 5) {
      return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">Regular</span>
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">New</span>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {totalCustomers} {totalCustomers === 1 ? 'customer' : 'customers'} found
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-pulse" />
              <p className="text-gray-500">Loading customers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading customers</h3>
              <p className="text-gray-500 mb-4">Please try again later.</p>
              <Button onClick={() => refetch()} variant="primary">
                Try Again
              </Button>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "Try adjusting your search to find what you're looking for."
                  : 'No customer purchases recorded yet.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchases
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Purchase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => {
                    const daysSince = getDaysSinceLastPurchase(customer.lastPurchaseDate)
                    return (
                      <tr
                        key={customer.phone}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/customers/${customer.phone}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                              <UsersIcon className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                {getCustomerBadge(customer)}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {customer.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <ShoppingCart className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.totalPurchases}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm font-semibold text-green-600">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {formatCurrency(customer.totalSpent)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(customer.averageOrderValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(customer.lastPurchaseDate)}</div>
                          <div className="text-xs text-gray-500">{daysSince} days ago</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/customers/${customer.phone}`)
                            }}
                            className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {customers.map((customer) => {
                const daysSince = getDaysSinceLastPurchase(customer.lastPurchaseDate)
                return (
                  <div
                    key={customer.phone}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.phone}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1 min-w-0 mr-2">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          <UsersIcon className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                            {getCustomerBadge(customer)}
                          </div>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Total Spent</p>
                        <p className="font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Purchases</p>
                        <p className="font-semibold text-gray-900">{customer.totalPurchases}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Avg Order</p>
                        <p className="font-medium text-gray-900">{formatCurrency(customer.averageOrderValue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Last Purchase</p>
                        <p className="font-medium text-gray-900 text-xs">{formatDate(customer.lastPurchaseDate)}</p>
                        <p className="text-xs text-gray-500">{daysSince} days ago</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/customers/${customer.phone}`)
                      }}
                      className="mt-3 w-full text-center py-2 text-sm text-primary-600 hover:text-primary-900 font-medium border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CustomersPage

