import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Spinner,
  Heading,
  Text,
  Progress,
  Button,
  HStack,
} from '@chakra-ui/react'
import { JobStatus } from '../../../stores/inferenceStore'

interface InferenceLoadingModalProps {
  isOpen: boolean
  inferenceMethod: 'MCMC' | 'VI'
  sampler?: string
  chains?: number
  draws?: number
  viMethod?: string
  viIterations?: number
  progress: number
  stage: string
  jobStatus: JobStatus | null
  onCancel: () => void
}

export const InferenceLoadingModal = ({
  isOpen,
  inferenceMethod,
  sampler,
  chains,
  draws,
  viMethod,
  viIterations,
  progress,
  stage,
  jobStatus,
  onCancel,
}: InferenceLoadingModalProps) => {
  const progressPercent = Math.round(progress * 100)
  const hasProgress = progress > 0

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
              {stage && (
                <Text color="purple.500" fontSize="sm" fontWeight="bold" textAlign="center" mt={1}>
                  {stage}
                </Text>
              )}
            </VStack>
            <VStack w="100%" spacing={1}>
              <Progress
                size="sm"
                value={hasProgress ? progressPercent : undefined}
                isIndeterminate={!hasProgress}
                colorScheme="purple"
                w="100%"
                borderRadius="full"
              />
              {hasProgress && (
                <HStack w="100%" justify="space-between">
                  <Text color="gray.500" fontSize="xs">
                    {jobStatus === 'PENDING' ? 'キューで待機中' : '処理中'}
                  </Text>
                  <Text color="gray.500" fontSize="xs">
                    {progressPercent}%
                  </Text>
                </HStack>
              )}
            </VStack>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              onClick={onCancel}
            >
              キャンセル
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
