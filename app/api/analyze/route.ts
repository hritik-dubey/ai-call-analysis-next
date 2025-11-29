import { NextRequest, NextResponse } from 'next/server'
import { parseExcelFile, transformRawData, validateExcelStructure } from '@/lib/excelProcessor'
import { batchCategorizeCallsWithProgress, generateReportWithGemini, setModelConfig, ModelConfig, LogCallback } from '@/lib/gemini'
import { calculateStatistics } from '@/lib/statistics'
import { CallData, AnalysisData } from '@/types'


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const provider = formData.get('provider') as string
    const model = formData.get('model') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!provider || !model) {
      return NextResponse.json(
        { success: false, error: 'Provider and model must be specified' },
        { status: 400 }
      )
    }

    if (provider !== 'gemini' && provider !== 'groq') {
      return NextResponse.json(
        { success: false, error: 'Invalid provider. Must be "gemini" or "groq"' },
        { status: 400 }
      )
    }

    const modelConfig: ModelConfig = { provider: provider as 'gemini' | 'groq', model }
    setModelConfig(modelConfig)
    console.log(`Using model: ${provider}/${model}`)

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'Only Excel files (.xlsx, .xls) are supported' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('Parsing Excel file...')
    const rawData = parseExcelFile(buffer)

    const validation = validateExcelStructure(rawData)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid Excel structure: ${validation.errors.join(', ')}`
        },
        { status: 400 }
      )
    }

    console.log(`Found ${rawData.length} calls to analyze`)

    const transformedData = transformRawData(rawData)

    const callsToAnalyze = transformedData

    console.log(`Starting AI categorization for ${callsToAnalyze.length} calls...`)

    const categorizationResults = await batchCategorizeCallsWithProgress(
      callsToAnalyze.map(call => ({
        transcript: call.transcript,
        callReason: call.callReason,
        issuesDiscussed: call.issuesDiscussed
      }))
    )

    const categorizedCalls: CallData[] = callsToAnalyze.map((call, index) => ({
      ...call,
      categories: categorizationResults[index].categories,
      sentiment: categorizationResults[index].sentiment,
      aiAnalysis: categorizationResults[index].summary
    }))

    console.log('Calculating statistics...')

    const analysisData: AnalysisData = calculateStatistics(categorizedCalls)

    console.log('Generating comprehensive report with Gemini...')

    const report = await generateReportWithGemini(analysisData)

    console.log('Analysis complete!')

    return NextResponse.json({
      success: true,
      message: `Successfully analyzed ${categorizedCalls.length} calls`,
      data: analysisData,
      report: report
    })

  } catch (error: any) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred during analysis'
      },
      { status: 500 }
    )
  }
}

