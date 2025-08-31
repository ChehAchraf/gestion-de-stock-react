import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Camera, X, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BrowserMultiFormatReader } from '@zxing/library'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [barcodeImage, setBarcodeImage] = useState(null)
  const [barcodeResult, setBarcodeResult] = useState('')
  const [processingBarcode, setProcessingBarcode] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const productsPerPage = 8

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    price: '',
    reference_number: '',
    image_url: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchTerm])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%`)
      }

      const from = (currentPage - 1) * productsPerPage
      const to = from + productsPerPage - 1

      const { data, error } = await query.range(from, to)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('خطأ في جلب المنتجات:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const productData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price)
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData])
        if (error) throw error
      }

      setShowAddModal(false)
      setEditingProduct(null)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error('خطأ في حفظ المنتج:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
        if (error) throw error
        fetchProducts()
      } catch (error) {
        console.error('خطأ في حذف المنتج:', error)
      }
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      quantity: product.quantity.toString(),
      price: product.price.toString(),
      reference_number: product.reference_number || '',
      image_url: product.image_url || ''
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: '',
      price: '',
      reference_number: '',
      image_url: ''
    })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadingImage(true)
      try {
        // التحقق من حجم الصورة (أقل من 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
          return
        }

        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
          alert('يرجى اختيار ملف صورة صحيح')
          return
        }

        // محاولة رفع الصورة إلى Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `product-images/${fileName}`

        // محاولة إنشاء bucket إذا لم يكن موجوداً
        try {
          const { data: buckets } = await supabase.storage.listBuckets()
          const bucketExists = buckets?.some(bucket => bucket.name === 'product-images')
          
          if (!bucketExists) {
            // إنشاء bucket جديد
            const { error: createError } = await supabase.storage.createBucket('product-images', {
              public: true,
              allowedMimeTypes: ['image/*'],
              fileSizeLimit: 5242880 // 5MB
            })
            
            if (createError) {
              console.warn('فشل في إنشاء bucket، سيتم استخدام حل بديل:', createError)
              // استخدام حل بديل - حفظ الصورة كـ base64
              const reader = new FileReader()
              reader.onload = (e) => {
                setFormData({ ...formData, image_url: e.target.result })
              }
              reader.readAsDataURL(file)
              return
            }
          }
        } catch (bucketError) {
          console.warn('خطأ في التحقق من bucket:', bucketError)
        }

        // رفع الصورة
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.warn('فشل في رفع الصورة إلى Storage، سيتم استخدام حل بديل:', uploadError)
          // استخدام حل بديل - حفظ الصورة كـ base64
          const reader = new FileReader()
          reader.onload = (e) => {
            setFormData({ ...formData, image_url: e.target.result })
          }
          reader.readAsDataURL(file)
          return
        }

        // الحصول على رابط الصورة
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        setFormData({ ...formData, image_url: publicUrl })
        
      } catch (error) {
        console.error('خطأ في معالجة الصورة:', error)
        
        // حل بديل - حفظ الصورة كـ base64
        try {
          const reader = new FileReader()
          reader.onload = (e) => {
            setFormData({ ...formData, image_url: e.target.result })
          }
          reader.readAsDataURL(file)
        } catch (base64Error) {
          console.error('فشل في تحويل الصورة إلى base64:', base64Error)
          alert('فشل في معالجة الصورة. يرجى المحاولة مرة أخرى.')
        }
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const processBarcodeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        img.onload = async () => {
          try {
            // إنشاء canvas لرسم الصورة
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            // تعيين أبعاد canvas
            canvas.width = img.width
            canvas.height = img.height
            
            // رسم الصورة على canvas
            ctx.drawImage(img, 0, 0)
            
            // الحصول على بيانات الصورة
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            
            // استخدام ZXing لقراءة الباركود
            const codeReader = new BrowserMultiFormatReader()
            
            // تحويل ImageData إلى HTMLImageElement
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = imageData.width
            tempCanvas.height = imageData.height
            const tempCtx = tempCanvas.getContext('2d')
            tempCtx.putImageData(imageData, 0, 0)
            
            // إنشاء صورة جديدة من canvas
            const newImg = new Image()
            newImg.onload = async () => {
              try {
                // محاولة قراءة الباركود باستخدام ZXing
                const result = await codeReader.decodeFromImage(newImg)
                
                if (result && result.text) {
                  // تنظيف النتيجة - إزالة المسافات والأحرف غير المرغوبة
                  let cleanResult = result.text.replace(/[^0-9]/g, '')
                  
                  // إذا كان الباركود يحتوي على أرقام فقط، استخدمه كما هو
                  if (cleanResult.length > 0) {
                    resolve(cleanResult)
                  } else {
                    // إذا لم تكن هناك أرقام، استخدم النص الأصلي
                    resolve(result.text.trim())
                  }
                } else {
                  reject(new Error('لم يتم العثور على باركود في الصورة'))
                }
              } catch (zxingError) {
                // إذا فشل ZXing، جرب jsQR كبديل
                try {
                  const jsQR = (await import('jsqr')).default
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                  })
                  
                  if (code) {
                    let cleanResult = code.data.replace(/[^0-9]/g, '')
                    if (cleanResult.length > 0) {
                      resolve(cleanResult)
                    } else {
                      resolve(code.data.trim())
                    }
                  } else {
                    reject(new Error('لم يتم العثور على باركود في الصورة'))
                  }
                } catch (jsQRError) {
                  reject(new Error('فشل في قراءة الباركود'))
                }
              }
            }
            
            newImg.src = tempCanvas.toDataURL()
            
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = () => {
          reject(new Error('فشل في تحميل الصورة'))
        }
        
        img.src = e.target.result
      }
      
      reader.onerror = () => {
        reject(new Error('فشل في قراءة الملف'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  const handleBarcodeImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setBarcodeImage(file)
      setProcessingBarcode(true)
      setBarcodeResult('')
      
      try {
        const result = await processBarcodeImage(file)
        setBarcodeResult(result)
      } catch (error) {
        console.error('خطأ في معالجة الباركود:', error)
        setBarcodeResult('فشل في قراءة الباركود')
      } finally {
        setProcessingBarcode(false)
      }
    }
  }

  const totalPages = Math.ceil(products.length / productsPerPage)

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة المنتجات</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          إضافة منتج جديد
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في المنتجات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الصورة
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المنتج
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السعر
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  الرقم المرجعي
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-6 py-4 text-center text-gray-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-6 py-4 text-center text-gray-500">
                    لا توجد منتجات
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      {!product.image_url && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 hidden sm:block">{product.description}</div>
                        )}
                        <div className="text-xs text-gray-500 sm:hidden">
                          {product.reference_number && `المرجع: ${product.reference_number}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantity.toLocaleString('en-US')}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.price.toLocaleString('en-US')} درهم
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      {product.reference_number || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 ml-2 sm:ml-3"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingProduct(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  صورة المنتج
                </label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <div className="text-blue-600 text-sm">جاري الرفع...</div>
                  )}
                </div>
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="صورة المنتج"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الكمية *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    السعر (درهم) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الرقم المرجعي
                </label>
                <div className="flex space-x-2 space-x-reverse">
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل الرقم المرجعي يدوياً"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBarcodeModal(true)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 space-x-reverse pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                >
                  {editingProduct ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingProduct(null)
                    resetForm()
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

      {/* Barcode Scanner Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">مسح الباركود</h2>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رفع صورة الباركود
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBarcodeImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {processingBarcode && (
                <div className="text-center py-4">
                  <div className="text-blue-600">جاري معالجة الباركود...</div>
                </div>
              )}

              {barcodeResult && !processingBarcode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    النتيجة:
                  </label>
                  <input
                    type="text"
                    value={barcodeResult}
                    readOnly
                    className={`w-full px-3 py-2 border rounded-md ${
                      barcodeResult === 'فشل في قراءة الباركود' 
                        ? 'border-red-300 bg-red-50 text-red-700' 
                        : 'border-green-300 bg-green-50 text-green-700'
                    }`}
                  />
                  {barcodeResult !== 'فشل في قراءة الباركود' && (
                    <p className="text-sm text-green-600 mt-1">تم قراءة الباركود بنجاح!</p>
                  )}
                </div>
              )}

              <div className="flex space-x-3 space-x-reverse pt-4">
                <button
                  onClick={() => {
                    if (barcodeResult && barcodeResult !== 'فشل في قراءة الباركود') {
                      setFormData({ ...formData, reference_number: barcodeResult })
                      setShowBarcodeModal(false)
                      setBarcodeResult('')
                      setBarcodeImage(null)
                    }
                  }}
                  disabled={!barcodeResult || barcodeResult === 'فشل في قراءة الباركود'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-md font-medium"
                >
                  استخدام النتيجة
                </button>
                <button
                  onClick={() => {
                    setShowBarcodeModal(false)
                    setBarcodeResult('')
                    setBarcodeImage(null)
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
