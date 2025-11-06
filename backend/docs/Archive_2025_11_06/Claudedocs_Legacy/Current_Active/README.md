# Current Active Work - MVP Sprint

**Status**: 🚀 ACTIVE SPRINT
**Sprint Start**: 2025-10-29
**Sprint End**: 2025-11-01 (3 days)
**Goal**: End-to-end pipeline demo with 3 benchmark papers

---

## 📋 Start Here

### New to this sprint?
1. **Read**: [CURRENT_WORK_TRACKER.md](./CURRENT_WORK_TRACKER.md) - Daily status and today's tasks
2. **Then**: [MVP_SPRINT__3_BENCHMARK_PAPERS.md](./MVP_SPRINT__3_BENCHMARK_PAPERS.md) - Full sprint plan

### Returning to work?
→ Check [CURRENT_WORK_TRACKER.md](./CURRENT_WORK_TRACKER.md) → "Today's Tasks" section

---

## 📂 Files in This Folder

### 1. **CURRENT_WORK_TRACKER.md** ⭐
**Purpose**: Daily task tracker, blockers, progress log

**Update**: Daily (multiple times per day during active work)

**Contains**:
- Today's tasks (morning/afternoon)
- Sprint progress (Day 1/2/3 status)
- Known blockers
- Daily log entries
- Quick command reference

---

### 2. **MVP_SPRINT__3_BENCHMARK_PAPERS.md** 📋
**Purpose**: Detailed sprint plan with all tasks, timelines, and success criteria

**Update**: As needed when plan changes

**Contains**:
- Sprint goal and success metrics
- 3 selected papers (TextCNN, CharCNN, DenseNet)
- Day-by-day timeline
- Detailed task breakdown with exit criteria
- Troubleshooting scenarios
- Definition of done

---

### 3. **MVP_DEMO_SCRIPT.md** (To be created Day 3)
**Purpose**: Step-by-step demo walkthrough for showcasing the MVP

**Update**: Created on Day 3 after successful executions

**Will Contain**:
- 15-minute demo script
- Prerequisites and setup
- Demo flow (6 steps)
- Talking points
- Screenshots/examples

---

### 4. **MVP_TROUBLESHOOTING.md** (To be created Day 3)
**Purpose**: Known issues and fixes discovered during sprint

**Update**: Created on Day 3, updated as issues found

**Will Contain**:
- Common failure scenarios
- Symptom → Cause → Fix mappings
- Pre-flight checklist
- Debug commands

---

## 🎯 Sprint at a Glance

### Goal
Demonstrate **Ingest → Extract → Plan → Materialize → Execute** on 3 benchmark papers

### Papers
1. **TextCNN** (Kim 2014) - NLP, SST-2 dataset
2. **CharCNN** (Zhang 2015) - NLP, AG News dataset
3. **DenseNet** (Huang 2017) - Vision, CIFAR-10 dataset

### Success Criteria
- ✅ 3/3 papers execute end-to-end
- ✅ All use real datasets (no synthetic fallback)
- ✅ Complete within 20-minute budget
- ✅ metrics.json shows accuracy > 0.5
- ✅ Demo script ready

### Timeline
- **Day 1** (Oct 29): Verification & Plan Generation
- **Day 2** (Oct 30): Materialize & First Execution
- **Day 3** (Oct 31): Full Execution & Documentation

---

## 📊 Current Status

**Current Day**: Day 1 (Oct 29)
**Phase**: Documentation setup complete, ready for verification

**Next Steps**:
1. Fix sanitizer test bug (5 min)
2. Verify papers in database
3. Generate plans for 3 papers

---

## 🔗 Related Documents

### In This Folder
- All sprint-related active work

### In Parent Folders
- `../Current_Reference/SEED_PAPERS_SUMMARY.md` - Paper metadata
- `../../current/status_overview.md` - Project-wide status
- `../../current/milestones/planner_refactor.md` - Recent milestone

---

## 🔄 Document Lifecycle

**During Sprint**:
- Update `CURRENT_WORK_TRACKER.md` daily
- Update sprint plan if scope changes
- Create demo/troubleshooting docs on Day 3

**After Sprint**:
- Archive sprint plan to `../Archive_Completed_Sessions/`
- Update `../../current/changelog.md` with results
- Create retrospective document
- Clear this folder for next sprint

---

## 💡 Quick Commands

### Start API Server
```bash
cd api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Generate Plan
```bash
curl -X POST http://localhost:8000/api/v1/plans/generate \
  -H "Content-Type: application/json" \
  -d '{"claim_id": "<ID>", "paper_id": "<ID>"}'
```

### Execute Notebook
```bash
curl -X POST http://localhost:8000/api/v1/plans/<PLAN_ID>/run
```

### Monitor Execution
```bash
curl -N http://localhost:8000/api/v1/runs/<RUN_ID>/stream
```

---

**Last Updated**: 2025-10-29
**Maintainer**: Sprint team
**Questions**: See sprint plan or parent README
