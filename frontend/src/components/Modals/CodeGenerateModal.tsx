import { useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Code,
  Box,
  useToast,
  Text
} from '@chakra-ui/react'
import { Highlight, themes } from 'prism-react-renderer'

interface CodeGenerateModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  onProceedToInference?: () => void
}

export const CodeGenerateModal = ({ isOpen, onClose, code, onProceedToInference }: CodeGenerateModalProps) => {
  const toast = useToast()

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true
    })
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pymc_model.py'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded as pymc_model.py',
      status: 'success',
      duration: 2000,
      isClosable: true
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>Generated PyMC Code</ModalHeader>
        <ModalBody overflowY="auto">
          <Box borderRadius="md" overflow="hidden">
            <Highlight theme={themes.vsDark} code={code} language="python">
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={className} style={{ ...style, padding: '1rem', fontSize: '0.85rem' }}>
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      <span style={{ display: 'inline-block', width: '2em', userSelect: 'none', opacity: 0.5 }}>
                        {i + 1}
                      </span>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </Box>
          <Text fontSize="xs" color="gray.500" mt={4}>
            Copy this code to your Python environment and run it with PyMC installed.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme="blue" mr={3} onClick={handleCopy}>
            Copy to Clipboard
          </Button>
          <Button colorScheme="teal" mr={3} onClick={handleDownload}>
            Download
          </Button>
          {onProceedToInference && (
            <Button colorScheme="green" onClick={onProceedToInference}>
              推論設定へ進む
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
