import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'
import { parseExcelFile, transformRawData, validateExcelStructure } from '@/lib/excelProcessor'
import { batchCategorizeCallsWithProgress, generateReportWithGemini, setModelConfig, ModelConfig, LogCallback } from '@/lib/gemini'
import { calculateStatistics } from '@/lib/statistics'
import { CallData, AnalysisData } from '@/types'


function createStreamWriter(controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  return (message: string, type: string = 'info') => {
    const logEntry = {
      message,
      type,
      timestamp: new Date().toISOString(),
    }
    const data = `data: ${JSON.stringify(logEntry)}\n\n`
    try {
      controller.enqueue(encoder.encode(data))
    } catch (error) {
      console.error('Error sending log:', error)
    }
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendLog: LogCallback = (message, type = 'info') => {
        createStreamWriter(controller, encoder)(message, type)
      }

      try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const provider = formData.get('provider') as string
        const model = formData.get('model') as string

        if (!file) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No file uploaded' })}\n\n`))
          controller.close()
          return
        }

        if (!provider || !model) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Provider and model must be specified' })}\n\n`))
          controller.close()
          return
        }

        if (provider !== 'gemini' && provider !== 'groq') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Invalid provider. Must be "gemini" or "groq"' })}\n\n`))
          controller.close()
          return
        }

        const modelConfig: ModelConfig = { provider: provider as 'gemini' | 'groq', model }
        setModelConfig(modelConfig)
        sendLog(`Using model: ${provider}/${model}`, 'info')

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Only Excel files (.xlsx, .xls) are supported' })}\n\n`))
          controller.close()
          return
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        sendLog('📄 Starting Excel file parsing...', 'info')
        sendLog(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`, 'info')

        const workbook = XLSX.read(buffer, { type: 'buffer' })
        sendLog(`📋 Found ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`, 'info')
        sendLog(`✅ Using sheet: "${workbook.SheetNames[0]}"`, 'info')

        const rawData = parseExcelFile(buffer)
        sendLog(`✅ Successfully parsed ${rawData.length} records from Excel file`, 'success')

        sendLog('🔍 Validating Excel file structure...', 'info')
        sendLog(`   Validating ${rawData.length} records...`, 'info')
        const validation = validateExcelStructure(rawData)

        if (!validation.isValid) {
          sendLog(`❌ Validation failed: ${validation.errors.join(', ')}`, 'error')
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Invalid Excel structure: ${validation.errors.join(', ')}` })}\n\n`))
          controller.close()
          return
        }

        sendLog('✅ Validation passed', 'success')
        sendLog(`Found ${rawData.length} calls to analyze`, 'info')

        sendLog(`🔄 Transforming ${rawData.length} raw records...`, 'info')
        const transformedData = transformRawData(rawData)
        sendLog(`✅ Successfully transformed ${transformedData.length} records`, 'success')
        const callsToAnalyze = transformedData

        sendLog(`Starting AI categorization for ${callsToAnalyze.length} calls...`, 'info')

        const categorizationResults = await batchCategorizeCallsWithProgress(
          callsToAnalyze.map(call => ({
            transcript: call.transcript,
            callReason: call.callReason,
            issuesDiscussed: call.issuesDiscussed
          })),
          undefined,
          sendLog
        )

        const categorizedCalls: CallData[] = callsToAnalyze.map((call, index) => ({
          ...call,
          categories: categorizationResults[index].categories,
          sentiment: categorizationResults[index].sentiment,
          aiAnalysis: categorizationResults[index].summary
        }))

        sendLog('Calculating statistics...', 'info')

        const analysisData: AnalysisData = calculateStatistics(categorizedCalls)

        sendLog('Analysis complete!', 'success')

        const result = {
          success: true,
          message: `Successfully analyzed ${categorizedCalls.length} calls`,
          data: analysisData,
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`))
        controller.close()

      } catch (error: any) {
        const errorMsg = error.message || 'An error occurred during analysis'
        sendLog(`❌ Error: ${errorMsg}`, 'error')
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ success: false, error: errorMsg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

