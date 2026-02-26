import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Box, Text, Badge, VStack, Tooltip, useColorModeValue } from '@chakra-ui/react'
import { NodeData } from '../../types/model'

const CustomNode = ({ data }: NodeProps<NodeData>) => {
  const bgColor = data.observed ? 'gray.200' : 'white'
  const borderColor = data.type === 'data' ? 'blue.500' : data.type === 'computed' ? 'green.500' : 'purple.500'
  const descriptionColor = useColorModeValue('gray.500', 'gray.400')

  return (
    <Box
      bg={bgColor}
      border="2px"
      borderColor={borderColor}
      borderRadius="md"
      p={3}
      minW="140px"
      cursor="pointer"
      _hover={{ shadow: 'md', borderColor: 'purple.600' }}
      transition="all 0.2s"
    >
      <Handle type="target" position={Position.Top} style={{ background: '#553C9A' }} />

      <VStack spacing={1} align="start">
        <Text fontWeight="bold" fontSize="sm" color="gray.800">
          {data.name}
        </Text>

        {data.distribution && (
          <Badge colorScheme="purple" fontSize="xs">
            {data.distribution}
          </Badge>
        )}

        {data.type === 'data' && (
          <Badge colorScheme="blue" fontSize="xs">
            Data
          </Badge>
        )}

        {data.type === 'computed' && (
          <Badge colorScheme="green" fontSize="xs">
            Computed
          </Badge>
        )}

        {data.expression && (
          <Text fontSize="xs" color="gray.600" fontFamily="mono" isTruncated maxW="200px">
            {data.expression}
          </Text>
        )}

        {data.observed && (
          <Badge colorScheme="orange" fontSize="xs">
            Observed
          </Badge>
        )}

        {data.description && (
          <Tooltip label={data.description} hasArrow placement="bottom" openDelay={300}>
            <Text fontSize="xs" color={descriptionColor} isTruncated maxW="140px">
              {data.description.length > 20 ? data.description.slice(0, 20) + '...' : data.description}
            </Text>
          </Tooltip>
        )}
      </VStack>

      <Handle type="source" position={Position.Bottom} style={{ background: '#553C9A' }} />
    </Box>
  )
}

export default memo(CustomNode)
