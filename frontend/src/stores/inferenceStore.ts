import { create } from 'zustand'
import { getInferenceWebSocketUrl } from '../services/api'

interface LOOMetrics {
  elpd: number
  se: number
  p_loo: number
  pareto_k?: {
    good: number
    ok: number
    bad: number
    very_bad: number
  }
  warning?: boolean
}

interface WAICMetrics {
  elpd: number
  se: number
  p_waic: number
  waic: number
  warning?: boolean
}

interface InferenceResult {
  success: boolean
  trace_plot?: string
  forest_plot?: string
  ppc_plot?: string
  summary?: any
  trace_samples_csv?: string
  loo?: LOOMetrics
  waic?: WAICMetrics
  error?: string
}

export type JobStatus =
  | 'PENDING'
  | 'BUILDING_MODEL'
  | 'SAMPLING'
  | 'POST_PREDICTIVE'
  | 'GENERATING_PLOTS'
  | 'COMPUTING_METRICS'
  | 'SUCCESS'
  | 'FAILURE'
  | 'CANCELLED'

interface JobProgress {
  job_id: string
  status: JobStatus
  progress: number
  stage: string
  error?: string | null
}

interface InferenceStore {
  result: InferenceResult | null
  isLoading: boolean
  // ジョブキュー関連
  jobId: string | null
  jobStatus: JobStatus | null
  progress: number
  stage: string
  ws: WebSocket | null
  // アクション
  setResult: (result: InferenceResult) => void
  setLoading: (loading: boolean) => void
  clearResult: () => void
  setJobId: (jobId: string) => void
  connectWebSocket: (jobId: string, onSuccess: () => void, onFailure: (error: string) => void) => void
  disconnectWebSocket: () => void
  cancelJob: () => void
  resetJob: () => void
}

export const useInferenceStore = create<InferenceStore>((set, get) => ({
  result: null,
  isLoading: false,
  jobId: null,
  jobStatus: null,
  progress: 0,
  stage: '',
  ws: null,

  setResult: (result) => set({ result, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearResult: () => set({ result: null, isLoading: false }),

  setJobId: (jobId) => set({ jobId }),

  connectWebSocket: (jobId, onSuccess, onFailure) => {
    const { ws: existingWs } = get()
    if (existingWs) {
      existingWs.close()
    }

    const wsUrl = getInferenceWebSocketUrl(jobId)
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data: JobProgress = JSON.parse(event.data)
        set({
          jobStatus: data.status,
          progress: data.progress,
          stage: data.stage,
        })

        if (data.status === 'SUCCESS') {
          onSuccess()
        } else if (data.status === 'FAILURE') {
          onFailure(data.error || '推論中にエラーが発生しました')
        } else if (data.status === 'CANCELLED') {
          set({ isLoading: false, jobStatus: 'CANCELLED', stage: 'キャンセルされました' })
        }
      } catch (e) {
        console.error('WebSocket message parse error:', e)
      }
    }

    ws.onerror = () => {
      console.error('WebSocket connection error')
    }

    ws.onclose = () => {
      set({ ws: null })
    }

    set({ ws, jobId, jobStatus: 'PENDING', progress: 0, stage: 'キューで待機中...' })
  },

  disconnectWebSocket: () => {
    const { ws } = get()
    if (ws) {
      ws.close()
      set({ ws: null })
    }
  },

  cancelJob: () => {
    const { ws } = get()
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send('cancel')
    }
  },

  resetJob: () => set({
    jobId: null,
    jobStatus: null,
    progress: 0,
    stage: '',
    isLoading: false,
  }),
}))
