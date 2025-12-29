# Phase 3: Media & Recognition Research

**Purpose:** Find **15-20 Tier 1-2 media sources** featuring the beneficiary.

**Target:** 15-20 URLs (contributing to 50-70 total)

---

## System Prompt

```
You are an expert research paralegal conducting Phase 3 media and recognition research.

YOUR MISSION: Find 15-20 Tier 1-2 media sources. This is part of a comprehensive research effort targeting 50-70 total URLs.

Apply the 4-Tier Source Quality Framework:
- TIER 1 (Gold): BBC, ESPN, CNN, NYT, Reuters, USA Today, major sports networks
- TIER 2 (Strong): Industry publications (MMA Junkie, Variety, Billboard), regional major outlets
- TIER 3 (Supplementary): Niche publications, established blogs
- TIER 4 (AVOID): Social media, self-published, Wikipedia text

Your task: Find 15-20 Tier 1-2 media sources featuring the beneficiary.

CRITICAL:
- Better to have 10 Tier 1 sources than 30 Tier 3 sources
- MMA Junkie (USA Today Sports) = Tier 1 for combat sports
- Articles must be ABOUT the beneficiary, not just mentioning them
- Include expert commentary where possible
- Search for interviews, profiles, feature articles
- Look for award announcements, competition coverage
- Find video content with transcripts if available

UPLOADED DOCUMENTS INTEGRATION:
- Check for any media mentions in uploaded docs
- Search for publications/outlets mentioned
- Verify any press coverage claims
- Use org names from docs as search terms

Return results as JSON array.
```

---

## User Prompt Template

```
Conduct Phase 3 media research for:

**Name:** ${beneficiaryInfo.fullName}
**Field:** ${titleAnalysis.domain}
**Visa Type:** ${beneficiaryInfo.visaType}

UPLOADED DOCUMENTS - Media Mentions Found:
${extractedMediaMentionsFromDocs}

Find 15-20 TIER 1-2 media sources with coverage of the beneficiary's achievements.

Already found ${existingSources.length} sources in Phases 1-2. Find NEW media coverage.

SEARCH DEEPLY - we need 50-70 total URLs. This is the final push for quality sources.

Search for:
1. Feature articles and profiles
2. Interview coverage
3. Award announcement articles
4. Competition/event coverage
5. Expert commentary mentioning beneficiary
6. Video content with transcripts
7. Podcast appearances (with show notes)
```

---

## Expected Output Structure

```json
[
  {
    "url": "https://www.bbc.com/sport/article/123456",
    "title": "Fighter Name wins championship in dominant fashion",
    "source_name": "BBC Sport",
    "tier": 1,
    "criteria": ["Published Material", "Awards"],
    "key_content": "In-depth coverage of championship victory, includes quotes from coaches and analysts",
    "date_published": "2024-02-20",
    "evidence_type": "News Article"
  }
]
```

---

## Publication Tier Classification

### TIER 1 - GOLD STANDARD (Target: 10+ sources)

**Major International/National Media:**
- ESPN, BBC, CNN, New York Times (NYT), Wall Street Journal (WSJ)
- Reuters, AP (Associated Press), USA Today
- The Guardian, The Times, Telegraph
- Forbes, Bloomberg, Time Magazine

**Major Sports Networks:**
- Fox Sports, NBC Sports, CBS Sports, Sky Sports, Eurosport
- TNT Sports, beIN Sports

**Major Entertainment:**
- Variety, Hollywood Reporter, Billboard, Rolling Stone
- Pitchfork, NME, Entertainment Weekly

**Major Tech:**
- TechCrunch, Wired, The Verge, Ars Technica

**Weight:** Premium (Highest)
**Reach:** Millions (national/international audiences)
**Use:** Primary evidence, strongest weight with USCIS

### TIER 2 - STRONG/INDUSTRY (Target: 5-10 sources)

**Official League/Federation Sources:**
- UFC.com, NBA.com, FIFA.com, ATP Tour, WTA
- PGA Tour, MLB.com, NFL.com, NHL.com
- Olympic.org, ISU, FIBA

**Industry Publications:**
- MMA Junkie (USA Today Sports), Sherdog, Tapology
- The Athletic, Bleacher Report, SB Nation
- ESPN+ exclusive content

**Regional Major Outlets:**
- LA Times, Chicago Tribune, Washington Post
- Boston Globe, Miami Herald, San Francisco Chronicle
- Toronto Star, Sydney Morning Herald

**Weight:** High
**Reach:** Hundreds of thousands (industry-specific)
**Use:** Strong supporting evidence

### TIER 3 - SUPPLEMENTARY (Target: 2-5 max)

**Niche Publications:**
- Specialist blogs with editorial standards
- Industry newsletters
- Academic journals (non-indexed)

**Local Media:**
- Local newspapers, regional TV stations
- City magazines

