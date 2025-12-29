# Visa Petition Ultimate - Developer Implementation Guide

## Complete Step-by-Step Workflow

This document explains EXACTLY how to implement the visa petition generation system from start to finish.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Phase 0: User Input Form](#phase-0-user-input-form)
3. [Phase 1: Perplexity Research](#phase-1-perplexity-research)
4. [Phase 2: URL Processing](#phase-2-url-processing)
5. [Phase 3: Document Generation](#phase-3-document-generation)
6. [Phase 4: Officer Scoring](#phase-4-officer-scoring)
7. [Phase 5: Output & Export](#phase-5-output--export)
8. [UI/UX Requirements](#uiux-requirements)
9. [API Configuration](#api-configuration)
10. [Deployment](#deployment)

---

## System Overview

### Document Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INPUT FORM                                    │
│  - Beneficiary Info (name, visa type, field, nationality)                   │
│  - Background narrative                                                      │
│  - Claimed criteria                                                          │
│  - User-provided URLs                                                        │
│  - Uploaded documents                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PHASE 1: PERPLEXITY RESEARCH                           │
│                                                                              │
│  Phase 0: Title Analysis → Determine strategy + extract doc terms           │
│  Phase 1: Identity Discovery → 15-20 sources                                │
│  Phase 2: Criterion Deep Dive → 20-30 sources                               │
│  Phase 3: Media Recognition → 15-20 sources                                 │
│  TARGET: 50-70 TOTAL URLS                                                   │
│  [FIND MORE URLS] button appears for criteria with weak evidence            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHASE 2: URL PROCESSING                               │
│                                                                              │
│  - Fetch content from all URLs (user + discovered)                          │
│  - Classify by tier (1-4)                                                   │
│  - Archive to archive.org                                                   │
│  - Extract relevant content                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 3: DOCUMENT GENERATION                            │
│                                                                              │
│  Doc 1: Comprehensive Analysis (75+ pages)                                  │
│  Doc 2: Publication Analysis (40+ pages)                                    │
│  Doc 3: URL Reference Document                                              │
│           │                                                                  │
│           ▼                                                                  │
│  Doc 4: Evidence Strategy & Argument Bridge (INTERNAL)                      │
│           │                                                                  │
│           ▼                                                                  │
│  Doc 5: Legal Brief (30-50 pages, USCIS-ready)                             │
│           │                                                                  │
│           ▼                                                                  │
│  Doc 6: USCIS Cover Letter                                                  │
│  Doc 7: Filing Completeness Checklist                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PHASE 4: OFFICER SCORING                               │
│                                                                              │
│  Doc 8: USCIS Officer Scoring Report (Devil's Advocate)                     │
│  Doc 9: Extended Officer Evaluation                                         │
│                                                                              │
│  → Identifies weaknesses                                                     │
│  → Predicts RFEs                                                            │
│  → Provides actionable recommendations                                       │
│  → Loops back to strengthen petition if needed                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 5: OUTPUT & EXPORT                             │
│                                                                              │
│  - Download individual documents                                             │
│  - Download complete package (ZIP)                                          │
│  - Save to database                                                          │
│  - Email notification                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: User Input Form

### Required Fields

```typescript
interface BeneficiaryInfo {
  fullName: string;           // Required
  visaType: 'O-1A' | 'O-1B' | 'P-1A' | 'EB-1A';  // Required
  fieldOfEndeavor: string;    // Required
  nationality: string;        // Required
  background: string;         // Narrative (500+ words recommended)
  claimedCriteria: number[];  // Array of criterion numbers being claimed
}

interface UserInput {
  beneficiaryInfo: BeneficiaryInfo;
  urls: {
    url: string;
    description: string;
    criterionSupported?: number;
  }[];
  uploadedFiles: {
    filename: string;
    content: string;  // Extracted text
    type: string;
  }[];
  documentPackage: '5-document' | '9-document';
}
```

### UI Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    VISA PETITION GENERATOR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BENEFICIARY INFORMATION                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Full Name: [________________________________]            │    │
│  │ Visa Type: [O-1A ▼]                                     │    │
│  │ Field:     [________________________________]            │    │
│  │ Nationality: [________________________________]          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  BACKGROUND NARRATIVE                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  [Large text area - form data PERSISTS during AI calls] │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  CLAIMED CRITERIA                                                │
│  ☑ Criterion 1: Awards                                          │
│  ☑ Criterion 2: Membership                                      │
│  ☐ Criterion 3: Published Material                              │
│  ...                                                             │
│                                                                  │
│  EVIDENCE URLS                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ URL: [https://espn.com/...]        [Remove]             │    │
│  │ Description: [ESPN article about...]                     │    │
│  │ Criterion: [1 - Awards ▼]                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│  [+ Add URL]                                                     │
│                                                                  │
│  UPLOAD DOCUMENTS                                                │
│  [Drop files here or click to upload]                           │
│  📄 resume.pdf (uploaded)                                        │
│  📄 award_certificate.pdf (uploaded)                             │
│                                                                  │
│  PACKAGE TYPE                                                    │
│  ○ 5-Document (Core)                                            │
│  ● 9-Document (Complete)                                         │
│                                                                  │
│  [🔍 START RESEARCH]  [📄 GENERATE PETITION]                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Perplexity Research

### Research Target: 50-70 Total URLs

The research phase MUST discover **50-70 quality URLs** through comprehensive searching. This is critical for building a strong evidence base.

| Phase | Target URLs | Focus |
|-------|-------------|-------|
| Phase 0 | N/A | Strategy determination |
| Phase 1 | **15-20** | Identity & achievements |
| Phase 2 | **20-30** | Criterion-specific evidence |
| Phase 3 | **15-20** | Media & recognition |
| **TOTAL** | **50-70** | Comprehensive coverage |

### 4-Phase Research Process

#### Phase 0: Title Analysis + Document Extraction

```typescript
// FIRST: Extract search terms from uploaded documents
async function extractSearchTermsFromDocs(uploadedFiles: UploadedFile[]): Promise<SearchTerms> {
  const extractedTerms = {
    organizations: [],    // Companies, teams, leagues mentioned
    people: [],          // Names of recommenders, colleagues
    events: [],          // Competitions, conferences, shows
    awards: [],          // Specific awards named
    publications: [],    // Media outlets mentioned
    achievements: [],    // Specific claims to verify
  };

  for (const file of uploadedFiles) {
    // Extract entities from document text
    const entities = await extractEntities(file.content);
    // Merge into extractedTerms
    mergeTerms(extractedTerms, entities);
  }

  return extractedTerms;
}

// THEN: Determine research strategy
const titleAnalysisPrompt = `
Analyze this beneficiary profile and determine the optimal research strategy:

Name: ${beneficiaryInfo.fullName}
Field: ${beneficiaryInfo.fieldOfEndeavor}
Visa Type: ${beneficiaryInfo.visaType}
Background: ${beneficiaryInfo.background}

UPLOADED DOCUMENTS ANALYSIS:
Organizations found: ${extractedTerms.organizations.join(', ')}
Events mentioned: ${extractedTerms.events.join(', ')}
Awards claimed: ${extractedTerms.awards.join(', ')}
Publications referenced: ${extractedTerms.publications.join(', ')}

Return JSON:
{
  "level_descriptor": "world-class" | "elite" | "professional",
  "domain": string,
  "role": string,
  "specialization": string,
  "scope_type": "EXPANDING" | "RESTRICTING" | "SPLITTING",
  "primary_criteria": number[],   // Strongest criteria to focus on
  "secondary_criteria": number[], // Supporting criteria
  "weak_criteria": number[],      // Unlikely to succeed
  "research_strategy": "Competitor" | "Creator" | "Business" | "Multi-Domain",
  "evidence_boundaries": string,  // What counts as evidence
  "search_terms": string[],       // Recommended search queries
  "doc_derived_searches": string[] // Searches from uploaded docs
}
`;
```

#### Phase 1: Identity & Primary Achievement Discovery

**Target: 15-20 URLs**

```typescript
const phase1Prompt = `
Research ${beneficiaryInfo.fullName} in ${beneficiaryInfo.fieldOfEndeavor}.

YOUR MISSION: Find 15-20 high-quality sources. We are targeting 50-70 TOTAL URLs.

UPLOADED DOCUMENTS - Key terms to search:
${extractedTerms.organizations.map(o => `- Organization: ${o}`).join('\n')}
${extractedTerms.events.map(e => `- Event: ${e}`).join('\n')}
${extractedTerms.awards.map(a => `- Award: ${a}`).join('\n')}

FIND 15-20 SOURCES focusing on:
- Official profiles (Wikipedia external links, official sites)
- Major media coverage (ESPN, BBC, CNN, NYT)
- Industry recognition
- Career highlights
- Everything mentioned in uploaded documents

SOURCE REQUIREMENTS:
- At least 8 Tier 1 sources (major national/international media)
- At least 6 Tier 2 sources (trade publications, official league sites)
- No more than 4 Tier 3 sources (regional, niche)

WIKIPEDIA MINING (CRITICAL):
- Find Wikipedia page
- Extract ALL external links section URLs
- Extract ALL reference section URLs
- Wikipedia pages often have 20-50 source URLs
- NEVER cite Wikipedia text - only use as source finder

IMPORTANT: For each source, provide:
- Full URL
- Publication name
- Date published
- Why it's relevant
- Tier classification (1-4)
- Which criterion it supports
`;
```

#### Phase 2: Criterion-Specific Deep Dive

**Target: 20-30 URLs**

```typescript
const phase2Prompt = `
Find evidence specifically for these criteria:
${primaryCriteria.map(c => `- Criterion ${c.number}: ${c.name}`).join('\n')}

YOUR MISSION: Find 20-30 sources. We are targeting 50-70 TOTAL URLs.

UPLOADED DOCUMENTS - Claims to verify:
${extractedTerms.achievements.map(a => `- Verify: "${a}"`).join('\n')}

FIND 20-30 SOURCES with:
- Direct evidence for each claimed criterion (3-5 per criterion minimum)
- Quantitative data (rankings, statistics, metrics)
- Third-party validation of claims in uploaded docs
- Multiple ranking sources (not just one)

FIELD-SPECIFIC SOURCES:
${getFieldSpecificSources(beneficiaryInfo.fieldOfEndeavor)}

MINIMUM PER CRITERION:
- Awards: 5+ sources
- Membership: 3+ sources
- Published Material: 8+ sources
- Judging: 3+ sources
- Original Contributions: 5+ sources
- Leading Role: 4+ sources
- High Salary: 3+ sources
`;

function getFieldSpecificSources(field: string): string {
  const sources = {
    'combat_sports': 'Tapology, Fight Matrix, MMA Junkie, BoxRec, Sherdog, UFC.com',
    'tennis': 'ATP/WTA rankings, ITF, Tennis Explorer, Tennis Abstract',
    'cricket': 'ESPN Cricinfo, ICC rankings, national team records, Cricbuzz',
    'tech': 'GitHub stars, Stack Overflow, Crunchbase, TechCrunch, ProductHunt',
    'music': 'Billboard, Spotify charts, Grammy.com, Rolling Stone, Pitchfork',
    'film': 'IMDb, Rotten Tomatoes, Box Office Mojo, Variety, Hollywood Reporter',
    'soccer': 'Transfermarkt, WhoScored, FIFA.com, UEFA.com, FBRef',
    'basketball': 'NBA.com, Basketball Reference, ESPN, FIBA',
  };
  return sources[field] || 'Industry-specific publications and official records';
}
```

#### Phase 3: Media & Recognition Research

**Target: 15-20 URLs**

```typescript
const phase3Prompt = `
Find published material ABOUT ${beneficiaryInfo.fullName}.

YOUR MISSION: Find 15-20 Tier 1-2 sources. We are targeting 50-70 TOTAL URLs.

UPLOADED DOCUMENTS - Media to search:
${extractedTerms.publications.map(p => `- Check: ${p}`).join('\n')}

Focus on:
- Feature articles (not just mentions)
- Interviews and profiles
- Critical reviews
- Industry analysis pieces
- Award announcement coverage
- Competition/event coverage
- Video content with transcripts
- Podcast appearances

QUALITY REQUIREMENTS:
- 10 Tier 1 sources are better than 50 Tier 3 sources
- Must be primarily ABOUT the beneficiary
- Should discuss achievements in depth
- Include quotes or expert commentary when possible
`;
```

### "Find More URLs" Button Implementation

**CRITICAL FEATURE**: When research shows weak evidence for a criterion, display a button to find more.

```typescript
// After research completes, analyze gaps
interface CriterionEvidence {
  criterionNumber: number;
  criterionName: string;
  sourcesFound: number;
  tier1Count: number;
  tier2Count: number;
  evidenceStrength: 'Strong' | 'Adequate' | 'Weak' | 'Missing';
  needsMoreEvidence: boolean;
  minimumRequired: number;  // Minimum sources needed for this criterion
}

// Minimum source requirements per criterion
const CRITERION_MINIMUMS = {
  awards: 5,
  membership: 3,
  published_material: 8,
  judging: 3,
  original_contributions: 5,
  scholarly_articles: 4,
  leading_role: 4,
  high_salary: 3,
};

function analyzeEvidenceGaps(
  claimedCriteria: number[],
  discoveredSources: DiscoveredSource[]
): CriterionEvidence[] {
  return claimedCriteria.map(criterionNum => {
    const sources = discoveredSources.filter(s =>
      s.criteriaSupported.includes(criterionNum)
    );

    const tier1Count = sources.filter(s => s.tier === 1).length;
    const tier2Count = sources.filter(s => s.tier === 2).length;
    const minimum = getMinimumForCriterion(criterionNum);

    let strength: 'Strong' | 'Adequate' | 'Weak' | 'Missing';
    if (tier1Count >= 5 && sources.length >= minimum) strength = 'Strong';
    else if (tier1Count >= 2 && tier2Count >= 3) strength = 'Adequate';
    else if (sources.length > 0) strength = 'Weak';
    else strength = 'Missing';

    return {
      criterionNumber: criterionNum,
      criterionName: getCriterionName(criterionNum),
      sourcesFound: sources.length,
      tier1Count,
      tier2Count,
      evidenceStrength: strength,
      needsMoreEvidence: strength === 'Weak' || strength === 'Missing',
      minimumRequired: minimum
    };
  });
}
```

**UI for Evidence Gaps**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESEARCH RESULTS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CRITERION EVIDENCE STATUS                                       │
│                                                                  │
│  ✅ Criterion 1: Awards                                         │
│     12 sources found (5 Tier 1, 4 Tier 2)                       │
│     Status: STRONG                                               │
│                                                                  │
│  ✅ Criterion 2: Membership                                     │
│     6 sources found (2 Tier 1, 3 Tier 2)                        │
│     Status: ADEQUATE                                             │
│                                                                  │
│  ⚠️ Criterion 3: Published Material                             │
│     3 sources found (0 Tier 1, 1 Tier 2)                        │
│     Status: WEAK                                                 │
│     [🔍 FIND MORE URLS FOR CRITERION 3]  ← BUTTON               │
│                                                                  │
│  ❌ Criterion 5: Original Contributions                         │
│     0 sources found                                              │
│     Status: MISSING                                              │
│     [🔍 FIND MORE URLS FOR CRITERION 5]  ← BUTTON               │
│                                                                  │
│  TOTAL: 21 sources | 7 Tier 1 | 8 Tier 2 | 6 Tier 3            │
│                                                                  │
│  [Continue to Document Generation]                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Find More URLs Button Handler**:

```typescript
async function findMoreUrlsForCriterion(
  criterionNumber: number,
  beneficiaryInfo: BeneficiaryInfo,
  existingUrls: string[]  // Don't duplicate
): Promise<DiscoveredSource[]> {
  const prompt = `
Find additional evidence for ${beneficiaryInfo.fullName} specifically for:

CRITERION ${criterionNumber}: ${getCriterionName(criterionNumber)}

Regulatory requirement: ${getCriterionRequirement(criterionNumber)}

ALREADY HAVE (do not duplicate):
${existingUrls.join('\n')}

FIND 5-10 NEW SOURCES that:
- Directly support this specific criterion
- Are Tier 1 or Tier 2 quality
- Provide concrete evidence (not just mentions)

Focus on:
${getCriterionSearchStrategy(criterionNumber)}
`;

  const response = await perplexity.search(prompt);
  return parseDiscoveredSources(response);
}
```

---

## Phase 2: URL Processing

### Fetch and Classify URLs

```typescript
async function processUrls(
  urls: string[]
): Promise<ProcessedUrl[]> {
  const results: ProcessedUrl[] = [];

  for (const url of urls) {
    try {
      // 1. Fetch content
      const response = await fetch(url, { timeout: 30000 });
      const html = await response.text();

      // 2. Parse and extract
      const $ = cheerio.load(html);
      $('script, style, nav, footer, aside').remove();

      const content = {
        title: $('title').text() || $('h1').first().text(),
        body: $('article, main, .content').text() || $('body').text(),
        date: extractDate($),
        author: extractAuthor($),
      };

      // 3. Classify tier
      const tier = classifySourceTier(url, content);

      // 4. Archive to archive.org
      const archiveUrl = await archiveToWayback(url);

      results.push({
        url,
        archiveUrl,
        tier,
        title: content.title,
        content: content.body.substring(0, 10000),
        domain: new URL(url).hostname,
        fetchedAt: new Date().toISOString(),
        success: true
      });

    } catch (error) {
      results.push({
        url,
        success: false,
        error: error.message
      });
    }

    // Rate limit
    await sleep(1000);
  }

  return results;
}
```

### Tier Classification

```typescript
function classifySourceTier(url: string, content: any): 1 | 2 | 3 | 4 {
  const domain = new URL(url).hostname.toLowerCase();

  // TIER 1: Major national/international media
  const tier1Domains = [
    'espn.com', 'bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com',
    'washingtonpost.com', 'wsj.com', 'reuters.com', 'apnews.com',
    'theguardian.com', 'forbes.com', 'bloomberg.com', 'time.com'
  ];
  if (tier1Domains.some(d => domain.includes(d))) return 1;

  // TIER 2: Trade publications, official organizations
  const tier2Domains = [
    'techcrunch.com', 'wired.com', 'variety.com', 'hollywoodreporter.com',
    'billboard.com', 'rollingstone.com', 'imdb.com', 'rottentomatoes.com',
    // Sports official sites
    'ufc.com', 'fifa.com', 'nba.com', 'nfl.com', 'mlb.com',
    'atp.com', 'wta.com', 'pga.com'
  ];
  if (tier2Domains.some(d => domain.includes(d))) return 2;

  // TIER 3: Regional, niche publications
  const tier3Indicators = [
    'local', 'regional', 'community', 'blog'
  ];
  if (tier3Indicators.some(i => domain.includes(i))) return 3;

  // TIER 4: Self-published, promotional, weak sources
  const tier4Indicators = [
    'medium.com', 'wordpress.com', 'blogspot.com', 'wix.com',
    'linkedin.com/pulse', 'facebook.com', 'instagram.com'
  ];
  if (tier4Indicators.some(i => domain.includes(i))) return 4;

  // Default to Tier 3 for unknown
  return 3;
}
```

---

## Phase 3: Document Generation

### Document Generation Order

```typescript
async function generateDocuments(
  input: UserInput,
  researchResults: ResearchResults,
  processedUrls: ProcessedUrl[]
): Promise<GeneratedDocuments> {

  // STAGE 1: Evidence Gathering Documents (can run in parallel)
  const [doc1, doc2, doc3] = await Promise.all([
    generateDoc1ComprehensiveAnalysis(input, researchResults, processedUrls),
    generateDoc2PublicationAnalysis(input, researchResults, processedUrls),
    generateDoc3UrlReference(input, researchResults, processedUrls),
  ]);

  // STAGE 2: Strategy Document (depends on Stage 1)
  const doc4 = await generateDoc4EvidenceStrategy(input, doc1, doc2, doc3);

  // STAGE 3: Legal Brief (depends on Doc 4)
  const doc5 = await generateDoc5LegalBrief(input, doc1, doc2, doc3, doc4);

  // STAGE 4: Supporting Documents (can run in parallel)
  const [doc6, doc7] = await Promise.all([
    generateDoc6CoverLetter(input, doc5),
    generateDoc7Checklist(input),
  ]);

  // STAGE 5: Officer Scoring (depends on all above)
  const [doc8, doc9] = await Promise.all([
    generateDoc8OfficerScoring(input, doc1, doc2, doc3, doc4, doc5),
    generateDoc9OfficerRating(input, doc5),
  ]);

  return { doc1, doc2, doc3, doc4, doc5, doc6, doc7, doc8, doc9 };
}
```

### Document Dependencies

```
Doc 1 ──┐
Doc 2 ──┼──► Doc 4 ──► Doc 5 ──► Doc 6
Doc 3 ──┘              │         Doc 7
                       │
                       └──► Doc 8
                            Doc 9
```

### AI Configuration per Document

```typescript
const documentConfigs = {
  doc1: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 20480,
    temperature: 0.3,
    targetPages: 75,
  },
  doc2: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 20480,
    temperature: 0.3,
    targetPages: 40,
  },
  doc3: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 12288,
    temperature: 0.2,
  },
  doc4: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 16384,
    temperature: 0.4,
    targetPages: 25,
    internalOnly: true,  // DO NOT SUBMIT TO USCIS
  },
  doc5: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 32768,
    temperature: 0.3,
    targetPages: 40,
    useDIYTemplate: true,  // CRITICAL
  },
  doc6: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 2048,
    temperature: 0.2,
    targetPages: 3,
  },
  doc7: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
    temperature: 0.2,
  },
  doc8: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 16384,
    temperature: 0.4,
    targetPages: 20,
    internalOnly: true,  // DO NOT SUBMIT TO USCIS
  },
  doc9: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 16384,
    temperature: 0.4,
    internalOnly: true,  // DO NOT SUBMIT TO USCIS
  },
};
```

---

## Phase 4: Officer Scoring

### When to Run Officer Scoring

```typescript
// Run after Legal Brief is generated
async function runOfficerScoring(
  doc5LegalBrief: string,
  visaType: VisaType,
  beneficiaryName: string
): Promise<OfficerScoringResult> {

  const systemPrompt = getOfficerSystemPrompt(visaType);
  const scoringPrompt = getScoringPrompt(doc5LegalBrief, visaType, beneficiaryName);

  const response = await callClaude(scoringPrompt, systemPrompt, {
    maxTokens: 16384,
    temperature: 0.4
  });

  // Parse structured results
  const results = parseOfficerReport(response);

  return {
    overallScore: results.overallScore,
    approvalProbability: results.approvalProbability,
    rfeProbability: results.rfeProbability,
    denialRisk: results.denialRisk,
    criteriaScores: results.criteriaScores,
    redFlags: results.redFlags,
    rfePredictions: results.rfePredictions,
    recommendations: results.recommendations,
    fullReport: response
  };
}
```

### Feedback Loop

If officer scoring identifies major weaknesses, allow user to:

```
┌─────────────────────────────────────────────────────────────────┐
│                 OFFICER SCORING RESULTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OVERALL SCORE: 58/100                                          │
│  VERDICT: RFE LIKELY - STRENGTHEN FIRST                         │
│                                                                  │
│  ⚠️ RED FLAGS IDENTIFIED:                                       │
│                                                                  │
│  1. Weak Media Coverage (Criterion 3)                           │
│     - Only 1 Tier 1 source                                      │
│     - Need 3+ major media publications                          │
│     [🔍 FIND MORE MEDIA URLS]                                   │
│                                                                  │
│  2. Self-Serving Expert Letters                                 │
│     - Both experts are business associates                      │
│     - Need independent expert opinions                          │
│                                                                  │
│  RECOMMENDED ACTIONS:                                            │
│  ☐ Add 3+ Tier 1 media sources                                  │
│  ☐ Obtain independent expert letter                             │
│  ☐ Strengthen Original Contributions evidence                   │
│                                                                  │
│  [↩️ Go Back & Strengthen]  [✅ Proceed Anyway]                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI/UX Requirements

### CRITICAL: Form Data Persistence

**REQUIREMENT**: User input MUST persist during AI operations.

```typescript
// BAD - Form clears during AI call
const handleGenerate = async () => {
  setLoading(true);
  const result = await generatePetition(formData);  // Form might clear!
  setLoading(false);
};

// GOOD - Form data preserved using state management
const [formData, setFormData] = useState<UserInput>(initialState);
const [isGenerating, setIsGenerating] = useState(false);

const handleGenerate = async () => {
  // Save current form state
  const savedData = { ...formData };

  setIsGenerating(true);

  try {
    const result = await generatePetition(savedData);
    // Form data still intact - user can see what they entered
  } finally {
    setIsGenerating(false);
  }
};
```

### Form State Management (React Example)

```tsx
// Use a form library that preserves state
import { useForm } from 'react-hook-form';

function PetitionForm() {
  const { register, handleSubmit, watch, getValues } = useForm<UserInput>({
    defaultValues: loadSavedFormData() || initialState,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-save form data to localStorage
  const formValues = watch();
  useEffect(() => {
    localStorage.setItem('petitionFormData', JSON.stringify(formValues));
  }, [formValues]);

  const onSubmit = async (data: UserInput) => {
    setIsProcessing(true);

    try {
      // Form data persists - user can still see/edit if needed
      const result = await generatePetition(data);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields with register() */}
      <input {...register('beneficiaryInfo.fullName')} disabled={isProcessing} />

      {/* During processing, show overlay but keep form visible */}
      {isProcessing && (
        <div className="processing-overlay">
          <Spinner />
          <p>Generating petition... Your form data is preserved.</p>
        </div>
      )}
    </form>
  );
}
```

### Loading States

```
┌─────────────────────────────────────────────────────────────────┐
│                    VISA PETITION GENERATOR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ FORM DATA (preserved and visible)                         │  │
│  │ Name: John Smith                                          │  │
│  │ Visa Type: O-1A                                           │  │
│  │ Field: Professional Tennis                                │  │
│  │ ...                                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║                    GENERATING...                          ║  │
│  ║                                                            ║  │
│  ║  [=============================>          ] 65%           ║  │
│  ║                                                            ║  │
│  ║  Currently: Generating Document 4 - Evidence Strategy     ║  │
│  ║                                                            ║  │
│  ║  ✓ Phase 1: Research completed (42 sources found)        ║  │
│  ║  ✓ Phase 2: URLs processed (38 successful)               ║  │
│  ║  ✓ Doc 1: Comprehensive Analysis (78 pages)              ║  │
│  ║  ✓ Doc 2: Publication Analysis (45 pages)                ║  │
│  ║  ✓ Doc 3: URL Reference Document                         ║  │
│  ║  ◉ Doc 4: Evidence Strategy (in progress...)             ║  │
│  ║  ○ Doc 5: Legal Brief                                     ║  │
│  ║  ○ Doc 6-9: Supporting Documents                          ║  │
│  ║                                                            ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  [Cancel]                                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Configuration

### Environment Variables

```env
# AI APIs
ANTHROPIC_API_KEY=sk-ant-...          # Claude (primary)
OPENAI_API_KEY=sk-...                  # OpenAI (fallback)
PERPLEXITY_API_KEY=pplx-...           # Perplexity (research)
GOOGLE_AI_API_KEY=...                  # Gemini (RAG, optional)

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Archive
ARCHIVE_ORG_ACCESS_KEY=...            # For archive.org API
ARCHIVE_ORG_SECRET_KEY=...

# Deployment
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### API Call Pattern with Fallback

```typescript
async function callAIWithFallback(
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  temperature: number
): Promise<{ content: string; provider: string }> {

  // Try Claude first
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      content: response.content[0].text,
      provider: 'claude'
    };
  } catch (claudeError) {
    console.error('Claude failed, trying OpenAI:', claudeError);
  }

  // Fallback to OpenAI
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    return {
      content: response.choices[0].message.content,
      provider: 'openai'
    };
  } catch (openaiError) {
    console.error('OpenAI also failed:', openaiError);
    throw new Error('All AI providers failed');
  }
}
```

---

## Deployment

### Google Cloud Run

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
```

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/visa-petition-ultimate', '.']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/visa-petition-ultimate']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'visa-petition-ultimate'
      - '--image'
      - 'gcr.io/$PROJECT_ID/visa-petition-ultimate'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--memory'
      - '2Gi'
      - '--timeout'
      - '3600'
      - '--allow-unauthenticated'
```

### Deploy Command

```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## Summary Checklist

### Before Launch

- [ ] All 9 document prompts configured
- [ ] Perplexity 4-phase research working
- [ ] "Find More URLs" button implemented for weak criteria
- [ ] Form data persists during AI operations
- [ ] Progress indicator shows current status
- [ ] Claude primary, OpenAI fallback configured
- [ ] Archive.org integration working
- [ ] Officer scoring feedback loop implemented
- [ ] Cloud Run deployment tested

### Quality Gates

- [ ] Doc 1 generates 75+ pages
- [ ] Doc 2 properly classifies sources by tier
- [ ] Doc 4 identifies weaknesses honestly
- [ ] Doc 5 follows DIY template exactly
- [ ] Doc 8 provides actionable recommendations
- [ ] Research finds 50-70 sources total
- [ ] At least 50% sources are Tier 1-2

---

## Repository

**GitHub:** https://github.com/IGTA-Tech/visa-petition-ultimate

**Related Repos:**
- `uscis-scoring-tool-cloudrun` - Standalone officer scoring
- `visa-exhibit-maker` - Exhibit assembly tool

---

*Last Updated: December 2024*
