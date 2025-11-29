import { CallData, CategoryStat, AnalysisData } from "@/types";

export function calculateStatistics(calls: CallData[]): AnalysisData {
  console.log("\n📊 Calculating statistics...");
  console.log(`📞 Processing ${calls.length} categorized calls`);

  const startTime = Date.now();

  const categoryMap = new Map<
    string,
    {
      count: number;
      customers: Set<string>;
      sentiment: { positive: number; neutral: number; negative: number };
    }
  >();

  calls.forEach((call, index) => {
    if (index > 0 && index % 50 === 0) {
      console.log(
        `   ⏳ Analyzed ${index}/${calls.length} calls for statistics...`
      );
    }

    call.categories.forEach((category) => {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          count: 0,
          customers: new Set(),
          sentiment: { positive: 0, neutral: 0, negative: 0 },
        });
      }

      const stat = categoryMap.get(category)!;
      stat.count++;
      stat.customers.add(call.phone);

      const sentiment = call.sentiment?.toLowerCase() || "neutral";
      if (sentiment === "positive") stat.sentiment.positive++;
      else if (sentiment === "negative") stat.sentiment.negative++;
      else stat.sentiment.neutral++;
    });
  });

  console.log(`   Found ${categoryMap.size} unique categories`);

  const categories: CategoryStat[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      percentage: (data.count / calls.length) * 100,
      sentiment: data.sentiment,
    }))
    .sort((a, b) => b.count - a.count);

  console.log(
    `   Top 5 categories: ${categories
      .slice(0, 5)
      .map((c) => c.category)
      .join(", ")}`
  );

  const totalDuration = calls.reduce((sum, call) => sum + call.duration, 0);
  const avgDuration = calls.length > 0 ? totalDuration / calls.length : 0;
  console.log(
    `   Total duration: ${Math.round(totalDuration)}s (${(
      totalDuration / 3600
    ).toFixed(2)}h)`
  );

  const sentimentCounts = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  calls.forEach((call) => {
    const sentiment = call.sentiment?.toLowerCase() || "neutral";
    if (sentiment === "positive") sentimentCounts.positive++;
    else if (sentiment === "negative") sentimentCounts.negative++;
    else sentimentCounts.neutral++;
  });

  const totalSentiment =
    sentimentCounts.positive +
    sentimentCounts.neutral +
    sentimentCounts.negative;
  console.log(
    `   Sentiment: Positive: ${sentimentCounts.positive} (${(
      (sentimentCounts.positive / totalSentiment) *
      100
    ).toFixed(1)}%), ` +
      `Neutral: ${sentimentCounts.neutral} (${(
        (sentimentCounts.neutral / totalSentiment) *
        100
      ).toFixed(1)}%), ` +
      `Negative: ${sentimentCounts.negative} (${(
        (sentimentCounts.negative / totalSentiment) *
        100
      ).toFixed(1)}%)`
  );

  const topCategories = categories.slice(0, 10).map((c) => c.category);

  const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Statistics calculated in ${processingTime}s`);

  return {
    totalCalls: calls.length,
    categorizedCalls: calls.length,
    categories,
    calls,
    summary: {
      answerRate: 100, // Assuming all uploaded calls were answered
      avgDuration,
      totalDuration,
      sentimentDistribution: sentimentCounts,
      topCategories,
    },
    timestamp: new Date().toISOString(),
  };
}

export function generateTextReport(data: AnalysisData): string {
  console.log("\n📝 Generating text report...");
  const lines: string[] = [];

  lines.push("=".repeat(100));
  lines.push("COMPREHENSIVE CALL CATEGORIZATION & STATISTICAL ANALYSIS REPORT");
  lines.push("=".repeat(100));
  lines.push("");
  lines.push(`Generated: ${new Date(data.timestamp).toLocaleString()}`);
  lines.push(`Total Calls Analyzed: ${data.totalCalls}`);
  lines.push(
    `Total Duration: ${Math.round(data.summary.totalDuration)} seconds (${(
      data.summary.totalDuration / 3600
    ).toFixed(1)} hours)`
  );
  lines.push(
    `Average Call Duration: ${Math.round(data.summary.avgDuration)} seconds`
  );
  lines.push("");

  lines.push("SENTIMENT DISTRIBUTION");
  lines.push("-".repeat(100));
  const total =
    data.summary.sentimentDistribution.positive +
    data.summary.sentimentDistribution.neutral +
    data.summary.sentimentDistribution.negative;
  lines.push(
    `Positive:  ${data.summary.sentimentDistribution.positive} (${(
      (data.summary.sentimentDistribution.positive / total) *
      100
    ).toFixed(1)}%)`
  );
  lines.push(
    `Neutral:   ${data.summary.sentimentDistribution.neutral} (${(
      (data.summary.sentimentDistribution.neutral / total) *
      100
    ).toFixed(1)}%)`
  );
  lines.push(
    `Negative:  ${data.summary.sentimentDistribution.negative} (${(
      (data.summary.sentimentDistribution.negative / total) *
      100
    ).toFixed(1)}%)`
  );
  lines.push("");

  lines.push("CATEGORY BREAKDOWN");
  lines.push("-".repeat(100));
  lines.push(
    `${"#".padEnd(5)}${"Category".padEnd(50)}${"Count".padStart(
      10
    )}${"%".padStart(10)}${"Customers".padStart(12)}`
  );
  lines.push("-".repeat(100));

  data.categories.forEach((cat, idx) => {
    lines.push(
      `${String(idx + 1).padEnd(5)}${cat.category.padEnd(50)}${String(
        cat.count
      ).padStart(10)}${cat.percentage.toFixed(1).padStart(9)}`
    );
  });

  lines.push("");
  lines.push("=".repeat(100));
  lines.push("END OF REPORT");
  lines.push("=".repeat(100));

  console.log(`✅ Text report generated (${lines.length} lines)`);

  return lines.join("\n");
}

export function generateCSV(data: AnalysisData): string {
  console.log("\n📊 Generating CSV export...");
  console.log(`   Exporting ${data.calls.length} calls`);

  const headers = [
    "Call ID",
    "Phone Number",
    "Customer Name",
    "Date",
    "Duration (sec)",
    "Categories",
    "Sentiment",
    "Outcome",
    "Call Reason",
    "AI Summary",
  ];

  const rows = data.calls.map((call) => [
    call.id,
    call.phone,
    call.customer,
    call.date,
    call.duration,
    call.categories.join("; "),
    call.sentiment || "Unknown",
    call.outcome || "Unknown",
    call.callReason || "N/A",
    call.aiAnalysis || "N/A",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const csvSize = (csvContent.length / 1024).toFixed(2);
  console.log(`✅ CSV generated (${csvSize} KB, ${rows.length} rows)`);

  return csvContent;
}
