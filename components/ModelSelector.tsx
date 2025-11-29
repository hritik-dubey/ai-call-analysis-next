'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Check, Info } from 'lucide-react'

export type Provider = 'gemini' | 'groq'
export type ModelConfig = {
  provider: Provider
  model: string
}

interface ModelInfo {
  value: string
  label: string
  requestsPerMinute: number | string
  requestsPerDay: number | string
  tokensPerMinute: number | string
  tokensPerDay: number | string
  contextWindow?: string
}

interface ModelSelectorProps {
  onModelSelect: (config: ModelConfig) => void
  disabled?: boolean
  initialValue?: ModelConfig | null
}

const GEMINI_MODELS: ModelInfo[] = [
  { 
    value: 'gemini-2.5-flash', 
    label: 'Gemini 2.5 Flash',
    requestsPerMinute: 10,
    requestsPerDay: '1.5K',
    tokensPerMinute: '1M',
    tokensPerDay: '1M',
    contextWindow: '1M tokens'
  }
]

const GROQ_MODELS: ModelInfo[] = [
  { 
    value: 'groq/compound', 
    label: 'Groq Compound',
    requestsPerMinute: 30,
    requestsPerDay: 250,
    tokensPerMinute: '70K',
    tokensPerDay: 'No limit',
    contextWindow: '128K tokens'
  },
  { 
    value: 'groq/compound-mini', 
    label: 'Groq Compound Mini',
    requestsPerMinute: 30,
    requestsPerDay: 250,
    tokensPerMinute: '70K',
    tokensPerDay: 'No limit',
    contextWindow: '128K tokens'
  },
  { 
    value: 'llama-3.3-70b-versatile', 
    label: 'Llama 3.3 70B Versatile',
    requestsPerMinute: 30,
    requestsPerDay: '1K',
    tokensPerMinute: '12K',
    tokensPerDay: '100K',
    contextWindow: '128K tokens'
  },
  { 
    value: 'llama-3.1-8b-instant', 
    label: 'Llama 3.1 8B Instant',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '128K tokens'
  },
  { 
    value: 'llama-3.1-70b-instant', 
    label: 'Llama 3.1 70B Instant',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '128K tokens'
  },
  { 
    value: 'mixtral-8x7b-32768', 
    label: 'Mixtral 8x7B',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '32K tokens'
  },
  { 
    value: 'gemma2-9b-it', 
    label: 'Gemma2 9B IT',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '8K tokens'
  },
  { 
    value: 'allam-2-7b', 
    label: 'Allam 2 7B',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '8K tokens'
  },
  { 
    value: 'meta-llama/llama-3.1-8b-instant', 
    label: 'Meta Llama 3.1 8B Instant',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '128K tokens'
  },
  { 
    value: 'meta-llama/llama-3.1-70b-instant', 
    label: 'Meta Llama 3.1 70B Instant',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '128K tokens'
  },
  { 
    value: 'meta-llama/llama-3.1-405b-instruct', 
    label: 'Meta Llama 3.1 405B Instruct',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '128K tokens'
  },
  { 
    value: 'meta-llama/llama-3.3-70b-instruct', 
    label: 'Meta Llama 3.3 70B Instruct',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '128K tokens'
  },
  { 
    value: 'meta-llama/llama-3.3-70b-versatile', 
    label: 'Meta Llama 3.3 70B Versatile',
    requestsPerMinute: 30,
    requestsPerDay: '7K',
    tokensPerMinute: '6K',
    tokensPerDay: '500K',
    contextWindow: '128K tokens'
  },
]

