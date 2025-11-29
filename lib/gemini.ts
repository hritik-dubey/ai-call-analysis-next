import { AnalysisData } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export type Provider = "gemini" | "groq";
export type ModelConfig = {
  provider: Provider;
  model: string;
};

let currentModelConfig: ModelConfig | null = null;

export function setModelConfig(config: ModelConfig) {
  currentModelConfig = config;
}

function getModelConfig(): ModelConfig {
  if (!currentModelConfig) {
    return { provider: "groq", model: "llama-3.3-70b-versatile" };
  }
  return currentModelConfig;
}

async function callGroqAPI(
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Please set it in your environment variables."
    );
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(
      errorData.error?.message ||
        `HTTP ${response.status}: ${response.statusText}`
    );
    error.status = response.status;
    error.errorData = errorData;
    throw error;
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function callGeminiAPI(prompt: string, model: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Please set it in your environment variables."
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model: model });

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  retryCount: number = 0,
  logCallback?: LogCallback
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const shouldRetry = retryCount < maxRetries;
    
    if (error?.status === 429 && shouldRetry) {
      const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 90000);
      const logMsg = `⚠️  Rate limit hit. Retrying after ${
        retryDelay / 1000
      } seconds... (Attempt ${retryCount + 1}/${maxRetries})`;
      console.log(logMsg);
      logCallback?.(logMsg, "warning");

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return retryWithBackoff(fn, maxRetries, retryCount + 1, logCallback);
    }
    
    if (error?.status === 503 && shouldRetry) {
      const retryDelay = Math.min(10000 * Math.pow(2, retryCount), 180000);
      const serviceMsg = `⚠️  Service overloaded (503). Retrying after ${
        retryDelay / 1000
      } seconds... (Attempt ${retryCount + 1}/${maxRetries})`;
      console.log(serviceMsg);
      logCallback?.(serviceMsg, "warning");
      const tipMsg = `   💡 Tip: The API is currently busy. Waiting before retry...`;
      console.log(tipMsg);
      logCallback?.(tipMsg, "info");

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return retryWithBackoff(fn, maxRetries, retryCount + 1, logCallback);
    }
    
    if (
      error?.status === 400 &&
      (error?.errorData?.error?.code === "context_length_exceeded" ||
        error?.message?.includes("length") ||
        error?.message?.includes("context"))
    ) {
      const errorMsg = `❌ Context length exceeded. Prompt is too long for the model.`;
      console.log(errorMsg);
      logCallback?.(errorMsg, "error");
      throw new Error(
        "The data is too large to process. Please try with fewer calls or contact support."
      );
    }
    
    if (error?.status >= 500 && error?.status < 600 && shouldRetry) {
      const retryDelay = Math.min(15000 * Math.pow(2, retryCount), 120000);
      const logMsg = `⚠️  Server error (${error.status}). Retrying after ${
        retryDelay / 1000
      } seconds... (Attempt ${retryCount + 1}/${maxRetries})`;
      console.log(logMsg);
      logCallback?.(logMsg, "warning");

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return retryWithBackoff(fn, maxRetries, retryCount + 1, logCallback);
    }

    throw error;
  }
}

export interface CategorizationResult {
  categories: string[];
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
}

export type LogCallback = (
  message: string,
  type?: "info" | "success" | "warning" | "error" | "progress"
) => void;

