# tests/conftest.py
import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--run-smoke",
        action="store_true",
        default=False,
        help="Run smoke tests that execute the CLI (may touch DB/Redis).",
    )


def pytest_configure(config):
    # Register marker to avoid unknown-mark warnings and to document intent. :contentReference[oaicite:0]{index=0}
    config.addinivalue_line("markers", "smoke: smoke tests (CLI/integration-style)")


def pytest_collection_modifyitems(config, items):
    # Skip smoke tests unless explicitly enabled via --run-smoke. :contentReference[oaicite:1]{index=1}
    if config.getoption("--run-smoke"):
        return

    skip_smoke = pytest.mark.skip(reason="need --run-smoke to run")
    for item in items:
        if "smoke" in item.keywords:
            item.add_marker(skip_smoke)
