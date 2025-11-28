import { NextRequest, NextResponse } from 'next/server';
import { lookupBeneficiary } from '@/app/lib/ai-beneficiary-lookup';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, profession, additionalInfo } = body;

    // Validate required fields
    if (!name || !profession) {
      return NextResponse.json(
        { error: 'Name and profession are required' },
        { status: 400 }
      );
    }

    // Perform AI beneficiary lookup
    const result = await lookupBeneficiary(name, profession, additionalInfo);

    return NextResponse.json({
      success: true,
      sources: result.sources,
      searchStrategy: result.searchStrategy,
      totalFound: result.totalFound,
      confidenceDistribution: result.confidenceDistribution,
      verificationData: result.verificationData,
    });
  } catch (error: any) {
    console.error('Error in lookup-beneficiary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lookup beneficiary' },
      { status: 500 }
    );
  }
}
