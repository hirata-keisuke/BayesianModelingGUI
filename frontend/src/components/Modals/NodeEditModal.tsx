import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Badge
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/api'
import { useModelStore } from '../../stores/modelStore'
import { useNodeEditor } from './hooks/useNodeEditor'
import { ComputedNodeEditor } from './components/ComputedNodeEditor'
import { VariableNodeEditor } from './components/VariableNodeEditor'

interface NodeEditModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NodeEditModal = ({ isOpen, onClose }: NodeEditModalProps) => {
  const { nodes, selectedNode } = useModelStore()

  const { data: distributions } = useQuery({
    queryKey: ['distributions'],
    queryFn: async () => {
      const res = await apiClient.getDistributions()
      return res.data
    }
  })

  const {
    node,
    name,
    setName,
    description,
    setDescription,
    distribution,
    setDistribution,
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
    shapeInput,
    handleShapeChange,
    isFeatureData,
    handleSave,
    handleParameterChange,
    handleParameterTypeChange
  } = useNodeEditor(selectedNode, distributions)

  // 参照可能なノード（現在のノード以外の変数ノードと決定論的ノード）
  const availableNodes = nodes.filter(n =>
    n.id !== selectedNode &&
    (n.type === 'variable' || n.type === 'computed') &&
    n.name
  )

  if (!node) return null

  const getBadgeColor = () => {
    if (node.type === 'data') return 'blue'
    if (node.type === 'computed') return 'green'
    return 'purple'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          Edit Node: {node.name}
          <Badge ml={2} colorScheme={getBadgeColor()}>
            {node.type}
          </Badge>
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Variable name"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">メモ</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このノードの説明や用途を記述..."
                size="sm"
                rows={2}
                resize="vertical"
              />
            </FormControl>

            {node.type === 'computed' && (
              <ComputedNodeEditor
                expression={expression}
                setExpression={setExpression}
                availableNodes={availableNodes}
              />
            )}

            {node.type === 'variable' && (
              <VariableNodeEditor
                distribution={distribution}
                setDistribution={setDistribution}
                distributions={distributions}
                parameters={parameters}
                parameterTypes={parameterTypes}
                observed={observed}
                setObserved={setObserved}
                observedDataSource={observedDataSource}
                setObservedDataSource={setObservedDataSource}
                observedDataSources={observedDataSources}
                setObservedDataSources={setObservedDataSources}
                availableNodes={availableNodes}
                dataNodes={dataNodes}
                isFeatureData={isFeatureData}
                shapeInput={shapeInput}
                onShapeChange={handleShapeChange}
                onParameterChange={handleParameterChange}
                onParameterTypeChange={handleParameterTypeChange}
              />
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="purple" onClick={() => handleSave(onClose)}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
