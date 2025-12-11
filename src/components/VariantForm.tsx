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
import { BRANCH_OPTIONS, COLOR_OPTIONS, MATERIAL_OPTIONS } from '../common/enums'
import { Info, MapPin, Tag, IndianRupee, Package, Cpu, HardDrive } from 'lucide-react'

interface VariantFormProps {
  isOpen: boolean
  onClose: () => void
  item?: Variant | null
  onSave: (item: Variant) => void
  error?: string
  isLoading?: boolean
}

// Zod schema for validation
const dimensionsSchema = z.object({
  height: z.number().min(0.01, 'Height must be positive').optional().or(z.nan().transform(() => undefined)),
  width: z.number().min(0.01, 'Width must be positive').optional().or(z.nan().transform(() => undefined)),
  depth: z.number().min(0.01, 'Depth must be positive').optional().or(z.nan().transform(() => undefined)),
})

const attributesSchema = z.object({
  color: z.string().optional(),
  weight: z.number().min(0.1, 'Weight must be positive').optional().or(z.nan().transform(() => undefined)),
  ram: z.number().min(1, 'RAM must be at least 1GB').optional().or(z.nan().transform(() => undefined)),
  storage: z.number().min(1, 'Storage must be at least 1GB').optional().or(z.nan().transform(() => undefined)),
  os: z.string().optional(),
  processor: z.string().optional(),
  dimensions: dimensionsSchema.optional(),
  batteryLife: z.number().min(1, 'Battery life must be at least 1 hour').optional().or(z.nan().transform(() => undefined)),
  material: z.string().optional(),
})

