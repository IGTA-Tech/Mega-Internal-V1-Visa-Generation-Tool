# Phase 0: Title Analysis & Document Extraction

**Source:** mega-visa-petition-generator-v4/app/lib/ai/perplexity-research.ts

**Purpose:**
1. Analyze the beneficiary's professional title to determine research strategy
2. **Extract search terms from uploaded documents** for comprehensive research
3. Determine evidence boundaries and criteria focus

**Critical:** This phase sets up the entire research strategy for finding **50-70 total URLs**.

---

## System Prompt

```
You are an expert immigration attorney analyzing beneficiary job titles for visa petitions.

Reference the BENEFICIARY_TITLE_RESEARCH_GUIDE.md methodology to analyze the beneficiary's professional title.

Your analysis must determine:
1. Level descriptor (world-class, elite, professional, accomplished, emerging)
2. Domain (the field/sport/industry)
3. Role (competitor, creator, leader, performer, etc.)
4. Specialization (any specific niche)
5. Scope type (EXPANDING, RESTRICTING, or SPLITTING)
6. Evidence boundaries (what counts vs what doesn't)
7. Primary criteria this title naturally supports
8. Secondary criteria (possible but harder)
9. Weak criteria (unlikely for this title)
10. Research strategy to use
11. Evidence threshold (what achievements are "good enough")

Return your analysis in JSON format.
```

---

## User Prompt Template

```
Analyze this beneficiary's title and professional descriptor:

**Full Name:** ${beneficiaryInfo.fullName}
**Professional Title/Description:** ${beneficiaryInfo.jobTitle || beneficiaryInfo.occupation || 'Professional in ' + fieldOfWork}
**Field:** ${fieldOfWork}
**Visa Type:** ${beneficiaryInfo.visaType}
**Country of Origin:** ${beneficiaryInfo.nationality || 'Not specified'}
**Background:** ${beneficiaryInfo.background}

**UPLOADED DOCUMENTS CONTENT:**
${uploadedDocumentsText}

INSTRUCTIONS:
1. Analyze the title per BENEFICIARY_TITLE_RESEARCH_GUIDE.md framework
2. Extract ALL searchable entities from uploaded documents:
   - Organization names (companies, teams, leagues, federations)
   - People names (recommenders, colleagues, coaches)
   - Event names (competitions, conferences, performances)
   - Award names (specific awards, titles, honors)
   - Publication names (media outlets that covered them)
   - Specific achievements mentioned (claims to verify)
3. Generate search queries using extracted entities

Provide a complete title analysis with document-derived search terms.
```

---

## Expected Output Structure

```json
{
  "title": "Professional MMA Fighter",
  "level_descriptor": "elite",
  "domain": "Mixed Martial Arts",
  "role": "competitor",
  "specialization": "lightweight division",
  "scope_type": "RESTRICTING",
  "evidence_boundaries": "Focus on MMA achievements only; exclude unrelated martial arts",
  "primary_criteria": ["Awards", "Published Material", "Critical Role"],
  "secondary_criteria": ["Membership", "Judging"],
  "weak_criteria": ["Scholarly Articles", "Original Contributions"],
  "research_strategy": "Competitor/Performer",
  "evidence_threshold": "Top 50 world ranking, major organization wins, significant media coverage",

  "extracted_from_documents": {
    "organizations": ["UFC", "Bellator", "American Top Team"],
    "people": ["Coach John Smith", "Dr. Jane Doe (recommender)"],
    "events": ["UFC 250", "ADCC Championships 2023"],
    "awards": ["Submission of the Night", "Regional Champion"],
    "publications": ["ESPN", "MMA Junkie"],
    "achievements_to_verify": [
      "Won ADCC championship in 2023",
      "Ranked #15 by Tapology",
      "Featured in ESPN documentary"
    ]
  },

  "recommended_search_queries": [
    "\"Beneficiary Name\" UFC",
    "\"Beneficiary Name\" ADCC 2023",
    "\"Beneficiary Name\" ESPN",
    "\"Beneficiary Name\" Tapology ranking",
    "American Top Team \"Beneficiary Name\""
  ]
}
```

---

## Scope Types Explained

### EXPANDING
- Evidence from related fields counts
- Example: "Combat Sports Athlete" - MMA, boxing, kickboxing all count

### RESTRICTING
- Only evidence directly in the stated field
- Example: "Professional Boxer" - only boxing achievements count

### SPLITTING
- Multiple distinct domains that must be addressed separately
- Example: "Actor and Director" - need evidence for both roles

---

## Research Strategy Types

| Strategy | Best For | Focus |
|----------|----------|-------|
| Competitor/Performer | Athletes, musicians, actors | Rankings, competitions, performances |
| Creator/Researcher | Scientists, artists, inventors | Publications, patents, innovations |
| Business/Leadership | Executives, entrepreneurs | Company achievements, impact, revenue |
| Multi-Domain | Professionals in multiple fields | Separate evidence for each domain |

---

## Level Descriptors

| Level | Evidence Threshold |
|-------|-------------------|
| World-class | Global top 10, major international titles |
| Elite | National champion, top 50 world ranking |
| Professional | Established career, regular competition/work at high level |
| Accomplished | Significant achievements, but not yet at top tier |
| Emerging | Early career, promising but limited track record |

---

## API Configuration

- **Model:** sonar
- **Max Tokens:** 2,000
- **Temperature:** 0.1 (low for consistency)
