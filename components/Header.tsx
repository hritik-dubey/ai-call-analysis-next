import { FileBarChart, Sparkles } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-primary-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <FileBarChart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                AI Call Analysis Tool
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Automated transcription categorization and statistical analysis
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

