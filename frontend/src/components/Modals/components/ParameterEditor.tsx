import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Radio,
  RadioGroup,
  Stack,
  Text
} from '@chakra-ui/react'
import { NodeData } from '../../../types/model'
import { parameterValueToString } from '../../../utils/shapeInference'

interface ParameterEditorProps {
  param: string
  meta: any
  paramType: 'value' | 'reference'
  currentValue: any
  availableNodes: NodeData[]
  onParameterChange: (param: string, value: string, type: 'value' | 'reference') => void
  onParameterTypeChange: (param: string, type: 'value' | 'reference') => void
}

export const ParameterEditor = ({
  param,
  meta,
  paramType,
  currentValue,
  availableNodes,
  onParameterChange,
  onParameterTypeChange
}: ParameterEditorProps) => {
  return (
    <FormControl key={param} borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
      <FormLabel fontSize="sm" fontWeight="bold">
        {param}
        {meta.required && <Text as="span" color="red.500"> *</Text>}
      </FormLabel>

      <RadioGroup
        value={paramType}
        onChange={(value) => onParameterTypeChange(param, value as 'value' | 'reference')}
      >
        <Stack direction="row" spacing={4} mb={2}>
          <Radio value="value" size="sm">Value</Radio>
          <Radio value="reference" size="sm">Reference Node</Radio>
        </Stack>
      </RadioGroup>

      {paramType === 'value' ? (
        <Input
          type="text"
          value={parameterValueToString(currentValue)}
          onChange={(e) => onParameterChange(param, e.target.value, 'value')}
          placeholder={`Default: ${meta.default || 'None'} (${meta.type}) - arrays: [1, 2] or [[1, 0], [0, 1]]`}
          size="sm"
        />
      ) : (
        <Select
          value={typeof currentValue === 'string' && currentValue.startsWith('@') ? currentValue.slice(1) : ''}
          onChange={(e) => onParameterChange(param, e.target.value, 'reference')}
          placeholder="Select node"
          size="sm"
        >
          {availableNodes.map(n => (
            <option key={n.id} value={n.name}>
              {n.name} ({n.distribution || 'no dist'})
            </option>
          ))}
        </Select>
      )}

      {meta.constraint && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          Constraint: {meta.constraint}
        </Text>
      )}
    </FormControl>
  )
}
