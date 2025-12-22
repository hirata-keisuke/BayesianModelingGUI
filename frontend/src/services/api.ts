import axios from 'axios'
import { ModelData } from '../types/model'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const apiClient = {
  // CSV関連
  uploadCSV: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/csv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  getCSVPreview: async (fileId: string) => {
    return api.get(`/api/csv/preview/${fileId}`)
  },

  // 分布関連
  getDistributions: async () => {
    return api.get('/api/distributions')
  },

  getDistributionParams: async (distName: string) => {
    return api.get(`/api/distributions/${distName}/params`)
  },

  // バリデーション
  validateModel: async (model: ModelData) => {
    return api.post('/api/validation/model', model)
  },

  validateNode: async (node: any) => {
    return api.post('/api/validation/node', node)
  },

  // コード生成
  generateCode: async (model: ModelData) => {
    return api.post('/api/codegen/generate', model)
  },

  // 推論実行
  runInference: async (request: any) => {
    return api.post('/api/inference/run', request)
  },

  // 事前予測チェック
  runPriorPredictive: async (request: any) => {
    return api.post('/api/inference/prior-predictive', request)
  }
}
