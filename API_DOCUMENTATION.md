# API Documentation - Mega Internal V1 Visa Petition Generator

**Date**: November 28, 2025
**Status**: All API routes implemented and ready for testing

---

## Overview

This system provides a complete REST API for generating visa petition documents with AI-powered beneficiary lookup, smart auto-fill, and optional exhibit generation.

---

## API Endpoints

### 1. POST `/api/lookup-beneficiary`

**Purpose**: AI-powered beneficiary lookup across publications and databases

**Request Body**:
```json
{
  "name": "Alex Hale",
  "profession": "Professional MMA Fighter",
  "additionalInfo": "Mixed Martial Arts"
}
```

**Response**:
```json
{
  "success": true,
  "sources": [
    {
      "url": "https://espn.com/...",
      "title": "Alex Hale UFC Profile",
      "sourceName": "ESPN",
      "tier": 1,
      "description": "...",
      "confidence": "high"
    }
  ],
  "searchStrategy": "Multi-source verification with 3 search approaches",
  "totalFound": 25,
  "confidenceDistribution": {
    "high": 15,
    "medium": 8,
    "low": 2
  },
  "verificationData": {
    "nameMatches": 25,
    "professionMatches": 20,
    "crossReferencedSources": 10
  }
}
```

**Use Case**: Step 2 of form - Get initial sources for beneficiary

---

### 2. POST `/api/smart-autofill`

**Purpose**: Extract structured data from documents/URLs to auto-fill form fields

**Request Body**:
```json
{
  "documentsText": "Full text of uploaded documents...",
  "urlsContext": "Combined text from URLs...",
  "beneficiaryName": "Alex Hale",
  "profession": "Professional MMA Fighter"
}
```

**Response**:
```json
{
  "success": true,
  "autoFillData": {
    "nationality": "Brazilian",
    "currentStatus": "B-2 Tourist Visa",
    "fieldOfExpertise": "Mixed Martial Arts - Lightweight Division",
    "backgroundInfo": "Professional MMA fighter with 15-2 record...",
    "achievements": ["UFC Fight Night Winner 2024", "..."],
    "suggestedCriteria": ["O-1A: Criterion B", "O-1A: Criterion E"]
  }
}
```

**Use Case**: Step 3 of form - Suggest values for form fields based on found data

---

### 3. POST `/api/generate`

**Purpose**: Start document generation (fire-and-forget, runs in background)

**Request Body**:
```json
{
  "beneficiaryInfo": {
    "fullName": "Alex Hale",
    "profession": "Professional MMA Fighter",
    "visaType": "O-1A",
    "briefType": "standard",
    "nationality": "Brazilian",
    "currentStatus": "B-2 Tourist Visa",
    "fieldOfExpertise": "Mixed Martial Arts",
    "backgroundInfo": "Professional fighter with...",
    "petitionerName": "Jackson Wink MMA Academy",
    "petitionerOrganization": "Jackson Wink MMA Academy LLC",
    "additionalInfo": "Recently won UFC Fight Night...",
    "primaryUrls": ["https://espn.com/...", "https://ufc.com/..."]
  },
  "urls": [
    {
      "url": "https://espn.com/...",
      "title": "Alex Hale Profile",
      "sourceName": "ESPN",
      "tier": 1
    }
  ],
  "files": [
    {
      "fileName": "resume.pdf",
      "storageUrl": "https://...",
      "extractedText": "..."
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "caseId": "ALEX1234ABCD",
  "message": "Generation started. Check progress endpoint for status.",
  "progressEndpoint": "/api/progress/ALEX1234ABCD"
}
```

**Use Case**: Step 5 of form - Start generating all 8 documents

**Background Processing**:
- Creates case in `petition_cases` table
- Stores URLs in `case_urls` table
- Generates 8 documents using AI
- Updates progress in real-time
- Stores documents in `generated_documents` table

---

### 4. GET `/api/progress/[caseId]`

**Purpose**: Poll for generation progress and get results when complete

**Request**: `GET /api/progress/ALEX1234ABCD`

**Response (In Progress)**:
```json
{
  "success": true,
  "caseId": "ALEX1234ABCD",
  "status": "generating",
  "progress": 45,
  "currentStage": "Document 4: Legal Brief",
  "currentMessage": "Generating standard brief (15-20 pages)...",
  "errorMessage": null,
  "createdAt": "2025-11-28T10:00:00Z",
  "completedAt": null,
  "documents": null
}
```

