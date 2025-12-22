import { useState, useRef } from 'react'
import {
  VStack,
  Button,
  Text,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  useToast,
  Badge,
  HStack,
  IconButton,
  Collapse
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/api'
import { useModelStore } from '../../stores/modelStore'
import { NodeType } from '../../types/model'

export const DataPanel = () => {
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { csvMetadata, setCsvMetadata, addNode } = useModelStore()

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await apiClient.uploadCSV(file)
      return res.data
    },
    onSuccess: (data) => {
      setCsvMetadata(data)
      toast({
        title: 'CSV uploaded successfully',
        description: `${data.rows} rows, ${data.columns.length} columns`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      setIsOpen(true)
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  const handleRoleChange = (columnName: string, role: 'observed' | 'feature' | 'unused') => {
    if (!csvMetadata) return

    const updatedColumns = csvMetadata.columns.map(col =>
      col.name === columnName ? { ...col, role } : col
    )

    setCsvMetadata({
      ...csvMetadata,
      columns: updatedColumns
    })
  }

  const handleCreateDataNodes = () => {
    if (!csvMetadata) return

    const observedCols = csvMetadata.columns.filter(col => col.role === 'observed')
    const featureCols = csvMetadata.columns.filter(col => col.role === 'feature')

    // 観測変数ノードを作成
    observedCols.forEach((col, idx) => {
      addNode({
        id: `data-obs-${col.name}-${Date.now()}`,
        type: NodeType.DATA,
        name: `${col.name}_data`,
        parameters: { column: col.name, role: 'observed' },
        observed: false,
        position: { x: 100, y: 100 + idx * 80 }
      })
    })

    // 特徴量ノードを作成
    featureCols.forEach((col, idx) => {
      addNode({
        id: `data-feat-${col.name}-${Date.now()}`,
        type: NodeType.DATA,
        name: `${col.name}`,
        parameters: { column: col.name, role: 'feature' },
        observed: false,
        position: { x: 400, y: 100 + idx * 80 }
      })
    })

    toast({
      title: 'Data nodes created',
      description: `${observedCols.length} observed, ${featureCols.length} features`,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold" fontSize="sm" color="gray.600">
          DATA
        </Text>
        {csvMetadata && (
          <IconButton
            aria-label="Toggle data panel"
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="xs"
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
          />
        )}
      </HStack>

      <VStack spacing={2} align="stretch">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <Button
          size="sm"
          colorScheme="teal"
          onClick={() => fileInputRef.current?.click()}
          isLoading={uploadMutation.isPending}
        >
          Upload CSV
        </Button>

        {csvMetadata && (
          <>
            <Box p={2} bg="teal.50" borderRadius="md">
              <Text fontSize="xs" fontWeight="bold" color="teal.700">
                {csvMetadata.filename}
              </Text>
              <Text fontSize="xs" color="teal.600">
                {csvMetadata.rows} rows × {csvMetadata.columns.length} columns
              </Text>
            </Box>

            <Collapse in={isOpen} animateOpacity>
              <Box maxH="300px" overflowY="auto" fontSize="xs">
                <Table size="sm" variant="simple">
                  <Thead position="sticky" top={0} bg="white" zIndex={1}>
                    <Tr>
                      <Th fontSize="xs">Column</Th>
                      <Th fontSize="xs">Type</Th>
                      <Th fontSize="xs">Role</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {csvMetadata.columns.map((col) => (
                      <Tr key={col.name}>
                        <Td fontSize="xs">{col.name}</Td>
                        <Td fontSize="xs">
                          <Badge size="xs" colorScheme="gray">
                            {col.dtype}
                          </Badge>
                        </Td>
                        <Td>
                          <Select
                            size="xs"
                            value={col.role}
                            onChange={(e) =>
                              handleRoleChange(
                                col.name,
                                e.target.value as 'observed' | 'feature' | 'unused'
                              )
                            }
                          >
                            <option value="unused">Unused</option>
                            <option value="observed">Observed</option>
                            <option value="feature">Feature</option>
                          </Select>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Button
                size="sm"
                colorScheme="teal"
                variant="outline"
                w="100%"
                mt={2}
                onClick={handleCreateDataNodes}
              >
                Create Data Nodes
              </Button>
            </Collapse>
          </>
        )}
      </VStack>
    </Box>
  )
}
