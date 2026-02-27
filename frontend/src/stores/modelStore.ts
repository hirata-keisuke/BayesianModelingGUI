import { create } from 'zustand'
import { NodeData, EdgeData, ModelData, CSVMetadata } from '../types/model'

const MAX_HISTORY = 50

interface Snapshot {
  nodes: NodeData[]
  edges: EdgeData[]
}

interface ModelStore {
  nodes: NodeData[]
  edges: EdgeData[]
  selectedNode: string | null
  selectedNodeIds: string[]
  clipboard: NodeData[]
  csvMetadata: CSVMetadata | null

  // Undo/Redo
  undoStack: Snapshot[]
  redoStack: Snapshot[]
  canUndo: boolean
  canRedo: boolean

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

  undo: () => void
  redo: () => void
}

function takeSnapshot(state: { nodes: NodeData[]; edges: EdgeData[] }): Snapshot {
  return {
    nodes: state.nodes.map(n => ({ ...n, position: { ...n.position }, parameters: { ...n.parameters } })),
    edges: state.edges.map(e => ({ ...e })),
  }
}

function pushUndo(state: { nodes: NodeData[]; edges: EdgeData[]; undoStack: Snapshot[] }) {
  const snapshot = takeSnapshot(state)
  const newStack = [...state.undoStack, snapshot]
  if (newStack.length > MAX_HISTORY) {
    newStack.shift()
  }
  return { undoStack: newStack, redoStack: [] as Snapshot[], canUndo: true, canRedo: false }
}

let pasteCounter = 0

export const useModelStore = create<ModelStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedNodeIds: [],
  clipboard: [],
  csvMetadata: null,
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  addNode: (node) => set((state) => ({
    ...pushUndo(state),
    nodes: [...state.nodes, node]
  })),

  updateNode: (id, data) => set((state) => ({
    ...pushUndo(state),
    nodes: state.nodes.map(n => n.id === id ? { ...n, ...data } : n)
  })),

  updateNodePosition: (id, position) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, position } : n)
  })),

  deleteNode: (id) => set((state) => ({
    ...pushUndo(state),
    nodes: state.nodes.filter(n => n.id !== id),
    edges: state.edges.filter(e => e.source !== id && e.target !== id),
    selectedNode: state.selectedNode === id ? null : state.selectedNode
  })),

  addEdge: (edge) => set((state) => ({
    ...pushUndo(state),
    edges: [...state.edges, edge]
  })),

  deleteEdge: (id) => set((state) => ({
    ...pushUndo(state),
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

  loadModel: (model) => set((state) => ({
    ...pushUndo(state),
    nodes: model.nodes,
    edges: model.edges,
    csvMetadata: model.csvMetadata || null
  })),

  reset: () => set((state) => ({
    ...pushUndo(state),
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedNodeIds: [],
    clipboard: [],
    csvMetadata: null
  })),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state
    const newUndoStack = [...state.undoStack]
    const snapshot = newUndoStack.pop()!
    const currentSnapshot = takeSnapshot(state)
    const newRedoStack = [...state.redoStack, currentSnapshot]
    return {
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: newUndoStack.length > 0,
      canRedo: true,
    }
  }),

  redo: () => set((state) => {
    if (state.redoStack.length === 0) return state
    const newRedoStack = [...state.redoStack]
    const snapshot = newRedoStack.pop()!
    const currentSnapshot = takeSnapshot(state)
    const newUndoStack = [...state.undoStack, currentSnapshot]
    return {
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: true,
      canRedo: newRedoStack.length > 0,
    }
  }),
}))
