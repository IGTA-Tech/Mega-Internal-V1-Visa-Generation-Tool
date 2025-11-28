# What Is NOT Working - Current Status

**Date**: November 28, 2025
**Test**: Internal review before running dev server
**Status**: TypeScript compilation has 32 errors

---

## ✅ WHAT IS FIXED

1. **Database Schema** - All columns and constraints updated ✅
2. **API Route Column Names** - Matches database schema ✅
3. **TypeScript Core Types** - EB-2 NIW added, missing fields added ✅
4. **Exhibit Table Names** - Using correct `exhibit_pdfs` table ✅

---

## 🔴 WHAT IS NOT WORKING (TypeScript Errors)

### Error Category 1: Missing Dependencies

**Issue**: `pdf-parse` module not found
```
app/lib/file-processor.ts(3,26): error TS2307: Cannot find module 'pdf-parse'
```

**Fix**: Install missing package
```bash
npm install pdf-parse @types/pdf-parse
```

---

### Error Category 2: Missing Type Declarations

**Issue**: `api2pdf` has no type declarations
```
app/lib/exhibit-generator.ts(1,21): error TS7016: Could not find a declaration file for module 'api2pdf'
```

**Fix**: Either install types or create declaration file
```bash
npm install --save-dev @types/api2pdf
```
OR create `app/lib/api2pdf.d.ts`:
```typescript
declare module 'api2pdf';
```

---

### Error Category 3: Missing Fields in BeneficiaryInfo

**Errors**:
- `app/lib/document-generator.ts`: Property `'background'` does not exist
- `app/lib/document-generator.ts`: Property `'recipientEmail'` does not exist
- `app/lib/perplexity-research.ts`: Property `'jobTitle'` does not exist
- `app/lib/perplexity-research.ts`: Property `'occupation'` does not exist

**Fix**: Add missing fields to `BeneficiaryInfo` in `app/types.ts`:
```typescript
export interface BeneficiaryInfo {
  // ... existing fields
  background?: string; // Alias for backgroundInfo
  recipientEmail?: string; // Email for sending documents
  jobTitle?: string; // Alias for profession
  occupation?: string; // Alias for profession
}
```

---

### Error Category 4: Wrong Import Name

**Error**:
```
app/lib/document-generator.ts(2,37): error TS2724: '"../types"' has no exported member named 'UploadedFileData'. Did you mean 'UploadedFile'?
```

**Fix**: Change import from `UploadedFileData` to `UploadedFile`

---

### Error Category 5: FileName vs Filename Typo

**Error**:
```
app/lib/document-generator.ts(1577,56): error TS2551: Property 'fileName' does not exist on type 'UploadedFile'. Did you mean 'filename'?
```

**Fix**: Change `fileName` → `filename` in document-generator.ts

---

### Error Category 6: Missing EB-2 NIW in Knowledge Base

**Error**:
```
app/lib/knowledge-base.ts(13,7): error TS2741: Property '"EB-2 NIW"' is missing in type '{ 'O-1A': string[]; 'O-1B': string[]; 'P-1A': string[]; 'EB-1A': string[]; }'
```

**Fix**: Add EB-2 NIW criteria to knowledge-base.ts

---

### Error Category 7: Tier Type Mismatch

**Errors**:
```
app/lib/document-generator.ts(484,14): error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
app/lib/document-generator.ts(491,48): error TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
```

**Fix**: The `tier` field is being compared to numbers but might be typed as string. Need to ensure consistent typing (number vs string).

---

### Error Category 8: Function Signature Mismatch

**Error**:
```
app/api/generate-exhibits/route.ts(88,7): error TS2345: Argument of type '(stage: string, progress: number, message: string) => void' is not assignable to parameter of type '(stage: string, current: number, total: number) => void'.
```

**Fix**: The `onProgress` callback signature in exhibit-generator expects `(stage, current, total)` but we're passing `(stage, progress, message)`. Need to align signatures.

---

### Error Category 9: processFile Return Type

**Error**:
```
app/api/upload/route.ts(105,59): error TS2554: Expected 1 arguments, but got 2.
app/api/upload/route.ts(106,41): error TS2339: Property 'text' does not exist on type 'ProcessedFile'.
```

