import { NextRequest, NextResponse } from 'next/server'
import { generateSummarizedReport, setModelConfig, ModelConfig } from '@/lib/gemini'
import { AnalysisData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const analysisData: AnalysisData = body.data
    const modelConfig: ModelConfig | undefined = body.modelConfig

    if (!analysisData) {
      return NextResponse.json(
        { success: false, error: 'Analysis data is required' },
        { status: 400 }
      )
    }

    if (modelConfig) {
      setModelConfig(modelConfig)
    }

    console.log('Generating summarized report on-demand...')
    console.log(`📊 Report data: ${analysisData.totalCalls} calls, ${analysisData.categories.length} categories`)
    if (modelConfig) {
      console.log(`🤖 Using model: ${modelConfig.provider}/${modelConfig.model}`)
    }

    const report = await generateSummarizedReport(analysisData)

    console.log('Summarized report generated successfully!')

    return NextResponse.json({
      success: true,
      report: report
    })

  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An error occurred while generating the report' 
      },
      { status: 500 }
    )
  }
}

