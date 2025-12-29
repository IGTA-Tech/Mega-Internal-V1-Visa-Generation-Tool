# VISA PETITION GENERATION WORKFLOW

## Complete Step-by-Step Process

This document details EXACTLY what happens when the "Generate Petition" button is pressed.

---

## PHASE 0: USER INPUT (Frontend)

### Step 0.1: User Clicks "Generate Petition"
**Action:** User submits form with case information

**Inputs Collected:**
- `beneficiaryInfo`:
  - Full name
  - Visa type (O-1A, O-1B, P-1A, EB-1A)
  - Field of endeavor
  - Nationality
  - Background narrative
  - Claimed criteria
- `urls`: Array of evidence URLs with descriptions
- `uploadedFiles`: Documents with extracted text
- `documentPackage`: "4-document" or "9-document"

**Output:** HTTP POST to `/api/generate`

---

## PHASE 1: API INITIALIZATION

### Step 1.1: Validate and Initialize Case
**Action:** Server receives and validates request

**Processing:**
1. Validate required fields (fullName, visaType)
2. Generate unique caseId: `CASE-{timestamp}-{random}`
3. Initialize progress tracking (in-memory + database)
4. Create database record in Supabase

**Output:** `{ success: true, caseId: "CASE-...", documentPackage: "..." }`

### Step 1.2: Queue Background Job
**Action:** Trigger async processing via Inngest

**Event Sent:** `petition/generate` with all case data

**Output:** Job queued for background processing

---

## PHASE 2: BACKGROUND PROCESSING (Inngest Pipeline)

### Step 2.1: Mark Case Started
**Progress:** 5%
**Action:** Initialize progress tracking
**Output:** `{ started: true }`

---

### Step 2.2: Prepare Beneficiary Information
**Progress:** 8%
**Action:** Normalize and structure beneficiary data

**Processing:**
- Standardize field names
- Extract file metadata (filename, type, word count)
- Build structured BeneficiaryInfo object

**Output:** Prepared BeneficiaryInfo with all fields normalized

---

### Step 2.3: Load Knowledge Base (RAG)
**Progress:** 10%
**Action:** Query Gemini RAG with visa type

**API Call:** Google Generative AI (Gemini with File Search)

**Query:** "Provide comprehensive guidance for preparing a [visaType] visa petition"

**RAG Files Accessed:**
- `O1A_O1B_P1A_EB1A_profesional_evaluationRAG.md` (master)
- `Master mega prompt Visa making.md`
- `[Visa-specific] knowledge base.md`
- `DIY [Visa] RAG.md` (templates)
- `policy memos visas.md`

**Output:**
- `ragContent`: Comprehensive guidance text with citations
- `visaCriteria`: Structured criteria + requirements for visa type

**CURRENT PROBLEM:** Code truncates to first 50,000 characters:
```javascript
knowledgeBase.substring(0, 50000)  // LOSES 75%+ OF CONTENT
```

---

### Step 2.4: Process Uploaded Files
**Progress:** 12%
**Action:** Prepare uploaded documents

**Processing:**
- Verify text extraction completed
- Calculate word counts
- Organize by filename

**Output:** Array of processed files with metadata

---

### Step 2.5: Conduct Perplexity Research (4 Phases)
**Progress:** 15-20%
**Action:** AI-powered research to discover evidence sources

**API Call:** Perplexity "sonar" model

#### Phase 0: Title Analysis
**Purpose:** Determine research strategy

**Output:**
- `level_descriptor`: world-class, elite, professional
- `domain`, `role`, `specialization`
- `scope_type`: EXPANDING / RESTRICTING / SPLITTING
- `primary_criteria`: Which criteria to prioritize
- `secondary_criteria`: Supporting criteria
- `weak_criteria`: Criteria unlikely to succeed
- `research_strategy`: Competitor / Creator / Business / Multi-Domain
- `evidence_boundaries`: What counts as evidence

#### Phase 1: Identity & Primary Achievement Discovery
**Target:** 8-12 sources

**Focus:**
- Wikipedia mining
- Major media outlets
- Sports networks / industry publications

**Source Requirements:**
- At least 3 Tier 1 sources (ESPN, BBC, CNN, NYT)
- At least 3 Tier 2 sources (industry publications)
- No more than 2 Tier 3 sources

**Output:** Array of DiscoveredSource objects

#### Phase 2: Criterion-Specific Deep Dive
**Target:** 10-15 sources

