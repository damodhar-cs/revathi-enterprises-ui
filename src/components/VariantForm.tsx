import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from 'react-query'
import { Button } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'
import { Variant } from '../types/index'
import { productsApi } from '../services/api'
import { BRANCH_OPTIONS, COLOR_OPTIONS } from '../common/enums'
import { Info, MapPin, Tag, IndianRupee, HardDrive, Lock } from 'lucide-react'

interface VariantFormProps {
  isOpen: boolean
  onClose: () => void
  item?: Variant | null
  onSave: (item: Variant) => void
  error?: string
  isLoading?: boolean
}

const attributesSchema = z.object({
  color: z.string().optional(),
  ram: z.number().min(1, 'RAM must be at least 1GB').optional().or(z.nan().transform(() => undefined)),
  storage: z.number().min(1, 'Storage must be at least 1GB').optional().or(z.nan().transform(() => undefined)),
  os: z.string().optional(),
  processor: z.string().optional(),
})

// Match backend CreateVariantInputDto structure
const VariantSchema = z.object({
  product_uid: z.string().min(1, 'Product selection is required'),
  product_name: z.string().optional(),
  title: z.string().optional().transform(val => val === '' ? undefined : val), // CMS title (optional, backend generates if not provided)
  description: z.string().optional().transform(val => val === '' ? undefined : val),
  imei: z.string().optional().transform(val => val === '' ? undefined : val), // Optional IMEI/Variant Code
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  branch: z.string().min(1, 'Branch is required'),
  supplier: z.string().optional(),
  cost_price: z.number().min(1, 'Cost price must be at least 1'),
  warranty: z.number().min(1, 'Warranty must be at least 1').optional().or(z.nan().transform(() => undefined)),
  notes: z.string().optional(),
  attributes: attributesSchema.optional(),
})