export async function categorizeCall(
  transcript: string,
  callReason?: string,
  issuesDiscussed?: string,
  logCallback?: LogCallback
): Promise<CategorizationResult> {
  return retryWithBackoff(
    async () => {
      const config = getModelConfig();
      const logMsg = `🤖 Analyzing call transcript (${transcript.length} characters) with ${config.provider}/${config.model}...`;
      console.log(logMsg);
      logCallback?.(logMsg, "info");

      const prompt = `You are an AI assistant analyzing customer service call transcripts for an automotive service center.

Analyze the following call transcript and provide:
1. Relevant categories that best describe the call content. Create specific, meaningful category names based on what the customer is asking about or discussing. Do NOT assume categories based on business names (e.g., "Oil Changers" does not automatically mean oil-related services). Analyze the actual conversation content.
2. Customer sentiment (positive, neutral, or negative)
3. A brief summary of the call

Call Information:
${callReason ? `Call Reason: ${callReason}` : ""}
${issuesDiscussed ? `Issues Discussed: ${issuesDiscussed}` : ""}
Transcript: ${transcript.substring(0, 2000)}${
        transcript.length > 2000 ? "..." : ""
      }

Respond ONLY with valid JSON format (no markdown, no code blocks, just the JSON object):
{
  "categories": ["CATEGORY 1", "CATEGORY 2"],
  "sentiment": "neutral",
  "summary": "Brief summary of the call"
}

Important: 
- Create categories based on the actual conversation content, not business names or assumptions
- Categories should be specific and descriptive (e.g., "PRICING INQUIRY", "SCHEDULING REQUEST", "SERVICE COMPLAINT", "PRODUCT INFORMATION", etc.)
- Only include categories that clearly apply to the conversation
- Be accurate and avoid false assumptions
- Return ONLY the JSON object, no other text`;

      let text: string;

      if (config.provider === "gemini") {
        text = await callGeminiAPI(prompt, config.model);
      } else {
        const messages = [
          {
            role: "system",
            content:
              "You are a helpful AI assistant that analyzes customer service calls. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ];
        text = await callGroqAPI(messages, config.model);
      }

      let jsonText = text.trim();
      jsonText = jsonText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        const errorMsg = `❌ Failed to extract JSON from ${config.provider} response`;
        const detailMsg = `Response: ${text.substring(0, 200)}`;
        console.log(errorMsg);
        console.log(detailMsg);
        logCallback?.(errorMsg, "error");
        logCallback?.(detailMsg, "error");
        throw new Error(`No JSON found in ${config.provider} response`);
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        const errorMsg = `❌ Failed to parse JSON from ${config.provider} response`;
        const detailMsg = `JSON text: ${jsonMatch[0].substring(0, 200)}`;
        console.log(errorMsg);
        console.log(detailMsg);
        logCallback?.(errorMsg, "error");
        logCallback?.(detailMsg, "error");
        throw new Error(`Invalid JSON in ${config.provider} response`);
      }

      if (
        !parsed.categories ||
        !Array.isArray(parsed.categories) ||
        parsed.categories.length === 0
      ) {
        parsed.categories = ["Unknown"];
      }

      if (
        !parsed.sentiment ||
        !["positive", "neutral", "negative"].includes(parsed.sentiment)
      ) {
        parsed.sentiment = "neutral";
      }

      if (!parsed.summary || typeof parsed.summary !== "string") {
        parsed.summary = "No summary available";
      }

      const successMsg = `✅ Call analyzed: ${parsed.categories.length} categories, sentiment: ${parsed.sentiment}`;
      console.log(successMsg);
      logCallback?.(successMsg, "success");

      return {
        categories: parsed.categories,
        sentiment: parsed.sentiment,
        summary: parsed.summary,
      };
    },
    5,
    0,
    logCallback
  );
}

export async function batchCategorizeCallsWithProgress(
  calls: Array<{
    transcript: string;
    callReason?: string;
    issuesDiscussed?: string;
  }>,
  onProgress?: (current: number, total: number) => void,
  logCallback?: LogCallback
): Promise<CategorizationResult[]> {
  const startMsg = "🚀 Starting batch categorization process...";
  console.log(startMsg);
  logCallback?.(startMsg, "info");

  const totalMsg = `📊 Total calls to process: ${calls.length}`;
  console.log(totalMsg);
  logCallback?.(totalMsg, "info");

  const timeMsg = `⏱️  Estimated time: ${((calls.length * 2.5) / 60).toFixed(
    1
  )} minutes (with rate limiting)`;
  console.log(timeMsg);
  logCallback?.(timeMsg, "info");

  const results: CategorizationResult[] = [];
  const startTime = Date.now();
  const delayBetweenCalls = 2500;

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    const callStartTime = Date.now();

    const progressMsg = `📞 Processing call ${i + 1}/${calls.length} (${(
      (i / calls.length) *
      100
    ).toFixed(1)}%)`;
    console.log(`\n${progressMsg}`);
    logCallback?.(progressMsg, "progress");

    try {
      const result = await categorizeCall(
        call.transcript,
        call.callReason,
        call.issuesDiscussed,
        logCallback
      );
      results.push(result);

      const callDuration = ((Date.now() - callStartTime) / 1000).toFixed(2);
      const processedMsg = `   ✅ Call ${i + 1} processed in ${callDuration}s`;
      console.log(processedMsg);
      logCallback?.(processedMsg, "success");

      const categoriesMsg = `   📋 Categories: ${result.categories.join(", ")}`;
      console.log(categoriesMsg);
      logCallback?.(categoriesMsg, "info");

      const sentimentMsg = `   😊 Sentiment: ${result.sentiment}`;
      console.log(sentimentMsg);
      logCallback?.(sentimentMsg, "info");

      if (onProgress) {
        onProgress(i + 1, calls.length);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const avgTimePerCall = elapsed / (i + 1);
      const remainingCalls = calls.length - (i + 1);
      const estimatedTimeRemaining = (avgTimePerCall * remainingCalls) / 60;

      if (i < calls.length - 1) {
        const waitMsg = `   ⏳ Waiting 2.5s before next call...`;
        console.log(waitMsg);
        logCallback?.(waitMsg, "info");

        const progressStatMsg = `   📊 Progress: ${i + 1}/${
          calls.length
        } completed`;
        console.log(progressStatMsg);
        logCallback?.(progressStatMsg, "info");

        const timeRemainingMsg = `   ⏱️  Estimated time remaining: ${estimatedTimeRemaining.toFixed(
          1
        )} minutes`;
        console.log(timeRemainingMsg);
        logCallback?.(timeRemainingMsg, "info");
      }

      if (i < calls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenCalls));
      }
    } catch (error: any) {
      const errorMsg = `   ❌ Error processing call ${i + 1}: ${error.message}`;
      console.log(errorMsg);
      logCallback?.(errorMsg, "error");

      const fallbackMsg = `   💡 Using fallback categorization for this call...`;
      console.log(fallbackMsg);
      logCallback?.(fallbackMsg, "warning");
      
      const fallbackResult: CategorizationResult = {
        categories: ["UNCATEGORIZED - API ERROR"],
        sentiment: "neutral",
        summary: `Failed to analyze: ${error.message || "Unknown error"}`,
      };

      results.push(fallbackResult);
      const uncategorizedMsg = `   ⚠️  Call ${
        i + 1
      } marked as uncategorized due to error`;
      console.log(uncategorizedMsg);
      logCallback?.(uncategorizedMsg, "warning");

      if (onProgress) {
        onProgress(i + 1, calls.length);
      }

      if (error?.status === 429 && error.message?.includes("exceeded")) {
        const criticalMsg = `\n❌ Critical rate limit error. Stopping batch processing.`;
        console.log(criticalMsg);
        logCallback?.(criticalMsg, "error");

        const processedBeforeMsg = `   Successfully processed ${results.length} calls before error.`;
        console.log(processedBeforeMsg);
        logCallback?.(processedBeforeMsg, "info");

        throw new Error(
          `Rate limit exceeded after retries. Processed ${results.length}/${
            calls.length
          } calls. ${error.message || ""}`
        );
      }

      if (i < calls.length - 1) {
        const waitMsg = `   ⏳ Waiting 10s before continuing to next call...`;
        console.log(waitMsg);
        logCallback?.(waitMsg, "info");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 60000).toFixed(2);
  const successCount = results.filter(
    (r) => !r.categories.includes("UNCATEGORIZED - API ERROR")
  ).length;
  const failureCount = results.length - successCount;

  const completeMsg = `\n🎉 Batch processing complete!`;
  console.log(completeMsg);
  logCallback?.(completeMsg, "success");

  const successMsg = `✅ Successfully processed ${successCount}/${calls.length} calls`;
  console.log(successMsg);
  logCallback?.(successMsg, "success");

  if (failureCount > 0) {
    const failureMsg = `⚠️  ${failureCount} call(s) failed and were marked as uncategorized`;
    console.log(failureMsg);
    logCallback?.(failureMsg, "warning");
  }

  const totalTimeMsg = `⏱️  Total time: ${totalTime} minutes`;
  console.log(totalTimeMsg);
  logCallback?.(totalTimeMsg, "info");

  return results;
}

export async function generateReportWithGemini(
  data: AnalysisData,
  logCallback?: LogCallback
): Promise<string> {
  const config = getModelConfig();
  const reportStartMsg = `📝 Generating comprehensive report with ${config.provider}/${config.model}...`;
  const reportDataMsg = `📊 Report data: ${data.totalCalls} calls, ${data.categories.length} categories`;
  console.log(`\n${reportStartMsg}`);
  console.log(reportDataMsg);
  logCallback?.(reportStartMsg, "info");
  logCallback?.(reportDataMsg, "info");

  return retryWithBackoff(
    async () => {
      const categorySummary = data.categories
        .map((cat) => ({
          category: cat.category,
          count: cat.count,
          percentage: cat.percentage.toFixed(1),
          sentiment: cat.sentiment,
        }))
        .slice(0, 10);

      const callsForReport =
        data.calls.length > 1 ? data.calls.slice(0, -1) : data.calls;
      const sampleCalls = callsForReport.slice(0, 5).map((call) => ({
        customer: call.customer || "Unknown",
        categories: call.categories,
        sentiment: call.sentiment,
        summary: (call.aiAnalysis || "No summary available").substring(0, 200),
        transcript:
          call.transcript.substring(0, 200) +
          (call.transcript.length > 200 ? "..." : ""),
      }));

      const prompt = `You are an AI assistant generating a comprehensive analysis report for customer service call data from an automotive service center.

Based on the following categorized call data and statistics, generate a detailed, professional plain text report (approximately 8 pages when formatted).

The report should include:
1. Executive Summary - High-level overview of the analysis
2. Overall Statistics - Total calls, unique customers, duration metrics
3. Sentiment Analysis - Distribution and insights on customer sentiment
4. Category Analysis - Detailed breakdown of all categories with insights, trends, and patterns
5. Key Findings - Important observations and patterns discovered
6. Recommendations - Actionable insights based on the data
7. Detailed Category Breakdown - For each category, provide count, percentage, customer impact, and sentiment distribution
8. Sample Call Insights - Analysis of representative calls

Data Summary:
- Total Calls: ${data.totalCalls}
- Total Duration: ${Math.round(data.summary?.totalDuration)} seconds (${(
        data.summary?.totalDuration / 3600
      ).toFixed(1)} hours)
- Average Call Duration: ${Math.round(data.summary?.avgDuration)} seconds
- Sentiment Distribution: Positive: ${
        data.summary?.sentimentDistribution.positive
      }, Neutral: ${data.summary?.sentimentDistribution.neutral}, Negative: ${
        data.summary?.sentimentDistribution.negative
      }

Category Statistics:
${JSON.stringify(categorySummary, null, 2)}

Sample Calls:
${JSON.stringify(sampleCalls, null, 2)}

Generate a comprehensive, well-structured plain text report. The report should be detailed, insightful, and professional. Focus on actionable insights and patterns in the data.`;

      const reportStartTime = Date.now();
      let report: string;

      if (config.provider === "gemini") {
        report = await callGeminiAPI(prompt, config.model);
      } else {
        const messages = [
          {
            role: "system",
            content:
              "You are a professional business analyst that generates comprehensive reports. Always provide detailed, well-structured reports.",
          },
          {
            role: "user",
            content: prompt,
          },
        ];
        report = await callGroqAPI(messages, config.model);
      }

      const reportTime = ((Date.now() - reportStartTime) / 1000).toFixed(2);
      const reportTimeMsg = `✅ Report generated in ${reportTime}s`;
      const reportLengthMsg = `📄 Report length: ${report.length} characters`;
      console.log(reportTimeMsg);
      console.log(reportLengthMsg);
      logCallback?.(reportTimeMsg, "success");
      logCallback?.(reportLengthMsg, "info");

      if (!report || report.trim().length === 0) {
        const emptyReportMsg = `❌ Empty report generated by ${config.provider}`;
        console.log(emptyReportMsg);
        logCallback?.(emptyReportMsg, "error");
        throw new Error(`Empty report generated by ${config.provider}`);
      }

      return report;
    },
    5,
    0,
    logCallback
  );
}

export async function generateSummarizedReport(
  data: AnalysisData,
  logCallback?: LogCallback
): Promise<string> {
  const config = getModelConfig();
  const reportStartMsg = `📝 Generating summarized executive report with ${config.provider}/${config.model}...`;
  const reportDataMsg = `📊 Report data: ${data.totalCalls} calls, ${data.categories.length} categories`;
  console.log(`\n${reportStartMsg}`);
  console.log(reportDataMsg);
  logCallback?.(reportStartMsg, "info");
  logCallback?.(reportDataMsg, "info");

  return retryWithBackoff(
    async () => {
      const topCategories = data.categories.slice(0, 10).map((cat) => ({
        category: cat.category,
        count: cat.count,
        percentage: cat.percentage.toFixed(1),
        sentiment: {
          positive: cat.sentiment.positive,
          neutral: cat.sentiment.neutral,
          negative: cat.sentiment.negative,
        },
      }));

      const callsForReport =
        data.calls.length > 1 ? data.calls.slice(0, -1) : data.calls;
      const sampleCalls = callsForReport.slice(0, 5).map((call) => ({
        customer: call.customer || "Unknown",
        categories: call.categories,
        sentiment: call.sentiment,
        callReason: (call.callReason || "N/A").substring(0, 100),
        issuesDiscussed: (call.issuesDiscussed || "N/A").substring(0, 100),
        summary: (call.aiAnalysis || "No summary available").substring(0, 150),
        transcript:
          call.transcript.substring(0, 250) +
          (call.transcript.length > 250 ? "..." : ""),
      }));

      const totalSentiment =
        data.summary.sentimentDistribution.positive +
        data.summary.sentimentDistribution.neutral +
        data.summary.sentimentDistribution.negative;
      const positivePct = (
        (data.summary.sentimentDistribution.positive / totalSentiment) *
        100
      ).toFixed(1);
      const neutralPct = (
        (data.summary.sentimentDistribution.neutral / totalSentiment) *
        100
      ).toFixed(1);
      const negativePct = (
        (data.summary.sentimentDistribution.negative / totalSentiment) *
        100
      ).toFixed(1);

      const prompt = `You are an AI assistant generating an executive detailed summary report of about 8-10 pages for customer service call data from an automotive service center. Generate a professional, actionable report in plain text format similar to the following structure:

REPORT STRUCTURE:
1. Title: "Call Analysis: Executive Summary & Key Findings"
2. Executive Summary - High-level overview explaining what the data reveals about customer needs, operational gaps, and opportunities
3. Key Observations & Opportunities for Improvement - Numbered sections (1-4) with bullet points identifying:
   - Quality Assurance & Service Consistency issues
   - Inventory Alignment & Customer Demand gaps
   - Data and Process Efficiency problems
   - Customer Communication & AI Support Opportunities
4. High-Value Missed Revenue Opportunities - Document specific products/services customers are requesting but not receiving
5. Actionable Recommendations - Numbered list of specific operational improvements
6. Proposed AI Enhancements - Suggestions for improving AI service advisor capabilities

IMPORTANT STYLE GUIDELINES:
- Use clear, professional language
- Focus on actionable insights and business value
- Identify specific patterns, gaps, and opportunities from the data
- Provide concrete examples from the call data
- Use bullet points (•) for sub-items
- Keep the tone analytical and supportive (not critical of individual performance)
- Make recommendations specific and implementable

DATA TO ANALYZE:
Total Calls: ${data.totalCalls}
Total Duration: ${Math.round(data.summary.totalDuration)} seconds (${(
        data.summary.totalDuration / 3600
      ).toFixed(1)} hours)
Average Call Duration: ${Math.round(data.summary.avgDuration)} seconds

Sentiment Distribution:
- Positive: ${data.summary.sentimentDistribution.positive} (${positivePct}%)
- Neutral: ${data.summary.sentimentDistribution.neutral} (${neutralPct}%)
- Negative: ${data.summary.sentimentDistribution.negative} (${negativePct}%)

Top Categories:
${JSON.stringify(topCategories, null, 2)}

Sample Calls with Transcripts:
${JSON.stringify(sampleCalls, null, 2)}

Generate a comprehensive executive summary report that identifies key patterns, operational gaps, missed revenue opportunities, and provides actionable recommendations. The report should be detailed enough to be useful for decision-making but focused on insights and recommendations.`;

      const reportStartTime = Date.now();
      let report: string;

      if (config.provider === "gemini") {
        report = await callGeminiAPI(prompt, config.model);
      } else {
        const messages = [
          {
            role: "system",
            content:
              "You are a professional business analyst that generates executive summary reports. Always provide detailed, actionable reports with clear structure.",
          },
          {
            role: "user",
            content: prompt,
          },
        ];
        report = await callGroqAPI(messages, config.model);
      }

      const reportTime = ((Date.now() - reportStartTime) / 1000).toFixed(2);
      const reportTimeMsg = `✅ Summarized report generated in ${reportTime}s`;
      const reportLengthMsg = `📄 Report length: ${report.length} characters`;
      console.log(reportTimeMsg);
      console.log(reportLengthMsg);
      logCallback?.(reportTimeMsg, "success");
      logCallback?.(reportLengthMsg, "info");

      if (!report || report.trim().length === 0) {
        const emptyReportMsg = `❌ Empty report generated by ${config.provider}`;
        console.log(emptyReportMsg);
        logCallback?.(emptyReportMsg, "error");
        throw new Error(`Empty report generated by ${config.provider}`);
      }

      return report;
    },
    5,
    0,
    logCallback
  );
}
