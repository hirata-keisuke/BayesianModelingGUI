import { create } from 'zustand'
import { NodeData, EdgeData, ModelData, CSVMetadata } from '../types/model'

interface ModelStore {
  nodes: NodeData[]
  edges: EdgeData[]
  selectedNode: string | null
  csvMetadata: CSVMetadata | null

  addNode: (node: NodeData) => void
  updateNode: (id: string, data: Partial<NodeData>) => void
  updateNodePosition: (id: string, position: { x: number; y: number }) => void
  deleteNode: (id: string) => void

  addEdge: (edge: EdgeData) => void
  deleteEdge: (id: string) => void

  setSelectedNode: (id: string | null) => void
  setCsvMetadata: (metadata: CSVMetadata | null) => void

  getModel: () => ModelData
  loadModel: (model: ModelData) => void
  reset: () => void
}

export const useModelStore = create<ModelStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
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

  setCsvMetadata: (metadata) => set({ csvMetadata: metadata }),

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
    csvMetadata: null
  })
}))
