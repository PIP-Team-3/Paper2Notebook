from api.app.materialize.generators.dataset_registry import lookup_dataset, normalize_dataset_name, DATASET_REGISTRY

print("Registry keys:", list(DATASET_REGISTRY.keys()))
print()

test_names = ["AG News", "agnews", "ag_news", "AG's News"]
for name in test_names:
    print(f"Testing: {repr(name)}")
    normalized = normalize_dataset_name(name)
    print(f"  Normalized: {repr(normalized)}")
    result = lookup_dataset(name)
    print(f"  Found: {result is not None}")
    if result:
        print(f"  Source: {result.source}")
    print()
