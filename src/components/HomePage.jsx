import { Package, ShoppingCart, TrendingUp, AlertTriangle, Tag } from 'lucide-react'
import { useDashboardStats, useCategories } from '../hooks/useLaravelApi'

export default function HomePage({ onNavigate }) {
  const { data: stats = {
    totalProducts: 0,
    totalSales: 0,
    lowStockProducts: 0,
    totalRevenue: 0
  }, isLoading } = useDashboardStats()
  
  const { data: categoriesData } = useCategories(1, '', 1000) // Get all categories
  const totalCategories = categoriesData?.totalCount || 0

  const statCards = [
    {
      title: 'إجمالي المنتجات',
      value: (stats?.totalProducts || 0).toLocaleString('en-US'),
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'إجمالي المبيعات',
      value: (stats?.totalSales || 0).toLocaleString('en-US'),
      icon: ShoppingCart,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'المنتجات منخفضة المخزون',
      value: (stats?.lowStockProducts || 0).toLocaleString('en-US'),
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500'
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${(stats?.totalRevenue || 0).toLocaleString('en-US')} درهم`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      title: 'إجمالي الفئات',
      value: totalCategories.toLocaleString('en-US'),
      icon: Tag,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500'
    }
  ]

  const quickActions = [
    {
      title: 'إضافة منتج جديد',
      icon: Package,
      color: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
      textColor: 'text-blue-600',
      action: () => onNavigate('products')
    },
    {
      title: 'تسجيل مبيعات',
      icon: ShoppingCart,
      color: 'border-green-200 hover:border-green-300 hover:bg-green-50',
      textColor: 'text-green-600',
      action: () => onNavigate('sales')
    },
    {
      title: 'إدارة الفئات',
      icon: Tag,
      color: 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50',
      textColor: 'text-indigo-600',
      action: () => onNavigate('categories')
    },
    {
      title: 'عرض التقارير',
      icon: TrendingUp,
      color: 'border-purple-200 hover:border-purple-300 hover:bg-purple-50',
      textColor: 'text-purple-600',
      action: () => onNavigate('reports')
    }
  ]

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
        <p className="text-sm sm:text-base text-gray-600">مرحباً بك في نظام إدارة المنتجات والمبيعات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className={`p-2 sm:p-3 rounded-full ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                </div>
                <div className="mr-3 sm:mr-4 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={action.action}
                className={`flex items-center justify-center p-3 sm:p-4 border-2 rounded-lg transition-colors cursor-pointer ${action.color} min-h-[60px] sm:min-h-[80px]`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.textColor} ml-2 flex-shrink-0`} />
                <span className={`${action.textColor} font-medium text-sm sm:text-base text-center`}>{action.title}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