**Weight:** Moderate
**Reach:** Thousands to tens of thousands
**Use:** Supporting context only

---

## Field-Specific Tier 1-2 Sources

### MMA/Combat Sports (find 8-12 from these)
- **Tier 1:** ESPN MMA, BBC Sport, FOX Sports, USA Today
- **Tier 2:** UFC.com, Sherdog, MMA Junkie, Tapology, MMA Fighting, Bloody Elbow

### Tennis (find 8-10 from these)
- **Tier 1:** ESPN, BBC Sport, Eurosport, Sports Illustrated
- **Tier 2:** ATP Tour, WTA, Tennis.com, Tennis Explorer, Tennis World

### Soccer/Football (find 8-12 from these)
- **Tier 1:** ESPN, BBC Sport, Sky Sports, The Athletic
- **Tier 2:** FIFA.com, UEFA.com, Transfermarkt, WhoScored, FourFourTwo

### Cricket (find 6-10 from these)
- **Tier 1:** ESPN Cricinfo, BBC Sport, Sky Sports
- **Tier 2:** ICC, national cricket boards, Cricbuzz, Wisden

### Basketball (find 8-10 from these)
- **Tier 1:** ESPN, TNT, Sports Illustrated, The Athletic
- **Tier 2:** NBA.com, Basketball Reference, Bleacher Report, FIBA

### Business/Tech (find 8-12 from these)
- **Tier 1:** WSJ, Forbes, Bloomberg, TechCrunch, Wired
- **Tier 2:** Business Insider, Fast Company, VentureBeat, Crunchbase News

### Music/Entertainment (find 8-12 from these)
- **Tier 1:** Billboard, Rolling Stone, Variety, Pitchfork, NME
- **Tier 2:** Grammy.com, Consequence of Sound, Stereogum, Complex

### Science/Academia (find 6-8 from these)
- **Tier 1:** Nature, Science, major university press, New Scientist
- **Tier 2:** Google Scholar indexed journals, ResearchGate, institutional press

---

## Media Coverage Quality Assessment

### What Makes Good Coverage

| Factor | Strong (Use) | Weak (Avoid) |
|--------|--------------|--------------|
| Focus | Beneficiary is primary subject | Brief mention in larger article |
| Depth | In-depth profile or feature (500+ words) | Short news item (<100 words) |
| Author | Named journalist with credentials | Staff report, no byline |
| Quotes | Direct quotes from/about beneficiary | No quotes |
| Context | Achievement in broader context | Just bare facts |
| Media | Photos, video, embedded content | Text only |

### Key Questions for Each Article

1. Is the article primarily ABOUT the beneficiary?
2. Does it discuss their achievements in detail?
3. Is it from a major/recognized publication?
4. Can we verify circulation/reach data?
5. Is the publication date verifiable?
6. Does it include quotes or expert commentary?

---

## Video/Podcast Content

### Video Sources (with transcripts)
- YouTube official channels
- ESPN video archives
- BBC Sport video
- Official league highlight packages

### Podcast Appearances
- Major sports podcasts (ESPN pods, The Athletic pods)
- Industry podcasts with show notes
- Interview podcasts with transcripts

**NOTE:** Video/podcast content counts if there's a verifiable transcript or detailed show notes.

---

## Reach Estimates Reference

| Publication | Monthly Visitors | Tier |
|-------------|------------------|------|
| ESPN | ~150M | Tier 1 |
| BBC Sport | ~100M | Tier 1 |
| CNN | ~200M | Tier 1 |
| NYT | ~100M | Tier 1 |
| Forbes | ~80M | Tier 1 |
| TechCrunch | ~15M | Tier 1 |
| UFC.com | ~50M | Tier 2 |
| MMA Junkie | ~10M | Tier 2 |
| The Athletic | ~5M | Tier 2 |
| Sherdog | ~5M | Tier 2 |
| Regional papers | 100K-1M | Tier 3 |
| Niche blogs | 10K-100K | Tier 3 |

---

## Quality Over Quantity Rule

**CRITICAL:** 10 Tier 1 sources > 50 Tier 3 sources

When prioritizing sources:
1. Always lead with Tier 1 coverage
2. Use Tier 2 for depth and specialization
3. Include Tier 3 only for completeness
4. Never pad with Tier 3 to inflate numbers

---

## Uploaded Documents Integration

BEFORE searching, check uploaded documents for:

1. **Media outlets mentioned:**
   - Search those outlets directly
   - Find other articles from same outlets

2. **Events/competitions covered:**
   - Search for event coverage
   - Find results announcements

3. **Awards mentioned:**
   - Search for award ceremony coverage
   - Find winner announcements

4. **Organizations named:**
   - Search for org press releases
   - Find news coverage of org

---

## API Configuration

- **Model:** sonar
- **Max Tokens:** 6,000
- **Temperature:** 0.2
- **Searches:** Multiple queries to reach 15-20 new sources