export const VariantForm: React.FC<VariantFormProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  error,
  isLoading,
}) => {
  const isEdit = !!item
  
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  // Debounce product search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearchTerm)
    }, 300) // 300ms debounce
    
    return () => clearTimeout(timer)
  }, [productSearchTerm])

  // Fetch products based on search
  const { data: products = [], isLoading: isLoadingProducts } = useQuery(
    ['products-for-variants', debouncedProductSearch],
    () => productsApi.getAllProducts({
      search: debouncedProductSearch || undefined,
      limit: 50, // Limit results for dropdown
    }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: showProductDropdown || debouncedProductSearch.length > 0, // Only fetch when needed
    }
  )
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(VariantSchema),
    defaultValues: {
      product_uid: item?.product_uid || '',
      product_name: item?.product_name || '',
      title: item?.title || '',
      description: item?.description || '',
      imei: item?.imei || '',
      category: item?.category || '',
      brand: item?.brand || '',
      branch: item?.branch || 'Mahadevapura',
      supplier: item?.supplier || '',
      cost_price: item?.cost_price || undefined,
      warranty: item?.warranty || undefined,
      notes: item?.notes || '',
      attributes: {
        color: item?.attributes?.color || '',
        ram: item?.attributes?.ram || undefined,
        storage: item?.attributes?.storage || undefined,
        os: item?.attributes?.os || '',
        processor: item?.attributes?.processor || '',
      },
    },
  })

  const selectedProductUid = watch('product_uid')
  
  // Initialize form with item data when editing
  useEffect(() => {
    if (item && isEdit) {
      // Reset form with item data
      reset({
        product_uid: item.product_uid,
        product_name: item.product_name || undefined,
        title: item.title || '',
        description: item.description,
        imei: item.imei,
        category: item.category,
        brand: item.brand,
        branch: item.branch,
        supplier: item.supplier,
        cost_price: item.cost_price,
        warranty: item.warranty,
        notes: item.notes,
        attributes: item.attributes
      })
      
      // Set the search term to show the selected product
      if (item.product_name) {
        const displayText = `${item.product_name} (${item.brand} - ${item.category})`
        setProductSearchTerm(displayText)
      }
    } else if (!item) {
      // Reset form for new item with clean defaults
      reset({
        product_uid: '',
        product_name: '',
        title: '',
        description: '',
        imei: '',
        category: '',
        brand: '',
        branch: '',
        supplier: '',
        cost_price: undefined,
        warranty: undefined,
        notes: '',
        attributes: {
          color: '',
          ram: undefined,
          storage: undefined,
          os: '',
          processor: '',
        }
      })
      setProductSearchTerm('')
    }
  }, [item, isEdit, reset])

  // Update category, brand when product is selected (only for new variants)
  React.useEffect(() => {
    if (selectedProductUid && !isEdit) {
      const selectedProduct = products.find(p => (p.uid || p._id) === selectedProductUid)
      if (selectedProduct) {
        setValue('product_name', selectedProduct.title)
        setValue('category', selectedProduct.category)
        setValue('brand', selectedProduct.brand)
        // Only set product-level defaults, not variant-specific attributes
        // Don't prefill OS, processor, or any other variant-specific details
      }
    }
  }, [selectedProductUid, products, setValue, isEdit])



  const branches = BRANCH_OPTIONS
  const colors = COLOR_OPTIONS
  const operatingSystems = ['iOS', 'Android 15', 'Android 14', 'Android 13', 'Windows', 'Other']

  const onSubmit = (data: any) => {
    const productData: Variant = {
      ...data,
      _id: item?._id || '',
    }
    onSave(productData)
  }

  const handleClose = () => {
    reset()
    setProductSearchTerm('')
    setShowProductDropdown(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[80vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className={`text-xl font-bold ${
            isEdit 
              ? 'text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 inline-block' 
              : 'text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block'
          }`}>
            {isEdit ? '✏️ Edit Variant' : '➕ Add New Variant'}
          </h2>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            📋 Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={isEdit ? (item?.product_name ? `${item.product_name} (${item.brand} - ${item.category})` : (item?.title || '')) : productSearchTerm}
                    onChange={(e) => {
                      if (!isEdit) {
                        setProductSearchTerm(e.target.value)
                        setShowProductDropdown(true)
                      }
                    }}
                    onFocus={() => {
                      if (!isEdit) {
                        setShowProductDropdown(true)
                      }
                    }}
                    placeholder={isEdit ? "" : "Search for a product..."}
                    disabled={isEdit}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                      isEdit
                        ? 'border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed pr-9'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                    }`}
                  />
                  {isEdit && (
                    <div
                      className="absolute right-2 top-1/2 -translate-y-1/2 group cursor-default"
                      title="Product cannot be changed when editing"
                    >
                      <Lock className="w-4 h-4 text-gray-400" />
                      <div className="absolute right-0 top-full mt-1 w-52 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-normal">
                        Product cannot be changed when editing
                      </div>
                    </div>
                  )}
                </div>
                {isLoadingProducts && (
                  <div className="absolute right-3 top-3">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
                  </div>
                )}
                
                {/* Dropdown */}
                {showProductDropdown && !isEdit && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {products.length > 0 ? (
                      products.map((product) => (
                        <button
                          key={product.uid || product._id}
                          type="button"
                          onClick={() => {
                            setValue('product_uid', product.uid || product._id || '')
                            setValue('product_name', product.title)
                            setValue('category', product.category)
                            setValue('brand', product.brand)
                            // Don't prefill any variant-specific attributes
                            // User should enter their own values for OS, processor, etc.
                            setProductSearchTerm(`${product.title} (${product.brand} - ${product.category})`)
                            setShowProductDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                        >
                          <div className="font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-500">{product.brand} - {product.category}</div>
                        </button>
                      ))
                    ) : debouncedProductSearch.length > 0 ? (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        No products found for "{debouncedProductSearch}"
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        Start typing to search products...
                      </div>
                    )}
                  </div>
                )}
                
                {/* Close dropdown when clicking outside */}
                {showProductDropdown && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowProductDropdown(false)}
                  />
                )}
              </div>
              
              {/* Hidden inputs for form */}
              <input {...register('product_uid')} type="hidden" />
              <input {...register('product_name')} type="hidden" />
              
              {errors.product_uid && (
                <p className="mt-1 text-sm text-red-600">{errors.product_uid.message}</p>
              )}
            </div>
            <Input
              {...register('imei')}
              label="IMEI/Variant Code"
              placeholder="e.g., 1234abcd"
              error={errors.imei?.message}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter variant description..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            📍 Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                {...register('branch')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10"
              >
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              {errors.branch && (
                <p className="mt-1 text-sm text-red-600">{errors.branch.message}</p>
              )}
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md border h-fit">
                <span className="font-medium">Quick Access:</span> Branch determines inventory location and reporting
              </div>
            </div>
          </div>
        </div>

        {/* Categorization */}
        <div>
          <h3 className="text-lg font-semibold text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            🏷️ Categorization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-gray-400">(Auto-filled from Product)</span>
              </label>
              <input
                {...register('category')}
                type="text"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Select a product first"
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand <span className="text-gray-400">(Auto-filled from Product)</span>
              </label>
              <input
                {...register('brand')}
                type="text"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Select a product first"
              />
              {errors.brand && (
                <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
              )}
            </div>

            <Input
              {...register('supplier')}
              label="Supplier"
              placeholder="e.g., Samsung"
              error={errors.supplier?.message}
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div>
          <h3 className="text-lg font-semibold text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4 flex items-center">
            <IndianRupee className="w-5 h-5 mr-2" />
            💰 Pricing & Stock
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('cost_price', {
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="1"
              label="Cost Price (₹)"
              placeholder="e.g., 55000"
              error={errors.cost_price?.message}
              isRequired
            />
            <Input
              {...register('warranty', {
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="1"
              label="Warranty (years)"
              placeholder="e.g., 1"
              error={errors.warranty?.message}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any additional notes..."
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>
        </div>

        {/* Technical Specifications */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-4 flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            ⚙️ Technical Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <select
                {...register('attributes.color')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Color</option>
                {colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
              {errors.attributes?.color && (
                <p className="mt-1 text-sm text-red-600">{errors.attributes.color.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RAM (GB)
              </label>
              <select
                {...register('attributes.ram', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select RAM</option>
                <option value="4">4 GB</option>
                <option value="6">6 GB</option>
                <option value="8">8 GB</option>
                <option value="12">12 GB</option>
                <option value="16">16 GB</option>
              </select>
              {errors.attributes?.ram && (
                <p className="mt-1 text-sm text-red-600">{errors.attributes.ram.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage (GB)
              </label>
              <select
                {...register('attributes.storage', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Storage</option>
                <option value="64">64 GB</option>
                <option value="128">128 GB</option>
                <option value="256">256 GB</option>
                <option value="512">512 GB</option>
                <option value="1024">1024 GB</option>
                <option value="2048">2048 GB</option>
              </select>
              {errors.attributes?.storage && (
                <p className="mt-1 text-sm text-red-600">{errors.attributes.storage.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operating System
              </label>
              <select
                {...register('attributes.os')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select OS</option>
                {operatingSystems.map(os => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
              {errors.attributes?.os && (
                <p className="mt-1 text-sm text-red-600">{errors.attributes.os.message}</p>
              )}
            </div>
            <Input
              {...register('attributes.processor')}
              label="Processor"
              placeholder="e.g., Snapdragon 8 Gen"
              error={errors.attributes?.processor?.message}
            />
          </div>
        </div>

        </div> {/* End of scrollable content */}

        {/* Fixed Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t bg-white">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Update Variant' : 'Add Variant'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default VariantForm 