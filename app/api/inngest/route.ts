import { serve } from 'inngest/next';
import { inngest } from '@/app/lib/inngest/client';
import { inngestFunctions } from '@/app/lib/inngest/functions';

/**
 * Inngest API route handler
 *
 * This serves the Inngest functions and handles webhooks from Inngest.
 * The functions can run for hours without timeout issues.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
