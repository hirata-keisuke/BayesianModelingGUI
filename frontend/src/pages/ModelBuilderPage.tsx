import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Grid, GridItem, useDisclosure, useToast,
  AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
  Button, Text
} from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import { Grid, GridItem, useDisclosure, useToast } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Common/Header'
import { StatusBar } from '../components/Common/StatusBar'
import { ToolPanel } from '../components/Panels/ToolPanel'
import { ErrorPanel } from '../components/Panels/ErrorPanel'
import { ModelCanvas } from '../components/Canvas/ModelCanvas'
import { NodeEditModal } from '../components/Modals/NodeEditModal'
import { CodeGenerateModal } from '../components/Modals/CodeGenerateModal'
import { SampleModelsModal } from '../components/Modals/SampleModelsModal'
import { useModelStore } from '../stores/modelStore'
import { useModelValidation } from '../hooks/useModelValidation'
import { useAutoSave, getSavedModel, clearSavedModel } from '../hooks/useAutoSave'
import { apiClient } from '../services/api'

export const ModelBuilderPage = () => {
  const navigate = useNavigate()
  const { isOpen: isNodeModalOpen, onOpen: onNodeModalOpen, onClose: onNodeModalClose } = useDisclosure()
  const { isOpen: isCodeModalOpen, onOpen: onCodeModalOpen, onClose: onCodeModalClose } = useDisclosure()
  const { isOpen: isSamplesModalOpen, onOpen: onSamplesModalOpen, onClose: onSamplesModalClose } = useDisclosure()
  const { isOpen: isRestoreDialogOpen, onOpen: onRestoreDialogOpen, onClose: onRestoreDialogClose } = useDisclosure()
  const [generatedCode, setGeneratedCode] = useState('')
  const cancelRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()
  const lastSaved = useAutoSave()

  const { selectedNode, setSelectedNode, getModel, loadModel, copySelectedNodes, pasteNodes } = useModelStore()
  const { data: validation } = useModelValidation(true)
  const isValidationValid = validation?.valid ?? true

  const { selectedNode, setSelectedNode, getModel, loadModel, undo, redo } = useModelStore()
  const { data: validation } = useModelValidation(true)
  const isValidationValid = validation?.valid ?? true

  // キーボードショートカット: Ctrl+Z (undo), Ctrl+Shift+Z (redo)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      redo()
    }
  }, [undo, redo])
  const { selectedNode, setSelectedNode, getModel, loadModel, copySelectedNodes, pasteNodes } = useModelStore()
  const { data: validation } = useModelValidation(true)
  const isValidationValid = validation?.valid ?? true

  // キーボードショートカット: Ctrl+C (copy), Ctrl+V (paste)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
      // テキスト入力中はブラウザデフォルトを優先
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      copySelectedNodes()
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.shiftKey) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      pasteNodes()
    }
  }, [copySelectedNodes, pasteNodes])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Check LocalStorage for saved model on mount
  useEffect(() => {
    const saved = getSavedModel()
    if (saved) {
      onRestoreDialogOpen()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRestore = useCallback(() => {
    const saved = getSavedModel()
    if (saved) {
      loadModel(saved.model)
      toast({
        title: 'Model restored',
        description: 'Previous work has been restored',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    }
    onRestoreDialogClose()
  }, [loadModel, toast, onRestoreDialogClose])

  const handleDiscardSaved = useCallback(() => {
    clearSavedModel()
    onRestoreDialogClose()
  }, [onRestoreDialogClose])

  // ノードが選択されたときにモーダルを開く
  useEffect(() => {
    if (selectedNode) {
      onNodeModalOpen()
    }
  }, [selectedNode, onNodeModalOpen])

  const handleGenerateCode = async () => {
    try {
      const model = getModel()

      if (model.nodes.length === 0) {
        toast({
          title: 'No nodes to generate',
          description: 'Please add some nodes to the canvas first',
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
        return
      }

      const response = await apiClient.generateCode(model)
      setGeneratedCode(response.data.code)
      onCodeModalOpen()
    } catch (error: any) {
      toast({
        title: 'Code generation failed',
        description: error.message || 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleSave = () => {
    const model = getModel()

    // データノードを除外してモデルを保存
    const modelToSave = {
      ...model,
      nodes: model.nodes.filter((node: any) => node.type !== 'data')
    }

    const json = JSON.stringify(modelToSave, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pymc_model.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Model saved',
      status: 'success',
      duration: 2000,
      isClosable: true
    })
  }

  const handleLoad = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        try {
          const model = JSON.parse(text)
          loadModel(model)
          toast({
            title: 'Model loaded',
            status: 'success',
            duration: 2000,
            isClosable: true
          })
        } catch (error) {
          toast({
            title: 'Failed to load model',
            description: 'Invalid JSON file',
            status: 'error',
            duration: 3000,
            isClosable: true
          })
        }
      }
    }
    input.click()
  }

  const handleNodeModalClose = () => {
    setSelectedNode(null)
    onNodeModalClose()
  }

  const handleProceedToInference = () => {
    onCodeModalClose()
    navigate('/inference')
  }

  return (
    <Grid
      templateAreas={`"header header"
                      "sidebar main"
                      "sidebar footer"`}
      gridTemplateRows={'60px 1fr 120px'}
      gridTemplateColumns={'250px 1fr'}
      h="100vh"
      gap="0"
    >
      <GridItem area="header">
        <Header
          onGenerateCode={handleGenerateCode}
          onSave={handleSave}
          onLoad={handleLoad}
          onOpenSamples={onSamplesModalOpen}
          isValidationValid={isValidationValid}
        />
      </GridItem>

      <GridItem area="sidebar" bg="gray.50" p={4} borderRight="1px" borderColor="gray.200">
        <ToolPanel />
      </GridItem>

      <GridItem area="main">
        <ModelCanvas />
      </GridItem>

      <GridItem area="footer" borderTop="1px" borderColor="gray.200">
        <ErrorPanel />
        <StatusBar lastSaved={lastSaved} />
      </GridItem>

      <NodeEditModal
        isOpen={isNodeModalOpen}
        onClose={handleNodeModalClose}
      />

      <CodeGenerateModal
        isOpen={isCodeModalOpen}
        onClose={onCodeModalClose}
        code={generatedCode}
        onProceedToInference={handleProceedToInference}
      />

      <SampleModelsModal
        isOpen={isSamplesModalOpen}
        onClose={onSamplesModalClose}
      />

      <AlertDialog
        isOpen={isRestoreDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRestoreDialogClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Restore Previous Work
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text>A previously saved model was found.</Text>
              <Text mt={2}>Would you like to restore it?</Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleDiscardSaved}>
                Start New
              </Button>
              <Button colorScheme="purple" onClick={handleRestore} ml={3}>
                Restore
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Grid>
  )
}
