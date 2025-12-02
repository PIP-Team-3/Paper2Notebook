"""
Dataset code generators.

Phase 1: SyntheticDatasetGenerator (extracts current notebook.py logic)
Phase 2: SklearnDatasetGenerator, TorchvisionDatasetGenerator, HuggingFaceDatasetGenerator
"""

from __future__ import annotations

import textwrap
from typing import List

from .base import CodeGenerator
from .dataset_registry import DatasetMetadata
from ...schemas.plan_v1_1 import PlanDocumentV11


class SyntheticDatasetGenerator(CodeGenerator):
    """
    Generates synthetic classification data using sklearn.datasets.make_classification.

    Phase 1: This extracts the EXACT current logic from notebook.py (lines 111-140).
    No behavior change - ensures regression-free refactor.

    Future: This will be used as fallback when real datasets unavailable.
    """

    def generate_imports(self, plan: PlanDocumentV11) -> List[str]:
        """Import statements for synthetic data generation."""
        return [
            "from sklearn.datasets import make_classification",
            "from sklearn.model_selection import train_test_split",
        ]

    def generate_code(self, plan: PlanDocumentV11) -> str:
        """
        Generate synthetic classification dataset.

        Creates 512 samples with 32 features, then splits 80/20 train/test.
        Logs dataset_load event and dataset_samples metric.
        """
        return textwrap.dedent(
            f"""
        log_event(
            "stage_update",
            {{
                "stage": "dataset_load",
                "dataset": "{plan.dataset.name}",
                "split": "{plan.dataset.split}",
            }},
        )

        X, y = make_classification(
            n_samples=512,
            n_features=32,
            n_informative=16,
            n_redundant=4,
            random_state=SEED,
        )
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=SEED
        )
        log_event(
            "metric_update",
            {{"metric": "dataset_samples", "value": int(X.shape[0])}},
        )
        """
        ).strip()

    def generate_requirements(self, plan: PlanDocumentV11) -> List[str]:
        """Pip requirements for synthetic data generation."""
        return ["scikit-learn==1.5.1"]


class SklearnDatasetGenerator(CodeGenerator):
    """
    Generates code to load sklearn built-in datasets.

    These datasets are bundled with sklearn (no download required):
    - digits: 8x8 images of handwritten digits
    - iris: Classic iris flower classification
    - wine: Wine recognition dataset
    - breast_cancer: Wisconsin breast cancer dataset

    The data is already on disk when sklearn is installed, making this
    the fastest dataset loading option.
    """

    def __init__(self, metadata: DatasetMetadata):
        """
        Initialize with dataset metadata.

        Args:
            metadata: Dataset metadata from registry
        """
        self.metadata = metadata

    def generate_imports(self, plan: PlanDocumentV11) -> List[str]:
        """Import statements for sklearn dataset loading."""
        return [
            f"from sklearn.datasets import {self.metadata.load_function}",
            "from sklearn.model_selection import train_test_split",
        ]

    def generate_code(self, plan: PlanDocumentV11) -> str:
        """
        Generate code to load sklearn dataset.

        Features:
        - No downloads (bundled with sklearn)
        - Deterministic train/test split with SEED
        - Logs dataset_load and dataset_samples events
        """
        dataset_name = plan.dataset.name
        load_func = self.metadata.load_function

        return textwrap.dedent(
            f"""
        # Dataset: {dataset_name} (sklearn built-in - no download)
        log_event("stage_update", {{"stage": "dataset_load", "dataset": "{dataset_name}"}})

        # Load dataset (bundled with sklearn)
        X, y = {load_func}(return_X_y=True)

        # Split train/test with deterministic seed
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=SEED
        )

        log_event("metric_update", {{"metric": "dataset_samples", "value": int(X.shape[0])}})
        """
        ).strip()

    def generate_requirements(self, plan: PlanDocumentV11) -> List[str]:
        """Pip requirements for sklearn dataset loading."""
        return ["scikit-learn==1.5.1"]


