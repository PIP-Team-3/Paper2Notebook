# Paper2Notebook - Development Roadmap

**Last Updated**: 2025-11-06
**Current Phase**: Phase 2 (Smart Baselines)

---

## Overview

This roadmap outlines the development path from the current Phase 2 (sklearn baselines) to Phase 3 (real model architectures) and beyond.

---

## ✅ COMPLETED: Phase 1 (Foundation)

**Goal**: Build core pipeline infrastructure

**Completed Work**:
- ✅ Ingest pipeline (PDF upload, text extraction)
- ✅ Verify stage (reproducibility check)
- ✅ Extract stage (structured information extraction)
- ✅ Plan stage (two-stage planner with structured outputs)
- ✅ Supabase integration (storage + database)
- ✅ OpenAI Agents SDK integration
- ✅ Basic notebook generation

**Outcome**: End-to-end pipeline works with hardcoded logic

---

## ✅ IN PROGRESS: Phase 2 (Smart Baselines)

**Goal**: Prove pipeline works with fast sklearn baselines + autonomous validation

### Completed (Sprint 11/5-11/6)
- ✅ Smart dataset selection (HuggingFace, torchvision, sklearn)
- ✅ Dataset registry with 11 datasets
- ✅ Generator factory pattern
- ✅ Import collection from generators
- ✅ Requirements collection from generators
- ✅ TextCNN baseline execution (72.2% accuracy)
- ✅ Autonomous validation system (syntax + sklearn parameters)
- ✅ Bug fixes (4 critical bugs found and fixed)

### Remaining Work
- [ ] Fix GOAL_VALUE calculation bug (use percentage format)
- [ ] Test validation catches all known bug types
- [ ] Execute CharCNN baseline (AG News)
- [ ] Execute DenseNet baseline (CIFAR-10)
- [ ] Document baseline performance comparison

**Expected Completion**: End of Sprint 11/06

---

## 🔜 NEXT: Phase 3 (Real Models)

**Goal**: Implement actual model architectures to match paper claims

**Timeline**: Sprint 11/07 onwards (1-2 weeks)

### Milestone 1: TextCNN Implementation
**Priority**: HIGH
**Estimated**: 3-4 days

#### Tasks
1. **Create TorchTextCNNGenerator** (2 days)
   - [ ] Implement TextCNN architecture (Conv1d layers)
   - [ ] Add word embedding layer
   - [ ] Implement training loop
   - [ ] Add evaluation logic
   - [ ] Generate proper imports (torch.nn, torch.optim)
   - [ ] Generate requirements (torch==2.0+)

2. **Update Factory Logic** (0.5 days)
   - [ ] Modify `get_model_generator()` to check plan.model.name
   - [ ] Return TorchTextCNNGenerator when model="TextCNN"
   - [ ] Keep sklearn baseline as fallback

3. **Add Validation Rules** (0.5 days)
   - [ ] Add PyTorch parameter validation
   - [ ] Check for GPU usage (should error)
   - [ ] Validate nn.Module structure

4. **Test & Verify** (1 day)
   - [ ] Unit tests for generator
   - [ ] Integration test (full pipeline)
   - [ ] Verify accuracy matches paper claim (88.1% ±2%)
   - [ ] Compare to Phase 2 baseline (72.2%)

**Success Criteria**:
- TextCNN notebook generates correctly
- Passes all validation checks
- Executes without errors
- Achieves 86-90% accuracy on SST-2
- Training completes in 5-10 minutes

---

### Milestone 2: CharCNN Implementation
**Priority**: MEDIUM
**Estimated**: 2-3 days

#### Tasks
1. **Create TorchCharCNNGenerator**
   - [ ] Implement character-level CNN
   - [ ] Add character embedding
   - [ ] Training loop with Adam optimizer
   - [ ] Test on AG News dataset

2. **Integration**
   - [ ] Add to factory logic
   - [ ] Add validation rules
   - [ ] Update tests

**Success Criteria**:
- Achieves paper claim accuracy on AG News
- Executes autonomously

---

### Milestone 3: DenseNet/ResNet Implementation
**Priority**: LOW (can defer to Phase 4)
**Estimated**: 3-4 days

#### Tasks
1. **Create TorchDenseNetGenerator**
   - [ ] Implement DenseNet architecture
   - [ ] Add data augmentation
   - [ ] Training loop
   - [ ] Test on CIFAR-10

2. **Integration**
   - [ ] Add to factory
   - [ ] Validation rules
   - [ ] Tests

**Success Criteria**:
- Achieves paper claim accuracy on CIFAR-10

---

### Milestone 4: Enhanced Validation (Phase 3)
**Priority**: MEDIUM
**Estimated**: 2 days

#### Tasks
1. **AST-based Parameter Validation**
   - [ ] Replace regex with AST parsing
   - [ ] Validate PyTorch parameters (lr, momentum, etc.)
   - [ ] Check for GPU usage patterns

2. **Dry-run Execution**
   - [ ] Execute first 3 cells in sandbox
   - [ ] Catch runtime errors before full execution
   - [ ] Validate imports actually work

