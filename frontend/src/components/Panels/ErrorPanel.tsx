import { Box, Text, VStack, Badge, HStack } from '@chakra-ui/react'
import { useModelValidation } from '../../hooks/useModelValidation'

export const ErrorPanel = () => {
  const { data: validation, isLoading } = useModelValidation(true)

  if (isLoading) {
    return (
      <Box h="100%" p={4}>
        <Text fontSize="sm" color="gray.500">Validating...</Text>
      </Box>
    )
  }

  if (!validation) {
    return (
      <Box h="100%" p={4}>
        <Text fontSize="sm" color="gray.500">No validation data</Text>
      </Box>
    )
  }

  const hasErrors = validation.errors && validation.errors.length > 0
  const hasWarnings = validation.warnings && validation.warnings.length > 0

  return (
    <Box h="100%" p={4} overflowY="auto">
      <HStack spacing={4} mb={2}>
        <Text fontWeight="bold" fontSize="sm">Validation:</Text>
        {validation.valid ? (
          <Badge colorScheme="green">Valid</Badge>
        ) : (
          <Badge colorScheme="red">Invalid</Badge>
        )}
      </HStack>

      {hasErrors && (
        <VStack spacing={2} align="start" mt={2}>
          {validation.errors.map((error: any, idx: number) => (
            <Box key={idx} p={2} bg="red.50" borderLeft="3px solid" borderColor="red.500" w="100%">
              <Text fontSize="xs" fontWeight="bold" color="red.700">
                {error.type}
              </Text>
              <Text fontSize="xs" color="red.600">
                {error.message}
              </Text>
              {error.node_id && (
                <Text fontSize="xs" color="red.500">
                  Node: {error.node_id}
                </Text>
              )}
            </Box>
          ))}
        </VStack>
      )}

      {hasWarnings && (
        <VStack spacing={2} align="start" mt={2}>
          {validation.warnings.map((warning: any, idx: number) => (
            <Box key={idx} p={2} bg="yellow.50" borderLeft="3px solid" borderColor="yellow.500" w="100%">
              <Text fontSize="xs" fontWeight="bold" color="yellow.700">
                Warning
              </Text>
              <Text fontSize="xs" color="yellow.600">
                {warning.message}
              </Text>
            </Box>
          ))}
        </VStack>
      )}

      {!hasErrors && !hasWarnings && (
        <Text fontSize="sm" color="green.600" mt={2}>
          No errors or warnings
        </Text>
      )}
    </Box>
  )
}
