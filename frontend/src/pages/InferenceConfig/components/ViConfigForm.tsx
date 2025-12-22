import {
  VStack,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Text
} from '@chakra-ui/react'

interface ViConfigFormProps {
  viMethod: string
  setViMethod: (value: string) => void
  viIterations: number
  setViIterations: (value: number) => void
  draws: number
  setDraws: (value: number) => void
  hdiProb: number
  setHdiProb: (value: number) => void
}

export const ViConfigForm = ({
  viMethod,
  setViMethod,
  viIterations,
  setViIterations,
  draws,
  setDraws,
  hdiProb,
  setHdiProb
}: ViConfigFormProps) => {
  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel>VI手法</FormLabel>
        <Select value={viMethod} onChange={(e) => setViMethod(e.target.value)}>
          <option value="ADVI">ADVI (Automatic Differentiation VI)</option>
          <option value="FullRankADVI">FullRank ADVI</option>
        </Select>
        <Text fontSize="xs" color="gray.600" mt={1}>
          ADVIは平均場近似、FullRankは共分散も考慮します
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>反復回数 (iterations)</FormLabel>
        <NumberInput
          value={viIterations}
          onChange={(_, val) => setViIterations(val)}
          min={1000}
          max={100000}
          step={1000}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Text fontSize="xs" color="gray.600" mt={1}>
          変分推論の最適化の反復回数
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>サンプル数 (draws)</FormLabel>
        <NumberInput
          value={draws}
          onChange={(_, val) => setDraws(val)}
          min={100}
          max={100000}
          step={100}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Text fontSize="xs" color="gray.600" mt={1}>
          近似事後分布から取得するサンプル数
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>HDI区間 (確率)</FormLabel>
        <NumberInput
          value={hdiProb}
          onChange={(_, val) => setHdiProb(val)}
          min={0.5}
          max={0.99}
          step={0.01}
          precision={2}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Text fontSize="xs" color="gray.600" mt={1}>
          最高密度区間（HDI）の確率（デフォルト: 0.95 = 95%）
        </Text>
      </FormControl>
    </VStack>
  )
}
