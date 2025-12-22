import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  CardHeader,
  CardBody,
  Image,
  Text,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tooltip
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { ArrowBackIcon, DownloadIcon } from '@chakra-ui/icons'
import { useInferenceStore } from '../stores/inferenceStore'
import { downloadImage, downloadCSV, summaryToCSV, downloadBase64CSV } from '../utils/downloadUtils'

export const InferenceResultsPage = () => {
  const navigate = useNavigate()
  const { result, isLoading } = useInferenceStore()

  const hasResults = result && result.success

  const handleDownloadImage = (base64Data: string, filename: string) => {
    downloadImage(base64Data, filename)
  }

  const handleDownloadSummary = () => {
    if (result?.summary?.parameters) {
      const csvData = summaryToCSV(result.summary.parameters)
      downloadCSV(csvData, 'inference_summary.csv')
    }
  }

  const handleDownloadTraceSamples = () => {
    if (result?.trace_samples_csv) {
      downloadBase64CSV(result.trace_samples_csv, 'trace_samples.csv')
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="purple.600" px={6} py={4} color="white">
        <Container maxW="container.xl">
          <HStack spacing={4}>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              colorScheme="whiteAlpha"
              onClick={() => navigate('/inference')}
            >
              設定に戻る
            </Button>
            <Heading size="md">推論結果</Heading>
          </HStack>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        {isLoading ? (
          <Center h="400px">
            <VStack spacing={4}>
              <Spinner size="xl" color="purple.500" thickness="4px" />
              <Text color="gray.600">推論を実行中...</Text>
            </VStack>
          </Center>
        ) : hasResults ? (
          <VStack spacing={6} align="stretch">
            {/* Trace Plot */}
            {result?.trace_plot && (
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <Box>
                      <Heading size="md">トレースプロット</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        パラメータのサンプリング履歴と分布
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<DownloadIcon />}
                      size="sm"
                      onClick={() => handleDownloadImage(result.trace_plot!, 'trace_plot.png')}
                    >
                      画像を保存
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Image
                    src={`data:image/png;base64,${result.trace_plot}`}
                    alt="Trace Plot"
                    w="100%"
                  />
                </CardBody>
              </Card>
            )}

            {/* Forest Plot */}
            {result?.forest_plot && (
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <Box>
                      <Heading size="md">フォレストプロット</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        パラメータの推定値と信頼区間
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<DownloadIcon />}
                      size="sm"
                      onClick={() => handleDownloadImage(result.forest_plot!, 'forest_plot.png')}
                    >
                      画像を保存
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Image
                    src={`data:image/png;base64,${result.forest_plot}`}
                    alt="Forest Plot"
                    w="100%"
                  />
                </CardBody>
              </Card>
            )}

            {/* Summary Statistics */}
            {result?.summary && result.summary.parameters && (
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <Box>
                      <Heading size="md">サマリー統計</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        パラメータの統計量
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<DownloadIcon />}
                      size="sm"
                      onClick={handleDownloadSummary}
                    >
                      CSVで保存
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Parameter</Th>
                        <Th isNumeric>Mean</Th>
                        <Th isNumeric>SD</Th>
                        <Th isNumeric>HDI Lower</Th>
                        <Th isNumeric>HDI Upper</Th>
                        {Object.values(result.summary.parameters)[0]?.r_hat !== undefined && (
                          <>
                            <Th isNumeric>R-hat</Th>
                            <Th isNumeric>ESS Bulk</Th>
                          </>
                        )}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Object.entries(result.summary.parameters).map(([param, stats]: [string, any]) => (
                        <Tr key={param}>
                          <Td fontWeight="medium">{param}</Td>
                          <Td isNumeric>{stats.mean?.toFixed(4)}</Td>
                          <Td isNumeric>{stats.sd?.toFixed(4)}</Td>
                          <Td isNumeric>{stats.hdi_lower?.toFixed(4)}</Td>
                          <Td isNumeric>{stats.hdi_upper?.toFixed(4)}</Td>
                          {stats.r_hat !== undefined && (
                            <>
                              <Td isNumeric>{stats.r_hat?.toFixed(3)}</Td>
                              <Td isNumeric>{stats.ess_bulk?.toFixed(0)}</Td>
                            </>
                          )}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            )}

            {/* Posterior Predictive Check */}
            {result?.ppc_plot && (
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <Box>
                      <Heading size="md">事後予測チェック</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        モデルの予測精度の評価
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<DownloadIcon />}
                      size="sm"
                      onClick={() => handleDownloadImage(result.ppc_plot!, 'ppc_plot.png')}
                    >
                      画像を保存
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Image
                    src={`data:image/png;base64,${result.ppc_plot}`}
                    alt="Posterior Predictive Check"
                    w="100%"
                  />
                </CardBody>
              </Card>
            )}

            {/* Model Comparison Metrics (LOO & WAIC) */}
            {(result?.loo || result?.waic) && (
              <Card>
                <CardHeader>
                  <Box>
                    <Heading size="md">モデル比較指標</Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      LOO（Leave-One-Out Cross-Validation）とWAIC（Watanabe-Akaike Information Criterion）
                    </Text>
                  </Box>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* LOO Metrics */}
                    {result?.loo && (
                      <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50">
                        <Heading size="sm" mb={3} color="blue.700">
                          LOO (Leave-One-Out Cross-Validation)
                        </Heading>
                        <VStack align="stretch" spacing={3}>
                          <Stat>
                            <StatLabel>ELPD (Expected Log Predictive Density)</StatLabel>
                            <StatNumber fontSize="2xl">{result.loo.elpd.toFixed(4)}</StatNumber>
                            <StatHelpText>± {result.loo.se.toFixed(4)} (大きいほど良い)</StatHelpText>
                          </Stat>
                          <Stat>
                            <StatLabel>
                              <Tooltip label="実効的なパラメータ数">
                                <Text as="span" borderBottom="1px dotted" cursor="help">
                                  p_loo
                                </Text>
                              </Tooltip>
                            </StatLabel>
                            <StatNumber fontSize="lg">{result.loo.p_loo.toFixed(4)}</StatNumber>
                          </Stat>
                          {result.loo.pareto_k && (
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" mb={2}>Pareto k診断:</Text>
                              <HStack spacing={2} flexWrap="wrap">
                                <Badge colorScheme="green">Good: {result.loo.pareto_k.good}</Badge>
                                <Badge colorScheme="yellow">OK: {result.loo.pareto_k.ok}</Badge>
                                <Badge colorScheme="orange">Bad: {result.loo.pareto_k.bad}</Badge>
                                <Badge colorScheme="red">Very Bad: {result.loo.pareto_k.very_bad}</Badge>
                              </HStack>
                              <Text fontSize="xs" color="gray.600" mt={2}>
                                k &lt; 0.5が理想的です。k &gt; 0.7の場合はモデルの再検討が必要です。
                              </Text>
                            </Box>
                          )}
                          {result.loo.warning && (
                            <Badge colorScheme="red" fontSize="sm">警告あり</Badge>
                          )}
                        </VStack>
                      </Box>
                    )}

                    {/* WAIC Metrics */}
                    {result?.waic && (
                      <Box p={4} borderWidth="1px" borderRadius="md" bg="purple.50">
                        <Heading size="sm" mb={3} color="purple.700">
                          WAIC (Watanabe-Akaike Information Criterion)
                        </Heading>
                        <VStack align="stretch" spacing={3}>
                          <Stat>
                            <StatLabel>WAIC値</StatLabel>
                            <StatNumber fontSize="2xl">{result.waic.waic.toFixed(4)}</StatNumber>
                            <StatHelpText>± {result.waic.se.toFixed(4)} (小さいほど良い)</StatHelpText>
                          </Stat>
                          <Stat>
                            <StatLabel>
                              <Tooltip label="実効的なパラメータ数">
                                <Text as="span" borderBottom="1px dotted" cursor="help">
                                  p_waic
                                </Text>
                              </Tooltip>
                            </StatLabel>
                            <StatNumber fontSize="lg">{result.waic.p_waic.toFixed(4)}</StatNumber>
                          </Stat>
                          {result.waic.warning && (
                            <Badge colorScheme="red" fontSize="sm">警告あり</Badge>
                          )}
                        </VStack>
                      </Box>
                    )}
                  </SimpleGrid>

                  <Box mt={4} p={3} bg="gray.100" borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      モデル比較のポイント:
                    </Text>
                    <VStack align="start" spacing={1} fontSize="xs" color="gray.700">
                      <Text>• LOOのELPDは大きいほど（0に近いほど）、WAICは小さいほどモデルの予測性能が高い</Text>
                      <Text>• 複数モデル比較時、LOOのELPD差が標準誤差の2倍以上、またはWAIC差が4倍以上あれば有意差あり</Text>
                      <Text>• p_looやp_waicは実効的なパラメータ数を示し、モデルの複雑さを反映</Text>
                      <Text>• Pareto k診断でBadやVery Badが多い場合は、外れ値や影響力の強い観測値が存在する可能性</Text>
                    </VStack>
                  </Box>
                </CardBody>
              </Card>
            )}

            {/* Trace Samples Data */}
            {result?.trace_samples_csv && (
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <Box>
                      <Heading size="md">サンプルデータ</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        MCMCサンプリングの生データをCSV形式でダウンロード
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<DownloadIcon />}
                      size="sm"
                      colorScheme="purple"
                      onClick={handleDownloadTraceSamples}
                    >
                      CSVで保存
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Text color="gray.600">
                    全てのパラメータのMCMCサンプルデータが含まれています。
                    各チェーンごとに列が分かれており、詳細な分析に使用できます。
                  </Text>
                </CardBody>
              </Card>
            )}
          </VStack>
        ) : (
          <Center h="400px">
            <VStack spacing={4}>
              <Text color="gray.600">推論結果がありません</Text>
              <Button colorScheme="purple" onClick={() => navigate('/inference')}>
                推論を実行
              </Button>
            </VStack>
          </Center>
        )}
      </Container>
    </Box>
  )
}
