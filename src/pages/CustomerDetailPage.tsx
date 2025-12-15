import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeft, 
  Phone, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Package,
  Eye
} from 'lucide-react'
import { Button } from '../components/Button'
import { customersApi } from '../services/api'

interface CustomerDetail {
  name: string
  phone: string
  totalPurchases: number
  totalSpent: number
  totalProfit: number
  averageOrderValue: number
  lastPurchaseDate: string
  firstPurchaseDate: string
}

interface Sale {
  _id: string
  productName: string
  imei: string
  brand: string
  category: string
  sellingPrice: number
  costPrice: number
  createdAt: string
  branch: string
}

const CustomerDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { phone } = useParams<{ phone: string }>()

  const { data: customer, isLoading: customerLoading, error: customerError } = useQuery<CustomerDetail>(
    ['customer', phone],
    () => customersApi.getCustomerByPhone(phone!),
    {
      enabled: !!phone,
    }
  )

  const { data: salesData, isLoading: salesLoading } = useQuery(
    ['customer-sales', phone],
    () => customersApi.getCustomerSales(phone!),
    {
      enabled: !!phone,
    }
  )

  const sales: Sale[] = salesData?.data || []

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCustomerBadge = () => {
    if (!customer) return null
    if (customer.totalPurchases >= 10) {
      return <span className="px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-full">VIP Customer</span>
    }
    if (customer.totalPurchases >= 5) {
      return <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">Regular Customer</span>
    }
    return <span className="px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-800 rounded-full">New Customer</span>
  }

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-pulse" />
          <p className="text-gray-500">Loading customer details...</p>
        </div>
      </div>
    )
  }

  if (customerError || !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
          <p className="text-gray-500 mb-4">The customer you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/customers')} variant="primary">
            Back to Customers
          </Button>
        </div>
      </div>
    )
  }

  const daysSinceFirst = Math.ceil(
    (new Date().getTime() - new Date(customer.firstPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/customers')}
          className="inline-flex items-center self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{customer.name}</h1>
            {getCustomerBadge()}
          </div>
          <p className="text-sm md:text-base text-gray-600 flex items-center mt-2">
            <Phone className="w-4 h-4 mr-2" />
            {customer.phone}
          </p>
        </div>
      </div>

      {/* Stats Cards - Mobile First Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Total Spent</p>
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{formatCurrency(customer.totalSpent)}</p>
          <p className="text-xs md:text-sm text-gray-500">Lifetime value</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Total Purchases</p>
            <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{customer.totalPurchases}</p>
          <p className="text-xs md:text-sm text-gray-500">Orders completed</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Avg Order Value</p>
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{formatCurrency(customer.averageOrderValue)}</p>
          <p className="text-xs md:text-sm text-gray-500">Per transaction</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">Customer Since</p>
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{daysSinceFirst} days</p>
          <p className="text-xs md:text-sm text-gray-500">{formatDate(customer.firstPurchaseDate)}</p>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Purchase History</h2>
          <p className="text-sm text-gray-600 mt-1">{sales.length} {sales.length === 1 ? 'purchase' : 'purchases'}</p>
        </div>

        {salesLoading ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-400 mb-3 animate-pulse" />
            <p className="text-gray-500">Loading purchase history...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-500">No purchase history found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{sale.productName}</div>
                          <div className="text-sm text-gray-500">{sale.brand} • {sale.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.imei}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(sale.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(sale.sellingPrice - sale.costPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {sale.branch}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/sales/${sale._id}`)}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {sales.map((sale) => (
                <div key={sale._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{sale.productName}</p>
                      <p className="text-xs text-gray-500 mt-1">{sale.brand} • {sale.category}</p>
                      <p className="text-xs text-gray-500 mt-1">SKU: {sale.imei}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded flex-shrink-0">
                      {sale.branch}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Price</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(sale.sellingPrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Profit</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(sale.sellingPrice - sale.costPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{formatDate(sale.createdAt)}</p>
                    <button
                      onClick={() => navigate(`/sales/${sale._id}`)}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium inline-flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CustomerDetailPage

