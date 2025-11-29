'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import { AnalysisData } from '@/types'
import ModelSelector, { ModelConfig } from './ModelSelector'
import LogViewer, { LogEntry } from './LogViewer'

interface FileUploadProps {
  onAnalysisComplete: (data: AnalysisData, report?: string, modelConfig?: ModelConfig) => void
  onAnalysisStart: () => void
  onAnalysisError?: (error: string) => void
  onLogsUpdate?: (logs: LogEntry[]) => void
  onModelConfigChange?: (config: ModelConfig | null) => void
  onStopRequested?: () => void
  stopHandlerRef?: React.MutableRefObject<(() => void) | null>
}

export default function FileUpload({ onAnalysisComplete, onAnalysisStart, onAnalysisError, onLogsUpdate, onModelConfigChange, onStopRequested, stopHandlerRef }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleFileChange = (selectedFile: File | null) => {
    setError('')
    
    if (selectedFile && (!modelConfig || !modelConfig.provider || !modelConfig.model)) {
      setError('Please select a provider and model first')
      return
    }
    
    if (!selectedFile) {
      setFile(null)
      return
    }

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)')
      setFile(null)
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (!modelConfig || !modelConfig.provider || !modelConfig.model) {
      setError('Please select a provider and model first')
      return
    }
    
    const droppedFile = e.dataTransfer.files[0]
    handleFileChange(droppedFile)
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsAnalyzing(false)
    const stopLog: LogEntry = {
      id: `${Date.now()}-stop`,
      message: '⏹️ Analysis stopped by user',
      type: 'warning',
      timestamp: new Date(),
    }
    setLogs(prev => {
      const updated = [...prev, stopLog]
      if (onLogsUpdate) {
        onLogsUpdate(updated)
      }
      return updated
    })
    if (onStopRequested) {
      onStopRequested()
    }
    if (onAnalysisError) {
      onAnalysisError('Analysis stopped by user')
    }
  }

  useEffect(() => {
    if (stopHandlerRef) {
      stopHandlerRef.current = handleStop
    }
    return () => {
      if (stopHandlerRef) {
        stopHandlerRef.current = null
      }
    }
  })

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    if (!modelConfig || !modelConfig.provider || !modelConfig.model) {
      setError('Please select a provider and model first')
      return
    }

    abortControllerRef.current = new AbortController()
    setIsAnalyzing(true)
    setLogs([])
    onAnalysisStart()
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('provider', modelConfig.provider)
      formData.append('model', modelConfig.model)

      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body reader available')
      }

      let result: any = null
      let buffer = ''

      const handleStreamData = (data: any) => {
        if (data.message) {
          console.log('Received log:', data.message, data.type)
          const logEntry: LogEntry = {
            id: `${Date.now()}-${Math.random()}`,
            message: data.message,
            type: data.type || 'info',
            timestamp: new Date(data.timestamp || Date.now()),
          }
          setLogs(prev => {
            const updated = [...prev, logEntry]
            if (onLogsUpdate) {
              onLogsUpdate(updated)
            }
            return updated
          })
        }
        
        if (data.success !== undefined) {
          result = data
          if (data.error) {
            throw new Error(data.error)
          }
        }
        
        if (data.error && !data.success) {
          throw new Error(data.error)
        }
      }

      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          reader.cancel()
          break
        }
        
        const { done, value } = await reader.read()
        
        if (abortControllerRef.current?.signal.aborted) {
          reader.cancel()
          break
        }
        
        if (done) {
          if (buffer.trim()) {
            const lines = buffer.split('\n')
            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6).trim()
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr)
                    handleStreamData(data)
                  }
                } catch (parseError) {
                  console.error('Error parsing final buffer:', parseError, 'Line:', trimmedLine)
                }
              }
            }
          }
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6).trim()
              if (jsonStr) {
                const data = JSON.parse(jsonStr)
                handleStreamData(data)
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError, 'Line:', trimmedLine)
            }
          } else if (trimmedLine) {
            console.log('Non-data line received:', trimmedLine.substring(0, 100))
          }
        }
      }

      if (!result) {
        throw new Error('No result received from server')
      }

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      if (!result.data) {
        throw new Error('No analysis data returned from server')
      }

      onAnalysisComplete(result.data, result.report, modelConfig)
      abortControllerRef.current = null
    } catch (err: any) {
      if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        console.log('Analysis aborted by user')
        abortControllerRef.current = null
        return
      }
      
      console.error('Analysis error:', err)
      const errorMessage = err.message || 'An unexpected error occurred during analysis. Please try again.'
      
      const errorLog: LogEntry = {
        id: `${Date.now()}-error`,
        message: `❌ Error: ${errorMessage}`,
        type: 'error',
        timestamp: new Date(),
      }
      setLogs(prev => [...prev, errorLog])
      if (onLogsUpdate) {
        setLogs(prev => {
          const updated = [...prev, errorLog]
          onLogsUpdate(updated)
          return updated
        })
      }
      
      setError(errorMessage)
      setIsAnalyzing(false)
      abortControllerRef.current = null
      if (onAnalysisError) {
        onAnalysisError(errorMessage)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Upload Your Call Data
          </h2>
          <p className="text-gray-600">
            Upload an Excel file containing call transcriptions for AI-powered analysis
          </p>
        </div>

        <div className="mb-8">
          <ModelSelector 
            onModelSelect={(config) => {
              setModelConfig(config)
              if (onModelConfigChange) {
                onModelConfigChange(config)
              }
            }}
            disabled={isAnalyzing || !!file}
          />
        </div>

        <div
          className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
            !modelConfig || !modelConfig.provider || !modelConfig.model
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              : isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
          }`}
          onDragOver={modelConfig && modelConfig.provider && modelConfig.model ? handleDragOver : (e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={modelConfig && modelConfig.provider && modelConfig.model ? handleDrop : (e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              if (modelConfig && modelConfig.provider && modelConfig.model) {
                handleFileChange(e.target.files?.[0] || null)
              }
            }}
            disabled={!modelConfig || !modelConfig.provider || !modelConfig.model}
            className="hidden"
          />

          {!modelConfig || !modelConfig.provider || !modelConfig.model ? (
            <>
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
                  <Upload className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-500 mb-2">
                Please select provider and model first
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Choose an AI provider and model above to enable file upload
              </p>
              <button
                disabled
                className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed shadow-md"
              >
                Browse Files
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Supported formats: .xlsx, .xls (Max size: 10MB)
              </p>
            </>
          ) : !file ? (
            <>
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full mb-4">
                  <Upload className="w-10 h-10 text-primary-600" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and drop your Excel file here
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-primary-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Browse Files
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: .xlsx, .xls (Max size: 10MB)
              </p>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <FileSpreadsheet className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-lg font-medium text-gray-700">{file.name}</p>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setFile(null)
                    setError('')
                  }}
                  disabled={isAnalyzing}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !modelConfig || !modelConfig.provider || !modelConfig.model}
                  className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-primary-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                </button>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            📋 Required Excel Columns:
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Originating Number</strong> - Phone number of caller</li>
            <li>• <strong>Transcript</strong> or <strong>summary_points</strong> - Call transcription</li>
            <li>• Optional: customer_name, call_reason, issues_discussed, customer_sentiment, outcome_status</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

