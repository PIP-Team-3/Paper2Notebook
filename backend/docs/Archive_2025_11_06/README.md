# Archive - November 6, 2025

**Archived Date**: 2025-11-06
**Reason**: Documentation reorganization - cleaning up legacy docs to focus on active work

---

## What's In This Archive

This archive contains all pre-reorganization documentation. The structure was complex with multiple overlapping folders and outdated information.

### Archived Folders

#### `Claudedocs_Legacy/`
The original Claudedocs folder with all subfolders:
- `Current_Active/` - Sprint documents (now in `/ActiveSprint`)
- `Current_Reference/` - Reference docs (mostly outdated)
- `Working_Logs/` - Session logs from October
- `Archive_**/` - Multiple archive folders (historical)
- `SeedSetup/` - Old seed paper setup guides

#### Root-Level Documents
- `AGENTS_detailed.md` - Outdated agents documentation
- `CONTRIBUTING.md` - Old contributing guidelines
- `P2N__SoupToNuts_Overview.md` - Early project overview
- `SECURITY.md` - Security guidelines (needs review)
- `verify_mvp_papers.md` - MVP paper verification notes

#### `current/`, `history/`, `playbooks/`
Previous documentation structure:
- `current/` - Status snapshots (October)
- `history/` - Historical session logs
- `playbooks/` - Manual testing playbooks

#### Other Docs
- `CODEX_RUN_NEXT.md` - Old codex prompts
- `FUTURE_CODEX_PROMPTS.md` - Future plans (outdated)
- `MASTER_CODEX_PROMPT.md` - Codex master prompt
- `ROADMAP_P2N.md` - Old roadmap (superseded by new ROADMAP.md)

---

## What Was Kept Active

The following documents were extracted and updated for active use:

### `/ActiveSprint/` (Current Work)
- `11_06_SPRINT_PROGRESS_AND_BUGS.md` - Latest sprint progress
- `DEPENDENCIES_AND_REGISTRY_STATUS.md` - System dependencies
- `MVP_SPRINT__3_BENCHMARK_PAPERS.md` - Sprint plan
- `README.md` - Sprint overview

### `/ProjectOverview/` (High-Level Docs)
- `PROJECT_OVERVIEW.md` - **NEW** - Comprehensive project overview
- `ROADMAP.md` - **NEW** - Development roadmap with phases

---

## Why Archive?

### Problems With Old Structure
1. **Too many overlapping folders**: Claudedocs, current, history, playbooks
2. **Outdated information**: Session logs from October, old prompts
3. **No clear entry point**: Hard to find relevant docs
4. **Stale references**: Links to non-existent files
5. **Mixed purposes**: Active work mixed with historical logs

### Benefits Of New Structure
1. **Clear hierarchy**: ProjectOverview → ActiveSprint → Archive
2. **Single entry point**: PROJECT_OVERVIEW.md
3. **Active docs only**: Archive old work regularly
4. **Better navigation**: Links between all active docs
5. **Reduced clutter**: Easy to find what's current

---

## How To Use This Archive

### ✅ **DO** Reference For:
- Historical context on past decisions
- Old implementation details
- Session transcripts for debugging
- Previous project structure understanding

### ❌ **DON'T** Use For:
- Current project status (use `/ProjectOverview/`)
- Active sprint work (use `/ActiveSprint/`)
- Development roadmap (use `/ProjectOverview/ROADMAP.md`)
- API documentation (use code comments + future docs)

---

## Archive Contents Map

```
Archive_2025_11_06/
├── Claudedocs_Legacy/           # Original Claudedocs folder (complete)
│   ├── Current_Active/          # Sprint docs (extracted to /ActiveSprint)
│   ├── Current_Reference/       # Reference docs (mostly outdated)
│   ├── Working_Logs/            # October session logs
│   ├── Archive_*/               # Multiple old archives
│   └── SeedSetup/               # Old setup guides
│
├── current/                     # Previous "current" folder
│   ├── milestones/              # Old milestone docs
│   ├── changelog.md             # Change log (October)
│   ├── status_overview.md       # Old status snapshot
│   └── README.md                # Old README
│
├── history/                     # Historical session logs
│   ├── 2025-10-19_*.md          # October sessions
│   └── INDEX.md                 # Session index
│
├── playbooks/                   # Manual testing playbooks
│   └── PLAYBOOK_*.md            # Testing procedures
│
├── AGENTS_detailed.md           # Outdated agents doc
├── CONTRIBUTING.md              # Old contributing guide
├── P2N__SoupToNuts_Overview.md  # Early overview
├── SECURITY.md                  # Security guidelines
├── verify_mvp_papers.md         # MVP verification notes
├── CODEX_RUN_NEXT.md            # Old codex prompts
├── FUTURE_CODEX_PROMPTS.md      # Future codex plans
├── MASTER_CODEX_PROMPT.md       # Codex master prompt
├── ROADMAP_P2N.md               # Old roadmap
└── README.md                    # This file
```

---

## When To Archive Next

Follow this schedule for regular cleanup:
- **Sprint Complete**: Archive sprint docs
- **Phase Transition**: Archive phase-specific docs
- **Quarterly**: General cleanup of stale docs
- **Major Reorganization**: As needed

Next archive folder: `Archive_YYYY_MM_DD/`

---

## Restoration

If you need to restore something from this archive:
1. Copy the file to the appropriate active folder
2. Update "Last Updated" date
3. Review and update content for accuracy
4. Add navigation links
5. Remove from archive (optional)

---

## Navigation

- [Back to Active Docs](../)
- [Project Overview](../ProjectOverview/PROJECT_OVERVIEW.md)
- [Active Sprint](../ActiveSprint/)
