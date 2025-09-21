import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = 'http://127.0.0.1:8000/api'

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...options,
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Products queries
export const useProducts = (page = 1, searchTerm = '', limit = 8) => {
  return useQuery({
    queryKey: ['products', page, searchTerm, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await apiCall(`/products?${params}`)
      
      return {
        data: response.data,
        totalCount: response.total,
        currentPage: response.current_page,
        lastPage: response.last_page,
      }
    },
    keepPreviousData: true,
  })
}

export const useProductsForSales = () => {
  return useQuery({
    queryKey: ['products-for-sales'],
    queryFn: async () => {
      const response = await apiCall('/products-for-sales')
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Categories queries
export const useCategories = (page = 1, searchTerm = '', limit = 10) => {
  return useQuery({
    queryKey: ['categories', page, searchTerm, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await apiCall(`/categories?${params}`)
      
      return {
        data: response.data,
        totalCount: response.total,
        currentPage: response.current_page,
        lastPage: response.last_page,
      }
    },
    keepPreviousData: true,
  })
}

export const useCategoriesForSelect = () => {
  return useQuery({
    queryKey: ['categories-for-select'],
    queryFn: async () => {
      const response = await apiCall('/categories-for-select')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Sales queries
export const useSales = (page = 1, limit = 8) => {
  return useQuery({
    queryKey: ['sales', page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
      })

      const response = await apiCall(`/sales?${params}`)
      
      return {
        data: response.data,
        totalCount: response.total,
        currentPage: response.current_page,
        lastPage: response.last_page,
      }
    },
    keepPreviousData: true,
  })
}

// Reports queries
export const useReports = (dateRange = 'all') => {
  return useQuery({
    queryKey: ['reports', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange !== 'all') {
        params.append('date_range', dateRange)
      }

      const response = await apiCall(`/reports?${params}`)
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Dashboard stats query
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiCall('/reports/dashboard')
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Mutations
export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (productData) => {
      const response = await apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['products-for-sales'])
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...productData }) => {
      const response = await apiCall(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['products-for-sales'])
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiCall(`/products/${id}`, {
        method: 'DELETE',
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['products-for-sales'])
    },
  })
}

export const useBulkDeleteProducts = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (ids) => {
      const response = await apiCall('/products/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['products-for-sales'])
    },
  })
}

export const useDeleteAllProducts = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiCall('/products/delete-all', {
        method: 'DELETE',
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['products-for-sales'])
    },
  })
}

export const useCreateSale = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (saleData) => {
      const response = await apiCall('/sales', {
        method: 'POST',
        body: JSON.stringify(saleData),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sales'])
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['products-for-sales'])
      queryClient.invalidateQueries(['reports'])
    },
  })
}

export const useUpdateSale = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...saleData }) => {
      const response = await apiCall(`/sales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(saleData),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sales'])
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['products-for-sales'])
      queryClient.invalidateQueries(['reports'])
    },
  })
}

export const useDeleteSale = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      await apiCall(`/sales/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sales'])
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['dashboard-stats'])
      queryClient.invalidateQueries(['products-for-sales'])
      queryClient.invalidateQueries(['reports'])
    },
  })
}

// Category mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (categoryData) => {
      const response = await apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
      queryClient.invalidateQueries(['categories-for-select'])
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...categoryData }) => {
      const response = await apiCall(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
      queryClient.invalidateQueries(['categories-for-select'])
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiCall(`/categories/${id}`, {
        method: 'DELETE',
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
      queryClient.invalidateQueries(['categories-for-select'])
      queryClient.invalidateQueries(['products'])
    },
  })
}
