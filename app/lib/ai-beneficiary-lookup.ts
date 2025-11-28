import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface BeneficiarySource {
  url: string;
  title: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  category?: string;
}

export interface BeneficiaryLookupResult {
  sources: BeneficiarySource[];
  searchStrategy: string;
  totalFound: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * AI-powered beneficiary lookup with LIBERAL search strategy
 * Fixes the "no results found" issue from previous versions
 *
 * Based on Claude's recommendations for comprehensive URL discovery
 */
export async function lookupBeneficiary(
  name: string,
  profession: string,
  additionalInfo?: string
): Promise<BeneficiaryLookupResult> {
  const prompt = `You are a research assistant helping find online sources about a person for visa petition evidence.

TASK: Find 10-15 verifiable URLs about this person.

BENEFICIARY INFORMATION:
- Name: ${name}
- Profession: ${profession}
- Additional Context: ${additionalInfo || 'None provided'}

SEARCH STRATEGY:
1. Start with the MOST LIKELY variations:
   - Full name exact: "${name}"
   - Name + profession: "${name} ${profession}"
   - Name + common platforms in their field

2. Search these SOURCE TYPES (in priority order):
   - Wikipedia (if notable enough)
   - LinkedIn profile
   - Official team/company pages
   - Major sports databases (ESPN, NFL, UFC, etc.)
   - News articles (ESPN, Sports Illustrated, NYT, Washington Post, etc.)
   - Industry-specific databases (IMDb for entertainment, etc.)
   - Professional association pages
   - Social media profiles (Twitter/X, Instagram - official verified accounts)
   - YouTube interviews/features
   - University/college profiles
   - Award databases

3. For ATHLETES specifically, check:
   - ESPN player pages
   - Team official websites
   - Pro Football Reference / Basketball Reference / Baseball Reference / Hockey Reference
   - Draft profiles and scouting reports
   - News coverage of games/performances
   - Sports Illustrated features
   - Athletic.com articles
   - Local news coverage

4. For ENTERTAINERS specifically, check:
   - IMDb profiles
   - Spotify/Apple Music artist pages
   - Billboard charts/features
   - Record label pages
   - Festival lineups
   - Entertainment news (Variety, Hollywood Reporter)
   - Rotten Tomatoes/Metacritic

5. For SCIENTISTS/ACADEMICS specifically, check:
   - Google Scholar profiles
   - University faculty pages
   - ResearchGate/Academia.edu
   - PubMed author searches
   - Conference presentations
   - Research lab pages
   - Citations and publications

6. For BUSINESS PROFESSIONALS specifically, check:
   - LinkedIn profile
   - Company leadership pages
   - Forbes/Fortune mentions
   - Business news (WSJ, Bloomberg, Business Insider)
   - Press releases
   - Industry publications
   - Conference speaker profiles

IMPORTANT INSTRUCTIONS:
- Be LIBERAL in your search - include sources even if they might be about a different person with the same name (we can filter later)
- DO NOT return "no results found" unless you have genuinely exhausted ALL search strategies above
- For common names, include multiple potential matches and note the uncertainty in confidence level
- Include URLs even if you're only 60-70% confident they're the right person
- Return AT LEAST 10 URLs if the person has ANY online presence whatsoever
- If you find fewer than 10 URLs, explain what searches you attempted and why they didn't yield more results
- Prioritize recent sources (last 5 years) but include older notable achievements
- Include both primary sources (official pages) and secondary sources (news articles, features)

OUTPUT FORMAT:
Return a JSON object with this EXACT structure:
{
  "sources": [
    {
      "url": "https://example.com/article",
      "title": "Title of the page or article",
      "source": "Website name (e.g., ESPN, LinkedIn, Wikipedia)",
      "confidence": "high" or "medium" or "low",
      "description": "Brief 1-sentence description of what this source contains and why it's relevant",
      "category": "profile" or "news" or "achievement" or "publication" or "media"
    }
  ],
  "searchStrategy": "Brief explanation of what search approach you used",
  "totalFound": 12,
  "failedSearches": ["list of search strategies that didn't work, if any"]
}

CONFIDENCE LEVELS:
- "high": 90%+ confident this is the right person (official pages, verified profiles, direct mentions)
- "medium": 70-90% confident (news articles with matching details, likely same person)
- "low": 50-70% confident (common name, could be same person, needs verification)

If you genuinely cannot find ANY information after exhaustive searching (extremely rare), return:
{
  "sources": [],
  "searchStrategy": "Detailed explanation of all searches attempted",
  "totalFound": 0,
  "failedSearches": ["all the specific search strategies you tried"]
}

BEGIN YOUR COMPREHENSIVE SEARCH NOW:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.3, // Slightly creative but consistent
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and structure the result
    const sources: BeneficiarySource[] = result.sources || [];

    // Calculate confidence distribution
    const confidenceDistribution = {
      high: sources.filter(s => s.confidence === 'high').length,
      medium: sources.filter(s => s.confidence === 'medium').length,
      low: sources.filter(s => s.confidence === 'low').length,
    };

    return {
      sources,
      searchStrategy: result.searchStrategy || 'Comprehensive multi-source search',
      totalFound: sources.length,
      confidenceDistribution,
    };
  } catch (error) {
    console.error('Error in AI beneficiary lookup:', error);

    // Return empty result with error info instead of throwing
    return {
      sources: [],
      searchStrategy: `Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
      totalFound: 0,
      confidenceDistribution: { high: 0, medium: 0, low: 0 },
    };
  }
}

/**
 * Deduplicate URLs from multiple sources
 */
export function deduplicateUrls(sources: BeneficiarySource[]): BeneficiarySource[] {
  const seen = new Set<string>();
  const deduplicated: BeneficiarySource[] = [];

  for (const source of sources) {
    // Normalize URL (remove trailing slash, lowercase domain)
    const normalizedUrl = source.url.toLowerCase().replace(/\/$/, '');

    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      deduplicated.push(source);
    }
  }

  return deduplicated;
}

/**
 * Filter sources by minimum confidence level
 */
export function filterByConfidence(
  sources: BeneficiarySource[],
  minConfidence: 'low' | 'medium' | 'high' = 'low'
): BeneficiarySource[] {
  const confidenceLevels = { low: 1, medium: 2, high: 3 };
  const threshold = confidenceLevels[minConfidence];

  return sources.filter(
    source => confidenceLevels[source.confidence] >= threshold
  );
}
