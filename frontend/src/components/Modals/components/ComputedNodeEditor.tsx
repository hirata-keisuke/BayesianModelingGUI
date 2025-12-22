import { FormControl, FormLabel, Input, Text } from '@chakra-ui/react'
import { NodeData } from '../../../types/model'

interface ComputedNodeEditorProps {
  expression: string
  setExpression: (value: string) => void
  availableNodes: NodeData[]
}

export const ComputedNodeEditor = ({
  expression,
  setExpression,
  availableNodes
}: ComputedNodeEditorProps) => {
  return (
    <FormControl borderWidth="1px" borderRadius="md" p={3} bg="green.50">
      <FormLabel fontSize="sm" fontWeight="bold">
        Expression
        <Text as="span" color="red.500"> *</Text>
      </FormLabel>
      <Input
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
        placeholder="e.g., @alpha + @beta * @x"
        size="sm"
        fontFamily="mono"
      />
      <Text fontSize="xs" color="gray.600" mt={2}>
        @node_name で他のノードを参照してください。 例: @alpha + @beta * @x
      </Text>
      <Text fontSize="xs" color="gray.500" mt={1}>
        Available nodes: {availableNodes.map(n => `@${n.name}`).join(', ') || 'none'}
      </Text>
    </FormControl>
  )
}
