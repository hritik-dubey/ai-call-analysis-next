# 🚀 AI Call Analysis Tool

An automated call transcription analysis tool powered by Google Gemini AI. Upload Excel files containing call data and get instant AI-powered categorization with comprehensive statistical reports.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange)

## ✨ Features

- 📊 **AI-Powered Categorization** - Automatically categorizes calls using Google Gemini AI
- 📈 **Statistical Analysis** - Comprehensive statistics and visualizations
- 🎯 **29 Predefined Categories** - From oil change services to complaints and inquiries
- 📉 **Sentiment Analysis** - Analyze customer sentiment (positive, neutral, negative)
- 📥 **Excel Upload** - Simple drag-and-drop or file browser upload
- 📤 **Export Reports** - Download detailed text reports and CSV files
- 🎨 **Modern UI** - Beautiful, responsive interface built with Tailwind CSS
- ⚡ **Fast Processing** - Batch processing with progress tracking
- 🔍 **Search & Filter** - Easily find and filter specific calls
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Charts**: Recharts
- **Icons**: Lucide React
- **Excel Processing**: XLSX library

## 📋 Prerequisites

- Node.js 18+ installed
- Google Gemini API key (free tier available)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone or Navigate to the Project

```bash
cd call-analysis-tool
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to Get Gemini API Key:**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env.local` file

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Excel File Requirements

Your Excel file should contain the following columns:

### Required Columns:
- **Originating Number** - Phone number of the caller
- **Transcript** or **summary_points** - Call transcription text

### Optional Columns:
- **customer_name** - Name of the customer
- **call_reason** - Reason for the call
- **issues_discussed** - Issues mentioned in the call
- **customer_sentiment** - Customer sentiment
- **outcome_status** - Call outcome
- **Start Timestamp** - Call date/time
- **Call duration** - Duration in seconds

## 🎯 Categories

The tool automatically categorizes calls into 29 predefined categories:

### Oil Change Services
- OIL CHANGE - PRICING
- OIL CHANGE - WAIT TIME
- OIL CHANGE - SCHEDULING
- OIL CHANGE - TYPE/SPECIFICATION
- OIL CHANGE - GENERAL INQUIRY

### Service Complaints
- SERVICE COMPLAINT - OIL OVERFILLED
- SERVICE COMPLAINT - OIL UNDERFILLED
- SERVICE COMPLAINT - OIL LEAK
- SERVICE COMPLAINT - DAMAGE
- SERVICE COMPLAINT - WRONG SERVICE
- SERVICE COMPLAINT - GENERAL

### Other Services
- FILTER SERVICES
- TRANSMISSION SERVICES
- COOLANT SERVICES
- BRAKE SERVICES
- TIRE SERVICES
- BATTERY SERVICES
- ENGINE DIAGNOSTICS
- INSPECTION SERVICES
- WIPER/BLADE SERVICES

### Customer Inquiries
- PAYMENT INQUIRY
- STAFF REQUEST
- VEHICLE SPECIFIC INQUIRY
- FOLLOW-UP CALL
- REFUND/BILLING ISSUE
- WARRANTY/GUARANTEE
- LOCATION/DIRECTIONS
- GENERAL INFORMATION
- OTHER/MISCELLANEOUS

## 🎨 Features in Detail

### Upload Interface
- Drag and drop Excel files
- File validation (type and size)
- Real-time error messages
- Required columns information

### Analysis Results
- **Overview Tab**: Key metrics, sentiment distribution, top categories
- **Categories Tab**: Detailed category breakdown with charts and statistics
- **Call Details Tab**: Searchable table with expandable row details

### Export Options
- **Text Report**: Comprehensive statistical report (plain text)
- **CSV Export**: All call data with categories and AI analysis

### Statistics Provided
- Total calls analyzed
- Unique customers
- Average call duration
- Sentiment distribution
- Category breakdown
- Top 10 categories visualization
- Customer segmentation

## ⚙️ Configuration

### Adjusting Processing Limits

In `app/api/analyze/route.ts`, you can modify:

```typescript
// Line 60: Adjust the number of calls to process
const callsToAnalyze = transformedData.slice(0, 100)
```

### Batch Processing Settings

In `lib/gemini.ts`:

```typescript
const batchSize = 5 // Number of calls per batch
const delayBetweenBatches = 1000 // Delay in milliseconds
```

### Adding Custom Categories

Edit the `CATEGORY_LIST` in `lib/gemini.ts`:

```typescript
const CATEGORY_LIST = [
  'YOUR_CUSTOM_CATEGORY',
  // ... existing categories
]
```

## 🐛 Troubleshooting

### Common Issues

**1. API Key Error**
- Ensure your Gemini API key is correctly set in `.env.local`
- Restart the development server after adding the key

**2. File Upload Fails**
- Check that your Excel file has required columns
- Ensure file size is under 10MB
- Verify file format (.xlsx or .xls)

**3. Rate Limit Errors**
- Gemini free tier has rate limits
- Adjust `batchSize` and `delayBetweenBatches` in `lib/gemini.ts`
- Consider upgrading to paid tier for higher limits

**4. Analysis Takes Too Long**
- Reduce the number of calls processed (modify line 60 in `app/api/analyze/route.ts`)
- Process calls in smaller batches

## 📦 Building for Production

```bash
npm run build
npm start
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variable `GEMINI_API_KEY`
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 🙏 Acknowledgments

- Google Gemini AI for powerful language model
- Next.js team for amazing framework
- Tailwind CSS for utility-first styling
- Recharts for beautiful visualizations

## 📧 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the Gemini API documentation
3. Open an issue in the repository

---

**Built with ❤️ using Next.js and Google Gemini AI**

