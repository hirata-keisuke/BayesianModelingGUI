import { useState, useEffect } from 'react'
import { useModelStore } from '../../../stores/modelStore'
import { NodeType, EdgeData } from '../../../types/model'

export const useNodeEditor = (selectedNode: string | null, distributions?: any) => {
  const { nodes, edges, updateNode, addEdge, deleteEdge, csvMetadata } = useModelStore()
  const node = nodes.find(n => n.id === selectedNode)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [distribution, setDistribution] = useState('')
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [parameterTypes, setParameterTypes] = useState<Record<string, 'value' | 'reference'>>({})
  const [observed, setObserved] = useState(false)
  const [observedDataSource, setObservedDataSource] = useState('')
  const [observedDataSources, setObservedDataSources] = useState<string[]>([])
  const [expression, setExpression] = useState('')
  const [shape, setShape] = useState<number[]>([])
  const [shapeInput, setShapeInput] = useState('')

  // Filter data nodes
  const dataNodes = nodes.filter(n => n.type === NodeType.DATA)

  // Helper function to get the role of a data node
  const getDataNodeRole = (dataNodeId: string): 'observed' | 'feature' | 'unused' | null => {
    const dataNode = dataNodes.find(n => n.id === dataNodeId)
    if (!dataNode || !csvMetadata) return null

    const columnName = dataNode.parameters?.column
    if (!columnName) return null

    const columnInfo = csvMetadata.columns.find(col => col.name === columnName)
    return columnInfo?.role || null
  }

  useEffect(() => {
    if (node) {
      setName(node.name)
      setDescription(node.description || '')
      setDistribution(node.distribution || '')
      setParameters(node.parameters || {})
      setObserved(node.observed)
      setObservedDataSource(node.observedDataSource || '')
      setObservedDataSources(node.observedDataSources || [])
      setExpression(node.expression || '')
      setShape(node.shape || [])
      setShapeInput(node.shape ? JSON.stringify(node.shape) : '')

      // パラメータのタイプを初期化（@で始まる場合は参照）
      const types: Record<string, 'value' | 'reference'> = {}
      Object.entries(node.parameters || {}).forEach(([key, value]) => {
        types[key] = typeof value === 'string' && value.startsWith('@') ? 'reference' : 'value'
      })
      setParameterTypes(types)
    }
  }, [node])

  // observedDataSourceが変更されたときに、featureデータの場合は分布をクリアする
  useEffect(() => {
    if (observedDataSource) {
      const role = getDataNodeRole(observedDataSource)
      if (role === 'feature') {
        // Featureデータが紐づけられた場合、分布を空にする
        setDistribution('')
        setParameters({})
      }
    }
  }, [observedDataSource])

  // 分布変更時にパラメータをクリアするハンドラー
  const handleDistributionChange = (newDistribution: string) => {
    // 分布が実際に変更された場合のみパラメータをクリア
    if (newDistribution !== distribution) {
      setParameters({})
      setParameterTypes({})
    }

    setDistribution(newDistribution)
  }

  const handleSave = (onClose: () => void) => {
    if (selectedNode) {
      // パラメータをそのまま保存（配列以外は文字列として保持）
      // 数値への変換はバックエンドで行う
      const finalParameters: Record<string, any> = {}

      // 現在の分布のパラメータ定義を取得
      const distInfo = distributions?.[distribution]

      // 未入力のパラメータにデフォルト値を設定
      if (distInfo && distInfo.params) {
        for (const [paramName, paramMeta] of Object.entries(distInfo.params)) {
          const currentValue = parameters[paramName]
          const meta = paramMeta as any

          // 値が未入力（undefined、空文字列、null）の場合
          if (currentValue === undefined || currentValue === '' || currentValue === null) {
            // デフォルト値が存在する場合は設定
            if (meta.default !== undefined && meta.default !== null) {
              finalParameters[paramName] = meta.default
            }
          } else {
            // 既に入力されている場合はそのまま使用
            finalParameters[paramName] = currentValue
          }
        }
      }

      // 分布定義にないパラメータも保持（既存の動作を維持）
      for (const [key, value] of Object.entries(parameters)) {
        if (!(key in finalParameters)) {
          finalParameters[key] = value
        }
      }

      updateNode(selectedNode, {
        name,
        description: description || undefined,
        distribution: distribution || undefined,
        parameters: finalParameters,
        observed,
        observedDataSource: observedDataSource || undefined,
        observedDataSources: observedDataSources.length > 0 ? observedDataSources : undefined,
        expression: expression || undefined,
        shape: shape.length > 0 ? shape : undefined
      })

      // 現在のノードへの全ての入力エッジを削除
      const oldEdges = edges.filter((e: EdgeData) => e.target === selectedNode)
      oldEdges.forEach((edge: EdgeData) => {
        deleteEdge(edge.id)
      })

      // 参照ノードを使用している場合、新しいエッジを作成
      const referencedNodeNames = new Set<string>()

      // パラメータから参照ノードを抽出
      Object.values(finalParameters).forEach((value: any) => {
        if (typeof value === 'string' && value.startsWith('@')) {
          referencedNodeNames.add(value.slice(1))
        }
      })

      // 決定論的ノードの式から参照ノードを抽出
      if (expression) {
        const matches = expression.match(/@(\w+)/g)
        if (matches) {
          matches.forEach((match: string) => {
            referencedNodeNames.add(match.slice(1))
          })
        }
      }

      // 参照されているノードに対してエッジを作成
      referencedNodeNames.forEach((refName: string) => {
        const sourceNode = nodes.find((n: any) => n.name === refName)
        if (sourceNode) {
          const edgeId = `${sourceNode.id}-${selectedNode}`
          addEdge({
            id: edgeId,
            source: sourceNode.id,
            target: selectedNode
          })
        }
      })
    }
    onClose()
  }

  const handleParameterChange = (param: string, value: string, type: 'value' | 'reference') => {
    let finalValue: any = value

    if (type === 'value') {
      // 配列のみパース、それ以外は文字列として保持
      // 数値への変換はhandleSave時に行う
      if (value === '') {
        finalValue = ''
      } else {
        // JSON配列形式（[1, 2]や[[1, 0], [0, 1]]）のパース試行
        const trimmed = value.trim()
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed)
            // 配列として正しくパースできた場合はそのまま使用
            if (Array.isArray(parsed)) {
              finalValue = parsed
            } else {
              // 配列でない場合は文字列として扱う
              finalValue = value
            }
          } catch (e) {
            // JSONパースエラーの場合は文字列として保持
            finalValue = value
          }
        } else {
          // 配列でない場合は文字列として保持（数値変換はhandleSave時）
          finalValue = value
        }
      }
    } else {
      // 参照の場合は@をプレフィックスとして追加
      finalValue = value.startsWith('@') ? value : `@${value}`
    }

    setParameters(prev => ({
      ...prev,
      [param]: finalValue
    }))
  }

  const handleParameterTypeChange = (param: string, type: 'value' | 'reference') => {
    setParameterTypes(prev => ({
      ...prev,
      [param]: type
    }))

    // タイプが変わったら値をクリア
    setParameters(prev => ({
      ...prev,
      [param]: type === 'value' ? '' : ''
    }))
  }

  const handleShapeChange = (value: string) => {
    setShapeInput(value)

    // 空文字列の場合は空配列
    if (value.trim() === '') {
      setShape([])
      return
    }

    try {
      // JSON形式でパース（[8], [3, 4]など）
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed) && parsed.every(v => typeof v === 'number' && v > 0)) {
        setShape(parsed)
      }
    } catch (e) {
      // パースエラーは無視（入力中の状態を許容）
    }
  }

  // 現在選択されているデータソースのroleを取得
  const selectedDataNodeRole = observedDataSource ? getDataNodeRole(observedDataSource) : null
  const isFeatureData = selectedDataNodeRole === 'feature'

  return {
    node,
    name,
    setName,
    description,
    setDescription,
    distribution,
    setDistribution: handleDistributionChange,
    parameters,
    parameterTypes,
    observed,
    setObserved,
    observedDataSource,
    setObservedDataSource,
    observedDataSources,
    setObservedDataSources,
    dataNodes,
    expression,
    setExpression,
    shape,
    shapeInput,
    handleShapeChange,
    isFeatureData,
    handleSave,
    handleParameterChange,
    handleParameterTypeChange
  }
}
