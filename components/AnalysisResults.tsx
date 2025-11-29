'use client'

import { useState, useEffect } from 'react'
import { AnalysisData } from '@/types'
import { 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  Phone,
  PieChart as PieChartIcon,
  BarChart3,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { generateTextReport, generateCSV } from '@/lib/statistics'
import CategoryChart from './CategoryChart'
import SentimentChart from './SentimentChart'
import CallsTable from './CallsTable'
import ModelSelector, { ModelConfig } from './ModelSelector'

interface AnalysisResultsProps {
  data: AnalysisData
  report?: string | null
  modelConfig?: ModelConfig | null
  onReset: () => void
  onViewLogs?: () => void
}

export default function AnalysisResults({ data, report, modelConfig, onReset, onViewLogs }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'calls'>('overview')
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [selectedModelForReport, setSelectedModelForReport] = useState<ModelConfig | null>(modelConfig || null)

  useEffect(() => {
    if (modelConfig) {
      setSelectedModelForReport(modelConfig)
    }
  }, [modelConfig])

  if (!data || typeof data !== 'object') {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Analysis Data</h2>
        <p className="text-gray-600 mb-4">The analysis data is missing or invalid</p>
        <button
          onClick={onReset}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  const downloadReport = async () => {
    try {
      setError(null)
      setIsGeneratingReport(true)

      if (!selectedModelForReport || !selectedModelForReport.provider || !selectedModelForReport.model) {
        throw new Error('Please select a provider and model to generate the report')
      }

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data,
          modelConfig: selectedModelForReport
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report')
      }

      const reportText = result.report || generateTextReport(data)
      const blob = new Blob([reportText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `call-analysis-report-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error generating/downloading report:', err)
      setError(err.message || 'Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const downloadCSV = () => {
    try {
      setError(null)
      const csv = generateCSV(data)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `call-analysis-data-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading CSV:', err)
      setError('Failed to download CSV. Please try again.')
    }
  }

  return (
      <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Report Generation Model</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select the AI model to use for generating the report. The default is the model used for analysis.
          </p>
          <ModelSelector 
            onModelSelect={setSelectedModelForReport}
            disabled={isGeneratingReport}
            initialValue={selectedModelForReport}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
            <p className="text-gray-600 text-sm mt-1">
              Generated on {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unknown date'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadReport}
              disabled={isGeneratingReport || !selectedModelForReport || !selectedModelForReport.provider || !selectedModelForReport.model}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Report</span>
                </>
              )}
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
            {onViewLogs && (
              <button
                onClick={onViewLogs}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Logs</span>
              </button>
            )}
            <button
              onClick={onReset}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Analysis</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Phone className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{data.totalCalls || 0}</div>
          <div className="text-blue-100 text-sm">Total Calls Analyzed</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {data?.summary?.avgDuration ? Math.round(data.summary.avgDuration) : 0}s
          </div>
          <div className="text-green-100 text-sm">Avg Call Duration</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <PieChartIcon className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{data?.categories?.length || 0}</div>
          <div className="text-orange-100 text-sm">Categories Identified</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`flex-1 px-6 py-4 font-medium transition-all ${
                activeTab === 'calls'
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Call Details
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SentimentChart data={data} />
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                    Top 10 Categories
                  </h3>
                  {data?.categories && data.categories.length > 0 ? (
                    <div className="space-y-3">
                      {data.categories.slice(0, 10).map((cat, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {cat.category || 'Unknown'}
                            </span>
                            <span className="text-sm text-gray-600">
                              {cat.count || 0} ({(cat.percentage || 0).toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(cat.percentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No categories available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && <CategoryChart data={data} />}

          {activeTab === 'calls' && <CallsTable data={data} />}
        </div>
      </div>
    </div>
  )
}

