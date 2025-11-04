# MVP Paper Verification Commands

## Paper IDs
- **TextCNN**: `15017eb5-68ee-4dcb-b3b4-1c98479c3a93`
- **CharCNN**: `8479e2f7-78fe-4098-b949-5899ce07f8c9`
- **DenseNet**: `3e585dc9-5968-4458-b81f-d1146d2577e8`

## Verification Commands (run after server starts)

### 1. Check Server Health
```bash
curl http://localhost:8000/health
```

### 2. Get TextCNN Paper
```bash
curl http://localhost:8000/api/v1/papers/15017eb5-68ee-4dcb-b3b4-1c98479c3a93
```

### 3. Get CharCNN Paper
```bash
curl http://localhost:8000/api/v1/papers/8479e2f7-78fe-4098-b949-5899ce07f8c9
```

### 4. Get DenseNet Paper
```bash
curl http://localhost:8000/api/v1/papers/3e585dc9-5968-4458-b81f-d1146d2577e8
```

### 5. Get TextCNN Claims
```bash
curl http://localhost:8000/api/v1/papers/15017eb5-68ee-4dcb-b3b4-1c98479c3a93/claims
```

### 6. Get CharCNN Claims
```bash
curl http://localhost:8000/api/v1/papers/8479e2f7-78fe-4098-b949-5899ce07f8c9/claims
```

### 7. Get DenseNet Claims
```bash
curl http://localhost:8000/api/v1/papers/3e585dc9-5968-4458-b81f-d1146d2577e8/claims
```

## Expected Results
- TextCNN: Should have ~28 claims
- CharCNN: Should have ~7 claims
- DenseNet: Should have ~5 claims

## Next: Generate Plans
Once verified, we'll generate plans using the first claim from each paper.
