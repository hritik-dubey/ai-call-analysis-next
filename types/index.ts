export interface CallData {
  id: string
  phone: string
  customer: string
  date: string
  duration: number
  transcript: string
  callReason?: string
  issuesDiscussed?: string
  sentiment?: string
  outcome?: string
  categories: string[]
  aiAnalysis?: string
}

export interface CategoryStat {
  category: string
  count: number
  percentage: number
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
}

export interface AnalysisData {
  totalCalls: number
  categorizedCalls: number
  categories: CategoryStat[]
  calls: CallData[]
  summary: {
    answerRate: number
    avgDuration: number
    totalDuration: number
    sentimentDistribution: {
      positive: number
      neutral: number
      negative: number
    }
    topCategories: string[]
  }
  timestamp: string
}

export interface UploadResponse {
  success: boolean
  message: string
  data?: AnalysisData
  report?: string
  error?: string
}

