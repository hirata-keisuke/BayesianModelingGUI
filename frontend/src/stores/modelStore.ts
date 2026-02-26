import { create } from 'zustand'
import { NodeData, EdgeData, ModelData, CSVMetadata } from '../types/model'

interface ModelStore {
  nodes: NodeData[]
  edges: EdgeData[]
  selectedNode: string | null
  selectedNodeIds: string[]
  clipboard: NodeData[]
  csvMetadata: CSVMetadata | null

  addNode: (node: NodeData) => void
  updateNode: (id: string, data: Partial<NodeData>) => void
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  deleteNode: (id: string) => void

  addEdge: (edge: EdgeData) => void
  deleteEdge: (id: string) => void

  setSelectedNode: (id: string | null) => void
  setSelectedNodeIds: (ids: string[]) => void
  setCsvMetadata: (metadata: CSVMetadata | null) => void

  copySelectedNodes: () => void
  pasteNodes: () => void

  getModel: () => ModelData
  loadModel: (model: ModelData) => void
  reset: () => void
}

let pasteCounter = 0

export const useModelStore = create<ModelStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedNodeIds: [],
  clipboard: [],
  csvMetadata: null,

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),

  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, ...data } : n)
  })),

  updateNodePosition: (id, position) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, position } : n)
  })),

  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id),
    edges: state.edges.filter(e => e.source !== id && e.target !== id),
    selectedNode: state.selectedNode === id ? null : state.selectedNode
  })),

  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge]
  })),

  deleteEdge: (id) => set((state) => ({
    edges: state.edges.filter(e => e.id !== id)
  })),

  setSelectedNode: (id) => set({ selectedNode: id }),

  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

  setCsvMetadata: (metadata) => set({ csvMetadata: metadata }),

  copySelectedNodes: () => {
    const state = get()
    const ids = state.selectedNodeIds.length > 0
      ? state.selectedNodeIds
      : state.selectedNode ? [state.selectedNode] : []
    if (ids.length === 0) return

    const nodesToCopy = state.nodes
      .filter(n => ids.includes(n.id))
      .map(n => ({ ...n, position: { ...n.position }, parameters: { ...n.parameters } }))
    pasteCounter = 0
    set({ clipboard: nodesToCopy })
  },

  pasteNodes: () => {
    const state = get()
    if (state.clipboard.length === 0) return

    pasteCounter++
    const offset = pasteCounter * 20

    const newNodes: NodeData[] = state.clipboard.map(n => ({
      ...n,
      id: `${n.id}_copy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${n.name}_copy`,
      parameters: { ...n.parameters },
      position: {
        x: n.position.x + offset,
        y: n.position.y + offset
      }
    }))

    set((s) => ({
      nodes: [...s.nodes, ...newNodes]
    }))
  },

  getModel: () => {
    const state = get()
    return {
      nodes: state.nodes,
      edges: state.edges,
      csvMetadata: state.csvMetadata || undefined
    }
  },

  loadModel: (model) => set({
    nodes: model.nodes,
    edges: model.edges,
    csvMetadata: model.csvMetadata || null
  }),

  reset: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedNodeIds: [],
    clipboard: [],
    csvMetadata: null
  })
}))
