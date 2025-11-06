# Current Work Tracker

**Last Updated**: 2025-10-29
**Active Sprint**: MVP - 3 Benchmark Papers
**Status**: 🚀 IN PROGRESS

---

## 🎯 Current Focus

**Primary Goal**: Demonstrate end-to-end pipeline on 3 benchmark papers (TextCNN, CharCNN, DenseNet)

**Sprint Document**: [MVP_SPRINT__3_BENCHMARK_PAPERS.md](./MVP_SPRINT__3_BENCHMARK_PAPERS.md)

**Target Completion**: 2025-11-01 (3 days)

---

## 📋 Today's Tasks (Day 1 - Oct 29) ✅ COMPLETE

### Morning: Verification & Setup
- [x] Fix sanitizer test assertion bug (5 min)
- [x] Verify 3 papers in database
- [x] Verify claims exist
- [x] Test Supabase connectivity
- [x] Verify .env configuration

### Afternoon: Plan Generation ✅ COMPLETE
- [x] Start API server
- [x] **BLOCKER FIXED**: Dataset normalization for possessives (AG's News)
- [x] Generate plan for TextCNN + SST-2 → `0d4f0ff4-730f-47dc-a387-7943806fe990`
- [x] Generate plan for CharCNN + AG News → `f9aae82f-57a9-470f-aaf6-97ab5bc1d0d4`
- [x] Generate plan for DenseNet + CIFAR-10 → `2288d95e-4514-497a-9229-84155002c9d0`
- [x] Document results

**Output**: ✅ 3 valid plan IDs with "resolved" dataset status

---

## 🚧 Known Blockers

**Day 1**: ~~Dataset normalization for "AG's News"~~ ✅ RESOLVED
- Fixed `normalize_dataset_name()` to strip possessives before other operations
- All 3 papers now generate plans successfully

---

## 📊 Sprint Progress

**Day 1** (Oct 29): Verification & Planning
- Status: ✅ COMPLETE
- Completion: 100%
- Key Achievement: Fixed dataset normalization blocker, generated 3 valid plans

**Day 2** (Oct 30): Materialize & First Execution
- Status: ⏳ READY TO START
- Plan IDs available for materialization

**Day 3** (Oct 31): Full Execution & Documentation
- Status: ⏳ NOT STARTED

---

## 🔗 Related Documents

### Active Sprint Docs
- [MVP Sprint Plan](./MVP_SPRINT__3_BENCHMARK_PAPERS.md) - Detailed sprint plan
- [MVP Demo Script](./MVP_DEMO_SCRIPT.md) - To be created Day 3
- [MVP Troubleshooting](./MVP_TROUBLESHOOTING.md) - To be created Day 3

### Reference Docs
- [Seed Papers Summary](../Current_Reference/SEED_PAPERS_SUMMARY.md) - Paper metadata
- [Project Status](../../current/status_overview.md) - Overall project state
- [Planner Refactor Milestone](../../current/milestones/planner_refactor.md) - Recent work

### Archive
- [Working Logs](../Working_Logs/) - Historical session logs
- [Completed Sessions](../Archive_Completed_Sessions/) - Past milestones

---

## 💡 Quick Commands

### Start API Server
```bash
cd api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Query Database for Papers
```sql
SELECT id, slug, title FROM papers
WHERE slug IN ('kim_2014_textcnn', 'zhang_2015_charcnn', 'huang_2017_densenet');
```

### Generate Plan
```bash
curl -X POST http://localhost:8000/api/v1/plans/generate \
  -H "Content-Type: application/json" \
  -d '{"claim_id": "<ID>", "paper_id": "<ID>"}'
```

### Monitor Run
```bash
curl -N http://localhost:8000/api/v1/runs/<RUN_ID>/stream
```

---

## 📝 Daily Log

### Oct 29 (Day 1) ✅ COMPLETE

**Morning**:
- Sprint planning completed
- Documentation reorganized
- Papers and claims verified in database

**Afternoon**:
- **CRITICAL FIX**: Dataset normalization for possessives
  - Problem: "AG's News" → "agsnews" (wrong) → plan generation failed
  - Solution: Strip possessive "'s" before other normalization steps
  - Files modified: `dataset_registry.py`, `test_dataset_registry.py`
  - Tests: 38/38 registry tests pass, 31/31 sanitizer tests pass
- Generated 3 valid plans:
  - TextCNN/SST-2: `0d4f0ff4-730f-47dc-a387-7943806fe990` ✅
  - CharCNN/AG News: `f9aae82f-57a9-470f-aaf6-97ab5bc1d0d4` ✅
  - DenseNet/CIFAR-10: `2288d95e-4514-497a-9229-84155002c9d0` ✅
- All plans show `data_resolution.status: "resolved"`
- Regression test passed: TextCNN and DenseNet still work after fix

**Blockers Resolved**: Dataset normalization for possessive forms

**Day 1 Exit Criteria**: ✅ ACHIEVED
- 3 plan IDs generated
- All datasets resolved
- No blockers remaining

---

### Oct 30 (Day 2) - NEXT UP
**Goal**: Materialize 3 notebooks and execute TextCNN

**Morning Tasks**:
- [ ] Materialize notebook for TextCNN plan
- [ ] Materialize notebook for CharCNN plan
- [ ] Materialize notebook for DenseNet plan
- [ ] Download and inspect all 3 notebooks
- [ ] Verify notebooks use real datasets (not synthetic fallback)

**Afternoon Tasks**:
- [ ] Execute TextCNN notebook (fastest, ~8-12 min)
- [ ] Monitor SSE stream for progress
- [ ] Verify metrics.json produced
- [ ] Debug any execution issues

**Exit Criteria**:
- 3 notebooks materialized and inspected
- 1 successful execution with valid metrics

---

### Oct 31 (Day 3)
[To be filled after Day 2 complete]

---

## 🎯 Definition of Done

Sprint complete when:
- ✅ 3 papers executed end-to-end
- ✅ All metrics verified
- ✅ Demo script created
- ✅ Documentation updated
- ✅ Retrospective completed

---

**Update this document daily** to track progress and blockers.