class TorchvisionDatasetGenerator(CodeGenerator):
    """
    Generates code to load torchvision datasets with caching.

    Supports vision datasets like:
    - MNIST: Handwritten digits (60k train, 10k test)
    - FashionMNIST: Fashion items (60k train, 10k test)
    - CIFAR10: 32x32 color images (50k train, 10k test)

    Features:
    - Downloads on first use, then caches locally
    - Respects OFFLINE_MODE environment variable
    - Subsamples for CPU budget (MAX_TRAIN_SAMPLES)
    - Converts to numpy for sklearn model compatibility (Phase 2)
    """

    def __init__(self, metadata: DatasetMetadata):
        """
        Initialize with dataset metadata.

        Args:
            metadata: Dataset metadata from registry
        """
        self.metadata = metadata

    def generate_imports(self, plan: PlanDocumentV11) -> List[str]:
        """Import statements for torchvision dataset loading."""
        return [
            "from torchvision import datasets, transforms",
            "import numpy as np",
            "import os",
        ]

    def generate_code(self, plan: PlanDocumentV11) -> str:
        """
        Generate code to load torchvision dataset with caching.

        Cache behavior:
        - Uses DATASET_CACHE_DIR (default: ./data)
        - download=True checks cache first, only downloads if missing
        - OFFLINE_MODE=true skips download (fails if not cached)

        Resource management:
        - Subsamples to MAX_TRAIN_SAMPLES for CPU budget
        - Flattens images to 1D for sklearn compatibility
        """
        dataset_name = plan.dataset.name
        dataset_class = self.metadata.load_function

        return textwrap.dedent(
            f"""
        # Dataset: {dataset_name} (Torchvision - cached download)
        CACHE_DIR = os.getenv("DATASET_CACHE_DIR", "./data")
        OFFLINE_MODE = os.getenv("OFFLINE_MODE", "false").lower() == "true"

        log_event("stage_update", {{"stage": "dataset_load", "dataset": "{dataset_name}"}})

        # Basic transforms (normalize to [0, 1])
        transform = transforms.Compose([
            transforms.ToTensor(),
        ])

        # Download=True checks cache first! Only downloads if missing.
        train_dataset = datasets.{dataset_class}(
            root=CACHE_DIR,
            train=True,
            download=not OFFLINE_MODE,  # Skip download if offline
            transform=transform
        )

        test_dataset = datasets.{dataset_class}(
            root=CACHE_DIR,
            train=False,
            download=not OFFLINE_MODE,
            transform=transform
        )

        # Convert to numpy and flatten for sklearn compatibility (Phase 2)
        X_train = train_dataset.data.numpy().reshape(len(train_dataset), -1)
        y_train = np.array(train_dataset.targets)

        X_test = test_dataset.data.numpy().reshape(len(test_dataset), -1)
        y_test = np.array(test_dataset.targets)

        # Subsample for CPU budget (20 min limit)
        MAX_SAMPLES = int(os.getenv("MAX_TRAIN_SAMPLES", "5000"))
        if len(X_train) > MAX_SAMPLES:
            indices = np.random.RandomState(SEED).choice(len(X_train), MAX_SAMPLES, replace=False)
            X_train, y_train = X_train[indices], y_train[indices]

        log_event("metric_update", {{"metric": "dataset_samples", "value": len(X_train)}})
        """
        ).strip()

    def generate_requirements(self, plan: PlanDocumentV11) -> List[str]:
        """Pip requirements for torchvision dataset loading."""
        return [
            "torch==2.1.0",
            "torchvision==0.16.0",
        ]


