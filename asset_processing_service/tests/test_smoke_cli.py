# tests/test_smoke_cli.py
import os
import subprocess
import sys
from pathlib import Path

import pytest


def _run_cli(
    cmd: list[str], env: dict[str, str], timeout_s: int = 120, cwd: Path | None = None
):
    """
    Run CLI and ALWAYS return combined output for debugging, even on timeouts.

    Uses Popen+communicate so we can capture output on TimeoutExpired and clean up properly.
    Python docs recommend killing the process and finishing communication on timeout. :contentReference[oaicite:2]{index=2}
    """
    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd) if cwd is not None else None,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,  # combine stderr into stdout for ordered logs :contentReference[oaicite:3]{index=3}
        text=True,
    )
    try:
        out, _ = proc.communicate(timeout=timeout_s)
        return proc.returncode, out or ""
    except subprocess.TimeoutExpired as e:
        # Capture whatever we have, then terminate cleanly.
        partial = ""
        if getattr(e, "stdout", None):
            # note: depending on python version, stdout may be bytes even with text=True :contentReference[oaicite:4]{index=4}
            partial = (
                e.stdout.decode(errors="replace")
                if isinstance(e.stdout, (bytes, bytearray))
                else str(e.stdout)
            )

        proc.kill()
        out2, _ = proc.communicate()
        combined = (partial or "") + (out2 or "")
        return 124, combined  # 124 commonly used for timeouts; helpful signal in CI


@pytest.mark.smoke
def test_cli_tests_1_exits_cleanly():
    # Run the real module entry to validate packaging + CLI wiring.
    cmd = [sys.executable, "-m", "asset_processing_service.main", "--tests", "1"]

    env = os.environ.copy()
    env["TESTING_FLAG"] = "true"
    env["JOB_FETCHER_RUN_NUMBER"] = "3"

    # Ensure consistent relative-path behavior if the app expects repo-root cwd.
    repo_root = Path(__file__).resolve().parents[1]

    rc, output = _run_cli(cmd, env=env, timeout_s=120, cwd=repo_root)

    assert rc == 0, f"CLI returned {rc}. Output:\n{output}\n"
    assert (
        "Shutdown complete." in output
    ), f"Missing shutdown message. Output:\n{output}\n"
