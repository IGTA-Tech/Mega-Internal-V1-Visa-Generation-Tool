# Issues Found & Fixes Required

**Date**: November 28, 2025
**Test Case**: Alex Hale - Professional NFL Kicker (should be O-1A, not P-1A)

---

## 🔴 CRITICAL ISSUES

### Issue 1: Database Schema Missing EB-2 NIW Visa Type

**Location**: `database/schema.sql:18`

**Problem**:
```sql
visa_type TEXT NOT NULL CHECK (visa_type IN ('O-1A', 'O-1B', 'P-1A', 'EB-1A')),
```

But the UI offers:
- O-1A ✅
- O-1B ✅
- EB-1A ✅
- **EB-2 NIW** ❌ (will fail database check)
- P-1A ✅

**Fix Required**:
```sql
visa_type TEXT NOT NULL CHECK (visa_type IN ('O-1A', 'O-1B', 'P-1A', 'EB-1A', 'EB-2 NIW')),
```

**Impact**: Any case with EB-2 NIW will fail to insert into database

---

### Issue 2: Database Schema Missing Exhibit Tracking Columns

**Location**: `database/schema.sql` - `petition_cases` table

**Problem**: API route `/api/generate-exhibits/route.ts` tries to update these columns:
```typescript
await supabase
  .from('petition_cases')
  .update({
    status: 'generating_exhibits',
    exhibit_generation_progress: progress,  // ❌ Column doesn't exist
    exhibit_package_url: exhibitPackage.combinedPdfUrl,  // ❌ Column doesn't exist
    exhibit_toc_url: exhibitPackage.tableOfContentsUrl,  // ❌ Column doesn't exist
    total_exhibits: exhibitPackage.totalExhibits,  // ❌ Column doesn't exist
  })
```

But the database table only has:
```sql
status TEXT NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'researching', 'generating', 'completed', 'failed')),
```

**Fix Required**: Add columns to `petition_cases` table:
```sql
-- Add to petition_cases table
exhibit_generation_progress INTEGER DEFAULT 0 CHECK (exhibit_generation_progress >= 0 AND exhibit_generation_progress <= 100),
exhibit_package_url TEXT,
exhibit_toc_url TEXT,
total_exhibits INTEGER DEFAULT 0,
```

Also update status check:
```sql
status TEXT NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'researching', 'generating', 'generating_exhibits', 'completed', 'failed', 'exhibit_generation_failed')),
```

**Impact**: Exhibit generation will fail when trying to update non-existent columns

---

### Issue 3: Database Table Name Mismatch for Files

**Location**: API route `/api/upload/route.ts:84`

**Problem**: API tries to insert into `case_files`:
```typescript
await supabase.from('case_files').insert({
```

But database schema has table named `case_files` with different column names:
- API expects: `file_name`, `file_type`, `file_size`, `storage_path`, `storage_url`, `extracted_text`, `page_count`, `uploaded_at`
- Database has: `filename`, `file_type`, `file_size_bytes`, `mime_type`, `storage_path`, `storage_url`, `extracted_text`, `word_count`, `uploaded_at`

**Fix Required**: Either:
1. Update API to match database columns, OR
2. Update database to match API expectations

**Recommended**: Update API route to match existing database schema

---

### Issue 4: Database Table Name Mismatch for Exhibits

**Location**: API route `/api/generate-exhibits/route.ts:56`

**Problem**: API tries to insert into `case_exhibits`:
```typescript
await supabase.from('case_exhibits').insert(exhibitRecords);
```

But database schema has table named `exhibit_pdfs`, not `case_exhibits`

**Fix Required**: Change API route to use correct table name `exhibit_pdfs`

Also verify column names match:
- API uses: `exhibit_number`, `exhibit_label`, `source_url`, `pdf_url`, `archive_url`, `page_count`, `file_size`
- Database has: `exhibit_number`, `exhibit_title`, `source_url`, `archive_url`, `pdf_storage_path`, `pdf_storage_url`, `pdf_size_bytes`

---

## ⚠️ MEDIUM ISSUES

### Issue 5: Missing `primaryUrls` Field in BeneficiaryInfo

**Location**: `app/lib/document-generator.ts:126`

**Problem**: Code references `beneficiaryInfo.primaryUrls`:
```typescript
const enrichedBeneficiaryInfo = {
  ...beneficiaryInfo,
  primaryUrls: urls.map((u: any) => u.url || u),
  urls: urls,
};
```

But `BeneficiaryInfo` type doesn't have `primaryUrls` field

**Fix Required**: Add to `app/types.ts`:
```typescript
export interface BeneficiaryInfo {
  // ... existing fields
  primaryUrls?: string[]; // Array of primary URL strings
  urls?: any[]; // Full URL objects with metadata
}
```

**Impact**: TypeScript compilation error (if strict mode)

---

### Issue 6: Missing `uploadedFiles` Field in BeneficiaryInfo

**Location**: `app/lib/document-generator.ts:241`

**Problem**: Code references `beneficiaryInfo.uploadedFiles`:
```typescript
filesProcessed: beneficiaryInfo.uploadedFiles?.length || 0,
```

But `BeneficiaryInfo` type doesn't have `uploadedFiles` field

