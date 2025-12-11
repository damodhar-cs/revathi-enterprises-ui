import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'
import { Product } from '../types/index'

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  item?: Product | null
  onSave: (item: Product) => void
  error?: string
  isLoading?: boolean
}


// Simplified schema for parent products (matches backend CreateProductsInputDto)
const productSchema = z.object({
  title: z.string().min(2, 'Product title is required'),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().min(1, 'Category is required'),
})

export const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  error,
  isLoading,
}) => {
  const isEdit = !!item
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: item?.title || '',
      brand: item?.brand || '',
      category: item?.category || '',
    },
  })

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      reset({
        title: item.title || '',
        brand: item.brand || '',
        category: item.category || '',
      })
    } else {
      reset({
        title: '',
        brand: '',
        category: '',
      })
    }
  }, [item, reset])

  // Use enums from backend
  const categories = ['Mobile', 'Accessories', 'Tablets', 'Smartwatches']
  const brands = ['Vivo', 'Oppo', 'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Redmi', 'Realme']

  const onSubmit = (data: any) => {
    const productData: Product = {
      ...data,
      _id: item?._id || '',
      createdAt: item?.createdAt || '',
      updatedAt: item?.updatedAt || '',
    }
    
    onSave(productData)
    handleClose()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Edit Product' : 'Add New Product'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
          <div className="space-y-4">
            <Input
              {...register('title')}
              label="Product Title"
              placeholder="e.g., iPhone 15 Pro Max"
              error={errors.title?.message}
              isRequired
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                {...register('brand')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              {errors.brand && (
                <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ProductForm
