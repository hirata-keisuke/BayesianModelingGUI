export enum NodeType {
  VARIABLE = 'variable',
  DATA = 'data',
  COMPUTED = 'computed'
}

export interface NodeData {
  id: string
  type: NodeType
  name: string
  distribution?: string
  parameters: Record<string, any>
  description?: string  // ノードのメモ・説明文
  expression?: string  // 計算ノード用の式
  shape?: number[]
  observed: boolean
  observedDataSource?: string  // 単一列参照（後方互換性）
  observedDataSources?: string[]  // 複数列参照（多変量分布用）
  position: { x: number; y: number }
}

export interface EdgeData {
  id: string
  source: string
  target: string
  sourceParam?: string
}

export interface ModelData {
  nodes: NodeData[]
  edges: EdgeData[]
  csvMetadata?: CSVMetadata
}

export interface CSVMetadata {
  file_id: string
  filename: string
  columns: Array<{
    name: string
    dtype: string
    role: 'observed' | 'feature' | 'unused'
  }>
  rows: number
}
