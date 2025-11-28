# Mega Internal V1 - Visa Generation Tool

**Internal-use visa petition generation system** - Built from the ground up with the most robust components from 7+ previous versions.

## 🎯 Purpose

Generate comprehensive, attorney-grade visa petition packages for internal team use. NO paywall, NO payments - optimized for maximum robustness and research depth.

## ✨ Key Features

- **AI-Powered Research**: Claude + Perplexity find 30+ sources per beneficiary
- **Robust File Processing**: LlamaParse for PDF extraction (fixes "0 words" issue)
- **8-Document Pipeline**: Generates 190+ page petition packages
- **Exhibit PDF System**: Numbered exhibits with archive.org preservation
- **Background Processing**: Supabase persistence (no timeout issues)
- **Bulk URL Input**: Paste entire articles, auto-extract URLs

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.template .env.local
```

Add your API keys to `.env.local`:
- ✅ **ANTHROPIC_API_KEY** - Provided
- ✅ **PERPLEXITY_API_KEY** - Provided
- 🔑 **LLAMA_CLOUD_API_KEY** - Get from https://cloud.llamaindex.ai/
- 🔑 **SUPABASE Keys** - Get from https://supabase.com/
- 🔑 **SENDGRID_API_KEY** - Get from https://sendgrid.com/ (must start with "SG.")
- 🔑 **API2PDF_API_KEY** - Get from https://api2pdf.com/

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Supported Visa Types

- ✅ O-1A (Extraordinary Ability - Sciences, Business, Education, Athletics)
- ✅ O-1B (Extraordinary Ability - Arts, Motion Picture, Television)
- ✅ P-1A (Internationally Recognized Athlete)
- ✅ EB-1A (Extraordinary Ability Green Card)

## 📁 Project Structure

```
app/
├── lib/                          # Core business logic (BEST versions copied)
│   ├── document-generator.ts     # 8-document pipeline
│   ├── perplexity-research.ts    # Deep research (547 lines)
│   ├── supabase.ts               # Database operations
│   ├── file-processor.ts         # PDF/DOCX/OCR extraction
│   └── ...
├── api/                          # Next.js API routes
├── components/                   # React components
└── types.ts                      # TypeScript definitions

knowledge-base/                   # 17 RAG files (1.3MB)
├── O-1a knowledge base.md
├── EB-1A knowledge base.md
└── ...
```

## 🔧 What's Fixed From Previous Versions

1. ✅ **"No case ID found" error** - Supabase persistence
2. ✅ **"0 words extracted" from PDFs** - LlamaParse integration
3. ✅ **AI lookup fails** - Liberal prompt engineering
4. ✅ **Perplexity not connected** - Properly wired now
5. ✅ **Clunky URL entry** - Bulk paste with auto-detection
6. ✅ **No exhibit PDF** - API2PDF with numbering
7. ✅ **URLs lost** - archive.org preservation

## 🚀 Deployment

**Recommended**: Netlify (85%+ success rate in testing)

1. Push to GitHub
2. Connect to Netlify
3. Set environment variables
4. Deploy!

---

**Built**: November 28, 2025
**Version**: Mega Internal V1
**Status**: Ready for testing with API keys