**Focus:** Evidence for PRIMARY criteria identified in Phase 0

**Field-Specific Protocols:**
- Combat sports: Tapology, Fight Matrix, MMA Junkie
- Tennis: ATP/WTA rankings, national team
- Cricket: CricInfo, national team caps
- Figure skating: ISU rankings, Olympic participation

**Output:** More DiscoveredSource objects

#### Phase 3: Media & Recognition Research
**Target:** 8-12 sources

**Focus:** Quality over quantity
- 3 Tier 1 sources > 20 Tier 3 sources
- Published material "about" beneficiary
- Critical reviews and analysis

**Output:** Final batch of DiscoveredSource objects

#### Combined Research Output:
- `discoveredSources`: All sources from all phases
- `totalSourcesFound`, `tier1Count`, `tier2Count`, `tier3Count`
- `criteriaCoverage`: Which criteria have supporting evidence
- Cost estimate (tokens used)

---

### Step 2.6: Fetch and Analyze URLs
**Progress:** 18%
**Action:** Extract content from all URLs

**URLs Processed:**
- User-provided URLs
- Discovered URLs from Perplexity research

**Processing:**
1. HTTP GET each URL (30s timeout)
2. Parse HTML with cheerio
3. Extract: title, main content, domain
4. Remove: script, style, nav, footer
5. Limit content to 10,000 characters

**Output:** Array of FetchedUrlData:
```
{
  url, title, content, domain,
  fetchedAt, success, error?
}
```

---

### Step 2.7: Build Preparation Data
**Progress:** 20%
**Action:** Consolidate all gathered information

**Output:** PreparationData object:
```
{
  knowledgeBase: string,
  visaCriteria: {...},
  researchResults: ResearchResult,
  fetchedUrls: FetchedUrlData[],
  uploadedFilesContent: string
}
```

---

## PHASE 3: DOCUMENT GENERATION

### Step 3.1: Generate Document 1 - Comprehensive Analysis
**Progress:** 25%
**Target:** 75+ pages (~37,500 words)

**AI Call:**
- Model: Claude Sonnet 4.5
- Fallback: OpenAI GPT-4o
- Max tokens: 20,480
- Temperature: 0.3

**Prompt Includes:**
- Beneficiary info
- Uploaded documents summary
- URLs analyzed (first 10, 2000 chars each)
- Knowledge base (first 50,000 chars) **<-- TRUNCATION PROBLEM**

**Required Document Structure:**
1. Executive Summary
2. Visa Type Determination
3. Regulatory Framework
4. Criterion-by-Criterion Analysis (5-10 pages each)
5. Evidence Mapping
6. Scoring Summary
7. Strengths Analysis
8. Weaknesses & Gaps
9. Approval Probability Assessment
10. Recommendations (10+ specific items)
11. Conclusion

---

### Step 3.2: Generate Document 2 - Publication Significance Analysis
**Progress:** 35%
**Target:** 40+ pages (~20,000 words)

**AI Call:** Claude Sonnet 4.5, 20,480 tokens

**Publication Tier Classification:**
- **Tier 1 (Gold):** ESPN, BBC, CNN, NYT, WSJ, Reuters
- **Tier 2 (Strong):** Trade publications, official league sites
- **Tier 3 (Supplementary):** Regional media, niche publications

**Required Document Structure:**
1. Introduction & Legal Framework
2. Methodology
3. Publication-by-Publication Analysis
4. Media Outlet Profiles
5. Comparative Analysis
6. Aggregate Assessment
7. Tier-Based Cumulative Analysis
8. Conclusion

---

### Step 3.3: Generate Document 3 - URL Reference Document
**Progress:** 45%

**AI Call:** Claude Sonnet 4.5, 12,288 tokens

**Required Document Structure:**
1. Introduction
2. URL Catalog Summary (totals by tier)
3. User-Provided Evidence URLs
4. Research-Discovered Sources (by tier)
5. Sources by Criterion (table)
6. Source Credibility Analysis
7. URL Verification Guide
8. Archive.org Preservation Status
9. Domain Credibility Index
10. Quick Reference Index
11. Conclusion

---

### Step 3.4: Generate Document 4 - Evidence Strategy & Argument Bridge
**Progress:** 55%
**Target:** 20-35 pages (10,000-17,500 words)

**AI Call:** Claude, 16,384 tokens

**Purpose:** CONDUIT document - bridges evidence to legal arguments

**Key Function:** Be brutally honest about weaknesses FIRST, then organize evidence for strongest arguments for Document 5 (Legal Brief)

