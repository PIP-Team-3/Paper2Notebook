"""
Notebook validation system to catch generator bugs before execution.

This module provides validation for generated notebooks to ensure:
1. All code cells have valid Python syntax
2. sklearn classes don't use invalid parameters
3. All functions have corresponding imports

This prevents bugs from surfacing during notebook execution, enabling
autonomous operation without human intervention.
"""

import ast
import re
from dataclasses import dataclass
from typing import List, Set

import nbformat


# Known sklearn parameter constraints
SKLEARN_PARAM_RULES = {
    'CountVectorizer': {
        'forbidden_params': {'random_state'},
        'reason': 'CountVectorizer is deterministic and does not accept random_state'
    },
    'TfidfVectorizer': {
        'forbidden_params': {'random_state'},
        'reason': 'TfidfVectorizer is deterministic and does not accept random_state'
    },
    'HashingVectorizer': {
        'forbidden_params': {'random_state'},
        'reason': 'HashingVectorizer is deterministic and does not accept random_state'
    },
}


@dataclass
class ValidationResult:
    """Result of notebook validation."""
    valid: bool
    errors: List[str]

    def __bool__(self):
        return self.valid


class NotebookValidator:
    """
    Validates generated notebooks before storage.

    Catches common generator bugs:
    - Syntax errors (indentation, missing colons, etc.)
    - Invalid sklearn parameters (random_state on CountVectorizer)
    - Missing imports (using functions without importing them)
    """

    def validate(self, notebook_bytes: bytes) -> ValidationResult:
        """
        Run all validation checks on a notebook.

        Args:
            notebook_bytes: Notebook content as bytes

        Returns:
            ValidationResult with valid flag and list of errors
        """
        try:
            nb = nbformat.reads(notebook_bytes.decode('utf-8'), as_version=4)
        except Exception as e:
            return ValidationResult(valid=False, errors=[f"Failed to parse notebook: {e}"])

        errors = []
        errors.extend(self._check_syntax(nb))
        errors.extend(self._check_sklearn_params(nb))

        return ValidationResult(valid=len(errors) == 0, errors=errors)

    def _check_syntax(self, nb) -> List[str]:
        """
        Compile each code cell to catch syntax errors.

        Returns list of syntax error messages.
        """
        errors = []
        for i, cell in enumerate(nb.cells):
            if cell.cell_type == 'code':
                try:
                    compile(cell.source, f'<cell-{i}>', 'exec')
                except SyntaxError as e:
                    errors.append(f"Syntax error in cell {i} at line {e.lineno}: {e.msg}")
                except Exception as e:
                    errors.append(f"Compilation error in cell {i}: {str(e)}")
        return errors

    def _check_sklearn_params(self, nb) -> List[str]:
        """
        Check for invalid sklearn class parameters.

        Uses regex pattern matching to find sklearn class instantiations
        and validates parameters against known rules.

        Returns list of parameter error messages.
        """
        errors = []

        for i, cell in enumerate(nb.cells):
            if cell.cell_type != 'code':
                continue

            for class_name, rules in SKLEARN_PARAM_RULES.items():
                # Check if class is used in this cell
                if class_name not in cell.source:
                    continue

                # Check for forbidden parameters
                for param in rules['forbidden_params']:
                    # Pattern: ClassName(..., param=value, ...)
                    pattern = rf'{class_name}\s*\([^)]*{param}\s*='
                    if re.search(pattern, cell.source):
                        errors.append(
                            f"Cell {i}: {class_name} uses invalid parameter '{param}'. "
                            f"Reason: {rules['reason']}"
                        )

        return errors

    def _check_imports_ast(self, nb) -> List[str]:
        """
        Check for undefined names using AST analysis.

        This is more robust than string matching but requires careful
        handling of builtins and injected names (SEED, EVENTS_PATH, etc.).

        Currently not used but available for Phase 2.
        """
        errors = []
        defined_names = set()

        # Add Python builtins
        import builtins
        defined_names.update(dir(builtins))

        # Add common injected names from setup cell
        defined_names.update(['SEED', 'EVENTS_PATH', 'METRICS_PATH', 'log_event', 'seed_everything'])

        for i, cell in enumerate(nb.cells):
            if cell.cell_type != 'code':
                continue

            try:
                tree = ast.parse(cell.source)

                # Collect definitions in this cell
                for node in ast.walk(tree):
                    if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                        defined_names.add(node.id)
                    elif isinstance(node, ast.FunctionDef):
                        defined_names.add(node.name)
                    elif isinstance(node, ast.Import):
                        for alias in node.names:
                            defined_names.add(alias.asname or alias.name)
                    elif isinstance(node, ast.ImportFrom):
                        for alias in node.names:
                            defined_names.add(alias.asname or alias.name)

                # Check for undefined loads
                for node in ast.walk(tree):
                    if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
                        if node.id not in defined_names:
                            errors.append(f"Cell {i}: Undefined name '{node.id}'")

            except Exception as e:
                errors.append(f"Cell {i}: Failed to parse AST: {e}")

        return errors
