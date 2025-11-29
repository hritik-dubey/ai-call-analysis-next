'use client'

import { useState, useRef } from 'react'
import FileUpload from '@/components/FileUpload'
import AnalysisResults from '@/components/AnalysisResults'
import Header from '@/components/Header'
import LogViewer, { LogEntry } from '@/components/LogViewer'
import { AnalysisData } from '@/types'
import { ModelConfig } from '@/components/ModelSelector'
import { Square } from 'lucide-react'

type Screen = 'upload' | 'dashboard' | 'logs'

export default function Home() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [report, setReport] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [currentScreen, setCurrentScreen] = useState<Screen>('upload')
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null)
  const stopHandlerRef = useRef<(() => void) | null>(null)

  const handleAnalysisComplete = (data: AnalysisData, report?: string, modelConfig?: ModelConfig) => {
    setAnalysisData(data)
    setReport(report || null)
    setIsAnalyzing(false)
    if (modelConfig) {
      setModelConfig(modelConfig)
    }
    setCurrentScreen('dashboard')
  }

  const handleAnalysisStart = () => {
    setIsAnalyzing(true)
    setAnalysisData(null)
    setError(null)
    setLogs([])
    setCurrentScreen('upload')
  }

  const handleReset = () => {
    setAnalysisData(null)
    setReport(null)
    setIsAnalyzing(false)
    setError(null)
    setLogs([])
    setModelConfig(null)
    setCurrentScreen('upload')
  }

  const handleModelConfigChange = (config: ModelConfig | null) => {
    setModelConfig(config)
  }

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage)
    setIsAnalyzing(false)
  }

  const handleStopRequested = () => {
    setIsAnalyzing(false)
    setError(null)
  }

  const handleLogsUpdate = (newLogs: LogEntry[]) => {
    console.log('Parent received logs update:', newLogs.length, 'logs')
    setLogs(newLogs)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {currentScreen === 'upload' && (
          <div className={isAnalyzing ? 'hidden' : 'animate-fade-in'}>
            <FileUpload 
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisStart={handleAnalysisStart}
              onAnalysisError={handleAnalysisError}
              onLogsUpdate={handleLogsUpdate}
              onModelConfigChange={handleModelConfigChange}
            />
          </div>
        )}

        {isAnalyzing && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Analyzing Calls with AI...
              </h3>
              <p className="text-gray-500 mb-4">
                This may take a few minutes depending on the number of calls
              </p>
              <button
                onClick={() => {
                  if (stopHandlerRef.current) {
                    stopHandlerRef.current()
                  }
                }}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
              >
                <Square className="w-4 h-4" />
                <span>Stop Analysis</span>
              </button>
            </div>
            <LogViewer logs={logs} isStreaming={isAnalyzing} />
            <div className="hidden">
              <FileUpload 
                onAnalysisComplete={handleAnalysisComplete}
                onAnalysisStart={handleAnalysisStart}
                onAnalysisError={handleAnalysisError}
                onLogsUpdate={handleLogsUpdate}
                onModelConfigChange={handleModelConfigChange}
                onStopRequested={handleStopRequested}
                stopHandlerRef={stopHandlerRef}
              />
            </div>
          </div>
        )}

        {error && !isAnalyzing && currentScreen === 'upload' && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {analysisData && currentScreen === 'dashboard' && (
          <div className="animate-slide-up">
            <AnalysisResults 
              data={analysisData}
              report={report}
              modelConfig={modelConfig}
              onReset={handleReset}
              onViewLogs={() => setCurrentScreen('logs')}
            />
          </div>
        )}

        {currentScreen === 'logs' && logs.length > 0 && (
          <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Analysis Logs</h2>
                <p className="text-gray-600">Detailed logs from the analysis process</p>
              </div>
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
              >
                ← Back to Dashboard
              </button>
            </div>
            <LogViewer logs={logs} isStreaming={false} />
          </div>
        )}
      </div>
    </main>
  )
}

