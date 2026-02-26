import { useCallback, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeChange,
  applyNodeChanges
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Box, useColorModeValue } from '@chakra-ui/react'
import { useModelStore } from '../../stores/modelStore'
import CustomNode from './CustomNode'
import { NodeData } from '../../types/model'

const nodeTypes = {
  custom: CustomNode
}

export const ModelCanvas = () => {
  const { nodes, edges, addEdge: addEdgeToStore, setSelectedNode, deleteNode, deleteEdge, updateNodePosition } = useModelStore()
  const minimapBg = useColorModeValue('#f7fafc', '#1a202c')
  const minimapMaskColor = useColorModeValue('rgb(240, 240, 240, 0.6)', 'rgb(0, 0, 0, 0.6)')

  const [rfNodes, setNodes, onNodesChange] = useNodesState([])
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState([])

  // Zustand stateからReact Flowのノードに変換（IDベースで差分更新）
  useEffect(() => {
    setNodes((currentNodes) => {
      const nodeMap = new Map(currentNodes.map(n => [n.id, n]))
      const updatedNodes: Node<NodeData>[] = []
      const addedIds = new Set<string>()

      // 既存ノードを更新または追加
      nodes.forEach(n => {
        addedIds.add(n.id)
        const existingNode = nodeMap.get(n.id)

        if (existingNode) {
          // 既存ノードの場合、dataのみ更新し、positionはReact Flowの状態を保持
          updatedNodes.push({
            ...existingNode,
            data: n
          })
        } else {
          // 新規ノードの場合
          updatedNodes.push({
            id: n.id,
            type: 'custom',
            position: n.position,
            data: n
          })
        }
      })

      return updatedNodes
    })
  }, [nodes, setNodes])

  // Zustand stateからReact Flowのエッジに変換
  useEffect(() => {
    const flowEdges: Edge[] = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#805AD5', strokeWidth: 2 },
      markerEnd: {
        type: 'arrowclosed',
        color: '#805AD5',
        width: 20,
        height: 20
      }
    }))
    setEdges(flowEdges)
  }, [edges, setEdges])

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      const edgeId = `${params.source}-${params.target}`
      addEdgeToStore({
        id: edgeId,
        source: params.source,
        target: params.target
      })
    }
  }, [addEdgeToStore])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id)
  }, [setSelectedNode])

  const onNodesDelete = useCallback((deleted: Node[]) => {
    deleted.forEach(node => deleteNode(node.id))
  }, [deleteNode])

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    deleted.forEach(edge => deleteEdge(edge.id))
  }, [deleteEdge])

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // React Flowのデフォルトの変更を適用
    onNodesChange(changes)

    // 位置変更をZustandストアに保存
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        // ドラッグが終了したときのみ保存
        updateNodePosition(change.id, change.position)
      }
    })
  }, [onNodesChange, updateNodePosition])

  return (
    <Box h="100%" w="100%">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          style={{ backgroundColor: minimapBg }}
          maskColor={minimapMaskColor}
          nodeColor={(node) => {
            const data = node.data as NodeData
            switch (data.type) {
              case 'variable': return '#3182CE'  // blue
              case 'data': return '#38A169'       // green
              case 'computed': return '#DD6B20'   // orange
              default: return '#805AD5'
            }
          }}
        />
      </ReactFlow>
    </Box>
  )
}
