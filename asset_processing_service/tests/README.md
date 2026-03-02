Tests TODO / Notes

Smoke-run the app in CLI testing mode:

Args:
["--tests", "1"]

Equivalent command:
poetry run python -m asset_processing_service.main --tests 1

Expected:

- exit code 0
- creates 1 test job
- job_fetcher_run loops N times (JOB_FETCHER_RUN_NUMBER)
- deletes created test job(s) on shutdown
