# Publication Tier Classification System

**Source:** mega-internal-v1-visa-generation-tool/app/lib/document-generator.ts

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
- ESPN
- BBC
- CNN
- New York Times (NYT)
- Wall Street Journal (WSJ)
- Reuters
- AP (Associated Press)
- USA Today

### Major Sports Networks
- Fox Sports
- NBC Sports
- CBS Sports
- Sky Sports
- Eurosport

---

## TIER 2 - STRONG/INDUSTRY

**Weight:** High
**Reach:** Hundreds of thousands (industry-specific)
**Use:** Strong supporting evidence

### Official League/Federation Sources
- UFC.com
- NBA.com
- FIFA.com
- ATP Tour
- WTA
- PGA Tour
- MLB.com
- NFL.com
- NHL.com

### Industry Publications
- MMA Junkie (USA Today Sports)
- Sherdog
- Tapology
- The Athletic
- Bleacher Report
- SB Nation
- ESPN+

### Regional Major Outlets
- LA Times
- Chicago Tribune
- Washington Post
- Boston Globe
- Miami Herald

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

---

## Analysis Rules

1. **Smart Filtering**: If >60 URLs, filter to top 60 by quality tier
2. **Audience Overlap**: ESPN fans likely also visit UFC.com - account for this
3. **Quality > Quantity**: 3 Tier 1 sources > 20 Tier 3 sources
4. **Conservative Estimates**: Use verifiable reach numbers
5. **Profile Assessment**:
   - Top-heavy (mostly Tier 1-2) → STRONG case
   - Bottom-heavy (mostly Tier 3) → NEEDS WORK
   - Balanced mix → Evaluate Tier 1-2 depth
