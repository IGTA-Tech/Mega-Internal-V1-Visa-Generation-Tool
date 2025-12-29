# Phase 2: Criterion-Specific Deep Dive

**Purpose:** Find **20-30 sources** focused on the PRIMARY CRITERIA identified in Phase 0.

**Target:** 20-30 URLs (contributing to 50-70 total)

---

## System Prompt

```
You are an expert research paralegal conducting Phase 2 criterion-specific research for a visa petition.

YOUR MISSION: Find 20-30 sources focused on PRIMARY CRITERIA. This is part of a comprehensive research effort targeting 50-70 total URLs.

Reference COMPREHENSIVE_RESEARCH_METHODOLOGY_TRAINING.md for field-specific research protocols.

Your task: Find 20-30 sources focused on the PRIMARY CRITERIA for this case.

CRITICAL FIELD-SPECIFIC PROTOCOLS:
- Combat Sports (MMA/Boxing): National team focus, Tapology/Fight Matrix rankings, MMA Junkie/Sherdog
- Tennis: National team selection (game-changer), ATP/WTA rankings, tournament results
- Cricket: National team caps, CricInfo, country competitiveness matters
- Figure Skating: Olympic participation, ISU rankings, Disney on Ice = distinguished org
- Tech/Business: TechCrunch, Crunchbase, product launches, funding announcements
- Music/Arts: Billboard, Grammy history, album reviews, tour coverage

Apply the professional attorney methodology:
- National team = satisfies multiple criteria (Awards, Membership, Critical Role, Press)
- Rankings from multiple systems (verify with contacts)
- "5-7 pages" per source (not too few, not too many)
- Capture context (ranked AMONG peers, not just individual ranking)

UPLOADED DOCUMENTS INTEGRATION:
- Extract specific claims from uploaded docs
- Search for verification of each claim
- Find corroborating sources for achievements mentioned
- Use uploaded docs as search term generators

Return results as JSON array.
```

---

## User Prompt Template

```
Conduct Phase 2 criterion-specific research for:

**Name:** ${beneficiaryInfo.fullName}
**Title:** ${titleAnalysis.title}
**Field:** ${titleAnalysis.domain}
**Primary Criteria to Focus:** ${titleAnalysis.primary_criteria.join(', ')}

UPLOADED DOCUMENTS - Key Claims to Verify:
${extractedClaimsFromDocuments}

Find 20-30 sources targeting these specific criteria. Focus on field-specific databases and authoritative sources.

Already found ${phase1Sources.length} sources in Phase 1. Find NEW sources.

RESEARCH DEEPLY - we are targeting 50-70 total URLs.

For EACH claimed criterion, find at least 3-5 sources.
```

---

## Expected Output Structure

```json
[
  {
    "url": "https://www.tapology.com/fightcenter/fighters/12345",
    "title": "Fighter Name - Tapology Fighter Profile",
    "source_name": "Tapology",
    "tier": 2,
    "criteria": ["Awards", "Critical Role"],
    "key_content": "Complete fight record with 15-2 record, regional championship wins, ranking history",
    "date_published": "2024-current",
    "evidence_type": "Rankings/Statistics"
  }
]
```

---

## Criterion-Specific Minimum Source Requirements

| Criterion | Minimum Sources | Source Types |
|-----------|-----------------|--------------|
| Awards | 5+ | Award announcements, ceremonies, lists |
| Membership | 3+ | Organization sites, membership announcements |
| Published Material | 8+ | Feature articles, profiles, interviews |
| Judging | 3+ | Event coverage, judge announcements |
| Original Contributions | 5+ | Technical coverage, impact articles |
| Scholarly Articles | 4+ | Publication sites, citations, academic coverage |
| Leading Role | 4+ | Org announcements, team coverage |
| High Salary | 3+ | Contract announcements, salary reports |

---

## Field-Specific Research Protocols

### Combat Sports (MMA/Boxing/Kickboxing)

**Primary Sources (find 8-10 from these):**
- Tapology (complete fight records, rankings)
- Fight Matrix (independent rankings)
- Sherdog (fight finder, news)
- MMA Junkie (USA Today Sports - Tier 1)
- BoxRec (boxing records)
- UFC.com / Bellator / ONE Championship
- ESPN MMA
- The Athletic MMA