3. **Generator Self-tests**
   - [ ] Add `self_test()` method to base class
   - [ ] Run during factory selection
   - [ ] Fall back to baseline if self-test fails

**Success Criteria**:
- All Phase 3 bugs caught by validation
- No execution failures in production

---

## 🔮 FUTURE: Phase 4+ (Advanced Features)

### Phase 4: Automated Execution Service
**Timeline**: TBD (2-3 weeks)
**Goal**: Fully autonomous execution without manual intervention

#### Features
- Worker service for notebook execution
- Sandboxed execution environment (Docker)
- Metrics collection and storage
- Automated claim comparison
- Email notifications on completion

---

### Phase 5: Multi-GPU Support
**Timeline**: TBD (1-2 weeks)
**Goal**: Support GPU-accelerated training

#### Features
- Optional GPU flag in plan config
- CUDA availability checking
- Distributed training (multi-GPU)
- Cloud GPU integration (AWS, GCP)

**Constraints**:
- Phase 2/3 must work CPU-only
- GPU is optimization, not requirement

---

### Phase 6: Web Frontend
**Timeline**: TBD (3-4 weeks)
**Goal**: User-friendly interface for paper submission and monitoring

#### Features
- Paper upload UI
- Pipeline progress visualization
- Notebook viewer
- Metrics comparison dashboard
- Paper database browser

---

### Phase 7: Scaling & Production
**Timeline**: TBD (ongoing)
**Goal**: Production-ready system

#### Features
- Horizontal scaling (multiple workers)
- Load balancing
- Monitoring & alerting
- Cost optimization
- Security hardening
- API rate limiting

---

## Decision Points

### Should We Skip DenseNet in Phase 3?
**Context**: DenseNet is most complex, least urgent

**Options**:
1. **Skip for now**: Focus on TextCNN + CharCNN, defer DenseNet to Phase 4
2. **Implement all three**: Complete Phase 3 fully before moving on

**Recommendation**: SKIP for now
- TextCNN + CharCNN prove NLP pipelines work
- DenseNet requires more complex vision pipeline
- Can add later without blocking other work

**Decision**: TBD (discuss with team)

---

### When to Add Automated Execution?
**Context**: Currently executing notebooks manually

**Options**:
1. **Phase 3**: Add execution service before implementing all models
2. **Phase 4**: Complete all model generators first, then automate

**Recommendation**: PHASE 4
- Manual execution works fine for development
- Focus on model quality first
- Automation can come later

**Decision**: TBD (discuss with team)

---

## Risk Assessment

### High Risk Items
1. **PyTorch Memory Issues**: Real models may OOM on CPU
   - Mitigation: Add memory monitoring, subsample data if needed
2. **Training Time**: Real models take 5-30 minutes
   - Mitigation: Optimize batch size, use smaller datasets
3. **Accuracy Gaps**: May not match paper claims exactly
   - Mitigation: Document differences, tune hyperparameters

### Medium Risk Items
1. **Generator Bugs**: New generators may have bugs
   - Mitigation: Enhanced validation, thorough testing
2. **Dataset Download Failures**: Network issues, rate limits
   - Mitigation: Retry logic, caching, offline mode

### Low Risk Items
1. **Dependency Conflicts**: Package version incompatibilities
   - Mitigation: Pinned versions, test environment

---

## Success Metrics

### Phase 2 (Current)
- ✅ 3 baselines execute successfully (1/3 complete)
- ✅ Validation system catches all known bugs
- 🔜 Baseline performance documented

### Phase 3 (Next)
- [ ] 3 real models implemented (TextCNN, CharCNN, DenseNet)
- [ ] Accuracy within ±2% of paper claims
- [ ] 100% autonomous execution (no human intervention)
- [ ] Training time < 30 minutes per notebook

### Phase 4+ (Future)
- [ ] Automated execution service deployed
- [ ] 10+ papers successfully reproduced
- [ ] Web frontend accessible
- [ ] System handles 100+ papers in database

---

## Timeline Summary

| Phase | Status | Duration | Completion Target |
|-------|--------|----------|-------------------|
| Phase 1: Foundation | ✅ Complete | 4 weeks | October 2025 |
| Phase 2: Smart Baselines | 🔧 In Progress | 1 week | Nov 6, 2025 |
| Phase 3: Real Models | 🔜 Next | 2 weeks | Nov 20, 2025 |
| Phase 4: Automation | 📅 Planned | 3 weeks | Dec 11, 2025 |
| Phase 5: GPU Support | 📅 Planned | 2 weeks | Dec 25, 2025 |
| Phase 6: Web Frontend | 📅 Planned | 4 weeks | Jan 22, 2026 |

**Note**: Timelines are estimates and may adjust based on complexity and discoveries during implementation.

---

## Navigation

- [Project Overview](./PROJECT_OVERVIEW.md)
- [Active Sprint](../ActiveSprint/)
- [Archived Docs](../Archive_2025_11_06/)