**Fix**: Check `file-processor.ts` to see what `processFile` actually returns and adjust API route accordingly.

---

### Error Category 10: Archive.org Type Issue

**Error**:
```
app/lib/archive-org.ts(46,7): error TS2322: Type '(url: string) => Promise<ArchivedUrl>' is not assignable to type 'string'.
```

**Fix**: Likely an incorrect export or type assignment in archive-org.ts

---

## 📊 ERROR SUMMARY

| Category | Count | Priority | Est. Fix Time |
|----------|-------|----------|---------------|
| Missing Dependencies | 1 | High | 2 min |
| Missing Type Declarations | 1 | Low | 2 min |
| Missing BeneficiaryInfo Fields | 7 | High | 5 min |
| Wrong Import Names | 1 | High | 1 min |
| Filename Typos | 1 | High | 1 min |
| Missing EB-2 NIW Data | 2 | High | 3 min |
| Type Mismatches | 5 | Medium | 10 min |
| Function Signature Mismatches | 1 | Medium | 5 min |
| ProcessFile Issues | 2 | Medium | 5 min |
| Archive.org Type Issues | 1 | Low | 3 min |
| **TOTAL** | **32** | | **~37 min** |

---

## 🚀 FIX PRIORITY ORDER

### MUST FIX NOW (Before Server Will Run):

1. **Install pdf-parse** (2 min)
   ```bash
   npm install pdf-parse
   ```

2. **Fix BeneficiaryInfo missing fields** (5 min)
   - Add: background, recipientEmail, jobTitle, occupation

3. **Fix import name** (1 min)
   - Change UploadedFileData → UploadedFile

4. **Fix filename typo** (1 min)
   - Change fileName → filename

5. **Add EB-2 NIW to knowledge base** (3 min)
   - Add criteria array for EB-2 NIW

### SHOULD FIX (For Proper TypeScript):

6. **Create api2pdf type declaration** (2 min)
7. **Fix tier type consistency** (10 min)
8. **Fix function signatures** (5 min)
9. **Fix processFile usage** (5 min)
10. **Fix archive.org types** (3 min)

---

## 🔧 RECOMMENDED APPROACH

### Option A: Quick Fix to Get Server Running (15 min)
1. Install pdf-parse
2. Fix BeneficiaryInfo fields
3. Fix import/filename typos
4. Add EB-2 NIW criteria
5. Add `// @ts-ignore` comments for remaining errors
6. Start dev server and test functionality

### Option B: Proper Fix All TypeScript Errors (37 min)
1. Fix all 32 errors systematically
2. Ensure full type safety
3. Start dev server

**RECOMMENDATION**: Start with Option A to unblock testing, then fix remaining errors.

---

## ✅ WHAT ALEX HALE TEST NEEDS

For testing with Alex Hale (NFL Kicker, O-1A):

### MUST HAVE:
- [x] Database schema with EB-2 NIW support
- [x] Database schema with exhibit tracking
- [x] API routes with correct column names
- [ ] Server actually starts (need to fix TypeScript errors)
- [ ] pdf-parse installed
- [ ] All BeneficiaryInfo fields available

### SHOULD HAVE:
- [ ] All TypeScript errors resolved
- [ ] Type safety verified
- [ ] Storage buckets created in Supabase

### TESTING FLOW:
1. Navigate to http://localhost:3000
2. Enter:
   - Name: Alex Hale
   - Profession: Professional NFL Kicker
   - Visa Type: **O-1A** (extraordinary ability in athletics)
   - Brief Type: Standard (15-20 pages)
3. Click "Start AI Lookup"
4. Verify sources found
5. Complete form and generate documents
6. Verify 8 documents generated
7. Optional: Generate exhibits

---

## 📝 NEXT STEPS

1. Apply fixes from Priority List above
2. Re-run `npx tsc --noEmit` to verify
3. Run `npm run dev` to start server
4. Test with Alex Hale O-1A case
5. Document any runtime errors
6. Fix remaining issues

**Status**: Ready to apply fixes (estimated 15-37 min depending on approach)
