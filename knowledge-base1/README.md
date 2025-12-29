# Visa Petition Ultimate

The **world's best prompts, RAG knowledge base, and document templates** for visa petition generation.

## Overview

This repository consolidates the best components from 5 visa petition repositories:
- mega-internal-v1-visa-generation-tool
- mega-visa-generation-project
- mega-visa-petition-generator-v4
- visa-exhibit-maker
- visa-glow-tool

**Focus:** Prompts and document quality - NOT the processing engine.

## AI/LLM Configuration

| Task | Primary Model | Fallback |
|------|---------------|----------|
| Research | Perplexity API (sonar) | - |
| Document Writing | Claude (Sonnet 4.5) | OpenAI GPT-4o |
| RAG Knowledge | Gemini (with File Search) | - |

## Supported Visa Types

- **O-1A**: Extraordinary Ability (Sciences, Education, Business, Athletics)
- **O-1B**: Extraordinary Ability (Arts, Motion Picture/TV)
- **P-1A**: Internationally Recognized Athletes
- **EB-1A**: Extraordinary Ability Green Card

## Repository Structure

```
visa-petition-ultimate/
├── knowledge-base/          # 27,923+ lines of RAG content
│   ├── O-1A/               # O-1A specific knowledge
│   ├── O-1B/               # O-1B specific knowledge
│   ├── P-1A/               # P-1A specific knowledge
│   ├── EB-1A/              # EB-1A specific knowledge (Gold Standard)
│   ├── shared/             # Cross-visa knowledge
│   └── exhibits/           # Exhibit organization guide
│
├── prompts/                 # All 9 document prompts
│   ├── doc1-comprehensive-analysis/
│   ├── doc2-publication-analysis/
│   ├── doc3-url-reference/
│   ├── doc4-evidence-gap-analysis/   # CONDUIT/BRIDGE document (INTERNAL)
│   ├── doc5-legal-brief/             # USCIS-ready formal petition
│   ├── doc6-uscis-cover-letter/
│   ├── doc7-visa-checklist/          # Filing completeness checklist
│   ├── doc8-uscis-officer-scoring/   # Devil's Advocate scoring (INTERNAL)
│   └── doc9-uscis-officer-rating/    # Extended officer evaluation (INTERNAL)
│
├── research/                # Perplexity 4-phase research prompts
│
├── examples/                # Example outputs for reference
│
└── templates/               # Agreements and support letters
    ├── agreements/          # 5 agreement types
    └── support-letters/     # 8 letter types
```

## Document Flow

```
Evidence Gathering              Strategy Bridge              Final Output
┌─────────────────┐           ┌─────────────────┐         ┌─────────────────┐
│ Doc 1: Analysis │──┐        │                 │         │                 │
├─────────────────┤  │        │   Doc 4:        │         │   Doc 5:        │
│ Doc 2: Pubs     │──┼───────>│   Evidence      │────────>│   Legal Brief   │
├─────────────────┤  │        │   Strategy &    │         │   (USCIS-Ready) │
│ Doc 3: URLs     │──┘        │   Argument      │         │                 │
└─────────────────┘           │   Bridge        │         └─────────────────┘
                              │   (INTERNAL)    │                  │
                              └─────────────────┘                  v
                                                           ┌──────────────────┐
                                                           │ Docs 6-9:        │
                                                           │ Supporting Docs  │
                                                           └──────────────────┘
```

## 9 Document Types

| # | Document | Purpose | Pages | Internal? |
|---|----------|---------|-------|-----------|
| 1 | Comprehensive Analysis | Criterion-by-criterion deep dive | 75+ | No |
| 2 | Publication Analysis | USCIS-focused tiered media analysis | 40+ | No |
| 3 | URL Reference | Evidence catalog with archive.org links | Variable | No |
| 4 | **Evidence Strategy & Argument Bridge** | Assess evidence, identify gaps, improve arguments | 20-35 | **YES** |
| 5 | **Legal Brief** | USCIS-ready formal petition (DIY template) | 30-50 | No |
| 6 | USCIS Cover Letter | Professional introduction | 2-3 | No |
| 7 | **Filing Completeness Checklist** | Pure checklist - is file complete? Yes/No | Variable | No |
| 8 | **USCIS Officer Scoring Report** | Devil's Advocate officer simulation | 15-25 | **YES** |
| 9 | USCIS Officer Rating | Extended officer evaluation | Variable | **YES** |

### Document 7: Filing Completeness Checklist

**Purpose:** Track whether all required components are present for filing

**Key Points:**
- Pure YES/NO checklist - is the item present or not?
- NO quality assessments (how strong is the case)
- NO timeline estimates
- NO recommendations or advice
- Just completeness tracking

### Document 8: USCIS Officer Scoring Report

**Purpose:** Simulate a skeptical USCIS Adjudications Officer evaluation