// Match backend CreateVariantInputDto structure
const VariantSchema = z.object({
  product_uid: z.string().min(1, 'Product selection is required'),
  product_name: z.string().min(1, 'Product name is required'),
  title: z.string().optional().transform(val => val === '' ? undefined : val), // CMS title (optional, backend generates if not provided)
  description: z.string().min(3, 'Description must be at least 3 characters'),
  sku: z.string().min(3, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  branch: z.string().min(1, 'Branch is required'),
  supplier: z.string().optional(),
  cost_price: z.number().min(1, 'Cost price must be at least 1'),
  selling_price: z.number().min(1, 'Selling price must be at least 1').optional().or(z.nan().transform(() => undefined)),
  quantity: z.number().min(0, 'Quantity must be at least 0').optional().or(z.nan().transform(() => undefined)),
  warranty: z.number().min(1, 'Warranty must be at least 1').optional().or(z.nan().transform(() => undefined)),
  image: z.string().url('Image must be a valid URL').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
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
      sku: item?.sku || '',
      category: item?.category || '',
      brand: item?.brand || '',
      branch: item?.branch || 'Mahadevapura',
      supplier: item?.supplier || '',
      cost_price: item?.cost_price || undefined,
      selling_price: item?.selling_price || undefined,
      quantity: item?.quantity || 0,
      warranty: item?.warranty || undefined,
      image: item?.image || '',
      notes: item?.notes || '',
      attributes: {
        color: item?.attributes?.color || '',
        weight: item?.attributes?.weight || undefined,
        size: item?.attributes?.size || '',
        ram: item?.attributes?.ram || undefined,
        storage: item?.attributes?.storage || undefined,
        os: item?.attributes?.os || '',
        processor: item?.attributes?.processor || '',
        dimensions: {
          height: item?.attributes?.dimensions?.height || undefined,
          width: item?.attributes?.dimensions?.width || undefined,
          depth: item?.attributes?.dimensions?.depth || undefined,
        },
        screen_size: item?.attributes?.screen_size || '',
        battery_life: item?.attributes?.battery_life || undefined,
        material: item?.attributes?.material || '',
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
        product_name: item.product_name,
        title: item.title || '',
        description: item.description,
        sku: item.sku,
        category: item.category,
        brand: item.brand,
        branch: item.branch,
        supplier: item.supplier,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        quantity: item.quantity,
        warranty: item.warranty,
        image: item.image,
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
        sku: '',
        category: '',
        brand: '',
        branch: '',
        supplier: '',
        cost_price: undefined,
        selling_price: undefined,
        quantity: 0,
        warranty: undefined,
        image: '',
        notes: '',
        attributes: {
          color: '',
          weight: undefined,
          size: '',
          ram: undefined,
          storage: undefined,
          os: '',
          processor: '',
          dimensions: {
            height: undefined,
            width: undefined,
            depth: undefined
          },
          screen_size: '',
          battery_life: undefined,
          material: ''
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
  const materials = MATERIAL_OPTIONS
  const operatingSystems = ['iOS', 'Android 15', 'Android 14', 'Android 13', 'Windows', 'Other']

  const onSubmit = (data: any) => {
    // Clean up the data to match the expected schema structure
    const productData: Variant = {
      ...data,
      _id: item?._id || '', // Provide empty string as fallback
    }
    
    // Clean up and properly handle dimensions - now handled by Zod schema
    if (productData.attributes?.dimensions) {
      const dimensions = productData.attributes.dimensions
      
      // Check if any valid dimensions exist
      const hasValidDimensions = (
        (typeof dimensions.height === 'number' && !isNaN(dimensions.height) && dimensions.height > 0) ||
        (typeof dimensions.width === 'number' && !isNaN(dimensions.width) && dimensions.width > 0) ||
        (typeof dimensions.depth === 'number' && !isNaN(dimensions.depth) && dimensions.depth > 0)
      )
      
      if (!hasValidDimensions) {
        delete productData.attributes.dimensions
      }
    }
    
    // Debug logging (can be removed in production)
    console.log('Submitting variant data:', {
      product_name: productData.product_name,
      dimensions: productData.attributes?.dimensions,
      hasAttributes: !!productData.attributes
    })
    
    onSave(productData)
    handleClose()
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
                <input
                  type="text"
                  value={productSearchTerm}
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
                  placeholder={isEdit ? "Product cannot be changed when editing" : "Search for a product..."}
                  disabled={isEdit}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
                    isEdit 
                      ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                />
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
              {...register('sku')}
              label="SKU/Variant Code"
              placeholder="e.g., 1234abcd"
              error={errors.sku?.message}
              isRequired
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {...register('selling_price', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="1"
              label="Selling Price (₹)"
              placeholder="e.g., 60000"
              error={errors.selling_price?.message}
            />
            <Input
              {...register('quantity', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="0"
              label="Quantity"
              placeholder="e.g., 10"
              error={errors.quantity?.message}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
            <Input
              {...register('image')}
              label="Image URL"
              placeholder="e.g., https://example.com/image.jpg"
              error={errors.image?.message}
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

        {/* Physical Attributes */}
        <div>
          <h3 className="text-lg font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            📦 Physical Attributes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <Input
              {...register('attributes.weight', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="0.1"
              step="0.1"
              label="Weight (grams)"
              placeholder="e.g., 180.5"
              error={errors.attributes?.weight?.message}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <select
                {...register('attributes.material')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Material</option>
                {materials.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
              {errors.attributes?.material && (
                <p className="mt-1 text-sm text-red-600">{errors.attributes.material.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <h3 className="text-lg font-semibold text-pink-800 bg-pink-50 border border-pink-200 rounded-lg px-4 py-2 mb-4 flex items-center">
            <Cpu className="w-5 h-5 mr-2" />
            📏 Dimensions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('attributes.dimensions.height', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="0.01"
              step="0.01"
              label="Height (mm)"
              placeholder="e.g., 148.5"
              error={errors.attributes?.dimensions?.height?.message}
            />
            <Input
              {...register('attributes.dimensions.width', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="0.01"
              step="0.01"
              label="Width (mm)"
              placeholder="e.g., 70.6"
              error={errors.attributes?.dimensions?.width?.message}
            />
            <Input
              {...register('attributes.dimensions.depth', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="0.01"
              step="0.01"
              label="Depth/Thickness (mm)"
              placeholder="e.g., 7.85"
              error={errors.attributes?.dimensions?.depth?.message}
            />
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
                <option value="5">5 GB</option>
                <option value="6">6 GB</option>
                <option value="8">8 GB</option>
                <option value="10">10 GB</option>
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
            <Input
              {...register('attributes.battery_life', { 
                valueAsNumber: true,
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              type="number"
              min="1"
              label="Battery Life (hours)"
              placeholder="e.g., 24"
              error={errors.attributes?.battery_life?.message}
            />
            <Input
              {...register('attributes.screen_size')}
              label="Screen Size"
              placeholder="e.g., 6.7 inches"
              error={errors.attributes?.screen_size?.message}
            />
            <Input
              {...register('attributes.size')}
              label="Size"
              placeholder="e.g., Large, Medium, Small"
              error={errors.attributes?.size?.message}
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