**Response (Completed)**:
```json
{
  "success": true,
  "caseId": "ALEX1234ABCD",
  "status": "completed",
  "progress": 100,
  "currentStage": "Complete",
  "currentMessage": "All 8 documents generated successfully!",
  "errorMessage": null,
  "createdAt": "2025-11-28T10:00:00Z",
  "completedAt": "2025-11-28T10:25:00Z",
  "documents": [
    {
      "document_number": 1,
      "document_name": "Comprehensive Analysis",
      "document_type": "analysis",
      "content": "# COMPREHENSIVE ANALYSIS...",
      "word_count": 5000,
      "page_estimate": 10
    },
    {
      "document_number": 4,
      "document_name": "Legal Brief",
      "document_type": "brief",
      "content": "# O-1A VISA PETITION BRIEF...",
      "word_count": 8500,
      "page_estimate": 17
    }
  ]
}
```

**Use Case**: Step 5 of form - Poll every 3-5 seconds to show progress

---

### 5. POST `/api/generate-exhibits`

**Purpose**: Generate exhibit PDFs AFTER documents are complete (optional)

**Request Body**:
```json
{
  "caseId": "ALEX1234ABCD",
  "exhibitSources": [
    {
      "url": "https://espn.com/...",
      "title": "Alex Hale Profile",
      "tier": 1
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "caseId": "ALEX1234ABCD",
  "message": "Exhibit generation started. Check progress endpoint for status.",
  "progressEndpoint": "/api/progress/ALEX1234ABCD"
}
```

**Use Case**: Step 6 (Complete) - User clicks "Generate Exhibit PDFs" button

**Background Processing**:
- Archives each URL to archive.org
- Converts to PDF via API2PDF
- Numbers exhibits (A, B, C...)
- Creates table of contents
- Merges into single PDF
- Updates case with `exhibit_package_url`

---

### 6. POST `/api/upload`

**Purpose**: Upload supporting documents (PDF, DOCX, images)

**Request**: Multipart form data
```
files: File[]
caseId: string (optional)
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully uploaded 3 file(s)",
  "files": [
    {
      "fileName": "resume.pdf",
      "fileType": "application/pdf",
      "fileSize": 245678,
      "storagePath": "uploads/temp/1234567890-resume.pdf",
      "storageUrl": "https://supabase.co/storage/...",
      "extractedText": "Full text extracted from PDF...",
      "pageCount": 2
    }
  ]
}
```

**Use Case**: Step 4 of form - Upload resumes, certificates, etc.

---

### 7. GET `/api/upload?caseId=[caseId]`

**Purpose**: Retrieve list of uploaded files for a case

**Request**: `GET /api/upload?caseId=ALEX1234ABCD`

**Response**:
```json
{
  "success": true,
  "files": [
    {
      "file_name": "resume.pdf",
      "file_type": "application/pdf",
      "file_size": 245678,
      "storage_url": "https://...",
      "extracted_text": "...",
      "page_count": 2,
      "uploaded_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

---

### 8. GET `/api/download/[caseId]?documentNumber=[number]&format=[format]`

**Purpose**: Download generated documents

**Examples**:

1. **Download single document**:
   ```
   GET /api/download/ALEX1234ABCD?documentNumber=4&format=markdown
   ```
   Returns: `Alex_Hale_Document_4_Legal_Brief.md`

2. **Download all documents (combined)**:
   ```
   GET /api/download/ALEX1234ABCD?format=markdown
   ```
   Returns: `Alex_Hale_All_Documents_ALEX1234ABCD.md`

3. **Get documents as JSON**:
   ```
   GET /api/download/ALEX1234ABCD?format=json
   ```
   Returns: JSON with all documents

**Formats**:
- `markdown` (default) - .md file
- `text` - .txt file
- `json` - JSON response

---

## Workflow Example

### Complete User Flow:

```
1. User enters basic info (name, profession, visa type, brief type)
   └─> Proceeds to step 2

2. User clicks "Start AI Lookup"
   └─> POST /api/lookup-beneficiary
   └─> Response: 25 sources found
   └─> User reviews and confirms: "Yes, Use These Sources"
   └─> Proceeds to step 3

3. User reviews/edits auto-filled fields
   └─> Optional: POST /api/smart-autofill (if documents uploaded)
   └─> User edits background info, petitioner details
   └─> Proceeds to step 4

