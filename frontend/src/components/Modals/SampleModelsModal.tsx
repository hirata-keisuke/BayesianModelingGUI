import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Box,
  Text,
  HStack,
  Badge,
  useToast
} from '@chakra-ui/react'
import { sampleModels, sampleModelDescriptions } from '../../utils/sampleModels'
import { useModelStore } from '../../stores/modelStore'

interface SampleModelsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SampleModelsModal = ({ isOpen, onClose }: SampleModelsModalProps) => {
  const { loadModel } = useModelStore()
  const toast = useToast()

  const handleLoadSample = (key: string) => {
    const model = sampleModels[key]
    if (model) {
      loadModel(model)
      toast({
        title: 'Sample model loaded',
        description: sampleModelDescriptions[key].name,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sample Models</ModalHeader>
        <ModalBody>
          <VStack spacing={3} align="stretch">
            {Object.entries(sampleModelDescriptions).map(([key, info]) => {
              const model = sampleModels[key]
              return (
                <Box
                  key={key}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  _hover={{ bg: 'gray.50', cursor: 'pointer', borderColor: 'purple.500' }}
                  onClick={() => handleLoadSample(key)}
                  transition="all 0.2s"
                >
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" fontSize="md">
                      {info.name}
                    </Text>
                    <HStack>
                      <Badge colorScheme="purple">{model.nodes.length} nodes</Badge>
                      <Badge colorScheme="green">{model.edges.length} edges</Badge>
                    </HStack>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {info.description}
                  </Text>
                </Box>
              )
            })}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
