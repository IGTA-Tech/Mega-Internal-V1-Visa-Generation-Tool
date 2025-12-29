# Source Tier Classification System

**Source:** mega-internal-v1-visa-generation-tool/app/lib/document-generator.ts + mega-visa-petition-generator-v4/app/lib/ai/perplexity-research.ts

**Purpose:** Comprehensive guide for classifying evidence sources by quality tier.

---

## Tier Classification Logic

```typescript
const getTierNumber = (tier: string): number => {
  if (tier === 'Major Media') return 1;
  if (tier === 'Trade Publication') return 2;
  if (tier === 'Online Media') return 3;
  return 4; // Unknown
};
```

---

## TIER 1 - GOLD STANDARD

**Weight:** Premium (Highest)
**Reach:** Millions (national/international audiences)
**Use:** Primary evidence, strongest weight with USCIS

### Major International/National Media
| Publication | Type | Est. Monthly Visitors |
|-------------|------|----------------------|
| ESPN | Sports | ~150M |
| BBC | News/Sports | ~100M |
| CNN | News | ~200M |
| New York Times (NYT) | News | ~100M |
| Wall Street Journal (WSJ) | Business | ~80M |
| Reuters | News | ~60M |
| AP (Associated Press) | News Wire | ~50M |
| USA Today | News | ~80M |

### Major Sports Networks
| Publication | Type | Est. Monthly Visitors |
|-------------|------|----------------------|
| Fox Sports | Sports | ~80M |
| NBC Sports | Sports | ~60M |
| CBS Sports | Sports | ~50M |
| Sky Sports | Sports (UK) | ~40M |
| Eurosport | Sports (EU) | ~30M |

---

## TIER 2 - STRONG/INDUSTRY

**Weight:** High
**Reach:** Hundreds of thousands (industry-specific)
**Use:** Strong supporting evidence

### Official League/Federation Sources
| Publication | Sport/Field | Est. Monthly Visitors |
|-------------|-------------|----------------------|
| UFC.com | MMA | ~50M |
| NBA.com | Basketball | ~40M |
| FIFA.com | Soccer | ~60M |
| ATP Tour | Tennis | ~15M |
| WTA | Tennis | ~10M |
| PGA Tour | Golf | ~20M |
| MLB.com | Baseball | ~30M |
| NFL.com | Football | ~50M |
| NHL.com | Hockey | ~15M |

### Industry Publications
| Publication | Field | Est. Monthly Visitors |
|-------------|-------|----------------------|
| MMA Junkie (USA Today Sports) | MMA | ~10M |
| Sherdog | MMA | ~5M |
| Tapology | MMA | ~3M |
| The Athletic | Sports | ~10M |
| Bleacher Report | Sports | ~30M |
| SB Nation | Sports | ~20M |
| ESPN+ | Sports Streaming | ~25M |

### Regional Major Outlets
| Publication | Region | Est. Monthly Visitors |
|-------------|--------|----------------------|
| LA Times | West Coast | ~20M |
| Chicago Tribune | Midwest | ~15M |
| Washington Post | East Coast | ~50M |
| Boston Globe | Northeast | ~10M |
| Miami Herald | Southeast | ~8M |

---

## TIER 3 - SUPPLEMENTARY

**Weight:** Moderate
**Reach:** Thousands to tens of thousands
**Use:** Supporting context, not primary evidence

### Niche Publications
- Specialist blogs with editorial standards
- Industry newsletters
- Academic journals (non-indexed)

### Local Media
- Local newspapers
- Regional TV stations
- City magazines

### Digital-Only
- Established blogs
- Podcasts (with transcripts)
- YouTube channels (documented)

**Est. Reach:** 10K-100K monthly visitors

---

## TIER 4 - AVOID (Do Not Use)

**Weight:** None
**Reach:** Variable
**Use:** DO NOT include in petition

### Never Use
- Social media posts (Facebook, Twitter, Instagram)
- Wikipedia text (use external links only)
- Self-published content
- Press releases without independent coverage
- Unverified blogs
- Comment sections
- Fan forums

