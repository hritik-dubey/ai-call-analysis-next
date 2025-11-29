'use client'

import { AnalysisData } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertCircle } from 'lucide-react'

interface CategoryChartProps {
  data: AnalysisData
}

export default function CategoryChart({ data }: CategoryChartProps) {
  if (!data || !data.categories || !Array.isArray(data.categories)) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Unable to Load Category Data
          </h3>
          <p className="text-gray-600">
            The category data is missing or invalid
          </p>
        </div>
      </div>
    )
  }

  if (data.categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No Categories Found
          </h3>
          <p className="text-gray-600">
            There are no categories to display
          </p>
        </div>
      </div>
    )
  }

  try {
    const chartData = data.categories.slice(0, 15).map(cat => ({
      name: cat.category && cat.category.length > 30 ? cat.category.substring(0, 27) + '...' : (cat.category || 'Unknown'),
      fullName: cat.category || 'Unknown',
      calls: cat.count || 0,
      percentage: parseFloat((cat.percentage || 0).toFixed(1)),
      positive: cat.sentiment?.positive || 0,
      neutral: cat.sentiment?.neutral || 0,
      negative: cat.sentiment?.negative || 0,
    }))

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Top 15 Categories by Call Volume
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 200 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={190} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-semibold text-gray-800 mb-2">{data.fullName}</p>
                        <p className="text-sm text-gray-600">Calls: {data.calls}</p>
                        <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="calls" fill="#0ea5e9" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Category Sentiment Breakdown (Top 15)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 200 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={190} />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill="#6b7280" name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.categories.map((cat, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-800 text-sm">{cat.category || 'Unknown'}</h4>
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium">
                  #{idx + 1}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Calls:</span>
                  <span className="font-semibold text-gray-800">{cat.count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Percentage:</span>
                  <span className="font-semibold text-gray-800">{(cat.percentage || 0).toFixed(1)}%</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-600">👍 {cat.sentiment?.positive || 0}</span>
                    <span className="text-gray-500">😐 {cat.sentiment?.neutral || 0}</span>
                    <span className="text-red-600">👎 {cat.sentiment?.negative || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error rendering category chart:', error)
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Error Displaying Categories
          </h3>
          <p className="text-gray-600">
            An error occurred while rendering the category data
          </p>
        </div>
      </div>
    )
  }
}

