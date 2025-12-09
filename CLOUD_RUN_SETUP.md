# Cloud Run Environment Variables Setup

## Issue
The application requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be available at runtime.

## Two Ways to Set Environment Variables in Cloud Run

### Option 1: Using Google Secret Manager (Recommended for Production)

1. Create secrets in Secret Manager:
   ```bash
   gcloud secrets create NEXT_PUBLIC_SUPABASE_URL --data-file=- <<< "https://your-project.supabase.co"
   gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=- <<< "your-service-role-key"
   ```

2. Grant Cloud Run service account access:
   ```bash
   # Get your service account email
   SERVICE_ACCOUNT=$(gcloud run services describe mega-visa-tool --region=us-central1 --format="value(spec.template.spec.serviceAccountName)")
   
   # Grant access
   gcloud secrets add-iam-policy-binding NEXT_PUBLIC_SUPABASE_URL \
     --member="serviceAccount:${SERVICE_ACCOUNT}" \
     --role="roles/secretmanager.secretAccessor"
   
   gcloud secrets add-iam-policy-binding SUPABASE_SERVICE_ROLE_KEY \
     --member="serviceAccount:${SERVICE_ACCOUNT}" \
     --role="roles/secretmanager.secretAccessor"
   ```

3. The `cloudbuild.yaml` already uses `--set-secrets` to mount these secrets.

### Option 2: Using Regular Environment Variables (Easier for Testing)

If you've set environment variables directly in Cloud Run console, you need to update the deployment to use `--set-env-vars` instead of `--set-secrets` for these variables.

**Update `cloudbuild.yaml` line 38-41:**

Replace:
```yaml
- '--set-secrets'
- 'ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,...,NEXT_PUBLIC_SUPABASE_URL=NEXT_PUBLIC_SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,...'
- '--set-env-vars'
- 'NODE_ENV=production,MAX_FILES_PER_CASE=30,MAX_FILE_SIZE_MB=50,MAX_URLS_PER_CASE=100'
```

With:
```yaml
- '--set-secrets'
- 'ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,PERPLEXITY_API_KEY=PERPLEXITY_API_KEY:latest,LLAMA_CLOUD_API_KEY=LLAMA_CLOUD_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,MISTRAL_API_KEY=MISTRAL_API_KEY:latest,SENDGRID_API_KEY=SENDGRID_API_KEY:latest,SENDGRID_FROM_EMAIL=SENDGRID_FROM_EMAIL:latest,SENDGRID_REPLY_TO_EMAIL=SENDGRID_REPLY_TO_EMAIL:latest,API2PDF_API_KEY=API2PDF_API_KEY:latest'
- '--set-env-vars'
- 'NODE_ENV=production,MAX_FILES_PER_CASE=30,MAX_FILE_SIZE_MB=50,MAX_URLS_PER_CASE=100,NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY'
```

**OR** set them manually via Cloud Run console:
1. Go to Cloud Run → mega-visa-tool → Edit & Deploy New Revision
2. Go to "Variables & Secrets" tab
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
4. Deploy

## Verify Environment Variables

After deployment, check the logs. The application will log:
- Whether `NEXT_PUBLIC_SUPABASE_URL` is set
- Whether `SUPABASE_SERVICE_ROLE_KEY` is set
- All environment variables that contain "SUPABASE"

Look for log entries like:
```
[ProcessJob] Environment check: { ... }
[ProcessJob] NEXT_PUBLIC_SUPABASE_URL is set: https://...
[ProcessJob] SUPABASE_SERVICE_ROLE_KEY is set: eyJh...
```

## Troubleshooting

If you see "Supabase credentials are not configured":
1. Check Cloud Run logs for the environment check output
2. Verify the variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
3. Ensure there are no typos or extra spaces
4. If using secrets, verify the service account has `secretmanager.secretAccessor` role
5. If using env vars, verify they're set in the Cloud Run service configuration

