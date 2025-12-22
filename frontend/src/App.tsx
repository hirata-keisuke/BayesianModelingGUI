import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactFlowProvider } from 'reactflow'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ModelBuilderPage } from './pages/ModelBuilderPage'
import { InferenceConfigPage } from './pages/InferenceConfigPage'
import { InferenceResultsPage } from './pages/InferenceResultsPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ReactFlowProvider>
                  <ModelBuilderPage />
                </ReactFlowProvider>
              }
            />
            <Route path="/inference" element={<InferenceConfigPage />} />
            <Route path="/inference/results" element={<InferenceResultsPage />} />
          </Routes>
        </BrowserRouter>
      </ChakraProvider>
    </QueryClientProvider>
  )
}

export default App