export default function ModelSelector({ onModelSelect, disabled = false, initialValue }: ModelSelectorProps) {
  const [provider, setProvider] = useState<Provider | ''>(initialValue?.provider || '')
  const [model, setModel] = useState<string>(initialValue?.model || '')
  const [showProviderDropdown, setShowProviderDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [selectedModelInfo, setSelectedModelInfo] = useState<ModelInfo | null>(null)

  useEffect(() => {
    if (initialValue) {
      setProvider(initialValue.provider)
      setModel(initialValue.model)
      const availableModels = initialValue.provider === 'gemini' ? GEMINI_MODELS : GROQ_MODELS
      const modelInfo = availableModels.find(m => m.value === initialValue.model) || null
      setSelectedModelInfo(modelInfo)
    } else {
      setProvider('')
      setModel('')
      setSelectedModelInfo(null)
    }
  }, [initialValue])

  const handleProviderSelect = (selectedProvider: Provider) => {
    setProvider(selectedProvider)
    setModel('')
    setSelectedModelInfo(null)
    setShowProviderDropdown(false)
    setShowModelDropdown(false)
  }

  const handleModelSelect = (selectedModel: string) => {
    setModel(selectedModel)
    const modelInfo = availableModels.find(m => m.value === selectedModel) || null
    setSelectedModelInfo(modelInfo)
    setShowModelDropdown(false)
    onModelSelect({ provider: provider as Provider, model: selectedModel })
  }

  const availableModels: ModelInfo[] = provider === 'gemini' ? GEMINI_MODELS : GROQ_MODELS

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select AI Provider
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setShowProviderDropdown(!showProviderDropdown)}
            disabled={disabled}
            className={`w-full px-4 py-3 bg-white border-2 rounded-lg text-left flex items-center justify-between ${
              disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : provider
                ? 'border-primary-500'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <span className={provider ? 'text-gray-900' : 'text-gray-500'}>
              {provider ? (provider === 'gemini' ? 'Gemini' : 'Groq') : 'Choose Provider'}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showProviderDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showProviderDropdown && !disabled && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              <button
                type="button"
                onClick={() => handleProviderSelect('gemini')}
                className="w-full px-4 py-3 text-black text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span>Gemini</span>
                {provider === 'gemini' && <Check className="w-5 h-5 text-primary-600" />}
              </button>
              <button
                type="button"
                onClick={() => handleProviderSelect('groq')}
                className="w-full px-4 py-3 text-black text-left hover:bg-gray-50 flex items-center justify-between border-t border-gray-200"
              >
                <span>Groq</span>
                {provider === 'groq' && <Check className="w-5 h-5 text-primary-600" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {provider && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Model
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && setShowModelDropdown(!showModelDropdown)}
              disabled={disabled}
              className={`w-full px-4 py-3 bg-white border-2 rounded-lg text-left flex items-center justify-between ${
                disabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : model
                  ? 'border-primary-500'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <span className={model ? 'text-gray-900' : 'text-gray-500'}>
                {model ? availableModels.find(m => m.value === model)?.label : 'Choose Model'}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showModelDropdown && !disabled && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {availableModels.map((m) => (
                  <div key={m.value} className="border-b border-gray-100 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => handleModelSelect(m.value)}
                      className="w-full px-4 py-3 text-black text-left hover:bg-gray-50 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{m.label}</span>
                          {model === m.value && <Check className="w-5 h-5 text-primary-600 ml-2 flex-shrink-0" />}
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                            <span><strong>Req/min:</strong> {m.requestsPerMinute}</span>
                            <span><strong>Req/day:</strong> {m.requestsPerDay}</span>
                            <span><strong>Tokens/min:</strong> {m.tokensPerMinute}</span>
                            <span><strong>Tokens/day:</strong> {m.tokensPerDay}</span>
                          </div>
                          {m.contextWindow && (
                            <span className="block"><strong>Context:</strong> {m.contextWindow}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {provider && model && selectedModelInfo && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-green-900 mb-1">
                Selected: {provider === 'gemini' ? 'Gemini' : 'Groq'} - {selectedModelInfo.label}
              </p>
              {disabled && (
                <p className="text-xs text-green-700">
                  Model selection is locked. Reset to change.
                </p>
              )}
            </div>
            <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          </div>
          
          <div className="bg-white rounded-md p-3 border border-green-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Model Limits & Capabilities</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-gray-600">Requests/min:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedModelInfo.requestsPerMinute}</span>
              </div>
              <div>
                <span className="text-gray-600">Requests/day:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedModelInfo.requestsPerDay}</span>
              </div>
              <div>
                <span className="text-gray-600">Tokens/min:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedModelInfo.tokensPerMinute}</span>
              </div>
              <div>
                <span className="text-gray-600">Tokens/day:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedModelInfo.tokensPerDay}</span>
              </div>
              {selectedModelInfo.contextWindow && (
                <div className="col-span-2">
                  <span className="text-gray-600">Context Window:</span>
                  <span className="ml-2 font-medium text-gray-900">{selectedModelInfo.contextWindow}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

