### To run the project, follow these steps:

poetry run asset-processing-service

## How to run tests from the command line

Think of `--tests 1,4` like checking boxes.

- You type numbers in the terminal.
- The program reads them.
- It turns on specific “test switches” (flags) based on which numbers you gave it.
- Then it creates only those test jobs.

Example mapping:

- `1` → create a normal job
- `2` → create a “max attempts” job
- `3` → create an “in progress” job with a recent heartbeat
- `4` → create a “stuck” job with an old heartbeat

And we keep the ids of the jobs we created, so we can delete exactly those jobs at shutdown.

---

## How to run from the command line (Windows)

From your project root (where `pyproject.toml` is), run:

```bash
poetry run python -m asset_processing_service.main --tests 1
```

Or multiple tests:

```bash
poetry run python -m asset_processing_service.main --tests 1,3,4
```

No `--tests` means “normal run” (unless `TESTING_FLAG=true` in your `.env`).

---

---

## How you run pytest

Assuming you’re running from the repo root (`C:\Users\ME\Documents\fullstack\Projects\asset_processing_service`) and using Poetry, here are the **exact commands** you’ll use.

### Run all non-smoke tests (default)

```bash
poetry run pytest
```

This will run everything **except** tests marked `@pytest.mark.smoke` (because your `conftest.py` skips them unless you pass `--run-smoke`).

### Run _everything_, including smoke tests

```bash
poetry run pytest --run-smoke
```

### Run _only_ smoke tests

```bash
poetry run pytest -m smoke --run-smoke
```

(`-m smoke` selects smoke tests; `--run-smoke` prevents your `conftest.py` from skipping them.)

### Run only unit tests (exclude smoke explicitly)

```bash
poetry run pytest -m "not smoke"
```

### Run a single file

```bash
poetry run pytest tests/test_unit_parse_tests.py
```

### Run a single test function

```bash
poetry run pytest tests/test_smoke_cli.py -k test_cli_tests_1_exits_cleanly --run-smoke
```

### Show available options (including your custom flag)

```bash
poetry run pytest -h
```

Note: if you added `--strict-markers` to `addopts` in `pyproject.toml`, pytest will error on unknown markers (useful for catching typos). ([python-basics-tutorial.readthedocs.io][1])

[1]: https://python-basics-tutorial.readthedocs.io/en/latest/test/pytest/config.html?utm_source=chatgpt.com "Configuration - Python Basics"
