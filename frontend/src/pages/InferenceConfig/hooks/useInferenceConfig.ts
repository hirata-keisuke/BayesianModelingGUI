import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@chakra-ui/react'
import { useModelStore } from '../../../stores/modelStore'
import { useInferenceStore } from '../../../stores/inferenceStore'
import { apiClient } from '../../../services/api'

export const useInferenceConfig = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { getModel } = useModelStore()
  const {
    setResult,
    setLoading,
    isLoading,
    connectWebSocket,
    disconnectWebSocket,
    cancelJob,
    resetJob,
    progress,
    stage,
    jobStatus,
  } = useInferenceStore()

  const [inferenceMethod, setInferenceMethod] = useState<'MCMC' | 'VI'>('MCMC')
  const [draws, setDraws] = useState(1000)
  const [tune, setTune] = useState(1000)
  const [chains, setChains] = useState(4)
  const [cores, setCores] = useState(4)
  const [hdiProb, setHdiProb] = useState(0.95)
  const [sampler, setSampler] = useState('NUTS')
  const [viIterations, setViIterations] = useState(10000)
  const [viMethod, setViMethod] = useState('ADVI')
  const [priorPredictiveResult, setPriorPredictiveResult] = useState<any>(null)
  const [isPriorCheckLoading, setIsPriorCheckLoading] = useState(false)

  const handleRunPriorPredictive = async () => {
    try {
      const model = getModel()

      if (model.nodes.length === 0) {
        toast({
          title: 'モデルが空です',
          description: 'まずモデルを構築してください',
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
        navigate('/')
        return
      }

      setIsPriorCheckLoading(true)

      toast({
        title: '事前予測チェックを実行中...',
        description: '事前分布からサンプリングしています',
        status: 'info',
        duration: 2000,
        isClosable: true
      })

      const response = await apiClient.runPriorPredictive({
        model,
        samples: 1000
      })

      setPriorPredictiveResult(response.data)
      setIsPriorCheckLoading(false)

      if (response.data.success) {
        toast({
          title: '事前予測チェックが完了しました',
          description: '結果を確認してモデルの妥当性を検証してください',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } else {
        toast({
          title: '事前予測チェックに失敗しました',
          description: response.data.error || 'エラーが発生しました',
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    } catch (error: any) {
      console.error('Prior predictive check error:', error)
      setIsPriorCheckLoading(false)
      toast({
        title: '事前予測チェックに失敗しました',
        description: error.message || 'ネットワークエラーが発生しました',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleRunInference = async () => {
    try {
      const model = getModel()

      if (model.nodes.length === 0) {
        toast({
          title: 'モデルが空です',
          description: 'まずモデルを構築してください',
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
        navigate('/')
        return
      }

      setLoading(true)

      const config = inferenceMethod === 'MCMC'
        ? {
            method: 'MCMC',
            sampler,
            draws,
            tune,
            chains,
            cores,
            hdi_prob: hdiProb
          }
        : {
            method: 'VI',
            vi_method: viMethod,
            iterations: viIterations,
            draws,
            hdi_prob: hdiProb
          }

      // ジョブを投入
      const response = await apiClient.submitInference({ model, config })
      const { job_id } = response.data

      toast({
        title: '推論ジョブを投入しました',
        description: 'バックグラウンドで実行中です',
        status: 'info',
        duration: 2000,
        isClosable: true
      })

      // WebSocketで進捗を監視
      connectWebSocket(
        job_id,
        // 成功時コールバック
        async () => {
          try {
            const resultResponse = await apiClient.getJobResult(job_id)
            setResult(resultResponse.data)
            disconnectWebSocket()

            if (resultResponse.data.success) {
              toast({
                title: '推論が完了しました',
                status: 'success',
                duration: 2000,
                isClosable: true
              })
              navigate('/inference/results')
            } else {
              toast({
                title: '推論に失敗しました',
                description: resultResponse.data.error || 'エラーが発生しました',
                status: 'error',
                duration: 5000,
                isClosable: true
              })
              setLoading(false)
            }
          } catch (err: any) {
            console.error('Failed to fetch result:', err)
            setLoading(false)
            disconnectWebSocket()
          }
        },
        // 失敗時コールバック
        (error: string) => {
          disconnectWebSocket()
          setLoading(false)
          toast({
            title: '推論に失敗しました',
            description: error,
            status: 'error',
            duration: 5000,
            isClosable: true
          })
        }
      )

    } catch (error: any) {
      console.error('Inference submit error:', error)
      setLoading(false)
      toast({
        title: '推論の投入に失敗しました',
        description: error.message || 'ネットワークエラーが発生しました',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleCancelInference = () => {
    cancelJob()
    resetJob()
    toast({
      title: '推論をキャンセルしました',
      status: 'info',
      duration: 2000,
      isClosable: true
    })
  }

  return {
    inferenceMethod,
    setInferenceMethod,
    draws,
    setDraws,
    tune,
    setTune,
    chains,
    setChains,
    cores,
    setCores,
    hdiProb,
    setHdiProb,
    sampler,
    setSampler,
    viIterations,
    setViIterations,
    viMethod,
    setViMethod,
    priorPredictiveResult,
    isPriorCheckLoading,
    isLoading,
    progress,
    stage,
    jobStatus,
    handleRunPriorPredictive,
    handleRunInference,
    handleCancelInference,
  }
}
