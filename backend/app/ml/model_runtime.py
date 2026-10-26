"""Reject incompatible environments before deserializing frozen estimators.

Scikit-learn does not support loading saved estimators across versions. Keep
this contract aligned with requirements-models.txt and the experiment runtime.
"""
from importlib.metadata import PackageNotFoundError, version
import sys

MODEL_RUNTIME = {
    "numpy": "2.1.3",
    "pandas": "2.2.3",
    "scipy": "1.14.1",
    "scikit-learn": "1.5.2",
    "joblib": "1.4.2",
    "lightgbm": "4.6.0",
}
MODULE_NAMES = {"scikit-learn": "sklearn"}


def installed_version(distribution):
    # A running process can retain a module imported before pip changed files.
    module = sys.modules.get(MODULE_NAMES.get(distribution, distribution))
    if module is not None and hasattr(module, "__version__"):
        return module.__version__
    return version(distribution)


def validate_model_runtime():
    mismatches = []
    for package, expected in MODEL_RUNTIME.items():
        try:
            actual = installed_version(package)
        except PackageNotFoundError:
            actual = "not installed"
        if actual != expected:
            mismatches.append(f"{package}: expected {expected}, found {actual}")
    if mismatches:
        raise RuntimeError(
            "Saved-model runtime mismatch (" + "; ".join(mismatches) + "). "
            "Install backend/requirements.txt in the project's .venv, then "
            "restart with backend/start.ps1. Existing models must not be "
            "loaded with a different scikit-learn version."
        )
