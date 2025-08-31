import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ReportsPage() {
  const [reports, setReports] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    topSellingProducts: [],
    recentSales: [],
    monthlyRevenue: [],
    stockAlerts: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('all') // all, week, month, year

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    try {
      setLoading(true)
      
      // إجمالي الإيرادات
      const { data: sales } = await supabase
        .from('sales')
        .select('total_price, created_at')

      let filteredSales = sales || []
      if (dateRange !== 'all') {
        const now = new Date()
        let startDate
        switch (dateRange) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
        }
        filteredSales = sales?.filter(sale => new Date(sale.created_at) >= startDate) || []
      }

      const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total_price || 0), 0)
      const totalSales = filteredSales.length

      // إجمالي المنتجات
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // المنتجات منخفضة المخزون
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('*')
        .lt('quantity', 10)

      // أفضل المنتجات مبيعاً
      const { data: topSelling } = await supabase
        .from('sales')
        .select(`
          quantity,
          total_price,
          products (
            name,
            reference_number
          )
        `)

      const productSales = {}
      topSelling?.forEach(sale => {
        const productName = sale.products?.name || 'منتج محذوف'
        if (!productSales[productName]) {
          productSales[productName] = { quantity: 0, revenue: 0 }
        }
        productSales[productName].quantity += sale.quantity
        productSales[productName].revenue += sale.total_price
      })

      const topSellingProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      // المبيعات الحديثة
      const { data: recentSales } = await supabase
        .from('sales')
        .select(`
          quantity,
          total_price,
          created_at,
          products (
            name,
            reference_number
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // الإيرادات الشهرية (آخر 6 أشهر)
      const monthlyRevenue = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthSales = sales?.filter(sale => {
          const saleDate = new Date(sale.created_at)
          return saleDate >= monthStart && saleDate <= monthEnd
        }) || []
        
        const monthRevenue = monthSales.reduce((sum, sale) => sum + (sale.total_price || 0), 0)
        monthlyRevenue.push({
          month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          revenue: monthRevenue
        })
      }

      // تنبيهات المخزون
      const stockAlerts = lowStockProducts?.map(product => ({
        name: product.name,
        quantity: product.quantity,
        reference_number: product.reference_number
      })) || []

      setReports({
        totalRevenue,
        totalSales,
        totalProducts: productsCount || 0,
        lowStockProducts: lowStockProducts?.length || 0,
        topSellingProducts,
        recentSales: recentSales || [],
        monthlyRevenue,
        stockAlerts
      })
    } catch (error) {
      console.error('خطأ في جلب التقارير:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRevenueChange = () => {
    if (reports.monthlyRevenue.length < 2) return 0
    const current = reports.monthlyRevenue[reports.monthlyRevenue.length - 1].revenue
    const previous = reports.monthlyRevenue[reports.monthlyRevenue.length - 2].revenue
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

  const revenueChange = getRevenueChange()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">جاري تحميل التقارير...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">جميع الفترات</option>
          <option value="week">آخر أسبوع</option>
          <option value="month">آخر شهر</option>
          <option value="year">آخر سنة</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-gray-900">{reports.totalRevenue.toLocaleString('en-US')} درهم</p>
              <div className="flex items-center text-sm">
                {revenueChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 ml-1" />
                )}
                <span className={revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(revenueChange).toFixed(1)}%
                </span>
                <span className="text-gray-500 mr-1">من الشهر السابق</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-gray-900">{reports.totalSales.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
              <p className="text-2xl font-bold text-gray-900">{reports.totalProducts.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">منخفضة المخزون</p>
              <p className="text-2xl font-bold text-gray-900">{reports.lowStockProducts.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">أفضل المنتجات مبيعاً</h2>
          <div className="space-y-4">
            {reports.topSellingProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">الكمية المباعة: {product.quantity.toLocaleString('en-US')}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{product.revenue.toLocaleString('en-US')} درهم</div>
                  <div className="text-sm text-gray-500">الإيرادات</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">تنبيهات المخزون</h2>
          <div className="space-y-3">
            {reports.stockAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد تنبيهات مخزون</p>
            ) : (
              reports.stockAlerts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <div className="font-medium text-red-800">{product.name}</div>
                    <div className="text-sm text-red-600">الكمية المتبقية: {product.quantity.toLocaleString('en-US')}</div>
                    {product.reference_number && (
                      <div className="text-xs text-red-500">الرقم المرجعي: {product.reference_number}</div>
                    )}
                  </div>
                  <div className="text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">آخر المبيعات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنتج
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكمية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السعر الإجمالي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {sale.products?.name || 'منتج محذوف'}
                      </div>
                      {sale.products?.reference_number && (
                        <div className="text-sm text-gray-500">
                          {sale.products.reference_number}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.quantity.toLocaleString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.total_price.toLocaleString('en-US')} درهم
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.created_at).toLocaleDateString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">الإيرادات الشهرية</h2>
        <div className="grid grid-cols-6 gap-4">
          {reports.monthlyRevenue.map((month, index) => (
            <div key={index} className="text-center">
              <div className="text-sm text-gray-600 mb-2">{month.month}</div>
              <div className="text-lg font-semibold text-gray-900">
                {month.revenue.toLocaleString('en-US')} درهم
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