---

## Field-Specific Tier 1-2 Sources

### MMA/Combat Sports
- **Tier 1:** ESPN MMA, BBC Sport, FOX Sports
- **Tier 2:** UFC.com, Sherdog, MMA Junkie, Tapology, MMA Fighting

### Tennis
- **Tier 1:** ESPN, BBC Sport, Eurosport
- **Tier 2:** ATP Tour, WTA, Tennis.com, Tennis Explorer

### Soccer/Football
- **Tier 1:** ESPN, BBC Sport, Sky Sports
- **Tier 2:** FIFA.com, UEFA.com, Transfermarkt, WhoScored

### Cricket
- **Tier 1:** ESPN Cricinfo, BBC Sport
- **Tier 2:** ICC, national cricket boards, Cricbuzz

### Basketball
- **Tier 1:** ESPN, TNT, Sports Illustrated
- **Tier 2:** NBA.com, Basketball Reference, The Athletic

### Business/Tech
- **Tier 1:** WSJ, Forbes, Bloomberg, TechCrunch
- **Tier 2:** Industry journals, Business Insider, Fast Company

### Science/Academia
- **Tier 1:** Nature, Science, major university press
- **Tier 2:** Google Scholar indexed journals, ResearchGate

### Arts/Entertainment
- **Tier 1:** Variety, Billboard, Hollywood Reporter
- **Tier 2:** IMDb, Rotten Tomatoes, specialized trade publications

---

## Analysis Rules

### 1. Smart Filtering
If >60 URLs, filter to top 60 by quality tier

### 2. Audience Overlap
ESPN fans likely also visit UFC.com - account for this when calculating reach

### 3. Quality > Quantity
**CRITICAL:** 3 Tier 1 sources > 20 Tier 3 sources

### 4. Conservative Estimates
Use verifiable reach numbers; don't inflate

### 5. Profile Assessment

| Profile Type | Distribution | Assessment |
|--------------|--------------|------------|
| Top-heavy | Mostly Tier 1-2 | STRONG case |
| Bottom-heavy | Mostly Tier 3 | NEEDS WORK |
| Balanced mix | Mixed | Evaluate Tier 1-2 depth |

---

## Tier Determination Checklist

For each source, ask:

1. **Is it a major national/international outlet?**
   - Yes → Tier 1
   - No → Continue

2. **Is it an official league/federation source?**
   - Yes → Tier 2
   - No → Continue

3. **Is it a recognized industry publication?**
   - Yes → Tier 2
   - No → Continue

4. **Is it a major regional outlet?**
   - Yes → Tier 2
   - No → Continue

5. **Does it have editorial standards and verifiable traffic?**
   - Yes → Tier 3
   - No → Tier 4 (Avoid)

---

## Documentation Requirements by Tier

### Tier 1 Sources
- Full article capture
- Publication date
- Author name (if available)
- Archive.org link
- Circulation/traffic data (if available)

### Tier 2 Sources
- Full article capture
- Publication date
- Source credibility statement
- Archive.org link

### Tier 3 Sources
- Full article capture
- Explanation of source relevance
- Corroborating evidence from higher-tier sources

---

## Aggregate Reach Calculation

When calculating total reach:

1. **Start with Tier 1 totals** (highest weight)
2. **Add Tier 2 with 50% reduction** (account for overlap)
3. **Add Tier 3 with 25% weight** (supplementary only)
4. **Never exceed 500M total unique reach** (realistic cap)

### Formula
```
Adjusted Reach = (Tier1 * 1.0) + (Tier2 * 0.5) + (Tier3 * 0.25)
```

---

## Usage in Documents

### Document 2: Publication Analysis
- Organize all sources by tier
- Spend more pages on Tier 1-2 sources
- Provide tier summary table

### Document 3: URL Reference
- Tag each URL with tier classification
- Sort by tier (highest first)
- Include credibility assessment

### Document 9: Officer Rating
- Evaluate tier distribution critically
- Flag if bottom-heavy (mostly Tier 3)
- Recommend improvements for tier balance
