import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Edit2, ShoppingCart, Package, Info, IndianRupee, Calendar, MapPin, Tag, Cpu, HardDrive, Battery, Smartphone } from 'lucide-react'
import { Button } from '../components/Button'
import VariantForm from '../components/VariantForm'
import SellForm from '../components/SellForm'
// import type { Variant } from '../types'
import { variantsApi, salesApi } from '../services/api'

const VariantDetailPage: React.FC = () => {
  const { variantId } = useParams<{ variantId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [mutationError, setMutationError] = useState('')
  const [sellError, setSellError] = useState('')

  // Fetch variant details
  const { data: variant, isLoading, error } = useQuery(
    ['variant', variantId],
    () => variantsApi.getVariant(variantId!),
    {
      enabled: !!variantId,
      onError: () => {
        setMutationError('Failed to load variant details')
      }
    }
  )

  // Update variant mutation
  const updateVariantMutation = useMutation(
    (variantData: any) => {
      const { id, _id, profitMargin, sellingPrice, createdAt, updatedAt, __v, count, ...dataWithoutId } = variantData;
      
      const cleanedData: any = {
        product_name: dataWithoutId.product_name,
        description: dataWithoutId.description,
        imei: dataWithoutId.imei,
        category: dataWithoutId.category,
        brand: dataWithoutId.brand,
        supplier: dataWithoutId.supplier,
        cost_price: Number(dataWithoutId.cost_price),
        branch: dataWithoutId.branch,
        quantity: Number(dataWithoutId.quantity) || 0,
      };
      
      if (dataWithoutId.warranty !== undefined && dataWithoutId.warranty !== null) {
        cleanedData.warranty = Number(dataWithoutId.warranty);
      }
      
      if (dataWithoutId.attributes) {
        cleanedData.attributes = dataWithoutId.attributes;
      }
      
      return variantsApi.updateVariant(variantId!, cleanedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['variant', variantId]);
        queryClient.invalidateQueries('variants');
        queryClient.invalidateQueries('product-variants');
        setIsEditModalOpen(false);
        setMutationError('');
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.message || 'Failed to update variant');
      },
    }
  );

  // Create sale mutation
  const createSaleMutation = useMutation(
    (saleData: any) => {
      return salesApi.createSale(saleData);
    },
    {
      onSuccess: () => {
        // No need to invalidate variant queries since we're navigating away
        // The variant will be refreshed when/if user navigates back to this page
        queryClient.invalidateQueries('sales'); // Invalidate sales queries to refresh data
        setIsSellModalOpen(false);
        setSellError('');
        // Navigate to sales listing to show the new sale
        navigate('/sales');
      },
      onError: (err: any) => {
        setSellError(err.response?.data?.message || 'Failed to complete sale');
      },
    }
  );

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleSell = () => {
    setIsSellModalOpen(true)
    setSellError('')
  }

  const handleSaleComplete = (saleData: any) => {
    createSaleMutation.mutate(saleData)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (error || !variant) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Variant not found</h3>
            <p className="mt-1 text-sm text-gray-500">The variant you're looking for doesn't exist.</p>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/variants')}
                variant="secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Variants
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
          <div className="flex items-center justify-between pt-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => navigate(`/variants/${variant.product_uid}`)}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{variant.product_name}</h1>
                <p className="text-sm text-gray-500">SKU: {variant.imei}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                onClick={handleEdit}
                className="flex items-center"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
                <Button
                  variant="primary"
                  onClick={handleSell}
                  className="flex items-center"
                  disabled={variant.quantity === 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {variant.quantity === 0 ? 'Out of Stock' : 'Sell'}
                </Button>
            </div>
          </div>

          {/* Error Alert */}
          {mutationError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{mutationError}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  📋 Basic Information
                </h3>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Product Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{variant.product_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{variant.description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{variant.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Brand</dt>
                    <dd className="mt-1 text-sm text-gray-900">{variant.brand}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Supplier</dt>
                    <dd className="mt-1 text-sm text-gray-900">{variant.supplier || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Warranty</dt>
                    <dd className="mt-1 text-sm text-gray-900">{variant.warranty ? `${variant.warranty} years` : 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Specifications */}
            {variant.attributes && (
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    ⚙️ Specifications
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    {variant.attributes.color && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Color</dt>
                        <dd className="mt-1 text-sm text-gray-900">{variant.attributes.color}</dd>
                      </div>
                    )}
                    {variant.attributes.ram && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <Cpu className="w-4 h-4 mr-1" />
                          RAM
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">{variant.attributes.ram} GB</dd>
                      </div>
                    )}
                    {variant.attributes.storage && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <HardDrive className="w-4 h-4 mr-1" />
                          Storage
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">{variant.attributes.storage} GB</dd>
                      </div>
                    )}
                    {variant.attributes.battery_life && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <Battery className="w-4 h-4 mr-1" />
                          Battery Life
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">{variant.attributes.battery_life} hours</dd>
                      </div>
                    )}
                    {variant.attributes.os && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Operating System</dt>
                        <dd className="mt-1 text-sm text-gray-900">{variant.attributes.os}</dd>
                      </div>
                    )}
                    {variant.attributes.processor && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Processor</dt>
                        <dd className="mt-1 text-sm text-gray-900">{variant.attributes.processor}</dd>
                      </div>
                    )}
                    {variant.attributes.material && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Material</dt>
                        <dd className="mt-1 text-sm text-gray-900">{variant.attributes.material}</dd>
                      </div>
                    )}
                    {variant.attributes.weight && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Weight</dt>
                        <dd className="mt-1 text-sm text-gray-900">{variant.attributes.weight} g</dd>
                      </div>
                    )}
                    {variant.attributes.dimensions && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {variant.attributes.dimensions.height && `H: ${variant.attributes.dimensions.height}mm`}
                          {variant.attributes.dimensions.width && ` × W: ${variant.attributes.dimensions.width}mm`}
                          {variant.attributes.dimensions.depth && ` × D: ${variant.attributes.dimensions.depth}mm`}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-green-800 bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center">
                  <IndianRupee className="w-5 h-5 mr-2" />
                  💰 Pricing
                </h3>
              </div>
              <div className="px-6 py-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cost Price</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">₹{variant.cost_price.toLocaleString('en-IN')}</dd>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                📍 Location
              </h3>
              </div>
              <div className="px-6 py-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Branch</dt>
                  <dd className="mt-1 text-sm text-gray-900">{variant.branch}</dd>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  📅 Timeline
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(variant.createdAt || variant.created_at || '')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(variant.updatedAt || variant.updated_at || '')}</dd>
                </div>
              </div>
            </div>

            {/* Product ID */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-pink-800 bg-pink-50 border border-pink-200 rounded-lg px-4 py-2 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  🏷️ Identifiers
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Variant ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{variant._id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Product ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{variant.product_uid}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <VariantForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={updateVariantMutation.mutate}
          item={variant}
          error={mutationError}
          isLoading={updateVariantMutation.isLoading}
        />

        {/* Sell Modal */}
        <SellForm
          isOpen={isSellModalOpen}
          onClose={() => setIsSellModalOpen(false)}
          onSell={handleSaleComplete}
          variant={variant}
          error={sellError}
          isLoading={createSaleMutation.isLoading}
        />
      </div>
    </div>
  )
}

export default VariantDetailPage
