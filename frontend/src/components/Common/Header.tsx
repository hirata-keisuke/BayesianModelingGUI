import { Box, Flex, Heading, Button, HStack, Tooltip, IconButton } from '@chakra-ui/react'
import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons'
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
  const undo = useModelStore(state => state.undo)
  const redo = useModelStore(state => state.redo)
  const canUndo = useModelStore(state => state.canUndo)
  const canRedo = useModelStore(state => state.canRedo)

  return (
    <Box bg="purple.600" px={6} py={3} color="white">
      <Flex justify="space-between" align="center">
        <HStack spacing={3}>
          <Heading size="md">PyMC Model Builder</Heading>
          <HStack spacing={1}>
            <Tooltip label="元に戻す (Ctrl+Z)" hasArrow placement="bottom">
              <IconButton
                aria-label="Undo"
                icon={<ArrowBackIcon />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={undo}
                isDisabled={!canUndo}
                opacity={canUndo ? 1 : 0.4}
              />
            </Tooltip>
            <Tooltip label="やり直す (Ctrl+Shift+Z)" hasArrow placement="bottom">
              <IconButton
                aria-label="Redo"
                icon={<ArrowForwardIcon />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={redo}
                isDisabled={!canRedo}
                opacity={canRedo ? 1 : 0.4}
              />
            </Tooltip>
          </HStack>
        </HStack>
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
