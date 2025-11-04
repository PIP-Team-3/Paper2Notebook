# MVP Sprint Summary - Quick Reference

**Sprint**: 3 Benchmark Papers End-to-End
**Dates**: Oct 29 - Nov 1, 2025 (3 days)
**Status**: 🚀 ACTIVE - Day 1

---

## 🎯 One-Sentence Goal

Prove the P2N pipeline works end-to-end by executing TextCNN (NLP), CharCNN (NLP), and DenseNet (Vision) papers from PDF to metrics.

---

## 📊 The Papers

| Paper | Dataset | Registry Status | Expected Runtime |
|-------|---------|-----------------|------------------|
| TextCNN (Kim 2014) | SST-2 | ✅ Available | 8-12 min |
| CharCNN (Zhang 2015) | AG News | ✅ Available | 10-15 min |
| DenseNet (Huang 2017) | CIFAR-10 | ✅ Available | 15-20 min |

---

## ✅ Success = 3 Green Checkmarks

- [ ] TextCNN executes → metrics.json with accuracy > 0.5
- [ ] CharCNN executes → metrics.json with accuracy > 0.5
- [ ] DenseNet executes → metrics.json with accuracy > 0.5

---

## 📅 3-Day Timeline

**Day 1** (Oct 29): Verify + Generate Plans
- Fix test bug (5 min)
- Verify papers in DB
- Generate 3 plans
- **Exit Criteria**: 3 plan IDs with "resolved" dataset status

**Day 2** (Oct 30): Materialize + First Execution
- Generate 3 notebooks
- Execute TextCNN (first test)
- Debug any issues
- **Exit Criteria**: 1 successful execution with metrics

**Day 3** (Oct 31): Full Execution + Docs
- Execute CharCNN + DenseNet
- Create demo script
- Write troubleshooting guide
- **Exit Criteria**: All 3 executions complete, demo ready

---

## 🔧 Key Commands

### Start Server
```bash
cd api
uvicorn app.main:app --reload --port 8000
```

### Generate Plan
```bash
curl -X POST http://localhost:8000/api/v1/plans/generate \
  -H "Content-Type: application/json" \
  -d '{"claim_id": "<ID>", "paper_id": "<ID>"}'
```

### Execute
```bash
curl -X POST http://localhost:8000/api/v1/plans/<PLAN_ID>/run
```

### Monitor
```bash
curl -N http://localhost:8000/api/v1/runs/<RUN_ID>/stream
```

---

## 🚧 Known Risks

1. **Dataset download fails**: CIFAR-10 is 170MB, may timeout
   - Mitigation: Pre-download locally or use smaller subset

2. **Execution exceeds 20 min**: Models might be too large
   - Mitigation: Reduce epochs, use MAX_TRAIN_SAMPLES cap

3. **Plans reference ImageNet**: Some claims may fail
   - Mitigation: Skip those claims, try different ones

---

## 📁 Documentation

- **Daily Tracker**: `CURRENT_WORK_TRACKER.md`
- **Full Plan**: `MVP_SPRINT__3_BENCHMARK_PAPERS.md`
- **Demo Script**: `MVP_DEMO_SCRIPT.md` (Day 3)
- **Troubleshooting**: `MVP_TROUBLESHOOTING.md` (Day 3)

---

## 🎉 Definition of Done

Sprint is complete when:
- ✅ All 3 papers execute end-to-end
- ✅ All metrics verified (accuracy > 0.5)
- ✅ Demo script created and tested
- ✅ Documentation updated
- ✅ Sprint archived

---

## 📞 Quick Links

- **Paper IDs**:
  - TextCNN: `15017eb5-68ee-4dcb-b3b4-1c98479c3a93`
  - CharCNN: `8479e2f7-78fe-4098-b949-5899ce07f8c9`
  - DenseNet: `3e585dc9-5968-4458-b81f-d1146d2577e8`

- **Datasets**:
  - SST-2: `sst2` (HuggingFace GLUE)
  - AG News: `agnews` (HuggingFace)
  - CIFAR-10: `cifar10` (Torchvision)

- **Reference**:
  - Seed papers: `../Current_Reference/SEED_PAPERS_SUMMARY.md`
  - Project status: `../../current/status_overview.md`

---

**Last Updated**: 2025-10-29
**Current Phase**: Day 1 - Verification
**Next Milestone**: Generate 3 plans
