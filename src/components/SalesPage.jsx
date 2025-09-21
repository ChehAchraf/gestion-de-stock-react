import { useState, useEffect } from 'react'
import { Plus, Search, ShoppingCart, X, Image as ImageIcon, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useSales, useProductsForSales, useCreateSale, useUpdateSale, useDeleteSale } from '../hooks/useLaravelApi'
import { useDebounce } from '../hooks/useDebounce'


export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [saleQuantity, setSaleQuantity] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [editingSale, setEditingSale] = useState(null)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationType, setNotificationType] = useState('success') // 'success' or 'error'
  const [notificationMessage, setNotificationMessage] = useState('')
  
  const salesPerPage = 8
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 300)
  
  // Use Laravel API hooks
  const { data: salesData, isLoading: salesLoading } = useSales(currentPage, salesPerPage)
  const { data: products = [] } = useProductsForSales()
  const createSaleMutation = useCreateSale()
  const updateSaleMutation = useUpdateSale()
  const deleteSaleMutation = useDeleteSale()
  
  const sales = salesData?.data || []
  const totalCount = salesData?.totalCount || 0
  const loading = salesLoading

  // إخفاء الإشعار تلقائياً بعد 3 ثوان
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showNotification])

  const showNotificationModal = (type, message) => {
    setNotificationType(type)
    setNotificationMessage(message)
    setShowNotification(true)
  }

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(debouncedProductSearchTerm.toLowerCase()) ||
    (product.reference_number && product.reference_number.toLowerCase().includes(debouncedProductSearchTerm.toLowerCase()))
  )

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setSalePrice(product.price.toString())
    setSaleQuantity('1')
  }

  const handleSubmitSale = async (e) => {
    e.preventDefault()
    if (!selectedProduct || !saleQuantity || !salePrice) return

    const quantity = parseInt(saleQuantity)
    const price = parseFloat(salePrice)
    const totalPrice = quantity * price

    if (quantity > selectedProduct.quantity) {
      alert('الكمية المطلوبة أكبر من الكمية المتوفرة في المخزون')
      return
    }

    try {
      const saleData = {
        product_id: selectedProduct.id,
        quantity: quantity,
        unit_price: price,
        total_price: totalPrice
      }

      await createSaleMutation.mutateAsync(saleData)

      setShowAddModal(false)
      setSelectedProduct(null)
      setSaleQuantity('')
      setSalePrice('')
      setProductSearchTerm('')
      showNotificationModal('success', 'تمت إضافة المبيعة بنجاح')
    } catch (error) {
      console.error('خطأ في تسجيل المبيعات:', error)
      showNotificationModal('error', 'تعذر إضافة المبيعة، من فضلك حاول لاحقاً')
    }
  }

  const handleEditSale = (sale) => {
    setEditingSale(sale)
    setSelectedProduct(sale.product)
    setSaleQuantity(sale.quantity.toString())
    setSalePrice(sale.unit_price.toString())
    setShowEditModal(true)
  }

  const handleUpdateSale = async (e) => {
    e.preventDefault()
    if (!selectedProduct || !saleQuantity || !salePrice || !editingSale) return

    const quantity = parseInt(saleQuantity)
    const price = parseFloat(salePrice)
    const totalPrice = quantity * price

    // حساب الفرق في الكمية
    const quantityDifference = quantity - editingSale.quantity

    // التحقق من الكمية المتوفرة
    const currentProduct = products.find(p => p.id === selectedProduct.id)
    if (quantityDifference > 0 && quantityDifference > currentProduct.quantity) {
      alert('الكمية المطلوبة أكبر من الكمية المتوفرة في المخزون')
      return
    }

    try {
      const saleData = {
        product_id: selectedProduct.id,
        quantity: quantity,
        unit_price: price,
        total_price: totalPrice
      }

      await updateSaleMutation.mutateAsync({
        id: editingSale.id,
        ...saleData
      })

      setShowEditModal(false)
      setEditingSale(null)
      setSelectedProduct(null)
      setSaleQuantity('')
      setSalePrice('')
      showNotificationModal('success', 'تم تحديث المبيعة بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث المبيعات:', error)
      showNotificationModal('error', 'تعذر تحديث المبيعة، من فضلك حاول لاحقاً')
    }
  }

  const handleDeleteSale = async (sale) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المبيعات؟')) return

    try {
      await deleteSaleMutation.mutateAsync(sale.id)

      showNotificationModal('success', 'تم حذف المبيعة بنجاح')
    } catch (error) {
      console.error('خطأ في حذف المبيعات:', error)
      showNotificationModal('error', 'تعذر حذف المبيعة، من فضلك حاول لاحقاً')
    }
  }

  const totalPages = Math.ceil(totalCount / salesPerPage)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">إدارة المبيعات</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          تسجيل مبيعات جديدة
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في المبيعات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                صورة المنتج
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المنتج
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الكمية المباعة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                سعر الوحدة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                السعر الإجمالي
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاريخ البيع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  جاري التحميل...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  لا توجد مبيعات
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sale.product?.image_url ? (
                      <img
                        src={sale.product.image_url}
                        alt={sale.product?.name || 'منتج محذوف'}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    {!sale.product?.image_url && (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {sale.product?.name || 'منتج محذوف'}
                      </div>
                      {sale.product?.reference_number && (
                        <div className="text-sm text-gray-500">
                          {sale.product.reference_number}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.quantity.toLocaleString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.unit_price.toLocaleString('en-US')} درهم
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.total_price.toLocaleString('en-US')} درهم
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.created_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditSale(sale)}
                      className="text-blue-600 hover:text-blue-900 ml-3"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSale(sale)}
                      className="text-red-600 hover:text-red-900"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              السابق
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              التالي
            </button>
          </nav>
        </div>
      )}

      {/* Add Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">تسجيل مبيعات جديدة</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedProduct(null)
                  setSaleQuantity('')
                  setSalePrice('')
                  setProductSearchTerm('')
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Product Selection */}
              <div>
                <h3 className="text-lg font-medium mb-4">اختيار المنتج</h3>
                
                {/* Product Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="البحث عن المنتجات..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      {productSearchTerm ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات متوفرة'}
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`w-full text-right p-3 border rounded-lg transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-8 h-8 rounded mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded mr-3 flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-gray-600">
                              الكمية المتوفرة: {product.quantity.toLocaleString('en-US')} | السعر: {product.price.toLocaleString('en-US')} درهم
                            </div>
                            {product.reference_number && (
                              <div className="text-xs text-gray-500">
                                الرقم المرجعي: {product.reference_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Sale Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">تفاصيل البيع</h3>
                {selectedProduct ? (
                  <form onSubmit={handleSubmitSale} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المنتج المختار
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          {selectedProduct.image_url ? (
                            <img
                              src={selectedProduct.image_url}
                              alt={selectedProduct.name}
                              className="w-12 h-12 rounded mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded mr-3 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm">{selectedProduct.name}</div>
                            <div className="text-sm text-gray-600">
                              الكمية المتوفرة: {selectedProduct.quantity.toLocaleString('en-US')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الكمية *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={selectedProduct.quantity}
                        value={saleQuantity}
                        onChange={(e) => setSaleQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        سعر الوحدة (درهم) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {saleQuantity && salePrice && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          السعر الإجمالي
                        </label>
                        <div className="p-3 bg-blue-50 rounded-md text-lg font-semibold text-blue-700">
                          {(parseFloat(saleQuantity) * parseFloat(salePrice)).toLocaleString('en-US')} درهم
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium"
                      >
                        تسجيل البيع
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false)
                          setSelectedProduct(null)
                          setSaleQuantity('')
                          setSalePrice('')
                          setProductSearchTerm('')
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>اختر منتجاً من القائمة</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">تعديل المبيعات</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingSale(null)
                  setSelectedProduct(null)
                  setSaleQuantity('')
                  setSalePrice('')
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSale} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المنتج
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    {selectedProduct?.image_url ? (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-12 h-12 rounded mr-3 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded mr-3 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{selectedProduct?.name || 'منتج محذوف'}</div>
                      <div className="text-sm text-gray-600">
                        الكمية المتوفرة: {products.find(p => p.id === selectedProduct?.id)?.quantity?.toLocaleString('en-US') || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الكمية *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سعر الوحدة (درهم) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {saleQuantity && salePrice && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر الإجمالي
                  </label>
                  <div className="p-3 bg-blue-50 rounded-md text-lg font-semibold text-blue-700">
                    {(parseFloat(saleQuantity) * parseFloat(salePrice)).toLocaleString('en-US')} درهم
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                >
                  تحديث البيع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingSale(null)
                    setSelectedProduct(null)
                    setSaleQuantity('')
                    setSalePrice('')
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center justify-center mb-4">
              {notificationType === 'success' ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-500" />
              )}
            </div>
            <div className="text-center">
              <h3 className={`text-lg font-semibold mb-2 ${
                notificationType === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notificationType === 'success' ? 'نجح العمل!' : 'حدث خطأ!'}
              </h3>
              <p className={`text-sm ${
                notificationType === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {notificationMessage}
              </p>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowNotification(false)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  notificationType === 'success'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
