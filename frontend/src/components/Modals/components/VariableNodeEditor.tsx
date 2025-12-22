import React, { ChangeEvent } from 'react'
import {
  FormControl,
  FormLabel,
  Select,
  Switch,
  HStack,
  VStack,
  Text,
  Checkbox,
  Box,
  Badge,
  Input
} from '@chakra-ui/react'
import { ParameterEditor } from './ParameterEditor'
import { NodeData } from '../../../types/model'

interface VariableNodeEditorProps {
  distribution: string
  setDistribution: (value: string) => void
  distributions: Record<string, any> | undefined
  parameters: Record<string, any>
  parameterTypes: Record<string, 'value' | 'reference'>
  observed: boolean
  setObserved: (value: boolean) => void
  observedDataSource: string
  setObservedDataSource: (value: string) => void
  observedDataSources: string[]
  setObservedDataSources: (value: string[]) => void
  availableNodes: NodeData[]
  dataNodes: NodeData[]
  isFeatureData: boolean
  shapeInput: string
  onShapeChange: (value: string) => void
  onParameterChange: (param: string, value: string, type: 'value' | 'reference') => void
  onParameterTypeChange: (param: string, type: 'value' | 'reference') => void
}

export const VariableNodeEditor = ({
  distribution,
  setDistribution,
  distributions,
  parameters,
  parameterTypes,
  observed,
  setObserved,
  observedDataSource,
  setObservedDataSource,
  observedDataSources,
  setObservedDataSources,
  availableNodes,
  dataNodes,
  isFeatureData,
  shapeInput,
  onShapeChange,
  onParameterChange,
  onParameterTypeChange
}: VariableNodeEditorProps) => {
  const selectedDist = distribution && distributions ? distributions[distribution] : null

  return (
    <>
      <FormControl>
        <FormLabel fontSize="sm">Distribution</FormLabel>
        <Select
          value={distribution}
          onChange={(e) => setDistribution(e.target.value)}
          placeholder="Select distribution"
          isDisabled={isFeatureData}
        >
          {distributions && Object.keys(distributions).map(dist => (
            <option key={dist} value={dist}>{dist}</option>
          ))}
        </Select>
        {isFeatureData && (
          <Text fontSize="xs" color="orange.500" mt={1}>
            Feature data is linked - distribution is not used (pm.Data will be generated)
          </Text>
        )}
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">
          Shape (Optional)
        </FormLabel>
        <Input
          value={shapeInput}
          onChange={(e) => onShapeChange(e.target.value)}
          placeholder="e.g., [8] or [3, 4]"
          fontSize="sm"
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          Specify array dimensions for hierarchical models. Examples: [8] for 8 elements, [3, 4] for 3x4 matrix
        </Text>
      </FormControl>

      {selectedDist && (
        <>
          <Text fontSize="sm" color="gray.600" alignSelf="start" fontStyle="italic">
            {selectedDist.description}
          </Text>

          {Object.entries(selectedDist.params).map(([param, meta]: [string, any]) => {
            const paramType = parameterTypes[param] || 'value'
            const currentValue = parameters[param]

            return (
              <ParameterEditor
                key={param}
                param={param}
                meta={meta}
                paramType={paramType}
                currentValue={currentValue}
                availableNodes={availableNodes}
                onParameterChange={onParameterChange}
                onParameterTypeChange={onParameterTypeChange}
              />
            )
          })}
        </>
      )}

      <FormControl>
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <FormLabel fontSize="sm" mb={0}>Observed</FormLabel>
            <Text fontSize="xs" color="gray.500">
              Mark if this variable has data
            </Text>
          </VStack>
          <Switch
            isChecked={observed}
            onChange={(e) => setObserved(e.target.checked)}
            colorScheme="orange"
          />
        </HStack>
      </FormControl>

      {observed && dataNodes.length > 0 && (
        <>
          <FormControl>
            <FormLabel fontSize="sm">Data Source Mode</FormLabel>
            <HStack spacing={4}>
              <Badge colorScheme={observedDataSources.length === 0 ? 'purple' : 'gray'}>
                Single Column
              </Badge>
              <Badge colorScheme={observedDataSources.length > 0 ? 'purple' : 'gray'}>
                Multiple Columns ({observedDataSources.length})
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Use multiple columns for multivariate distributions
            </Text>
          </FormControl>

          {observedDataSources.length === 0 ? (
            <FormControl>
              <FormLabel fontSize="sm">Observed Data Source (Single)</FormLabel>
              <Select
                value={observedDataSource}
                onChange={(e) => setObservedDataSource(e.target.value)}
                placeholder="Select data node"
              >
                {dataNodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.parameters?.column})
                  </option>
                ))}
              </Select>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Or select multiple columns below
              </Text>
            </FormControl>
          ) : (
            <Box>
              <Text fontSize="xs" color="orange.500" mb={2}>
                Multiple column mode active - single column selection is disabled
              </Text>
            </Box>
          )}

          <FormControl>
            <FormLabel fontSize="sm">Observed Data Sources (Multiple)</FormLabel>
            <VStack align="stretch" spacing={2} p={3} bg="gray.50" borderRadius="md">
              {dataNodes.map(node => (
                <Checkbox
                  key={node.id}
                  isChecked={observedDataSources.includes(node.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setObservedDataSources([...observedDataSources, node.id])
                      setObservedDataSource('') // Clear single selection
                    } else {
                      setObservedDataSources(observedDataSources.filter(id => id !== node.id))
                    }
                  }}
                >
                  {node.name} ({node.parameters?.column})
                </Checkbox>
              ))}
            </VStack>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Select multiple columns for multivariate distributions (e.g., MvNormal)
            </Text>
          </FormControl>
        </>
      )}
    </>
  )
}
