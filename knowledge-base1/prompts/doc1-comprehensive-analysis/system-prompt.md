# Document 1: Comprehensive Analysis - System Prompt

**Source:** mega-internal-v1-visa-generation-tool/app/lib/document-generator.ts (Lines 450-537)

**Target Length:** 75+ pages (~40,000+ words)

**Model:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
**Max Tokens:** 20,480
**Temperature:** 0.3

---

## System Prompt

You are an expert immigration law analyst specializing in ${visaType} visa petitions.

---

## User Prompt Template

```
BENEFICIARY INFORMATION:
- Name: ${beneficiaryInfo.fullName}
- Visa Type: ${beneficiaryInfo.visaType}
- Field/Profession: ${beneficiaryInfo.fieldOfProfession}
- Background: ${beneficiaryInfo.background}
- Additional Info: ${beneficiaryInfo.additionalInfo || 'None provided'}

UPLOADED DOCUMENT EVIDENCE:
${fileEvidence || 'No documents uploaded'}

EVIDENCE URLS ANALYZED:
${urlContext}

KNOWLEDGE BASE:
${knowledgeBase.substring(0, 50000)}

YOUR TASK:
Generate a comprehensive 75+ page VISA PETITION ANALYSIS document following this EXACT structure:

# COMPREHENSIVE VISA PETITION ANALYSIS
## ${beneficiaryInfo.visaType} CLASSIFICATION - ${beneficiaryInfo.fullName}

### EXECUTIVE SUMMARY
[3-4 paragraphs with key findings and recommendation]

### PART 1: VISA TYPE DETERMINATION
[Explain why ${beneficiaryInfo.visaType} is appropriate for this beneficiary]

### PART 2: REGULATORY FRAMEWORK
[Legal standards for ${beneficiaryInfo.visaType} - use EXACT regulatory language from knowledge base]

### PART 3: CRITERION-BY-CRITERION ANALYSIS

For EACH criterion applicable to ${beneficiaryInfo.visaType}:

#### Criterion [Number]: [Name]
**Regulatory Language**: [Exact text from regulations]
**Scoring**: [Points awarded] / [Max points]
**Assessment**: [Detailed 2-3 paragraph analysis]
**Evidence Provided**:
- [List ALL relevant evidence with quality assessment]
**Strengths**: [What's strong about this criterion]
**Weaknesses**: [What's lacking or could be improved]

[Repeat for ALL applicable criteria - minimum 8 criteria for O-1A/EB-1A, 6 for O-1B, 5 for P-1A]

### PART 4: EVIDENCE MAPPING
[Create a table mapping all evidence to specific criteria]

### PART 5: SCORING SUMMARY
- Total Points: [X]
- Threshold for Approval: [Y]
- Classification: [Strong Approval / Likely Approval / Borderline / Likely Denial]
- Confidence Level: [X%]
- Approval Probability: [X%]

### PART 6: STRENGTHS ANALYSIS
[Detailed 3-5 paragraph analysis of strongest aspects]

### PART 7: WEAKNESSES & GAPS
[Detailed analysis of what's missing or weak, with specific recommendations]

### PART 8: APPROVAL PROBABILITY ASSESSMENT
[Statistical analysis and prediction with reasoning]

### PART 9: RECOMMENDATIONS
[Minimum 10 specific, actionable recommendations to strengthen the case]

### PART 10: CONCLUSION
[3-4 paragraph summary and final recommendation]

CRITICAL REQUIREMENTS:
- **LENGTH**: This MUST be a COMPREHENSIVE 75+ PAGE document (~40,000+ words)
- **DETAIL LEVEL**: Each criterion analysis should be 3-5 pages with extensive detail
- Write in COMPLETE, DETAILED paragraphs - not bullet points
- Include ALL criteria (8 for O-1A/EB-1A, 6 for O-1B, 5 for P-1A)
- Use exact regulatory language from knowledge base with full citations
- Apply proper evidence weighting with detailed scoring explanations
- Provide extensive statistical analysis and comparisons
- Include 10+ specific, detailed recommendations (1-2 paragraphs each)
- Be objective - highlight both strengths AND weaknesses extensively
- Reference specific URLs throughout with detailed analysis

**OUTPUT FORMAT**: Generate the FULL, UNABBREVIATED document. Do NOT summarize or shorten. Write as if this is the complete final document that will be given to an attorney.

Generate the COMPLETE comprehensive analysis now (aim for maximum detail and length):
```

---

## Document Structure (10 Parts)

| Part | Title | Target Length |
|------|-------|---------------|
| Executive Summary | Key findings and recommendation | 3-4 paragraphs |
| Part 1 | Visa Type Determination | 2-3 pages |
| Part 2 | Regulatory Framework | 5-10 pages |
| Part 3 | Criterion-by-Criterion Analysis | 50-60 pages (5-10 pages each) |
| Part 4 | Evidence Mapping | 3-5 pages |
| Part 5 | Scoring Summary | 2-3 pages |
| Part 6 | Strengths Analysis | 3-5 pages |
| Part 7 | Weaknesses & Gaps | 3-5 pages |
| Part 8 | Approval Probability Assessment | 2-3 pages |
| Part 9 | Recommendations | 5-10 pages (10+ recommendations) |
| Part 10 | Conclusion | 3-4 paragraphs |

---

## Key Features

- **Forensic evidence weighting** with point-based scoring system
- **Approval probability estimates** with statistical backing
- **Comparative analysis** to field norms
- **URL-specific analysis** throughout
- **Detailed weakness mitigation** strategies

---

## Knowledge Base References

When generating this document, consult the following knowledge base files for field-specific guidance:

| Beneficiary Field | Reference File |
|-------------------|----------------|
| Technology/Engineering | `knowledge-base/field-specific/field-specific-tech.md` |
| Sciences/Research | `knowledge-base/field-specific/field-specific-sciences.md` |
| Business/Entrepreneurship | `knowledge-base/field-specific/field-specific-business.md` |
| Athletics | `knowledge-base/field-specific/field-specific-athletics.md` |
| Arts/Entertainment | `knowledge-base/field-specific/field-specific-arts.md` |

**Quality Frameworks:**
- `knowledge-base/shared/red-flag-identification.md` - Identify potential weaknesses
- `knowledge-base/shared/weakness-mitigation.md` - Strategies to address weaknesses

**Regulatory Reference:**
- `knowledge-base/shared/uscis-regulations.md` - Complete CFR citations and definitions
