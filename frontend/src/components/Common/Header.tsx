import { Box, Flex, Heading, Button, HStack, Tooltip } from '@chakra-ui/react'
import { useModelStore } from '../../stores/modelStore'

interface HeaderProps {
  onGenerateCode: () => void
  onSave: () => void
  onLoad: () => void
  onOpenSamples: () => void
  isValidationValid: boolean
}

export const Header = ({ onGenerateCode, onSave, onLoad, onOpenSamples, isValidationValid }: HeaderProps) => {
  const reset = useModelStore(state => state.reset)

  return (
    <Box bg="purple.600" px={6} py={3} color="white">
      <Flex justify="space-between" align="center">
        <Heading size="md">PyMC Model Builder</Heading>
        <HStack spacing={3}>
          <Button size="sm" colorScheme="whiteAlpha" variant="outline" onClick={onOpenSamples}>
            Samples
          </Button>
          <Button size="sm" colorScheme="whiteAlpha" variant="outline" onClick={onLoad}>
            Load
          </Button>
          <Button size="sm" colorScheme="whiteAlpha" variant="outline" onClick={onSave}>
            Save
          </Button>
          <Button size="sm" colorScheme="whiteAlpha" variant="outline" onClick={reset}>
            Reset
          </Button>
          <Tooltip
            label={isValidationValid ? "" : "モデルにエラーがあります。修正してください。"}
            hasArrow
            placement="bottom"
          >
            <Button
              size="sm"
              colorScheme="green"
              onClick={onGenerateCode}
              isDisabled={!isValidationValid}
            >
              Generate Code
            </Button>
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  )
}
