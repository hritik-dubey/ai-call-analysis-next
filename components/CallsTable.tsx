'use client'

import { useState } from 'react'
import { AnalysisData } from '@/types'
import { Search, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface CallsTableProps {
  data: AnalysisData
}

export default function CallsTable({ data }: CallsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const itemsPerPage = 10

  if (!data || !data.calls || !Array.isArray(data.calls)) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Unable to Load Call Data
        </h3>
        <p className="text-gray-600">
          The call data is missing or invalid
        </p>
      </div>
    )
  }

  if (data.calls.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Calls Found
        </h3>
        <p className="text-gray-600">
          There are no calls to display
        </p>
      </div>
    )
  }

  let filteredCalls = []
  try {
    filteredCalls = data.calls.filter(call => {
      if (!call) return false
      
      const matchesSearch = 
        (call.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.id || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        (call.categories && Array.isArray(call.categories) && call.categories.includes(selectedCategory))

      return matchesSearch && matchesCategory
    })
  } catch (error) {
    console.error('Error filtering calls:', error)
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Error Filtering Calls
        </h3>
        <p className="text-gray-600">
          An error occurred while filtering the call data
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayedCalls = filteredCalls.slice(startIndex, startIndex + itemsPerPage)

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  try {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by phone, customer, or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="all">All Categories</option>
            {data.categories && Array.isArray(data.categories) && data.categories.map((cat, idx) => (
              <option key={idx} value={cat.category}>
                {cat.category || 'Unknown'} ({cat.count || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCalls.length)} of {filteredCalls.length} calls
        </div>

        {filteredCalls.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Calls Found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Call ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedCalls.map((call) => (
                    <>
                      <tr key={call.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {call.id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {call.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {call.customer || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {call.duration || 0}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            call.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            call.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {call.sentiment || 'neutral'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {call.categories && Array.isArray(call.categories) && call.categories.slice(0, 2).map((cat, idx) => (
                              <span key={idx} className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
                                {cat && cat.length > 20 ? cat.substring(0, 17) + '...' : (cat || 'Unknown')}
                              </span>
                            ))}
                            {call.categories && call.categories.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{call.categories.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => toggleRow(call.id)}
                            className="text-primary-600 hover:text-primary-800 flex items-center space-x-1"
                          >
                            {expandedRows.has(call.id) ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                <span>Hide</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                <span>View</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(call.id) && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-1">AI Analysis:</h4>
                                <p className="text-sm text-gray-600">{call.aiAnalysis || 'N/A'}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-1">All Categories:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {call.categories && Array.isArray(call.categories) && call.categories.map((cat, idx) => (
                                    <span key={idx} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm">
                                      {cat || 'Unknown'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {call.callReason && (
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-1">Call Reason:</h4>
                                  <p className="text-sm text-gray-600">{call.callReason}</p>
                                </div>
                              )}
                              {call.issuesDiscussed && (
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-1">Issues Discussed:</h4>
                                  <p className="text-sm text-gray-600">{call.issuesDiscussed}</p>
                                </div>
                              )}
                              <div>
                                <h4 className="font-semibold text-gray-700 mb-1">Transcript Preview:</h4>
                                <p className="text-sm text-gray-600">
                                  {call.transcript ? call.transcript.substring(0, 200) + '...' : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error rendering calls table:', error)
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Error Displaying Calls
        </h3>
        <p className="text-gray-600">
          An error occurred while rendering the call data
        </p>
      </div>
    )
  }
}