**Key Evidence:**
- Win/loss records with opponent rankings
- Championship titles and defenses
- World/regional rankings over time
- National team selection (if applicable)
- Fight purses and disclosed pay

### Tennis

**Primary Sources (find 8-10 from these):**
- ATP Tour / WTA official sites
- Tennis.com
- Tennis Explorer (rankings history)
- ITF (International Tennis Federation)
- Tennis Abstract
- Tennis World USA
- ESPN Tennis

**Key Evidence:**
- World ranking history and peak ranking
- Grand Slam/ATP/WTA tournament results
- National team selection (Davis Cup/Fed Cup)
- Prize money earned
- H2H records vs top players

### Soccer/Football

**Primary Sources (find 8-10 from these):**
- FIFA.com
- UEFA.com
- Transfermarkt (career history, valuations)
- WhoScored (statistics)
- SofaScore
- FBRef
- Soccerway

**Key Evidence:**
- International caps and goals
- Club career achievements
- Transfer valuations
- League/cup championships
- Individual awards

### Cricket

**Primary Sources (find 8-10 from these):**
- ESPN Cricinfo (gold standard)
- ICC official site
- National cricket board sites
- Cricbuzz
- HowStat

**Key Evidence:**
- International caps (Test, ODI, T20)
- Career statistics
- Tournament performances
- National team selection timeline
- Rankings history

### Figure Skating

**Primary Sources (find 6-8 from these):**
- ISU (International Skating Union)
- Olympic.org
- Figure Skating Results
- US Figure Skating / national federations
- IceNetwork

**Key Evidence:**
- Olympic/World Championship participation
- ISU rankings
- National championship results
- Professional skating (Disney on Ice = distinguished org)

### Tech/Business

**Primary Sources (find 8-10 from these):**
- TechCrunch
- Crunchbase
- Wired
- The Verge
- Ars Technica
- VentureBeat
- Product Hunt
- GitHub (stars, contributions)
- Stack Overflow

**Key Evidence:**
- Funding rounds
- Product launches
- User/revenue metrics
- Technical innovations
- Speaking engagements
- Patent applications

### Music/Entertainment

**Primary Sources (find 8-10 from these):**
- Billboard
- Rolling Stone
- Variety
- Hollywood Reporter
- Pitchfork
- NME
- Grammy.com
- Spotify/Apple Music charts

**Key Evidence:**
- Chart positions
- Album/single certifications
- Award nominations/wins
- Tour grosses
- Streaming numbers
- Critical reviews

---

## National Team Evidence (Multi-Criteria Impact)

National team selection is a "game-changer" because it satisfies multiple criteria:

| Criterion | How National Team Helps |
|-----------|-------------------------|
| Awards | Selection itself is an award |
| Membership | Team membership requiring outstanding achievement |
| Critical Role | Leading/critical role for distinguished organization |
| Published Material | Media coverage of team selection |

**Find 3-5 sources for EACH aspect of national team involvement.**

---

## Ranking Evidence Best Practices

1. **Multiple Sources:** Get rankings from 3-4 different systems
2. **Historical Context:** Show ranking progression over time
3. **Peer Comparison:** "Ranked #15 AMONG 500+ active fighters"
4. **Verification:** Cross-reference with official sources
5. **Screenshot/Archive:** Archive ranking pages for evidence

---

## Uploaded Documents Analysis

BEFORE searching, extract from uploaded documents:

1. **Specific achievements to verify:**
   - "Won X award in Y year" → Search for coverage
   - "Ranked #X in Y" → Find ranking source
   - "Member of X organization" → Find org announcement

2. **Organizations mentioned:**
   - Search org's website for mentions
   - Search news for org + beneficiary name

3. **Events/competitions:**
   - Search for event coverage
   - Find results pages
   - Look for photos/videos

4. **People who recommended:**
   - Verify their credentials
   - Find coverage of their work
   - Establish their authority

---

## API Configuration

- **Model:** sonar
- **Max Tokens:** 8,000
- **Temperature:** 0.2
- **Searches:** Multiple queries across all criteria to reach 20-30 sources
