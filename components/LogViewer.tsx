'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'

export interface LogEntry {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'progress'
  timestamp: Date
}

interface LogViewerProps {
  logs: LogEntry[]
  isStreaming?: boolean
}

export default function LogViewer({ logs, isStreaming = false }: LogViewerProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('LogViewer received logs:', logs.length)
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      case 'progress':
        return <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
    }
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-300 bg-green-900/30 border-l-2 border-green-500'
      case 'warning':
        return 'text-yellow-300 bg-yellow-900/30 border-l-2 border-yellow-500'
      case 'error':
        return 'text-red-300 bg-red-900/30 border-l-2 border-red-500'
      case 'progress':
        return 'text-blue-300 bg-blue-900/30 border-l-2 border-blue-500'
      default:
        return 'text-gray-300 bg-gray-800/50 border-l-2 border-gray-500'
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Processing Logs</span>
        </div>
        {isStreaming && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        )}
      </div>
      
      <div className="h-96 overflow-y-auto p-4 font-mono text-sm bg-gray-900">
        {!logs || logs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-500" />
            <div>Waiting for logs...</div>
            <div className="text-xs text-gray-600 mt-2">Logs will appear here in real-time</div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => {
              if (!log || !log.message) return null
              return (
                <div
                  key={log.id || `${log.timestamp}-${Math.random()}`}
                  className={`px-3 py-2 rounded flex items-start space-x-2 ${getLogColor(log.type)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="break-words text-sm">{log.message}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {isStreaming && (
              <div className="flex items-center space-x-2 text-gray-500 px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Processing...</span>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