class ExcelDatasetGenerator(CodeGenerator):
    """
    Generates code to load Excel datasets (.xls, .xlsx) with pandas.

    Supports tabular datasets like:
    - Penalty Shootouts: Soccer penalty shootout outcomes (265 rows)
    - Economic experiments: Small-scale randomized trials
    - Survey data: Structured questionnaires

    Features:
    - Supports both .xls (xlrd) and .xlsx (openpyxl) formats
    - Auto-detects target column (Win, target, label, y, class)
    - Categorical encoding (LabelEncoder for strings, keep integers)
    - No subsampling needed for small datasets (<5000 rows)
    - Supabase upload support (Phase A.5)
    """

    def __init__(self, metadata: DatasetMetadata, paper=None):
        """
        Initialize with dataset metadata.

        Args:
            metadata: Dataset metadata from registry
            paper: Optional PaperRecord with uploaded dataset (Phase A.5)
        """
        self.metadata = metadata
        self.paper = paper

    def generate_imports(self, plan: PlanDocumentV11) -> List[str]:
        """Import statements for Excel dataset loading."""
        return [
            "import pandas as pd",
            "from sklearn.preprocessing import LabelEncoder",
            "from sklearn.model_selection import train_test_split",
            "import os",
        ]

    def _generate_uploaded_dataset_code(self, plan: PlanDocumentV11) -> str:
        """
        Generate code to load uploaded dataset from local file (Phase A.5).

        The dataset file is downloaded by the backend and placed in the same directory
        as the notebook. This avoids environment variable injection and network calls.
        """
        dataset_name = plan.dataset.name
        # Use the filename that was stored with the paper
        dataset_filename = self.paper.dataset_original_filename if self.paper else "dataset.xls"

        return textwrap.dedent(
            f"""
        # Dataset: {dataset_name} (Uploaded with paper - loaded from local file)
        log_event("stage_update", {{"stage": "dataset_load", "dataset": "{dataset_name}"}})

        # Dataset file is in the same directory as this notebook
        dataset_path = "{dataset_filename}"
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset not found at {{dataset_path}}. Expected file: {dataset_filename}")

        log_event("info", {{"message": f"Loading dataset from local file: {{dataset_path}}"}})

        # Load Excel file
        df = pd.read_excel(dataset_path)

        log_event("metric_update", {{"metric": "dataset_rows", "value": len(df)}})

        # Clean data: Remove rows with missing values
        df_clean = df.dropna()
        if len(df_clean) < len(df):
            dropped = len(df) - len(df_clean)
            log_event("info", {{"message": f"Dropped {{dropped}} rows with missing values ({{dropped/len(df)*100:.1f}}%)"}})
        df = df_clean

        # Detect target column (common names)
        target_column = None
        for col in ["Win", "win", "target", "label", "class", "y", "Target", "Label"]:
            if col in df.columns:
                target_column = col
                break

        if target_column is None:
            # Fall back to last column
            target_column = df.columns[-1]
            log_event("warning", {{"message": f"No standard target column found. Using last column: {{target_column}}"}})

        # Separate features and target
        y = df[target_column].values
        X_df = df.drop(columns=[target_column])

        # Drop high-cardinality string columns (team names, competition names, etc.)
        # Keep only columns with reasonable cardinality (<50 unique values)
        for col in X_df.columns:
            if X_df[col].dtype == 'object':  # String column
                if X_df[col].nunique() > 50:
                    X_df = X_df.drop(columns=[col])
                    log_event("info", {{"message": f"Dropped high-cardinality column: {{col}}"}})

        # Encode categorical features
        label_encoders = {{}}
        for col in X_df.columns:
            if X_df[col].dtype == 'object':  # String categorical
                le = LabelEncoder()
                X_df[col] = le.fit_transform(X_df[col].astype(str))
                label_encoders[col] = le

        # Convert to numpy array
        X = X_df.values

        # Subsample for CPU budget (only if dataset is large)
        MAX_SAMPLES = int(os.getenv("MAX_TRAIN_SAMPLES", "5000"))
        if len(X) > MAX_SAMPLES:
            indices = np.random.RandomState(SEED).choice(len(X), MAX_SAMPLES, replace=False)
            X, y = X[indices], y[indices]
            log_event("info", {{"message": f"Subsampled {{len(X)}} → {{MAX_SAMPLES}} rows"}})

        # Split train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=SEED
        )

        log_event("metric_update", {{"metric": "dataset_samples", "value": len(X)}})
        log_event("metric_update", {{"metric": "dataset_features", "value": X.shape[1]}})
        """
        ).strip()

    def generate_code(self, plan: PlanDocumentV11) -> str:
        """
        Generate code to load Excel dataset with pandas.

        Routes between:
        1. Supabase-uploaded dataset (if paper has dataset_storage_path) - Phase A.5
        2. Local registry dataset (fallback for testing/development)

        Target column detection heuristics:
        1. Check plan.dataset.notes for target_column hint
        2. Try common names: Win, win, target, label, class, y
        3. Fall back to last column

        Preprocessing (Phase 2):
        - Categorical encoding: LabelEncoder for string columns
        - Numeric columns: Keep as-is (already encoded in most datasets)
        - Drop high-cardinality columns (team names, IDs, etc.)
        """
        # Route to uploaded dataset if available (Phase A.5)
        if self.paper and self.paper.dataset_storage_path:
            return self._generate_uploaded_dataset_code(plan)

        # Fallback: Local registry dataset (for development/testing)
        dataset_name = plan.dataset.name
        file_path = f"./{dataset_name}.xls"  # Placeholder - will be replaced with actual path

        return textwrap.dedent(
            f"""
        # Dataset: {dataset_name} (Excel format - local registry)
        log_event("stage_update", {{"stage": "dataset_load", "dataset": "{dataset_name}"}})

        # Load Excel file (supports .xls and .xlsx)
        df = pd.read_excel("{file_path}")

        log_event("metric_update", {{"metric": "dataset_rows", "value": len(df)}})

        # Detect target column (common names)
        target_column = None
        for col in ["Win", "win", "target", "label", "class", "y", "Target", "Label"]:
            if col in df.columns:
                target_column = col
                break

        if target_column is None:
            # Fall back to last column
            target_column = df.columns[-1]
            log_event("warning", {{"message": f"No standard target column found. Using last column: {{target_column}}"}})

        # Separate features and target
        y = df[target_column].values
        X_df = df.drop(columns=[target_column])

        # Drop high-cardinality string columns (team names, competition names, etc.)
        # Keep only columns with reasonable cardinality (<50 unique values)
        for col in X_df.columns:
            if X_df[col].dtype == 'object':  # String column
                if X_df[col].nunique() > 50:
                    X_df = X_df.drop(columns=[col])
                    log_event("info", {{"message": f"Dropped high-cardinality column: {{col}}"}})

        # Encode categorical features
        label_encoders = {{}}
        for col in X_df.columns:
            if X_df[col].dtype == 'object':  # String categorical
                le = LabelEncoder()
                X_df[col] = le.fit_transform(X_df[col].astype(str))
                label_encoders[col] = le

        # Convert to numpy array
        X = X_df.values

        # Subsample for CPU budget (only if dataset is large)
        MAX_SAMPLES = int(os.getenv("MAX_TRAIN_SAMPLES", "5000"))
        if len(X) > MAX_SAMPLES:
            indices = np.random.RandomState(SEED).choice(len(X), MAX_SAMPLES, replace=False)
            X, y = X[indices], y[indices]
            log_event("info", {{"message": f"Subsampled {{len(X)}} → {{MAX_SAMPLES}} rows"}})

        # Split train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=SEED
        )

        log_event("metric_update", {{"metric": "dataset_samples", "value": len(X)}})
        log_event("metric_update", {{"metric": "dataset_features", "value": X.shape[1]}})
        """
        ).strip()

    def generate_requirements(self, plan: PlanDocumentV11) -> List[str]:
        """Pip requirements for Excel dataset loading."""
        return [
            "pandas==2.2.2",
            "xlrd>=2.0.1",  # For .xls files
            "openpyxl>=3.1.0",  # For .xlsx files
            "scikit-learn==1.5.1",
        ]