4. User uploads supporting files
   └─> POST /api/upload (for each file)
   └─> Response: Files stored and text extracted
   └─> User clicks "Start Generation"

5. System starts document generation
   └─> POST /api/generate
   └─> Response: { caseId: "ALEX1234ABCD" }
   └─> Frontend polls: GET /api/progress/ALEX1234ABCD (every 3 sec)
   └─> Progress: 10% → 25% → 50% → 75% → 100%
   └─> Status changes to "completed"
   └─> Documents available

6. User reviews 8 generated documents
   └─> Downloads individual docs: GET /api/download/ALEX1234ABCD?documentNumber=4
   └─> Downloads all: GET /api/download/ALEX1234ABCD
   └─> User decides: "Generate Exhibit PDFs"

7. User clicks "Generate Exhibit PDFs"
   └─> POST /api/generate-exhibits
   └─> Response: Exhibit generation started
   └─> Frontend polls: GET /api/progress/ALEX1234ABCD
   └─> Exhibits complete: exhibit_package_url available
   └─> User downloads exhibit PDF package
```

---

## Database Schema

### petition_cases
```sql
case_id (PK)
beneficiary_name
profession
visa_type
nationality
current_status
field_of_expertise
background_info
petitioner_name
petitioner_organization
additional_info
status (initializing|generating|generating_exhibits|completed|failed)
progress_percentage
current_stage
current_message
error_message
exhibit_generation_progress
exhibit_package_url
exhibit_toc_url
total_exhibits
created_at
updated_at
completed_at
```

### generated_documents
```sql
id (PK)
case_id (FK)
document_number (1-8)
document_name
document_type
content (markdown)
word_count
page_estimate
storage_url
created_at
```

### case_urls
```sql
id (PK)
case_id (FK)
url
title
description
source_type
source_name
quality_tier (1|2|3)
created_at
```

### case_files
```sql
id (PK)
case_id (FK)
file_name
file_type
file_size
storage_path
storage_url
extracted_text
page_count
uploaded_at
```

### case_exhibits
```sql
id (PK)
case_id (FK)
exhibit_number
exhibit_label (A, B, C...)
source_url
pdf_url
archive_url
page_count
file_size
created_at
```

---

## Error Handling

All endpoints return standard error format:

```json
{
  "error": "Description of what went wrong",
  "status": 400|404|500
}
```

**Common Error Codes**:
- `400` - Bad Request (missing required fields)
- `404` - Not Found (case not found)
- `500` - Server Error (generation failed, API error, etc.)

---

## Testing Checklist

### Option 1: API Routes ✅
- [x] `/api/lookup-beneficiary` - AI beneficiary lookup
- [x] `/api/smart-autofill` - Smart auto-fill
- [x] `/api/generate` - Document generation (fire-and-forget)
- [x] `/api/progress/[caseId]` - Progress tracking
- [x] `/api/generate-exhibits` - Post-generation exhibit creation
- [x] `/api/upload` - File upload with text extraction
- [x] `/api/download/[caseId]` - Document download

### Option 2: Form UI ✅
- [x] Step 1: Basic info with brief type selector
- [x] Step 2: AI lookup with Yes/Try Again/Skip confirmation
- [x] Step 3: Review & edit fields
- [x] Step 4: File upload
- [x] Step 5: Real-time progress display
- [x] Step 6: Complete with optional "Generate Exhibits" button

### End-to-End Test (Alex Hale) ⏳
- [ ] Test complete workflow with real MMA fighter
- [ ] Verify standard brief (15-20 pages)
- [ ] Verify comprehensive brief (30-50 pages)
- [ ] Verify tier-based publication analysis
- [ ] Verify optional exhibit generation
- [ ] Verify all documents maintain DIY template structure

---

## Next Steps

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test with Alex Hale**:
   - Name: Alex Hale
   - Profession: Professional NFL Kicker
   - Visa Type: P-1A
   - Brief Type: Standard

3. **Verify Features**:
   - ✅ Standard vs Comprehensive brief selection
   - ✅ Exhibit generation AFTER documents (optional)
   - ✅ Tier-based publication analysis (up to 60 URLs)
   - ✅ DIY template enforcement
   - ✅ Real-time progress tracking

---

**All API routes and UI complete!** 🎉
