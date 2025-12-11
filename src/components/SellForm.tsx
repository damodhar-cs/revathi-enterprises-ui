import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'
import { Variant } from '../types/index'
import { ShoppingCart, DollarSign, User, Phone, Mail, MapPin } from 'lucide-react'

interface SellFormProps {
  isOpen: boolean
  onClose: () => void
  onSell: (saleData: any) => void
  variant?: Variant | null
  error?: string
  isLoading?: boolean
}

// Zod schema for validation
const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .length(10, 'Phone number must be exactly 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
    .length(6, 'Pincode must be exactly 6 digits')
    .optional().or(z.literal('')),
})

// Schema uses internal form field names
const SellSchema = z.object({
  sellingPrice: z.number().min(1, 'Selling price must be at least ₹1'),
  customer: customerSchema,
  paymentMethod: z.string().min(1, 'Payment method is required'),
  color: z.string().optional(),
  notes: z.string().optional(),
})

export const SellForm: React.FC<SellFormProps> = ({
  isOpen,
  onClose,
  onSell,
  variant,
  error,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<z.infer<typeof SellSchema>>({
    resolver: zodResolver(SellSchema),
    defaultValues: {
      sellingPrice: variant?.cost_price || 0,
      customer: {
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      },
      paymentMethod: '',
      color: variant?.attributes?.color || '',
      notes: '',
    },
  })

  // Watch selling price to calculate profit
  const sellingPrice = watch('sellingPrice')
  const profitMargin = variant ? sellingPrice - variant.cost_price : 0
  const profitPercentage = variant && variant.cost_price > 0 ? (profitMargin / variant.cost_price) * 100 : 0

  // Match backend PAYMENT_METHOD_ENUM
  const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Credit Card']

  const onSubmit = (data: z.infer<typeof SellSchema>) => {
    if (!variant) return
    
    // Transform to backend format (snake_case)
    const saleData = {
      variant_uid: variant.uid || variant._id || '',
      selling_price: data.sellingPrice,
      customer: {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || undefined,
        address: data.customer.address || undefined,
        city: data.customer.city || undefined,
        state: data.customer.state || undefined,
        pincode: data.customer.pincode || undefined,
      },
      payment_method: data.paymentMethod,
      color: data.color || undefined,
      notes: data.notes || undefined,
    }

    onSell(saleData)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!variant) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" title="">
      <div className="w-full max-w-xl mx-auto max-h-[80vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6 pt-4 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mr-3">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sell Product</h2>
              <p className="text-sm text-gray-500">{variant.product_name} - {variant.sku}</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Product Info & Pricing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-semibold text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              💰 Pricing Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price
                </label>
                <div className="text-lg font-semibold text-gray-900">₹{variant.cost_price.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('sellingPrice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter selling price"
                  className="font-semibold"
                />
                {errors.sellingPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.sellingPrice.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profit/Loss
                </label>
                <div className={`text-lg font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin >= 0 ? '+' : ''}₹{profitMargin.toLocaleString('en-IN')}
                  <span className="text-sm ml-2">
                    ({profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              👤 Customer Information
            </h3>
            <div className="space-y-4">
              {/* Name and Phone in one row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('customer.name')}
                    placeholder="Enter customer name"
                    className="h-12 px-4 text-base"
                  />
                  {errors.customer?.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      {...register('customer.phone')}
                      type="tel"
                      maxLength={10}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Enter 10-digit phone number"
                      className="pl-10 h-12 px-4 text-base"
                    />
                  </div>
                  {errors.customer?.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Email in full width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    {...register('customer.email')}
                    type="email"
                    placeholder="Enter email (optional)"
                    className="pl-10 h-12 px-4 text-base"
                  />
                </div>
                {errors.customer?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer.email.message}</p>
                )}
              </div>

              {/* Address in full width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    {...register('customer.address')}
                    rows={3}
                    placeholder="Enter full address (optional)"
                    className="w-full pl-10 px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>
              </div>

              {/* City and State in one row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <Input
                    {...register('customer.city')}
                    placeholder="Enter city (optional)"
                    className="h-12 px-4 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <Input
                    {...register('customer.state')}
                    placeholder="Enter state (optional)"
                    className="h-12 px-4 text-base"
                  />
                </div>
              </div>

              {/* Pincode in separate row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <Input
                    {...register('customer.pincode')}
                    type="tel"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Enter 6-digit pincode (optional)"
                    className="h-12 px-4 text-base"
                  />
                  {errors.customer?.pincode && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer.pincode.message}</p>
                  )}
                </div>
                <div>
                  {/* Empty div for alignment */}
                </div>
              </div>
            </div>
          </div>

          {/* Sale Details */}
          <div>
            <h3 className="text-base font-semibold text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              🛒 Sale Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('paymentMethod')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                {errors.paymentMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color (from variant)</label>
                <Input
                  {...register('color')}
                  placeholder="Color (optional)"
                  defaultValue={variant?.attributes?.color || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Enter any additional notes (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
            </div>
          </div>

          </div>

          {/* Fixed Footer with Action Buttons */}
          <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                className="px-4 py-2"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="px-4 py-2"
                disabled={isLoading}
              >
                {isLoading ? 'Processing Sale...' : 'Complete Sale'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default SellForm
