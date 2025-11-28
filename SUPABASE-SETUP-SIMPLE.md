# 🚀 SUPABASE DATABASE SETUP - SUPER SIMPLE GUIDE

**Time Required:** 5 minutes
**Difficulty:** Easy (middle schooler friendly!)

---

## STEP 1: Open Supabase SQL Editor (1 minute)

1. Click this link: https://supabase.com/dashboard/project/oguwvltqkmtzthehdgvi/sql/new

2. You'll see a page that looks like a code editor with a big text box

That's it! You're ready for step 2.

---

## STEP 2: Copy the Database Code (30 seconds)

1. Open this file on your computer:
   ```
   /home/innovativeautomations/Mega Working - Visa Petition Generator/mega-internal-v1-visa-tool/database/schema.sql
   ```

2. Select ALL the text in that file (Ctrl+A or Cmd+A)

3. Copy it (Ctrl+C or Cmd+C)

**OR** if you're using ChatGPT in agent mode, just tell it:
> "Copy all text from /home/innovativeautomations/Mega Working - Visa Petition Generator/mega-internal-v1-visa-tool/database/schema.sql"

---

## STEP 3: Paste and Run (30 seconds)

1. Go back to the Supabase SQL Editor (from Step 1)

2. Click in the big text box

3. Paste the code (Ctrl+V or Cmd+V)

4. Click the green **"RUN"** button at the bottom right
   - OR press Ctrl+Enter (Cmd+Enter on Mac)

5. Wait 5-10 seconds

6. You should see a green success message that says something like:
   ```
   Success. No rows returned
   ```

✅ **DATABASE TABLES CREATED!**

---

## STEP 4: Create Storage Buckets (2 minutes)

Now we need to create 3 folders for storing files.

### Bucket 1: petition-documents (PUBLIC)

1. In Supabase, click **"Storage"** in the left sidebar

2. Click the green **"New bucket"** button

3. Fill in:
   - **Name:** `petition-documents`
   - **Public bucket:** ✅ CHECK THIS BOX (make it public)

4. Click **"Create bucket"**

### Bucket 2: uploaded-files (PRIVATE)

1. Click **"New bucket"** again

2. Fill in:
   - **Name:** `uploaded-files`
   - **Public bucket:** ❌ LEAVE UNCHECKED (keep private)

3. Click **"Create bucket"**

### Bucket 3: exhibit-pdfs (PUBLIC)

1. Click **"New bucket"** one more time

2. Fill in:
   - **Name:** `exhibit-pdfs`
   - **Public bucket:** ✅ CHECK THIS BOX (make it public)

3. Click **"Create bucket"**

✅ **ALL 3 STORAGE BUCKETS CREATED!**

---

## STEP 5: Verify Everything Worked (1 minute)

### Check Tables:

1. Click **"Table Editor"** in the left sidebar

2. You should see these 6 tables:
   - ✅ petition_cases
   - ✅ case_urls
   - ✅ case_files
   - ✅ generated_documents
   - ✅ exhibit_pdfs
   - ✅ research_sessions

### Check Storage:

1. Click **"Storage"** in the left sidebar

2. You should see these 3 buckets:
   - ✅ petition-documents (public)
   - ✅ uploaded-files (private)
   - ✅ exhibit-pdfs (public)

---

## ✅ YOU'RE DONE!

If you see all 6 tables and all 3 storage buckets, **YOU DID IT!** 🎉

The database is now ready for the visa petition tool to use.

---

## 🆘 TROUBLESHOOTING

### Problem: "relation already exists" error

**Solution:** Tables already created! This is fine, just means you ran it twice. Skip to Step 4.

### Problem: "uuid_generate_v4() does not exist"

**Solution:** Run this command first in the SQL editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
Then run the full schema again.

### Problem: Can't find the schema.sql file

**Full path:**
```
/home/innovativeautomations/Mega Working - Visa Petition Generator/mega-internal-v1-visa-tool/database/schema.sql
```

### Problem: SQL Editor won't load

**Direct link:**
https://supabase.com/dashboard/project/oguwvltqkmtzthehdgvi/sql

---

## 📋 QUICK CHECKLIST

Copy this and check off as you go:

```
[ ] Step 1: Opened Supabase SQL Editor
[ ] Step 2: Copied schema.sql code
[ ] Step 3: Pasted and ran code (saw green success)
[ ] Step 4a: Created petition-documents bucket (PUBLIC)
[ ] Step 4b: Created uploaded-files bucket (PRIVATE)
[ ] Step 4c: Created exhibit-pdfs bucket (PUBLIC)
[ ] Step 5: Verified 6 tables exist
[ ] Step 5: Verified 3 buckets exist
```

When all boxes are checked, you're done! ✅

---

## 🤖 FOR CHATGPT AGENT MODE

If you're having ChatGPT do this, just say:

> "Follow the instructions in SUPABASE-SETUP-SIMPLE.md exactly. The file is at: /home/innovativeautomations/Mega Working - Visa Petition Generator/mega-internal-v1-visa-tool/SUPABASE-SETUP-SIMPLE.md"

ChatGPT will be able to:
- Read the schema.sql file
- Execute each step
- Verify completion

---

**After this is done, come back and we'll finish building the tool!** 🚀
