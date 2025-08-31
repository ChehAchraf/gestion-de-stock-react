import { useState } from 'react'
import { SignIn } from '@clerk/clerk-react'
import { ShoppingCart, TrendingUp, Package, BarChart3 } from 'lucide-react'

export default function WelcomePage() {
  const [showSignIn, setShowSignIn] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            نظام إدارة المنتجات والمبيعات
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            نظام متكامل لإدارة المخزون والمبيعات مع تقارير مفصلة وإحصائيات دقيقة
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Package className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">إدارة المنتجات</h3>
            <p className="text-gray-600">إضافة وتعديل وحذف المنتجات بسهولة</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ShoppingCart className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">المبيعات</h3>
            <p className="text-gray-600">تسجيل المبيعات وتحديث المخزون تلقائياً</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">التقارير</h3>
            <p className="text-gray-600">تقارير مفصلة وإحصائيات المبيعات</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <BarChart3 className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">الباركود</h3>
            <p className="text-gray-600">مسح الباركود يدوياً أو عبر الصور</p>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          onClick={() => setShowSignIn(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
        >
          تسجيل الدخول
        </button>

        {/* Sign In Modal */}
        {showSignIn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">تسجيل الدخول</h2>
                <button
                  onClick={() => setShowSignIn(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <SignIn />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
