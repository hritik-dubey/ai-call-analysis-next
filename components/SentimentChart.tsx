'use client'

import { AnalysisData } from '@/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Smile, Meh, Frown, AlertCircle } from 'lucide-react'

interface SentimentChartProps {
  data: AnalysisData
}

export default function SentimentChart({ data }: SentimentChartProps) {
  console.log(data)
  
  if (!data || !data.summary || !data.summary.sentimentDistribution) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Customer Sentiment Distribution
        </h3>
        <div className="flex items-center justify-center h-64 text-center">
          <div className="space-y-3">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-gray-600">Unable to load sentiment data</p>
            <p className="text-sm text-gray-500">The data structure is invalid or missing</p>
          </div>
        </div>
      </div>
    )
  }

  const sentimentData = [
    { 
      name: 'Positive', 
      value: data.summary.sentimentDistribution.positive || 0,
      color: '#10b981',
      icon: Smile
    },
    { 
      name: 'Neutral', 
      value: data.summary.sentimentDistribution.neutral || 0,
      color: '#6b7280',
      icon: Meh
    },
    { 
      name: 'Negative', 
      value: data.summary.sentimentDistribution.negative || 0,
      color: '#ef4444',
      icon: Frown
    },
  ]

  const total = sentimentData.reduce((sum, item) => sum + (item.value || 0), 0)
  
  if (total === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Customer Sentiment Distribution
        </h3>
        <div className="flex items-center justify-center h-64 text-center">
          <div className="space-y-3">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <p className="text-gray-600">No sentiment data available</p>
          </div>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Customer Sentiment Distribution
        </h3>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-3">
          {sentimentData.map((item, idx) => {
            const Icon = item.icon
            const percentage = total > 0 ? ((item.value || 0) / total * 100).toFixed(1) : '0'
            return (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{item.value || 0}</div>
                  <div className="text-sm text-gray-500">{percentage}%</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error rendering sentiment chart:', error)
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Customer Sentiment Distribution
        </h3>
        <div className="flex items-center justify-center h-64 text-center">
          <div className="space-y-3">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-gray-600">Error displaying sentiment chart</p>
            <p className="text-sm text-gray-500">Please refresh and try again</p>
          </div>
        </div>
      </div>
    )
  }
}

