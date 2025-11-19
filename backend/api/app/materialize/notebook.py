from __future__ import annotations

import json
import textwrap
from hashlib import sha256
from typing import List, Tuple

import nbformat
from nbformat.v4 import new_code_cell, new_markdown_cell, new_notebook

from ..schemas.plan_v1_1 import PlanDocumentV11
from .generators.factory import GeneratorFactory


DEFAULT_REQUIREMENTS: List[str] = [
    "numpy==1.26.4",
    "scikit-learn==1.5.1",
    "pandas==2.2.2",
    "matplotlib==3.9.0",
    "jupyter==1.1.1"
]


def _primary_metric(plan: PlanDocumentV11) -> str:
    return plan.metrics[0].name if plan.metrics else "metric"


def build_requirements(plan: PlanDocumentV11) -> Tuple[str, str]:
    """
    Build requirements.txt content from plan using generator requirements.

    Collects requirements from:
    1. DEFAULT_REQUIREMENTS (base dependencies)
    2. Dataset generator requirements
    3. Model generator requirements

    Returns:
        Tuple of (requirements_text, env_hash)
    """
    requirements = set(DEFAULT_REQUIREMENTS)

    # Get generators and collect their requirements
    dataset_gen = GeneratorFactory.get_dataset_generator(plan)
    model_gen = GeneratorFactory.get_model_generator(plan)

    dataset_reqs = dataset_gen.generate_requirements(plan)
    model_reqs = model_gen.generate_requirements(plan)

    requirements.update(dataset_reqs)
    requirements.update(model_reqs)

    sorted_lines = sorted(requirements)
    requirements_text = "\n".join(sorted_lines) + "\n"
    env_hash = sha256("\n".join(sorted_lines).encode("utf-8")).hexdigest()
    return requirements_text, env_hash


def build_notebook_bytes(plan: PlanDocumentV11, plan_id: str, paper=None) -> bytes:
    """
    Build a Jupyter notebook from a plan using modular code generators.

    Phase 1: Uses GeneratorFactory to get generators, which returns
             SyntheticDatasetGenerator and SklearnLogisticGenerator.
             This produces IDENTICAL output to the previous implementation.

    Phase A.5: Supports user-uploaded datasets via paper context.

    Future Phases: Factory will intelligently select generators based on
                   plan.dataset.name, plan.model.name, and plan.config.framework.

    Args:
        plan: Plan document to materialize
        plan_id: Plan ID for notebook header
        paper: Optional PaperRecord with uploaded dataset (Phase A.5)

    Returns:
        Notebook bytes (UTF-8 encoded JSON)
    """
    # Get code generators via factory (Phase 2: smart dataset selection, Phase A.5: uploaded datasets)
    dataset_gen = GeneratorFactory.get_dataset_generator(plan, paper=paper)
    model_gen = GeneratorFactory.get_model_generator(plan)

    # Collect imports from generators
    dataset_imports = dataset_gen.generate_imports(plan)
    model_imports = model_gen.generate_imports(plan)
    all_imports = sorted(set(dataset_imports + model_imports))

    # Generate dataset and model code sections
    dataset_code = dataset_gen.generate_code(plan)
    model_code = model_gen.generate_code(plan)

    # Intro cell (unchanged)
    intro = new_markdown_cell(
        textwrap.dedent(
            f"""
            # Plan {plan_id}

            This notebook was generated automatically from Plan JSON v1.1.
            It follows the declared dataset, model, and configuration using a
            deterministic CPU-only workflow.
            """
        ).strip()
    )

    # Setup cell with base imports
    setup_code = f"""import json
import os
import random
import sys
from pathlib import Path

import numpy as np

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

EVENTS_PATH = Path("events.jsonl")
METRICS_PATH = Path("metrics.json")

if EVENTS_PATH.exists():
    EVENTS_PATH.unlink()
if METRICS_PATH.exists():
    METRICS_PATH.unlink()

def log_event(event_type: str, payload: dict) -> None:
    EVENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with EVENTS_PATH.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps({{"event": event_type, **payload}}) + "\\n")

def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    if TORCH_AVAILABLE:
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            raise RuntimeError("E_GPU_REQUESTED: CUDA devices are not permitted during runs")
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False

SEED = {plan.config.seed}
seed_everything(SEED)
log_event("stage_update", {{"stage": "seed_check", "seed": SEED}})
print("Notebook generated for Plan {plan_id}")
print("Python version:", sys.version)
print("Seed set to", SEED)
if TORCH_AVAILABLE:
    print("Torch version:", torch.__version__)
else:
    print("Torch not installed (not required for this plan)")"""

    # Generator-specific imports cell
    imports_code = "\n".join(all_imports) if all_imports else "# No additional imports needed"

    # Assemble notebook cells
    cells = [
        intro,
        new_code_cell(setup_code),
        new_code_cell(imports_code),
        new_code_cell(dataset_code),
        new_code_cell(model_code),
    ]

    # Create and serialize notebook
    notebook = new_notebook(
        cells=cells,
        metadata={
            "kernelspec": {"name": "python3", "display_name": "Python 3"},
            "language_info": {"name": "python"},
        },
    )
    return nbformat.writes(notebook).encode("utf-8")
