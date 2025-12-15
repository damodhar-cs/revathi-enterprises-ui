import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowLeft, Package, User, Phone, Mail, MapPin, Calendar, CreditCard, FileText, IndianRupee, Tag, Smartphone, Printer, Send } from 'lucide-react'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { salesApi, receiptApi } from '../services/api'

const SaleDetailPage: React.FC = () => {
  const { saleId } = useParams<{ saleId: string }>()
  const navigate = useNavigate()
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch sale details
  const { data: sale, isLoading, error } = useQuery(
    ['sale', saleId],
    () => salesApi.getSale(saleId!),
    {
      enabled: !!saleId,
      onError: () => {
        console.error('Failed to load sale details')
      }
    }
  )

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const handleDownloadReceipt = async () => {
    if (!saleId) return
    
    setIsDownloading(true)
    try {
      const blob = await receiptApi.downloadReceipt(saleId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Receipt_${saleId.slice(-8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error downloading receipt:', error)
      alert(error.response?.data?.message || 'Failed to download receipt. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleEmailReceipt = async () => {
    if (!saleId || !recipientEmail) {
      setEmailMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      setEmailMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    setIsEmailing(true)
    setEmailMessage(null)

    try {
      await receiptApi.emailReceipt(saleId, recipientEmail)
      setEmailMessage({ 
        type: 'success', 
        text: `Receipt sent successfully to ${recipientEmail}!` 
      })
      setTimeout(() => {
        setShowEmailModal(false)
        setRecipientEmail('')
        setEmailMessage(null)
      }, 2000)
    } catch (error: any) {
      console.error('Error emailing receipt:', error)
      setEmailMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send receipt. Please try again.' 
      })
    } finally {
      setIsEmailing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sale not found</h3>
            <p className="mt-1 text-sm text-gray-500">The sale you're looking for doesn't exist.</p>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/sales')}
                variant="secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sticky Header */}
        <div className="sticky top-16 z-30 bg-gray-50 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/sales')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sales
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sale Details</h1>
                <p className="text-sm text-gray-500">Receipt: {sale.receiptNumber}</p>
              </div>
            </div>
            
            {/* Receipt Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                className="inline-flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Print Receipt'}
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowEmailModal(true)}
                className="inline-flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Email Receipt
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  📱 Product Details
                </h3>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Product Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{(sale as any).title || (sale as any).product_name || 'N/A'}</dd>
                  </div>
                  {(sale as any).imei && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">SKU</dt>
                      <dd className="mt-1 text-sm text-gray-900">{(sale as any).imei}</dd>
                    </div>
                  )}
                  {(sale as any).category && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Category</dt>
                      <dd className="mt-1 text-sm text-gray-900">{(sale as any).category}</dd>
                    </div>
                  )}
                  {(sale as any).brand && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Brand</dt>
                      <dd className="mt-1 text-sm text-gray-900">{(sale as any).brand}</dd>
                    </div>
                  )}
                  {(sale as any).branch && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Branch</dt>
                      <dd className="mt-1 text-sm text-gray-900">{(sale as any).branch}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Product Specifications */}
            {(sale.color || sale.ram || sale.storage) && (
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    ⚙️ Specifications
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sale.color && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Color</dt>
                        <dd className="mt-1 text-sm text-gray-900">{sale.color}</dd>
                      </div>
                    )}
                    {sale.ram && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">RAM</dt>
                        <dd className="mt-1 text-sm text-gray-900">{sale.ram} GB</dd>
                      </div>
                    )}
                    {sale.storage && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Storage</dt>
                        <dd className="mt-1 text-sm text-gray-900">{sale.storage} GB</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Customer Information */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  👤 Customer Information
                </h3>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{sale.customer.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      Phone
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{sale.customer.phone}</dd>
                  </div>
                  {sale.customer.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{sale.customer.email}</dd>
                    </div>
                  )}
                  {sale.customer.address && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Address
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {sale.customer.address}
                        {sale.customer.city && `, ${sale.customer.city}`}
                        {sale.customer.state && `, ${sale.customer.state}`}
                        {sale.customer.pincode && ` - ${sale.customer.pincode}`}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 flex items-center">
                  <IndianRupee className="w-5 h-5 mr-2" />
                  💰 Pricing
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cost Price</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency((sale as any).cost_price)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Selling Price</dt>
                  <dd className="mt-1 text-2xl font-bold text-green-600">{formatCurrency((sale as any).selling_price)}</dd>
                </div>
                <div className="border-t pt-3">
                  <dt className="text-sm font-medium text-gray-500">Profit/Loss</dt>
                  <dd className={`mt-1 text-xl font-bold ${((sale as any).profit_margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {((sale as any).profit_margin || 0) >= 0 ? '+' : ''}{formatCurrency((sale as any).profit_margin)}
                  </dd>
                  {(sale as any).cost_price && (
                    <div className="text-xs text-gray-500 mt-1">
                      Margin: {((((sale as any).profit_margin || 0) / (sale as any).cost_price) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  💳 Payment Details
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {(sale as any).payment_method && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                    <dd className="mt-1">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {(sale as any).payment_method}
                      </span>
                    </dd>
                  </div>
                )}
                {(sale as any).receipt_number && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Receipt Number</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900">{(sale as any).receipt_number}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Sale Timeline */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  📅 Timeline
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sale Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate((sale as any).created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate((sale as any).updated_at)}</dd>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {sale.notes && (
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-pink-800 bg-pink-50 border border-pink-200 rounded-lg px-4 py-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    📝 Notes
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-900">{sale.notes}</p>
                </div>
              </div>
            )}

            {/* Sale ID */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  🏷️ Identifiers
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sale ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{(sale as any).uid}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Variant ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{(sale as any).variant_uid}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Receipt Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false)
          setRecipientEmail('')
          setEmailMessage(null)
        }}
        title="Email Receipt"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Send a PDF receipt to customer's email address
            </p>
            
            <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email Address
            </label>
            <input
              id="recipient-email"
              type="email"
              placeholder="customer@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={isEmailing}
            />
          </div>

          {emailMessage && (
            <div className={`p-3 rounded-md ${
              emailMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="text-sm">{emailMessage.text}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEmailModal(false)
                setRecipientEmail('')
                setEmailMessage(null)
              }}
              disabled={isEmailing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEmailReceipt}
              disabled={isEmailing || !recipientEmail}
              className="inline-flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {isEmailing ? 'Sending...' : 'Send Receipt'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SaleDetailPage
