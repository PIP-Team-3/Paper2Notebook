# Phase 1 Quick Start Guide

**Goal**: Enable automatic penalty shootouts plan generation (no manual intervention)

---

## 📋 What You Need to Do

### **Step 1: Run Schema Migration** (5 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy-paste **entire contents** of `backend/sql/migration_phase1_claims_metadata.sql`
3. Click "Run" (green button)
4. Verify output shows: `MIGRATION COMPLETE ✅`

**What This Does**:
- Adds 4 new nullable columns to `claims` table:
  - `dataset_format` (e.g., "excel", "huggingface")
  - `target_column` (e.g., "Win", "sentiment")
  - `preprocessing_notes` (optional hints)
  - `dataset_url` (optional download link)

**Safety**: All columns nullable → won't break existing claims

---

### **Step 2: Verify Migration** (2 minutes)

Run this query in Supabase SQL Editor:

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'claims'
    AND column_name IN ('dataset_format', 'target_column', 'preprocessing_notes', 'dataset_url')
ORDER BY column_name;
```

**Expected Output** (4 rows):
```
column_name          | is_nullable
---------------------+-------------
dataset_format       | YES
dataset_url          | YES
preprocessing_notes  | YES
target_column        | YES
```

---

### **Step 3: Check Existing Claims Still Work** (1 minute)

```sql
SELECT id, dataset_name, metric_name, dataset_format, target_column
FROM claims
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: New columns show `NULL` for existing claims (this is correct ✅)

---

## 🚀 Next Steps After Migration

### **Immediate** (Do These Today):
1. ✅ Migration complete
2. Update Pydantic models (I'll help with this)
3. Restart backend server
4. Run TextCNN regression test (MUST PASS)

### **Sprint 2** (Dataset Resolver Tool):
- Create tool that checks registry + uploaded datasets
- Register tool in planner agent
- Test: "penalty_shootouts" → finds uploaded Excel

### **Sprint 3** (Extractor Prompt):
- Update prompt to capture `dataset_format` and `target_column`
- Test: Extract from penalty shootouts paper → stores "excel" + "Win"

### **Sprint 4** (Planner Prompt):
- Update prompt to use dataset_resolver_tool
- Test: Create plan for penalty shootouts → succeeds automatically

### **Sprint 5** (Generator Enhancement):
- Use explicit target_column from claims
- Test: Generate notebook with correct target column

---

## 📊 Progress Tracking

**Phase A.5** (COMPLETE ✅):
- Upload infrastructure
- Supabase storage
- Materialization with paper context
- Requirements.txt bug fix

**Phase 1 Sprint 1** (IN PROGRESS):
- [ ] Run schema migration SQL
- [ ] Verify migration successful
- [ ] Update Pydantic models
- [ ] Test TextCNN regression

**Phase 1 Sprint 2-5** (PENDING):
- [ ] Dataset resolver tool
- [ ] Extractor prompt update
- [ ] Planner prompt update
- [ ] Generator enhancement

---

## 🆘 If Something Goes Wrong

### Migration Failed?
```sql
-- Rollback (removes new columns)
ALTER TABLE claims
DROP COLUMN IF EXISTS dataset_format,
DROP COLUMN IF EXISTS target_column,
DROP COLUMN IF EXISTS preprocessing_notes,
DROP COLUMN IF EXISTS dataset_url;
```

### Existing Claims Don't Load?
- Check Pydantic model has `extra: "ignore"` config
- Check new fields are `Optional[str] = None`
- Verify database columns are nullable

### TextCNN Test Fails?
- Rollback database (see above)
- Rollback code: `git checkout backend/api/app/data/models.py`
- Restart backend
- Report issue

---

## 📝 Columns Added to `claims` Table

| Column Name | Type | Nullable | Purpose | Example Value |
|-------------|------|----------|---------|---------------|
| `dataset_format` | text | YES | Dataset type identifier | `"excel"`, `"huggingface"`, `"csv"` |
| `target_column` | text | YES | Prediction target name | `"Win"`, `"sentiment"`, `"default"` |
| `preprocessing_notes` | text | YES | Optional preprocessing hints | `"categorical encoding needed"` |
| `dataset_url` | text | YES | Optional download URL | `"https://..."` (future feature) |

---

## 🎯 End Goal

### Before Phase 1:
```
User uploads penalty shootouts + Excel
  ↓
Extractor extracts claims ⚠️ (missing metadata)
  ↓
Planner REJECTS ❌ (dataset not in registry)
  ↓
MANUAL PLAN CREATION REQUIRED ❌
```

### After Phase 1:
```
User uploads penalty shootouts + Excel
  ↓
Extractor captures: dataset_format="excel", target_column="Win" ✅
  ↓
Planner finds uploaded dataset ✅
  ↓
Plan created automatically ✅
  ↓
Notebook generated and executed ✅
```

---

## 📚 Documentation

- **Full Sprint Plan**: [PHASE_1_AGENT_MODULARITY.md](PHASE_1_AGENT_MODULARITY.md)
- **Safety Analysis**: [PHASE_1_SAFETY_VERIFICATION.md](PHASE_1_SAFETY_VERIFICATION.md)
- **Migration SQL**: [backend/sql/migration_phase1_claims_metadata.sql](backend/sql/migration_phase1_claims_metadata.sql)
- **Phase A.5 Status**: [DATASET_UPLOAD_IMPLEMENTATION.md](DATASET_UPLOAD_IMPLEMENTATION.md)

---

## ✅ Ready to Proceed?

**Next Action**: Copy-paste `migration_phase1_claims_metadata.sql` into Supabase SQL Editor and run it!

After successful migration, let me know and I'll help with Step 2 (update Pydantic models).
