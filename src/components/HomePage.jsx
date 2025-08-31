import { useState, useEffect } from 'react'
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    lowStockProducts: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // إجمالي المنتجات
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // إجمالي المبيعات
      const { count: salesCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })

      // المنتجات منخفضة المخزون
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('*')
        .lt('quantity', 10)

      // إجمالي الإيرادات
      const { data: sales } = await supabase
        .from('sales')
        .select('total_price')

      const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.total_price || 0), 0) || 0

      setStats({
        totalProducts: productsCount || 0,
        totalSales: salesCount || 0,
        lowStockProducts: lowStockProducts?.length || 0,
        totalRevenue: totalRevenue
      })
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error)
    }
  }

  const statCards = [
    {
      title: 'إجمالي المنتجات',
      value: stats.totalProducts.toLocaleString('en-US'),
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'إجمالي المبيعات',
      value: stats.totalSales.toLocaleString('en-US'),
      icon: ShoppingCart,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'المنتجات منخفضة المخزون',
      value: stats.lowStockProducts.toLocaleString('en-US'),
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500'
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.totalRevenue.toLocaleString('en-US')} درهم`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
        <p className="text-gray-600">مرحباً بك في نظام إدارة المنتجات والمبيعات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <Package className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-blue-600 font-medium">إضافة منتج جديد</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
            <ShoppingCart className="w-6 h-6 text-green-600 mr-2" />
            <span className="text-green-600 font-medium">تسجيل مبيعات</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
            <span className="text-purple-600 font-medium">عرض التقارير</span>
          </button>
        </div>
      </div>
    </div>
  )
}
