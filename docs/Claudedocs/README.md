# Claudedocs - Documentation for AI Assistant Context

> **Important (2025-10-29):**
> - **Active work**: See `Current_Active/` folder (current sprint, daily tasks)
> - **Stable reference**: See `Current_Reference/` folder (project overview, seed papers)
> - **Authoritative docs**: See `../current/` for formal documentation (status, changelog, milestones)
> - **Historical context**: All other folders contain archived sessions and logs

**Purpose**: Documentation optimized for Claude (AI assistant) to quickly load context
**Last Organized**: 2025-10-29

---

## 📂 Folder Structure

### 🚀 **Current_Active/** - ⭐ START HERE ⭐
**What**: Active sprint documents, daily task tracking, immediate next steps

**Key Files**:
- **`CURRENT_WORK_TRACKER.md`** - **READ FIRST** - Daily status, today's tasks, blockers
- **`MVP_SPRINT__3_BENCHMARK_PAPERS.md`** - Active sprint: End-to-end pipeline demo
- `MVP_DEMO_SCRIPT.md` - Demo walkthrough (created Day 3)
- `MVP_TROUBLESHOOTING.md` - Known issues and fixes (created Day 3)

**Update Frequency**: Daily during active sprint

**Purpose**: Answer "What are we working on RIGHT NOW?"

### 📚 **Current_Reference/** - Quick Reference
**What**: Stable reference docs that don't change frequently

**Key Files**:
- **`CLAUDE.md`** - High-level P2N project overview
- **`SEED_PAPERS_SUMMARY.md`** - Catalog of 11 ingested papers with metadata
- **`INGEST_GUIDE.md`** - Instructions for ingesting new papers
- `openai-agents-and-responses-docs-compiled.md` - OpenAI SDK reference

**Update Frequency**: After major milestones

**Purpose**: Answer "What papers/datasets do we have?" and "How does the system work?"

### 📖 **Working_Logs/** - Session Transcripts
**What**: Chronological working session logs (debugging, implementation, verification)

**Recent Files**:
- `2025-10-10_Phase2_Verification_and_Storage_Fix.md`
- `2025-10-08_Two_Stage_Planner_Live_Testing.md`
- `2025-10-08_Two_Stage_Planner_Implementation.md`
- `2025-10-08_Phase1_Verification_Session.md`
- And more...

**Purpose**: Audit trail of decisions, debugging sessions, implementation details

**Update Frequency**: After each significant working session (2+ hours)

---

### ✅ **Archive_Completed_Sessions/** - Completed Milestones
**What**: Major milestones that are done and archived

**Files**:
- `P2N_MILESTONE_UPDATE__2025-10-16.md` - Seed papers ingested, Phase 2 complete
- `P2N_Roadmap_Next_Milestones_2025-10-10.md` - Post-Phase-2 planning
- `SCHEMA_V1_NUCLEAR__Tracking_Doc.md` - Schema v1 deployment
- And more...

**Purpose**: Historical record of completed work

**Update Frequency**: When milestones are achieved

---

### 🗄️ **Archive_Pre_*/** and **Archive_Obsolete/** - Historical Context
**What**: Snapshots before major refactors, deprecated docs

**Folders**:
- `Archive_Pre_Event_Type_Fix/` - Pre-SDK event type fixes
- `Archive_Pre_Message_Type_Fix/` - Pre-message type refactor
- `Archive_Obsolete/` - Deprecated plans and audits

**Purpose**: Recovery points if needed, historical lessons learned

**Update Frequency**: Before major breaking changes

---

### 🌱 **SeedSetup/** - Paper Ingestion Resources
**What**: Resources for ingesting seed papers

**Files**:
- `manifests_seed_papers.csv` - Metadata for 15 seed papers
- `INGEST_GUIDE.md` - Step-by-step ingestion instructions

**Purpose**: Reference when adding new papers to the system

**Update Frequency**: When new papers are added

---

## 🎯 Quick Navigation Guide

### "I'm starting a new session" 🆕
→ Read **`Current_Active/CURRENT_WORK_TRACKER.md`** first
→ Then read **`Current_Active/MVP_SPRINT__3_BENCHMARK_PAPERS.md`** for detailed plan

### "What are we working on right now?" 🎯
→ Check **`Current_Active/CURRENT_WORK_TRACKER.md`** → Today's tasks section

### "What's the project about?" 📖
→ Read **`Current_Reference/CLAUDE.md`** for high-level overview
→ Read **`docs/current/status_overview.md`** for formal status

### "What papers/datasets are available?" 📊
→ Check **`Current_Reference/SEED_PAPERS_SUMMARY.md`**

### "How did we get here?" 🕰️
→ Skim **`Working_Logs/`** in reverse chronological order
→ Check **`Archive_Completed_Sessions/`** for major milestones

### "Something broke - how was it fixed before?" 🔧
→ Search **`Working_Logs/`** and **`Archive_Completed_Sessions/`** for similar issues

---

## 📝 Documentation Guidelines

### When to Create/Update Docs

**Daily** (during active sprint):
- Update `Current_Active/CURRENT_WORK_TRACKER.md` with progress
- Log blockers and completed tasks

**Per Sprint**:
- Create new sprint plan in `Current_Active/`
- Archive completed sprint to `Archive_Completed_Sessions/`

**Per Session** (2+ hour working session):
- Create session log in `Working_Logs/YYYY-MM-DD_Description.md`
- Document decisions, bugs fixed, insights gained

**Per Milestone**:
- Archive milestone doc to `Archive_Completed_Sessions/`
- Update `docs/current/` formal documentation
- Update this README if folder structure changes

### Naming Conventions

- **Date Prefix**: `YYYY-MM-DD_` for chronological docs
- **Status Prefix**: `CURRENT_`, `ACTIVE_`, `MVP_` for active docs
- **ALL_CAPS**: Important tracker/index docs
- **Underscores**: Separate words in filenames

---

## 🔄 Maintenance Checklist

### Daily (During Sprint)
- [ ] Update `Current_Active/CURRENT_WORK_TRACKER.md`
- [ ] Log completed tasks
- [ ] Note any blockers

### Weekly
- [ ] Archive completed sprint docs
- [ ] Review and clean obsolete docs
- [ ] Update this README if needed

### Monthly
- [ ] Audit folder structure
- [ ] Move old working logs to archive folders
- [ ] Update navigation guide

---

## 🤖 Tips for AI Assistants

**When starting a new conversation**:
1. Read `Current_Active/CURRENT_WORK_TRACKER.md` first
2. Check active sprint doc for detailed context
3. Skim recent `Working_Logs/` for recent changes
4. Use `Current_Reference/` for stable project facts

**When ending a conversation**:
1. Update `Current_Active/CURRENT_WORK_TRACKER.md` with progress
2. Create new working log if session was significant (2+ hours)
3. Archive completed docs if milestone reached

---

## 📞 Questions?

- **About this folder**: See this README
- **About the project**: See `Current_Reference/CLAUDE.md`
- **About formal docs**: See `../current/README.md`

---

**Last Updated**: 2025-10-29
**Active Sprint**: MVP - 3 Benchmark Papers
**Current Focus**: End-to-end pipeline validation
