import {
  VStack,
  Box,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Image
} from '@chakra-ui/react'

interface PriorPredictiveCheckProps {
  onRunCheck: () => void
  isLoading: boolean
  result: any
}

export const PriorPredictiveCheck = ({
  onRunCheck,
  isLoading,
  result
}: PriorPredictiveCheckProps) => {
  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Heading size="sm" mb={2}>事前予測チェック（推奨）</Heading>
        <Text fontSize="sm" color="gray.600">
          推論を実行する前に、事前分布からサンプリングしてモデルアーキテクチャが妥当かを確認できます
        </Text>
      </Box>

      <Button
        colorScheme="blue"
        variant="outline"
        onClick={onRunCheck}
        isLoading={isLoading}
        loadingText="サンプリング中..."
      >
        事前予測チェックを実行
      </Button>

      {result && result.success && (
        <VStack align="stretch" spacing={4}>
          <Alert status="info">
            <AlertIcon />
            事前予測チェックの結果を確認してください。予測値が妥当な範囲にあるか確認しましょう。
          </Alert>

          {result.prior_predictive_plot && (
            <Box>
              <Text fontWeight="bold" mb={2}>Prior Predictive Distribution</Text>
              <Image
                src={`data:image/png;base64,${result.prior_predictive_plot}`}
                alt="Prior Predictive Plot"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
            </Box>
          )}

          {result.prior_trace_plot && (
            <Box>
              <Text fontWeight="bold" mb={2}>Prior Distributions</Text>
              <Image
                src={`data:image/png;base64,${result.prior_trace_plot}`}
                alt="Prior Trace Plot"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
            </Box>
          )}
        </VStack>
      )}

      {result && !result.success && (
        <Alert status="error">
          <AlertIcon />
          {result.error || 'エラーが発生しました'}
        </Alert>
      )}
    </VStack>
  )
}
