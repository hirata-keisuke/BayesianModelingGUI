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

interface McmcConfigFormProps {
  sampler: string
  setSampler: (value: string) => void
  draws: number
  setDraws: (value: number) => void
  tune: number
  setTune: (value: number) => void
  chains: number
  setChains: (value: number) => void
  cores: number
  setCores: (value: number) => void
  hdiProb: number
  setHdiProb: (value: number) => void
}

export const McmcConfigForm = ({
  sampler,
  setSampler,
  draws,
  setDraws,
  tune,
  setTune,
  chains,
  setChains,
  cores,
  setCores,
  hdiProb,
  setHdiProb
}: McmcConfigFormProps) => {
  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel>サンプラー</FormLabel>
        <Select value={sampler} onChange={(e) => setSampler(e.target.value)}>
          <option value="NUTS">NUTS (推奨)</option>
          <option value="Metropolis">Metropolis</option>
        </Select>
        <Text fontSize="xs" color="gray.600" mt={1}>
          NUTSは高次元の問題に効率的です
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>サンプリング数 (draws)</FormLabel>
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
          各チェーンで取得するサンプル数
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>チューニング数 (tune)</FormLabel>
        <NumberInput
          value={tune}
          onChange={(_, val) => setTune(val)}
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
          サンプラーの調整に使用するサンプル数（破棄されます）
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>チェーン数 (chains)</FormLabel>
        <NumberInput
          value={chains}
          onChange={(_, val) => setChains(val)}
          min={1}
          max={16}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Text fontSize="xs" color="gray.600" mt={1}>
          並列実行するマルコフ連鎖の数
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>コア数 (cores)</FormLabel>
        <NumberInput
          value={cores}
          onChange={(_, val) => setCores(val)}
          min={1}
          max={16}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Text fontSize="xs" color="gray.600" mt={1}>
          並列処理に使用するCPUコア数
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