**Required Document Structure:**
1. Executive Assessment (case strength, filing recommendation)
2. Evidence Inventory by Criterion (with tier distribution)
3. Gap Analysis (Critical/Significant/Minor gaps)
4. Argument Strategy Bridge (criteria ranking, lead arguments)
5. Evidence-to-Argument Mapping (master table)
6. Comparable Evidence Strategy (if applicable)
7. RFE Prediction & Preemptive Response
8. Expert Letter Strategy
9. Legal Brief Outline (recommended structure for Doc 5)
10. Action Items Before Filing
11. Document Status

**Outputs Used by Document 5:**
- Criteria ranked by evidence strength
- Lead arguments identified
- Preemptive RFE responses drafted
- Legal Brief structure outlined

**INTERNAL ONLY - DO NOT SUBMIT TO USCIS**

---

### Step 3.5: Generate Document 5 - Legal Brief
**Progress:** 62%
**Target:** 30-50 pages (15,000-25,000 words)

**AI Call:** Claude, 20,480 tokens

**Primary Input:** Document 4 (Evidence Strategy & Argument Bridge)

**CRITICAL: Uses Document 4 Strategy to Order Arguments**

The Legal Brief MUST:
- Lead with strongest criteria (per Doc 4 ranking)
- Include preemptive RFE defenses (from Doc 4)
- Follow DIY Template format

**DIY Template for Each Criterion:**
```
☐ Yes ☐ No  CRITERION [NUMBER]: [NAME]

REGULATORY STANDARD: [Exact CFR citation and text]

ESTABLISHMENT OF ELEMENTS:
1. [First regulatory element]
   [Evidence satisfying this element]
2. [Second regulatory element]
   [Evidence satisfying this element]

[If applicable] COMPARABLE EVIDENCE THEORY:
[Explanation of why comparable evidence applies]

CONSIDERATION OF EVIDENCE:
[Summary of how evidence satisfies criterion]
```

**Required Document Structure:**
1. Caption & Title
2. Table of Contents
3. Table of Authorities
4. Introduction
5. Beneficiary's Professional Background
6. Current Standing in Field
7. Legal Standards
8. Statement of Facts
9. Argument - Criteria Analysis (ordered by strength from Doc 4)
10. (EB-1A only) Final Merits Determination (Kazarian Step 2)
11. Conclusion
12. Exhibit List

---

### Step 3.6-3.9: Generate Documents 6-9 (9-Document Package Only)

#### Document 6: USCIS Cover Letter
**Progress:** 70%
**AI Call:** Claude, 2,048 tokens
**Target:** 2-3 pages

**Structure:**
- Date & USCIS Address
- Formal salutation
- Introduction (petition type, beneficiary)
- Qualifications Summary
- Criteria Satisfied (checkboxes)
- Petition Contents
- Request for Approval
- Signature block

---

#### Document 6: USCIS Cover Letter
**Progress:** 70%
**AI Call:** Claude, 2,048 tokens
**Target:** 2-3 pages

**Structure:**
- Date & USCIS Address
- Formal salutation
- Introduction (petition type, beneficiary)
- Qualifications Summary
- Criteria Satisfied (checkboxes)
- Petition Contents
- Request for Approval
- Signature block

---

#### Document 7: Visa Checklist
**Progress:** 78%
**AI Call:** Claude, 4,096 tokens

**Contents:**
- Case Strength Overview (Strong/Moderate/Weak)
- Filing Recommendation
- Approval Probability
- RFE Risk
- Criteria Scorecard (table)
- Top 5 Strengths
- Top 5 Weaknesses
- Critical Action Items
- Evidence Inventory
- Document Readiness checklist

---

#### Document 8: Exhibit Assembly Guide
**Progress:** 85%
**AI Call:** Claude, 8,192 tokens

**Contents:**
- Organization Overview
- Exhibit List by Criterion
- Assembly Instructions (step-by-step)
- Highlighting Guide (max 30% per page)
- Quality Control Checklist
- Filing Instructions
- Timeline (7-11 hours to assemble)

---

#### Document 9: USCIS Officer Rating Report
**Progress:** 90%
**AI Call:** Claude, 16,384 tokens

**DEVIL'S ADVOCATE ANALYSIS:**
- Simulates USCIS adjudicator perspective
- Identifies likely areas of challenge
- Highlights evidentiary weaknesses
- Predicts potential RFE language
- Suggests how to preempt concerns

