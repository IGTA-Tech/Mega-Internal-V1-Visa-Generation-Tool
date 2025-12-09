import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const allEnvKeys = Object.keys(process.env).sort();
  const supabaseKeys = allEnvKeys.filter(k => k.includes('SUPABASE'));
  const publicKeys = allEnvKeys.filter(k => k.startsWith('NEXT_PUBLIC_'));
  
  // Check for the specific variables we need
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
    },
    supabase: {
      hasUrl: hasSupabaseUrl,
      hasKey: hasSupabaseKey,
      urlValue: hasSupabaseUrl ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50)}...` : null,
      keyValue: hasSupabaseKey ? `${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...` : null,
    },
    allSupabaseKeys: supabaseKeys,
    allPublicKeys: publicKeys,
    totalEnvVars: allEnvKeys.length,
    // Show first 50 env keys (to avoid huge response)
    sampleEnvKeys: allEnvKeys.slice(0, 50),
    // Show all keys that might be related
    relatedKeys: allEnvKeys.filter(k => 
      k.includes('SUPABASE') || 
      k.includes('DATABASE') || 
      (k.includes('URL') && k.includes('SUPABASE'))
    ),
  }, {
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}