**Fix Required**: Add to `app/types.ts`:
```typescript
export interface BeneficiaryInfo {
  // ... existing fields
  uploadedFiles?: UploadedFile[];
}
```

---

## 🟡 MINOR ISSUES

### Issue 7: Inconsistent Visa Type in Documentation

**Location**: `IMPLEMENTATION_COMPLETE.md:458`

**Problem**: Documentation says test with:
> Test Case: Alex Hale (NFL Kicker)
> Visa Type: P-1A

But user corrected this should be **O-1A** (NFL kickers qualify for O-1A for extraordinary ability in athletics, not P-1A which is for teams)

**Fix Required**: Update all documentation to use O-1A for Alex Hale

---

### Issue 8: Storage Bucket Names Inconsistency

**Location**: Multiple files

**Problem**: Different bucket names used in different places:
- Schema comments: `petition-documents`, `uploaded-files`, `exhibit-pdfs`
- API route: `petition-files`

**Fix Required**: Standardize bucket names across all files

---

## 📝 WHAT'S ACTUALLY WORKING

### ✅ Working Components:

1. **Environment Setup**: All API keys configured in `.env.local`
2. **Dependencies**: All npm packages installed
3. **Core Library Files**: All exist and are implemented:
   - `ai-beneficiary-lookup.ts` ✅
   - `smart-autofill.ts` ✅
   - `exhibit-generator.ts` ✅
   - `document-generator.ts` ✅
   - `perplexity-research.ts` ✅
   - `file-processor.ts` ✅
   - etc.

4. **API Routes Structure**: All 7 routes created with correct logic
5. **Form UI**: Complete 6-step wizard component
6. **TypeScript Types**: Mostly complete (just need additions)

---

## 🔧 FIXES TO APPLY

### Fix 1: Update Database Schema

**File**: `database/schema.sql`

**Changes**:
1. Add EB-2 NIW to visa_type check
2. Add exhibit tracking columns to petition_cases
3. Update status check to include exhibit statuses

### Fix 2: Fix API Route Column Names

**File**: `app/api/upload/route.ts`

**Changes**:
1. Change `file_name` → `filename`
2. Change `file_size` → `file_size_bytes`
3. Add `mime_type` field
4. Remove `page_count` (database uses `word_count`)

**File**: `app/api/generate-exhibits/route.ts`

**Changes**:
1. Change table name `case_exhibits` → `exhibit_pdfs`
2. Change `exhibit_label` → `exhibit_title`
3. Change `pdf_url` → `pdf_storage_url`
4. Change `file_size` → `pdf_size_bytes`
5. Remove `page_count` if not in schema

### Fix 3: Update TypeScript Types

**File**: `app/types.ts`

**Changes**:
1. Add `primaryUrls?: string[]` to BeneficiaryInfo
2. Add `urls?: any[]` to BeneficiaryInfo
3. Add `uploadedFiles?: UploadedFile[]` to BeneficiaryInfo
4. Add EB-2 NIW to VisaType union

---

## 🚀 PRIORITY ORDER

### MUST FIX BEFORE TESTING:

1. **Database Schema** - Add missing columns and visa type (5 min)
2. **API Routes** - Fix column name mismatches (10 min)
3. **TypeScript Types** - Add missing fields (2 min)

### SHOULD FIX:

4. **Documentation** - Update Alex Hale visa type to O-1A (1 min)
5. **Storage Buckets** - Standardize names (5 min)

---

## 📋 TESTING CHECKLIST (After Fixes)

Once fixes are applied:

### Database Setup:
- [ ] Run updated schema.sql in Supabase
- [ ] Verify all tables exist
- [ ] Verify petition-files storage bucket exists

### API Testing:
- [ ] POST /api/lookup-beneficiary works
- [ ] POST /api/smart-autofill works
- [ ] POST /api/generate creates case successfully
- [ ] GET /api/progress/[caseId] returns data
- [ ] POST /api/upload stores files correctly
- [ ] POST /api/generate-exhibits creates exhibits
- [ ] GET /api/download/[caseId] downloads documents

### End-to-End Test:
- [ ] Alex Hale test case:
  - Name: Alex Hale
  - Profession: Professional NFL Kicker
  - Visa Type: **O-1A** (extraordinary ability in athletics)
  - Brief Type: Standard
  - Expected: 15-20 page brief focusing on NFL statistics, media coverage, team participation

---

## 💡 RECOMMENDATIONS

### Before Running npm run dev:

1. Apply all MUST FIX items
2. Create storage buckets in Supabase:
   - `petition-files` (public: false)
3. Run TypeScript compiler to catch any remaining type errors:
   ```bash
   npx tsc --noEmit
   ```

### For Production:

1. Add proper error boundaries in UI
2. Add loading states for all async operations
3. Add form validation
4. Add CORS configuration if needed
5. Add rate limiting on API routes
6. Add proper logging (Winston, Pino, etc.)

---

## 🎯 SUMMARY

**Total Critical Issues**: 4
**Total Medium Issues**: 2
**Total Minor Issues**: 2

**Estimated Fix Time**: ~20 minutes

**Next Steps**:
1. Apply fixes (I'll do this now)
2. Run TypeScript compilation check
3. Start dev server
4. Test with Alex Hale O-1A case

