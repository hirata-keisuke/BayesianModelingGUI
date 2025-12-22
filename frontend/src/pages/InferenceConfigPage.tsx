import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Button,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Text,
  Select,
  Divider
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { useInferenceConfig } from './InferenceConfig/hooks/useInferenceConfig'
import { McmcConfigForm } from './InferenceConfig/components/McmcConfigForm'
import { ViConfigForm } from './InferenceConfig/components/ViConfigForm'
import { PriorPredictiveCheck } from './InferenceConfig/components/PriorPredictiveCheck'
import { InferenceLoadingModal } from './InferenceConfig/components/InferenceLoadingModal'

export const InferenceConfigPage = () => {
  const navigate = useNavigate()
  const {
    inferenceMethod,
    setInferenceMethod,
    draws,
    setDraws,
    tune,
    setTune,
    chains,
    setChains,
    cores,
    setCores,
    hdiProb,
    setHdiProb,
    sampler,
    setSampler,
    viIterations,
    setViIterations,
    viMethod,
    setViMethod,
    priorPredictiveResult,
    isPriorCheckLoading,
    isLoading,
    handleRunPriorPredictive,
    handleRunInference
  } = useInferenceConfig()

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="purple.600" px={6} py={4} color="white">
        <Container maxW="container.lg">
          <HStack spacing={4}>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              colorScheme="whiteAlpha"
              onClick={() => navigate('/')}
            >
              モデル構築に戻る
            </Button>
            <Heading size="md">推論設定</Heading>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.md" py={8}>
        <Card>
          <CardHeader>
            <Heading size="md">推論設定</Heading>
            <Text fontSize="sm" color="gray.600" mt={2}>
              PyMCの推論パラメータを設定してください
            </Text>
          </CardHeader>

          <CardBody>
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel>推論手法</FormLabel>
                <Select
                  value={inferenceMethod}
                  onChange={(e) => setInferenceMethod(e.target.value as 'MCMC' | 'VI')}
                >
                  <option value="MCMC">MCMC サンプリング</option>
                  <option value="VI">変分推論 (VI)</option>
                </Select>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  MCMCは正確ですが時間がかかります。VIは高速ですが近似的です
                </Text>
              </FormControl>

              {inferenceMethod === 'MCMC' ? (
                <McmcConfigForm
                  sampler={sampler}
                  setSampler={setSampler}
                  draws={draws}
                  setDraws={setDraws}
                  tune={tune}
                  setTune={setTune}
                  chains={chains}
                  setChains={setChains}
                  cores={cores}
                  setCores={setCores}
                  hdiProb={hdiProb}
                  setHdiProb={setHdiProb}
                />
              ) : (
                <ViConfigForm
                  viMethod={viMethod}
                  setViMethod={setViMethod}
                  viIterations={viIterations}
                  setViIterations={setViIterations}
                  draws={draws}
                  setDraws={setDraws}
                  hdiProb={hdiProb}
                  setHdiProb={setHdiProb}
                />
              )}

              <Divider my={6} />

              <PriorPredictiveCheck
                onRunCheck={handleRunPriorPredictive}
                isLoading={isPriorCheckLoading}
                result={priorPredictiveResult}
              />

              <Divider my={6} />

              <Button
                colorScheme="green"
                size="lg"
                onClick={handleRunInference}
                mt={4}
                isLoading={isLoading}
                loadingText="推論実行中..."
              >
                推論を実行
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Container>

      <InferenceLoadingModal
        isOpen={isLoading}
        inferenceMethod={inferenceMethod}
        sampler={sampler}
        chains={chains}
        draws={draws}
        viMethod={viMethod}
        viIterations={viIterations}
      />
    </Box>
  )
}
