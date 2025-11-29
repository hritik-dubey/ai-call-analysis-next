import * as XLSX from 'xlsx'
import { CallData } from '@/types'

export interface RawCallData {
  'Originating Number'?: string | number
  'Start Timestamp'?: string
  'Call duration'?: number
  'Transcript'?: string
  'customer_name'?: string
  'call_reason'?: string
  'customer_sentiment'?: string
  'issues_discussed'?: string
  'outcome_status'?: string
  [key: string]: any
}

export function parseExcelFile(buffer: Buffer): RawCallData[] {
  try {
    console.log('📄 Starting Excel file parsing...')
    console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`)
    
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    console.log(`📋 Found ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`)
    
    const sheetName = workbook.SheetNames[0]
    console.log(`✅ Using sheet: "${sheetName}"`)
    
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<RawCallData>(worksheet)
    
    console.log(`✅ Successfully parsed ${data.length} records from Excel file`)
    
    return data
  } catch (error) {
    console.error('❌ Error parsing Excel file:', error)
    throw new Error('Failed to parse Excel file')
  }
}

export function transformRawData(rawData: RawCallData[]): Array<{
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
}> {
  console.log(`🔄 Transforming ${rawData.length} raw records...`)
  
  const transformed = rawData.map((row, index) => {
    if (index > 0 && index % 100 === 0) {
      console.log(`   ⏳ Transformed ${index}/${rawData.length} records...`)
    }
    
    return {
      id: `call-${index + 1}`,
      phone: String(row['Originating Number'] || 'Unknown'),
      customer: String(row['customer_name'] || 'Unknown'),
      date: String(row['Start Timestamp'] || new Date().toISOString()),
      duration: Number(row['Call duration'] || 0),
      transcript: String(row['Transcript'] || row['summary_points'] || 'No transcript available'),
      callReason: row['call_reason'] ? String(row['call_reason']) : undefined,
      issuesDiscussed: row['issues_discussed'] ? String(row['issues_discussed']) : undefined,
      sentiment: row['customer_sentiment'] ? String(row['customer_sentiment']) : undefined,
      outcome: row['outcome_status'] ? String(row['outcome_status']) : undefined,
    }
  })
  
  console.log(`✅ Successfully transformed ${transformed.length} records`)
  
  return transformed
}

export function validateExcelStructure(data: RawCallData[]): {
  isValid: boolean
  errors: string[]
} {
  console.log('🔍 Validating Excel file structure...')
  const errors: string[] = []

  if (data.length === 0) {
    console.log('❌ Validation failed: Excel file is empty')
    errors.push('Excel file is empty')
    return { isValid: false, errors }
  }

  console.log(`   Validating ${data.length} records...`)

  const firstRow = data[0]
  const availableColumns = Object.keys(firstRow)
  console.log(`   Found ${availableColumns.length} columns: ${availableColumns.slice(0, 5).join(', ')}${availableColumns.length > 5 ? '...' : ''}`)
  
  const hasTranscript = 'Transcript' in firstRow || 'summary_points' in firstRow
  const hasPhoneNumber = 'Originating Number' in firstRow
  
  if (!hasTranscript) {
    console.log('❌ Missing required column: Transcript or summary_points')
    errors.push('Missing required column: Transcript or summary_points')
  } else {
    console.log('✅ Found transcript column')
  }
  
  if (!hasPhoneNumber) {
    console.log('❌ Missing required column: Originating Number')
    errors.push('Missing required column: Originating Number')
  } else {
    console.log('✅ Found phone number column')
  }

  const isValid = errors.length === 0
  console.log(isValid ? '✅ Validation passed' : `❌ Validation failed with ${errors.length} error(s)`)

  return {
    isValid,
    errors
  }
}

