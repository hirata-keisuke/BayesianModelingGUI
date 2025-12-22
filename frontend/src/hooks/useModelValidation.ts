import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api'
import { useModelStore } from '../stores/modelStore'

export const useModelValidation = (enabled = true) => {
  // ストアから直接nodesとedgesを監視
  const nodes = useModelStore(state => state.nodes)
  const edges = useModelStore(state => state.edges)
  const csvMetadata = useModelStore(state => state.csvMetadata)

  // モデルを構築
  const model = {
    nodes,
    edges,
    csvMetadata: csvMetadata || undefined
  }

  return useQuery({
    queryKey: ['modelValidation', nodes, edges],
    queryFn: async () => {
      const res = await apiClient.validateModel(model)
      return res.data
    },
    enabled: enabled && nodes.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 500
  })
}