**INTERNAL ONLY - DO NOT SUBMIT TO USCIS**

---

## PHASE 4: POST-PROCESSING

### Step 4.1: Archive URLs to archive.org
**Progress:** 93%
**Action:** Preserve all evidence in Wayback Machine

**Processing:**
1. Check for existing archive
2. If not archived, submit to archive.org
3. 1-second delay between requests
4. Track success/failure

**Output:** Array of archived URLs with Wayback Machine links

---

### Step 4.2: Save Documents to Database
**Progress:** 95%
**Action:** Persist to Supabase

**For each document:**
```sql
INSERT INTO generated_documents (
  case_id, document_number, document_name,
  content, word_count, page_estimate,
  generated_at
)
```

---

### Step 4.3: Mark Complete
**Progress:** 100%
**Action:** Finalize case

**Updates:**
- Status = "completed"
- Progress = 100%
- Completion timestamp

**Output:** Success response with document count

---

## API/SERVICE SUMMARY

| Service | Purpose | When Used |
|---------|---------|-----------|
| **Gemini RAG** | Knowledge base queries | Step 2.3 |
| **Perplexity** | Research discovery | Step 2.5 (4 phases) |
| **Claude Sonnet 4.5** | Document generation | Steps 3.1-3.9 |
| **OpenAI GPT-4o** | Fallback for Claude | If Claude fails |
| **Archive.org** | URL preservation | Step 4.1 |
| **Supabase** | Database storage | Steps 1.1, 4.2-4.3 |
| **Inngest** | Job orchestration | All background steps |

---

## KNOWN ISSUES TO FIX

### Issue 1: RAG Truncation
**Location:** Step 2.3 and all document generation
**Problem:** `knowledgeBase.substring(0, 50000)` loses 75%+ of content
**Impact:** Documents missing critical guidance
**Fix:** Smart chunking by visa type + criterion

### Issue 2: Template Adherence
**Location:** Document 4 generation
**Problem:** Output doesn't always follow DIY template exactly
**Impact:** Legal brief not USCIS-compliant
**Fix:** Stronger template injection in prompt

### Issue 3: Research Quality Control
**Location:** Step 2.5
**Problem:** No validation that research meets tier requirements
**Impact:** Low-quality sources in final documents
**Fix:** Add research quality gates before proceeding

### Issue 4: No Output Validation
**Location:** After each document generation
**Problem:** No check that output meets requirements
**Impact:** Poor quality documents accepted
**Fix:** Add validation checkpoints

---

## TIMING ESTIMATES

| Phase | Estimated Time |
|-------|----------------|
| Phase 0-1 (Init) | 2-5 seconds |
| Phase 2.1-2.4 (Prep) | 5-15 seconds |
| Phase 2.5 (Research) | 60-120 seconds |
| Phase 2.6-2.7 (URLs) | 30-60 seconds |
| Phase 3.1 (Doc 1) | 60-90 seconds |
| Phase 3.2 (Doc 2) | 45-60 seconds |
| Phase 3.3 (Doc 3) | 30-45 seconds |
| Phase 3.4 (Doc 4) | 60-90 seconds |
| Phase 3.5-3.9 (Docs 5-9) | 120-180 seconds |
| Phase 4 (Post) | 60-120 seconds |
| **TOTAL (4-doc)** | **5-8 minutes** |
| **TOTAL (9-doc)** | **10-15 minutes** |

---

## DOCUMENT PACKAGE SUMMARY

### 5-Document Package (Core Documents):
1. **Comprehensive Analysis** - 75+ pages
2. **Publication Significance Analysis** - 40+ pages
3. **URL Reference Document** - Variable
4. **Evidence Strategy & Argument Bridge** - 20-35 pages (INTERNAL - bridges to Legal Brief)
5. **Legal Brief** - 30-50 pages (Uses Doc 4 strategy)

### 9-Document Package (5 above + 4 additional):
6. **USCIS Cover Letter** - 2-3 pages
7. **Visa Checklist** - Quick reference
8. **Exhibit Assembly Guide** - Assembly instructions
9. **USCIS Officer Rating** - INTERNAL ONLY (Devil's Advocate)

### Document Flow:
```
Doc 1-3 (Evidence Gathering) → Doc 4 (Strategy Bridge) → Doc 5 (Legal Brief)
                                      ↓
                              Docs 6-9 (Supporting)
```

---

*This workflow document can be modified to adjust the petition generation process.*
