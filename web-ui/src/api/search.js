import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.error || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

/**
 * 搜索日志
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export const searchLogs = (params) => {
  return apiClient.post('/search', params)
}

/**
 * 获取可用字段列表
 * @returns {Promise}
 */
export const getFields = () => {
  return apiClient.get('/fields')
}

/**
 * 获取服务名称列表
 * @returns {Promise}
 */
export const getServices = () => {
  return apiClient.get('/services')
}

/**
 * 健康检查
 * @returns {Promise}
 */
export const healthCheck = () => {
  return axios.get('/health')
}

export default apiClient
