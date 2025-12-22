import { Box, Text, HStack, Badge } from '@chakra-ui/react'
import { useModelStore } from '../../stores/modelStore'

export const StatusBar = () => {
  const nodes = useModelStore(state => state.nodes)
  const edges = useModelStore(state => state.edges)

  return (
    <Box bg="gray.100" px={6} py={2} borderTop="1px" borderColor="gray.200">
      <HStack spacing={4}>
        <Text fontSize="sm" fontWeight="medium">Status:</Text>
        <Badge colorScheme="blue">{nodes.length} Nodes</Badge>
        <Badge colorScheme="green">{edges.length} Connections</Badge>
      </HStack>
    </Box>
  )
}
