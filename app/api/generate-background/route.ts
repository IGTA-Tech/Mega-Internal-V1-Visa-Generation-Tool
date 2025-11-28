import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  retryWithBackoff,
  createFallbackBackground,
  logError,
} from '@/app/lib/retry-helper';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 60000, // 60 seconds
  maxRetries: 2,
});

interface UrlSource {
  url: string;
  title?: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, profession, visaType, urls } = body;

    // Validate required fields
    if (!fullName || !profession || !visaType) {
      return NextResponse.json(
        { error: 'Full name, profession, and visa type are required' },
        { status: 400 }
      );
    }

    // Create a concise prompt for background generation
    const urlContext = urls && urls.length > 0
      ? `\n\nREFERENCE SOURCES:\n${urls.slice(0, 5).map((url: UrlSource) => `- ${url.title || url.url}: ${url.description || ''}`).join('\n')}`
      : '';

    const prompt = `Generate a professional 2-3 paragraph background summary for a visa petition (${visaType}) for ${fullName}, a ${profession}.

${urlContext}

The background should:
1. Introduce who they are and their field
2. Highlight their most notable achievements, credentials, or recognition
3. Explain their significance in their field
4. Be professional, factual, and suitable for USCIS immigration petition

Keep it concise (150-250 words) and authoritative. Write in third person.`;

    console.log(`[GenerateBackground] Generating for ${fullName}`);

    const response = await retryWithBackoff(
      () =>
        anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      {
        maxRetries: 3,
        initialDelay: 1000,
      }
    );

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    console.log(`[GenerateBackground] Successfully generated background`);

    return NextResponse.json({
      success: true,
      background: content.text.trim(),
    });
  } catch (error) {
    logError('generate-background', error, { fullName, profession, visaType });

    // Return fallback background instead of error
    const fallbackBackground = createFallbackBackground(fullName, profession, visaType);

    console.log('[GenerateBackground] Using fallback background');

    return NextResponse.json({
      success: true,
      background: fallbackBackground,
      warning: 'Generated using fallback mode due to service interruption',
    });
  }
}
