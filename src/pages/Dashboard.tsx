import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  TrendingUp,
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertCircle,
  Users,
  Plus,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '../components/Button'
import { dashboardApi } from '../services/api'

interface DashboardStats {
  todaySales: SalesSummary
  weekSales: SalesSummary
  monthSales: SalesSummary
  previousWeekSales: SalesSummary
  previousMonthSales: SalesSummary
  inventory: InventoryStatus
  topProducts: TopProduct[]
  recentSales: RecentSale[]
  branchPerformance: BranchPerformance[]
}

interface SalesSummary {
  revenue: number
  profit: number
  transactionCount: number
  averageOrderValue: number
}

interface InventoryStatus {
  totalItems: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
}

interface TopProduct {
  product_name: string
  brand: string
  category: string
  salesCount: number
  revenue: number
  profit: number
}

interface RecentSale {
  _id: string
  product_name: string
  imei: string
  brand: string
  customer: {
    name: string
    phone: string
  }
  selling_price: number
  profit: number
  createdAt: string
  branch: string
}

interface BranchPerformance {
  branch: string
  revenue: number
  profit: number
  transactionCount: number
  averageOrderValue: number
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const { data: stats, isLoading, error, refetch, isFetching } = useQuery<DashboardStats>(
    'dashboard-stats',
    () => dashboardApi.getStats(),
    {
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '₹0'
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const PercentageIndicator: React.FC<{ value: number }> = ({ value }) => {
    const isPositive = value >= 0
    return (
      <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
        {Math.abs(value).toFixed(1)}%
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-pulse" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading dashboard</h3>
          <p className="text-gray-500 mb-4">Please try again later.</p>
          <Button onClick={() => refetch()} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const weekChange = calculatePercentageChange(stats.weekSales.revenue, stats.previousWeekSales.revenue)
  const monthChange = calculatePercentageChange(stats.monthSales.revenue, stats.previousMonthSales.revenue)

  // Prepare chart data
  const salesTrendData = [
    {
      period: 'Prev Week',
      revenue: stats.previousWeekSales.revenue,
      profit: stats.previousWeekSales.profit,
    },
    {
      period: 'This Week',
      revenue: stats.weekSales.revenue,
      profit: stats.weekSales.profit,
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Welcome back! Here's your business overview</p>
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

      {/* Quick Stats Cards - Mobile First Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 text-sm font-medium">Today's Sales</p>
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-blue-200" />
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-1">{formatCurrency(stats.todaySales.revenue)}</p>
          <p className="text-blue-100 text-xs md:text-sm">
            {stats.todaySales.transactionCount} transactions • Profit: {formatCurrency(stats.todaySales.profit)}
          </p>
        </div>

        {/* Week's Sales */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">This Week</p>
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{formatCurrency(stats.weekSales.revenue)}</p>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs md:text-sm">{stats.weekSales.transactionCount} sales</p>
            <PercentageIndicator value={weekChange} />
          </div>
        </div>

        {/* Month's Sales */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">This Month</p>
            <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{formatCurrency(stats.monthSales.revenue)}</p>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs md:text-sm">{stats.monthSales.transactionCount} sales</p>
            <PercentageIndicator value={monthChange} />
          </div>
        </div>

        {/* Inventory Status */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-100 text-sm font-medium">Inventory</p>
            <Package className="w-6 h-6 md:w-8 md:h-8 text-orange-200" />
          </div>
          <p className="text-2xl md:text-3xl font-bold mb-1">{stats.inventory.totalItems}</p>
          <div className="flex items-center gap-3 text-xs md:text-sm text-orange-100">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
              {stats.inventory.inStock}
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
              {stats.inventory.lowStock}
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
              {stats.inventory.outOfStock}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/variants/new')}
            className="flex flex-col items-center justify-center h-20 md:h-24 text-xs md:text-sm"
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            Add Variant
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/variants')}
            className="flex flex-col items-center justify-center h-20 md:h-24 text-xs md:text-sm"
          >
            <Package className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            View Inventory
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/sales')}
            className="flex flex-col items-center justify-center h-20 md:h-24 text-xs md:text-sm"
          >
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            View Sales
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/customers')}
            className="flex flex-col items-center justify-center h-20 md:h-24 text-xs md:text-sm"
          >
            <Users className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            Customers
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/products')}
            className="flex flex-col items-center justify-center h-20 md:h-24 text-xs md:text-sm"
          >
            <Package className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            Products
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/variants?stockStatus=lowStock')}
            className="flex flex-col items-center justify-center h-20 md:h-24 text-xs md:text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
          >
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 mb-1" />
            Low Stock
          </Button>
        </div>
      </div>

      {/* Charts Section - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
              <Bar dataKey="profit" fill="#10b981" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Performance */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Branch Performance</h2>
          <div className="space-y-3">
            {stats.branchPerformance.map((branch) => (
              <div key={branch.branch} className="border border-gray-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm md:text-base">{branch.branch}</h3>
                  <span className="text-xs md:text-sm text-gray-500">{branch.transactionCount} sales</span>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                  <div>
                    <p className="text-gray-600">Revenue</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(branch.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit</p>
                    <p className="font-semibold text-green-600">{formatCurrency(branch.profit)}</p>
                  </div>
                </div>
              </div>
            ))}
            {stats.branchPerformance.length === 0 && (
              <p className="text-center text-gray-500 py-4 text-sm">No branch data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products & Recent Sales - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs md:text-sm font-medium text-gray-600 pb-2">Product</th>
                  <th className="text-right text-xs md:text-sm font-medium text-gray-600 pb-2">Sales</th>
                  <th className="text-right text-xs md:text-sm font-medium text-gray-600 pb-2 hidden sm:table-cell">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product) => (
                  <tr key={`${product.product_name}-${product.brand}`} className="border-b border-gray-100 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 md:mr-3 text-xs md:text-sm font-semibold text-blue-600">
                          {stats.topProducts.indexOf(product) + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
                          <p className="text-xs text-gray-500">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3">
                      <span className="text-xs md:text-sm font-semibold text-gray-900">{product.salesCount}</span>
                    </td>
                    <td className="text-right py-3 hidden sm:table-cell">
                      <span className="text-xs md:text-sm text-gray-600">{formatCurrency(product.revenue)}</span>
                    </td>
                  </tr>
                ))}
                {stats.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500 text-sm">
                      No sales data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Recent Sales</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/sales')}
              className="text-xs md:text-sm"
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {stats.recentSales.slice(0, 5).map((sale) => (
              <div
                key={sale._id}
                className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate(`/sales/${sale._id}`)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{sale.product_name}</p>
                    <p className="text-xs text-gray-500">{sale.customer?.name || 'N/A'} • {sale.customer?.phone || 'N/A'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs md:text-sm font-semibold text-gray-900">{formatCurrency(sale.selling_price)}</p>
                    <p className="text-xs text-green-600">+{formatCurrency(sale.profit)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(sale.createdAt)}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{sale.branch}</span>
                </div>
              </div>
            ))}
            {stats.recentSales.length === 0 && (
              <p className="text-center text-gray-500 py-4 text-sm">No recent sales</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
