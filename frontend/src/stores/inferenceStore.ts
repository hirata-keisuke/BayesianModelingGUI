import { create } from 'zustand'

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

interface InferenceStore {
  result: InferenceResult | null
  isLoading: boolean
  setResult: (result: InferenceResult) => void
  setLoading: (loading: boolean) => void
  clearResult: () => void
}

export const useInferenceStore = create<InferenceStore>((set) => ({
  result: null,
  isLoading: false,
  setResult: (result) => set({ result, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearResult: () => set({ result: null, isLoading: false })
}))