**Persona:** Senior officer with 15+ years experience who:
- Is skeptical by default
- Questions everything
- Has seen every trick
- Protects system integrity

**Key Outputs:**
- Overall score (0-100) with weighted matrix
- Approval/RFE/Denial probabilities
- Criterion-by-criterion officer ratings
- Red flags identified
- RFE predictions with draft language
- Actionable recommendations (Critical/High/Recommended)

**Scoring Matrix:**
| Category | Weight |
|----------|--------|
| Evidence Quality | 25% |
| Criteria Coverage | 25% |
| Documentation | 15% |
| Credibility | 15% |
| Comparative Standing | 10% |
| Presentation | 10% |

**Cloud Run Deployment:** Based on `uscis-scoring-tool-cloudrun` repository

**DO NOT SUBMIT TO USCIS** - Internal quality check only

### Document 4: Evidence Strategy & Argument Bridge

**Purpose:** CONDUIT between evidence gathering (Docs 1-3) and Legal Brief (Doc 5)

**Key Functions:**
1. Be brutally honest about weaknesses FIRST
2. Assess evidence in totality
3. Rank criteria by evidence strength
4. IMPROVE and BOLSTER arguments for Doc 5
5. Draft preemptive RFE defenses
6. Provide argument strategy for Legal Brief

**DO NOT SUBMIT TO USCIS** - This is an internal strategy document.

### Document 5: Legal Brief

**Purpose:** Execute the argument strategy from Doc 4 as formal USCIS petition

**Key Requirements:**
1. Use DIY Template format EXACTLY (checkboxes, regulatory standards, etc.)
2. Present criteria in STRENGTH ORDER (per Doc 4 ranking)
3. Include BOLSTERED arguments from Doc 4
4. Include preemptive RFE defenses
5. USCIS-ready format (NOT casual markdown)
6. 3-5 pages per criterion minimum
7. No emojis - professional legal document

## 4-Phase Perplexity Research

**Total Target: 50-70 URLs**

| Phase | Purpose | Target Sources |
|-------|---------|----------------|
| 0 | Title Analysis + Document Extraction | Strategy, search terms from uploaded docs |
| 1 | Identity Discovery | **15-20** Tier 1-2 sources |
| 2 | Criterion Deep Dive | **20-30** field-specific sources |
| 3 | Media Recognition | **15-20** Tier 1-2 media sources |

**Key:** Research uses uploaded documents to extract organizations, events, awards, and publications as additional search terms.

## DIY Template Format (Required for Doc 5)

Each criterion MUST include:

1. **Criterion Header with Checkboxes**
   ```
   ☐ Yes, the Beneficiary is pursuing qualification under this criterion.
   ☐ No, the Beneficiary is not pursuing qualification under this criterion.
   ```

2. **Regulatory Standard Block** - Exact CFR citation and language

3. **Establishment of Elements in Evidence** - Numbered points matching regulatory elements

4. **Comparable Evidence Theory** (O-1A, O-1B, EB-1A ONLY - NOT P-1A)

5. **Consideration of Evidence Closing**

## CFR References

| Visa Type | Base Section | Comparable Evidence |
|-----------|--------------|---------------------|
| O-1A | 8 CFR 214.2(o)(3)(iii) | 8 CFR 214.2(o)(3)(v) |
| O-1B | 8 CFR 214.2(o)(3)(iv) | 8 CFR 214.2(o)(3)(v) |
| P-1A | 8 CFR 214.2(p)(4)(ii) | **NONE** |
| EB-1A | 8 CFR 204.5(h)(3) | 8 CFR 204.5(h)(4) |

## Key Features

- **DIY Template Enforcement**: Exact USCIS format with CFR citations
- **Tier Classification**: Tier 1 (Gold - ESPN, BBC, CNN), Tier 2 (Industry), Tier 3 (Supplementary)
- **Kazarian Two-Step**: EB-1A proper framework (criteria first, then final merits)
- **Comparable Evidence**: O-1A, O-1B, EB-1A (NOT P-1A)
- **RFE Prevention**: Common trigger identification and preemptive defenses
- **Wikipedia Rule**: NEVER cite directly, only use to find its sources

## Usage

Each prompt folder contains:
- `system-prompt.md` - The system prompt for Claude/GPT
- `user-prompt-template.md` - The user prompt with placeholders
- `config.json` - Token limits, temperature, model settings

## Source Repositories

| Repository | Best Components |
|------------|-----------------|
| mega-internal-v1 | Claude prompts, DIY template, publication tiers |
| mega-visa-petition-generator-v4 | 9-doc architecture, modular design, Doc 9 |
| mega-visa-generation-project | Support letters, Mistral OCR |
| visa-exhibit-maker | Exhibit organization (61KB guide) |

---

Created: December 2024
Last Updated: December 2024
