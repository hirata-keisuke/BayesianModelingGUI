import { VStack, Button, Text, Box, Divider } from '@chakra-ui/react'
import { useModelStore } from '../../stores/modelStore'
import { NodeType } from '../../types/model'
import { DataPanel } from './DataPanel'

export const ToolPanel = () => {
  const addNode = useModelStore(state => state.addNode)

  const handleAddNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: NodeType.VARIABLE,
      name: `var_${Date.now()}`,
      parameters: {},
      observed: false,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 }
    }
    addNode(newNode)
  }

  const handleAddComputedNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: NodeType.COMPUTED,
      name: `comp_${Date.now()}`,
      parameters: {},
      expression: '',
      observed: false,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 }
    }
    addNode(newNode)
  }

  return (
    <Box h="100%" overflowY="auto">
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontWeight="bold" mb={2} fontSize="sm" color="gray.600">
            ADD NODES
          </Text>
          <VStack spacing={2}>
            <Button
              size="sm"
              w="100%"
              colorScheme="purple"
              onClick={handleAddNode}
            >
              + Variable Node
            </Button>
            <Button
              size="sm"
              w="100%"
              colorScheme="green"
              onClick={handleAddComputedNode}
            >
              + Computed Node
            </Button>
          </VStack>
        </Box>

        <Divider />

        <DataPanel />

        <Divider />

        <Box>
          <Text fontWeight="bold" mb={2} fontSize="sm" color="gray.600">
            INSTRUCTIONS
          </Text>
          <VStack spacing={2} align="start" fontSize="xs" color="gray.600">
            <Text>1. CSVファイルをアップロードする (任意)</Text>
            <Text>2. 変数ノードを追加する</Text>
            <Text>3. ノードをクリックして設定を編集する</Text>
            <Text>4. ドラッグかノードの設定でノードを繋ぐ</Text>
            <Text>6. コードを生成する</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  )
}
