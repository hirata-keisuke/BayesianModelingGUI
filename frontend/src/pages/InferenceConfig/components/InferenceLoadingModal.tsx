import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Spinner,
  Heading,
  Text,
  Progress
} from '@chakra-ui/react'

interface InferenceLoadingModalProps {
  isOpen: boolean
  inferenceMethod: 'MCMC' | 'VI'
  sampler?: string
  chains?: number
  draws?: number
  viMethod?: string
  viIterations?: number
}

export const InferenceLoadingModal = ({
  isOpen,
  inferenceMethod,
  sampler,
  chains,
  draws,
  viMethod,
  viIterations
}: InferenceLoadingModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnOverlayClick={false} isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
      <ModalContent bg="white" maxW="md" boxShadow="2xl">
        <ModalBody py={10}>
          <VStack spacing={6}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="purple.500"
              size="xl"
            />
            <VStack spacing={2}>
              <Heading size="md" color="purple.600">
                推論を実行中...
              </Heading>
              <Text color="gray.600" fontSize="sm" textAlign="center">
                {inferenceMethod === 'MCMC'
                  ? `${sampler}サンプラーで${chains}チェーン × ${draws}サンプルを実行中`
                  : `${viMethod}で${viIterations}回の反復を実行中`
                }
              </Text>
              <Text color="gray.500" fontSize="xs" textAlign="center" mt={2}>
                この処理には数分かかる場合があります
              </Text>
            </VStack>
            <Progress
              size="xs"
              isIndeterminate
              colorScheme="purple"
              w="100%"
              borderRadius="full"
            />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
