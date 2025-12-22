import { useState, useEffect } from 'react'
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
import { apiClient } from '../services/api'

export const ModelBuilderPage = () => {
  const navigate = useNavigate()
  const { isOpen: isNodeModalOpen, onOpen: onNodeModalOpen, onClose: onNodeModalClose } = useDisclosure()
  const { isOpen: isCodeModalOpen, onOpen: onCodeModalOpen, onClose: onCodeModalClose } = useDisclosure()
  const { isOpen: isSamplesModalOpen, onOpen: onSamplesModalOpen, onClose: onSamplesModalClose } = useDisclosure()
  const [generatedCode, setGeneratedCode] = useState('')
  const toast = useToast()

  const { selectedNode, setSelectedNode, getModel, loadModel } = useModelStore()
  const { data: validation } = useModelValidation(true)
  const isValidationValid = validation?.valid ?? true

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
    </Grid>
  )
}