class HuggingFaceDatasetGenerator(CodeGenerator):
    """
    Generates code to load HuggingFace datasets with streaming support.

    Supports text datasets like:
    - SST-2: Stanford Sentiment Treebank (67MB)
    - IMDB: Movie reviews (130MB)
    - AG News: News articles (20MB)
    - TREC: Question classification (5MB)

    Features:
    - Lazy loading with caching
    - Streaming mode for huge datasets
    - OFFLINE_MODE support
    - Converts to sklearn-compatible format (Phase 2: bag-of-words)
    """

    def __init__(self, metadata: DatasetMetadata):
        """
        Initialize with dataset metadata.

        Args:
            metadata: Dataset metadata from registry
        """
        self.metadata = metadata

    def generate_imports(self, plan: PlanDocumentV11) -> List[str]:
        """Import statements for HuggingFace dataset loading."""
        return [
            "from datasets import load_dataset",
            "from sklearn.feature_extraction.text import CountVectorizer",
            "from sklearn.model_selection import train_test_split",
            "import os",
        ]

    def generate_code(self, plan: PlanDocumentV11) -> str:
        """
        Generate code to load HuggingFace dataset with caching.

        Cache behavior:
        - Uses DATASET_CACHE_DIR (default: ./data/cache)
        - download_mode="reuse_dataset_if_exists" reuses cache
        - OFFLINE_MODE=true fails if not cached

        Preprocessing (Phase 2):
        - Converts text to bag-of-words (CountVectorizer)
        - This allows sklearn models (LogisticRegression) to work
        - Phase 3 will add real NLP models (TextCNN, BERT)
        """
        dataset_name = plan.dataset.name
        hf_path = self.metadata.hf_path
        hf_path_str = ", ".join(f'"{p}"' for p in hf_path)
        split = plan.dataset.split or "train"

        return textwrap.dedent(
            f"""
        # Dataset: {dataset_name} (HuggingFace - cached download)
        CACHE_DIR = os.getenv("DATASET_CACHE_DIR", "./data/cache")
        OFFLINE_MODE = os.getenv("OFFLINE_MODE", "false").lower() == "true"

        log_event("stage_update", {{"stage": "dataset_load", "dataset": "{dataset_name}"}})

        # Load with caching (downloads only if not cached)
        dataset = load_dataset(
            {hf_path_str},
            cache_dir=CACHE_DIR,
            download_mode="reuse_dataset_if_exists",  # Reuse cache if available
        )

        # Extract split
        split_name = "{split}" if "{split}" in dataset else "train"
        train_data = dataset[split_name]

        # Convert to sklearn-compatible format
        # Phase 2: Simple bag-of-words (Phase 3 will add real NLP models)

        # Detect text field (common field names)
        text_field = None
        for field in ["sentence", "text", "content", "review"]:
            if field in train_data.features:
                text_field = field
                break

        if text_field is None:
            raise ValueError(f"Could not find text field in dataset. Available fields: {{list(train_data.features.keys())}}")

        # Extract texts and labels
        texts = [row[text_field] for row in train_data]

        # Detect label field
        label_field = "label" if "label" in train_data.features else list(train_data.features.keys())[1]
        labels = [row[label_field] for row in train_data]

        # Vectorize text (bag-of-words for sklearn compatibility)
        MAX_FEATURES = int(os.getenv("MAX_BOW_FEATURES", "1000"))
        vectorizer = CountVectorizer(max_features=MAX_FEATURES)
        X = vectorizer.fit_transform(texts).toarray()
        y = np.array(labels)

        # Subsample for CPU budget
        MAX_SAMPLES = int(os.getenv("MAX_TRAIN_SAMPLES", "5000"))
        if len(X) > MAX_SAMPLES:
            indices = np.random.RandomState(SEED).choice(len(X), MAX_SAMPLES, replace=False)
            X, y = X[indices], y[indices]

        # Split train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=SEED
        )

        log_event("metric_update", {{"metric": "dataset_samples", "value": len(X)}})
        """
        ).strip()

    def generate_requirements(self, plan: PlanDocumentV11) -> List[str]:
        """Pip requirements for HuggingFace dataset loading."""
        return [
            "datasets>=2.14.0",
            "scikit-learn==1.5.1",
        ]
