import argparse
import asyncio
import logging
import os
import threading
from collections import defaultdict
from datetime import datetime
from typing import (
    Annotated,
    Any,
    Callable,
    Dict,
    List,
    Literal,
    NotRequired,
    Optional,
    TypedDict,
    Union,
)

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.redis import RedisSaver
from langgraph.store.postgres import PostgresStore
from langsmith import utils as ls_utils
from pydantic import utils
from tavily import AsyncTavilyClient, TavilyClient

from asset_processing_service.api_client import (
    create_test_job,
    delete_test_job_by_id,
    delete_test_jobs_by_user_id,
    drop_asset_processing_jobs_table,
    ensure_postgres_tables,
    fetch_job,
    fetch_jobs,
    truncate_asset_processing_jobs_table,
    update_job_details,
)
from asset_processing_service.job_processor import process_job
from asset_processing_service.life_goals_agent import (
    get_builder_personal,
    get_builder_work,
)
from asset_processing_service.my_utils.configuration import configuration
from asset_processing_service.my_utils.env_loader import load_dotenv_once
from asset_processing_service.my_utils.logger_setup import setup_logger
from asset_processing_service.my_utils.postgres_store_loader import (
    open_postgres_store_with_fallback,
)
from asset_processing_service.setup_config import c_setup_config

load_dotenv_once()
# from asset_processing_service.config import config
setup_config = c_setup_config.get_instance()
logger = setup_config.get_logger()


_RUNTIME_INITIALIZED = False

_INIT_LOCK = threading.Lock()


LANGCHAIN_PROJECT_NAME = "BreakpointsProject"


#####################################################################
### START
#####################################################################
def env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def init_runtime() -> None:
    """Initialize logging and environment variables at runtime.

    This function exists to avoid import-time side effects, which can break or slow down
    documentation builds (e.g., when Sphinx autodoc imports the module).

    Side Effects
    ------------
    - Configures logging via :func:`my_utils.logger_setup.setup_logger`.
    - Loads and validates environment variables via :func:`my_utils.load_env.load_environment`.

    :returns: ``None``.
    """
    global _RUNTIME_INITIALIZED

    if _RUNTIME_INITIALIZED:
        return
    with _INIT_LOCK:
        if _RUNTIME_INITIALIZED:
            return

        try:
            setup_config.get_llm()  # Initialize LLM (and related setup) at runtime
            logger.debug("llm  initialized in init_runtime()")

            if setup_config.langsmith_enable:
                #  LangSmith
                # Enable LangChain's advanced tracing features by setting the environment variable.
                # This activation allows for detailed tracking of operations within LangChain,
                # facilitating debugging and performance monitoring.
                # Setting this variable to "true" enables tracing; any other value will disable it.
                os.environ["LANGCHAIN_TRACING_V2"] = "true"

                # Specify the project name for organizing traces in LangChain.
                # By defining this environment variable, all traces generated during the application's
                # execution will be associated with the "Router Agent Project".
                # This categorization aids in the systematic analysis and retrieval of trace data.
                # If the specified project does not exist, it will be created automatically upon the first trace.

                # Set the LANGCHAIN_PROJECT_NAME at the top of the file
                os.environ["LANGCHAIN_PROJECT"] = LANGCHAIN_PROJECT_NAME

            # Check if tracing is enabled in the current environment
            # This function evaluates the current tracing status, which is determined by
            # environment variables or prior configuration within the application.
            # It returns a boolean value:
            # - True: Tracing is active.
            # - False: Tracing is inactive.
            # This check is essential for conditional tracing, allowing developers to
            # enable or disable tracing based on specific conditions or configurations.
            is_tracing_active = ls_utils.tracing_is_enabled()
            # Print the status of tracing
            logger.debug(
                f"LangSmith Tracing is {'enabled' if is_tracing_active else 'disabled'}."
            )

            logger.debug("Setting up Tavily clients...")
            # setup Tavily clients (both sync and async) and store in setup_config for use throughout the app
            # Sync
            setup_config.tavily_client = TavilyClient(
                os.environ["TAVILY_API_KEY"]
            )  # Initialize tavily client (and related setup) at runtime

            # Async
            setup_config.get_tavily_async_client()  # Initialize tavily async client (and related setup) at runtime
            logger.debug("Tavily clients initialized in init_runtime()")

            # check for Server API Key and log a warning if not set (since it's required for the heartbeat endpoint)
            logger.debug("Checking for SERVER_API_KEY in environment variables...")
            setup_config.get_server_api_key()

            logger.debug("Validating setup_config initialization...")
            setup_config.validate_initialization()

            logger.debug("my_langchain_logger Started!")
            logger.debug(f"Effective LOG_LEVEL from env: {os.getenv('LOG_LEVEL')}")
            """
                DEBUG = 10
                INFO = 20
                WARNING = 30
                ERROR = 40
                CRITICAL = 50            
            """
            logger.debug(f"Logger effective level: {logger.getEffectiveLevel()}")

            _RUNTIME_INITIALIZED = True
        except Exception as e:
            _RUNTIME_INITIALIZED = False
            logger.exception(f"init_runtime() failed: {e}")  #
            raise


async def print_job(job_id: str) -> None:
    if job_id is None or not str(job_id).strip():
        raise ValueError("job_id is required and cannot be empty.")

    job = await fetch_job(job_id)
    if job is None:
        logger.warning("Job not found: id=%s", job_id)
        return

    logger.info(
        "Job id=%s\nstatus=%s\nattempts=%s\nerror_message=%s",
        job.id,
        job.status,
        job.attempts,
        job.error_message,
    )


async def job_fetcher_run(
    job_queue: asyncio.Queue,
    jobs_pending_or_in_progress: set,
):
    if setup_config.testing_flag2:
        logger.info("job_fetcher_run is running in TESTING MODE ")
        job_fetcher_run_cnt = 0

    while True:
        try:
            if setup_config.testing_flag2:
                job_fetcher_run_cnt += 1
                logger.info(
                    f"job_fetcher_run count: {job_fetcher_run_cnt} / {setup_config.job_fetcher_run_number}"
                )
                if job_fetcher_run_cnt > setup_config.job_fetcher_run_number:
                    logger.info(
                        f"job_fetcher_run has reached the maximum run number of {setup_config.job_fetcher_run_number}. Exiting job_fetcher_run."
                    )
                    break  # Exit the loop to stop the job fetcher after reaching the specified run number

            current_time = datetime.now().timestamp()
            logger.info(f"Fetching jobs current time: {current_time}")
            # Fetch jobs from the API and add them to the queue if they are not already being processed
            jobs = await fetch_jobs()

            for job in jobs:
                # handle the case where the job is in progress
                if job.status == "in_progress" and job.last_heartbeat:
                    """
                    if job has a heartbeat that is super old, job is stuck. Fail it. Remove job from queue.
                    """
                    last_heartbeat_time = job.last_heartbeat.timestamp()
                    time_since_last_heartbeat = abs(current_time - last_heartbeat_time)
                    logger.info(
                        f"Time since last heartbeat for job {job.id}: {time_since_last_heartbeat}"
                    )
                    """
                    if job is created or failed, try to work on job as long as it is under the max attempt count.
                    add job to the queue to jobs_pending_or_in_progress (set)
                    """
                    #######################################################################
                    # STUCK_JOB_THRESHOLD_SECONDS"
                    #######################################################################
                    if (
                        time_since_last_heartbeat
                        > setup_config.stuck_job_threshold_seconds
                    ):
                        logger.info(f"Job {job.id} is stuck. Failing job.")
                        await update_job_details(
                            job.id,
                            {
                                "status": "failed",
                                "errorMessage": "Job is stuck - no heartbeat received recently",
                                "attempts": job.attempts + 1,
                            },
                        )
                        if setup_config.testing_flag:
                            await print_job(job.id)
                        if job.id in jobs_pending_or_in_progress:
                            jobs_pending_or_in_progress.remove(job.id)
                ###########################################################################
                # created" or "failed"
                ###########################################################################
                elif job.status in ["created", "failed"]:
                    if job.attempts >= setup_config.max_job_attempts:
                        logger.info(
                            f"Job {job.id} has exceeded max attempts. Failing job."
                        )
                        ###################################################################
                        # "max_attempts_exceeded"
                        ###################################################################
                        # Update job status to "max_attempts_exceeded" and set error message
                        await update_job_details(
                            job.id,
                            {
                                "status": "max_attempts_exceeded",
                                "errorMessage": "Max attempts exceeded",
                            },
                        )
                        if setup_config.testing_flag:
                            await print_job(job.id)
                        ###################################################################
                        # "created"
                        ###################################################################
                    elif job.id not in jobs_pending_or_in_progress:
                        logger.info(f"Adding job to queue: {job.id}")
                        jobs_pending_or_in_progress.add(job.id)
                        await job_queue.put(job)

            await asyncio.sleep(3)

        except Exception as e:
            logger.error(f"Error fetching jobs: {e}")
            await asyncio.sleep(3)


async def worker_run(
    worker_id: int,
    job_queue: asyncio.Queue,
    jobs_pending_or_in_progress: set,
    job_locks: dict,
    graphs: dict,
):
    if setup_config.testing_flag2:
        logger.info("worker_run is running in TESTING MODE returning early ")
        return
    while True:
        try:
            # Wait for a job to be available in the queue and get it
            job = await job_queue.get()

            # Use a lock to ensure that only one worker can process a job at a time
            async with job_locks[job.id]:
                logger.info(f"Worker {worker_id} processing job {job.id}...")
                try:
                    # Do the actual job processing
                    # process_job(job: AssetProcessingJob, graphs: dict)
                    await process_job(job, graphs)
                except Exception as e:
                    logger.error(f"Error processing job {job.id}: {e}")
                    error_message = str(e)
                    await update_job_details(
                        job.id,
                        {
                            "status": "failed",
                            "errorMessage": error_message,
                            "attempts": job.attempts + 1,
                        },
                    )
                finally:
                    # Remove the job from the set of pending or in progress jobs and release the lock
                    jobs_pending_or_in_progress.discard(job.id)
                    job_locks.pop(job.id, None)

            # Mark the job as done in the queue
            job_queue.task_done()
        except Exception as e:
            logger.error(f"Error in worker {worker_id}: {e}")
            await asyncio.sleep(3)


# --- Shutdown Debug Helpers (NEW) ---
async def _shutdown_default_executor(logger: logging.Logger) -> None:
    """Force shutdown of asyncio's default ThreadPoolExecutor to avoid hanging non-daemon threads."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return
    try:
        await loop.shutdown_default_executor()
        logger.info("Shutdown debug: default executor shutdown complete.")
    except Exception as e:
        logger.warning("Shutdown debug: default executor shutdown failed: %r", e)


def _log_active_threads(logger: logging.Logger) -> None:
    threads = threading.enumerate()
    logger.warning("Shutdown debug: %d active thread(s):", len(threads))
    for t in threads:
        logger.warning(
            "  thread name=%r ident=%s daemon=%s alive=%s",
            t.name,
            t.ident,
            t.daemon,
            t.is_alive(),
        )


async def _cancel_and_await_pending_tasks(
    logger: logging.Logger,
) -> None:
    """Cancel pending tasks (except current) and await them so cleanup runs."""
    try:
        current = asyncio.current_task()
        tasks = [t for t in asyncio.all_tasks() if t is not current]
    except RuntimeError:
        # No running loop in this context
        return

    if not tasks:
        logger.info("Shutdown debug: no pending asyncio tasks.")
        return

    logger.warning("Shutdown debug: %d pending asyncio task(s):", len(tasks))
    for t in tasks:
        try:
            coro = t.get_coro()
            coro_name = getattr(coro, "__qualname__", repr(coro))
        except Exception:
            coro_name = "<unknown>"

        logger.warning(
            "  task=%r name=%r done=%s cancelled=%s coro=%s",
            t,
            t.get_name() if hasattr(t, "get_name") else None,
            t.done(),
            t.cancelled(),
            coro_name,
        )

    # Cancel then await so each task can run its CancelledError cleanup. :contentReference[oaicite:2]{index=2}
    for t in tasks:
        t.cancel()

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for i, r in enumerate(results):
        if isinstance(r, BaseException):
            logger.warning("Shutdown debug: task[%d] ended with: %r", i, r)


def parse_test_numbers(raw: Optional[str]) -> Optional[list[int]]:
    """Parse a comma-separated string like '1,4' into [1, 4]."""
    if raw is None:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    parts = [p.strip() for p in cleaned.split(",")]
    numbers: list[int] = []
    for p in parts:
        if not p:
            continue
        try:
            numbers.append(int(p))
        except ValueError as e:
            raise ValueError(
                f"Invalid test number '{p}'. Use something like: 1,3,4"
            ) from e
    return numbers if numbers else None


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Asset Processing Service - run workers or create test jobs.",
    )
    parser.add_argument(
        "--tests",
        type=str,
        default=None,
        help="Comma-separated test job numbers. Example: --tests 1,4",
    )
    return parser


"""
    normal_job_flag, Set this to True if you want to create a normal test job that should be processed successfully
    max_attempts_job_flag, Set this to True if you want to create a test job that has already exceeded max attempts
    in_progress_job_flag, Set this to True if you want to create a test job that is in progress with a recent heartbeat
    stuck_job_flag, Set this to True if you want to create a test job that is in progress with an old heartbeat (stuck)
"""


def describe_test_menu() -> str:
    return (
        "Test menu:\n"
        "  1 = normal job (created)\n"
        "  2 = max attempts job (failed, attempts=5)\n"
        "  3 = in_progress job (recent heartbeat)\n"
        "  4 = stuck job (old heartbeat)\n"
        "  5 = get todo list job (created)\n"
    )


async def async_main(test_numbers: Optional[list[int]] = None) -> int:

    # Startup
    """
    Return an exit code:
      - 0 = success
      - non-zero = failure
    """
    job_fetcher_task = None
    workers = []
    checkpointer_cm = None
    store_cm = None
    test_job_ids: list[str] = []
    try:
        # -------- STARTUP (runs once) --------
        init_runtime()

        # Defaults (no tests selected)
        my_testing_normal_job_flag = False
        my_testing_normal_get_job_flag = False
        my_testing_max_attempts_job_flag = False
        my_testing_in_progress_job_flag = False
        my_testing_stuck_job_flag = False

        testing_mode = setup_config.testing_flag or bool(test_numbers)
        if testing_mode:
            logger.info("async_main is running in TESTING MODE ")
            setup_config.testing_flag = testing_mode

            if test_numbers is not None:
                logger.info("async_main is running with tests=%s", test_numbers)
                logger.info("\n%s", describe_test_menu())

            # If tests were provided, flip flags based on membership
            if test_numbers:
                selected = set(test_numbers)
                my_testing_normal_job_flag = 1 in selected
                my_testing_normal_get_job_flag = 5 in selected
                my_testing_max_attempts_job_flag = 2 in selected
                my_testing_in_progress_job_flag = 3 in selected
                my_testing_stuck_job_flag = 4 in selected

            # await drop_asset_processing_jobs_table()  # FIX THIS NOW - drop table to ensure clean slate for testing. In production, you would not do this.
            await ensure_postgres_tables()

            # You can remove this after confirming that jobs are being created and processed correctly
            await truncate_asset_processing_jobs_table()
            # testing normal job
            if my_testing_normal_job_flag:
                inserted_id = await create_test_job(
                    thread_id="test_thread_1",
                    user_id="test_user_1",
                    message="Add todo: Buy milk and eggs.",
                )
                test_job_ids.append(inserted_id)

            # testing normal job Get todo
            if my_testing_normal_get_job_flag:
                inserted_id = await create_test_job(
                    thread_id="test_thread_1",
                    user_id="test_user_1",
                    message="get my todo list.",
                )
                test_job_ids.append(inserted_id)

            # testing job with max attempts
            if my_testing_max_attempts_job_flag:
                inserted_id = await create_test_job(
                    thread_id="test_thread_1",
                    user_id="test_user_1",
                    message="Testing failed from create_test_job()",
                    status="failed",
                    attempts=5,
                )
                test_job_ids.append(inserted_id)

            # testing in_progress job with recent heartbeat
            if my_testing_in_progress_job_flag:
                inserted_id = await create_test_job(
                    thread_id="test_thread_1",
                    user_id="test_user_1",
                    message="Testing in_progress from create_test_job()",
                    status="in_progress",
                    attempts=0,
                    last_heartbeat=datetime.now(),
                )
                test_job_ids.append(inserted_id)

            # testing max heartbeat time by setting last heartbeat to a very old date 1/1/2026
            if my_testing_stuck_job_flag:
                inserted_id = await create_test_job(
                    thread_id="test_thread_1",
                    user_id="test_user_1",
                    message="Testing in_progress from create_test_job()",
                    status="in_progress",
                    attempts=0,
                    last_heartbeat=datetime(2026, 1, 1, 0, 0, 0),
                )
                test_job_ids.append(inserted_id)

        # TODO: Create a new Function for LangGraph agent
        #########################################################################
        # add LangGraph agent and graph builder setup here
        #########################################################################
        # -------- LangGraph memory setup (NO FastAPI) --------
        # db_url = os.getenv(
        #     "DB_URL",
        #     "postgresql://postgres:postgres@localhost:5432/langgraph?sslmode=disable",
        # )

        redis_uri = (
            setup_config.get_redis_url()
        )  # This will handle fallback logic and validation

        # --- Checkpointer (short-term / per-thread) ---
        # Open RedisSaver context manager and keep it for app lifetime
        checkpointer_cm = RedisSaver.from_conn_string(redis_uri)
        checkpointer = checkpointer_cm.__enter__()
        # Create tables (safe to run at startup)
        checkpointer.setup()

        # --- Store (long-term / cross-thread) ---
        # store_cm = PostgresStore.from_conn_string(db_url)
        # store = store_cm.__enter__()
        # store.setup()

        # --- Store (long-term / cross-thread) ---
        db_url = setup_config.get_db_url()
        db_url_fallback = setup_config.get_db_url_fallback()

        store_cm, store = open_postgres_store_with_fallback(
            db_url=db_url,
            db_url_fallback=db_url_fallback,
        )
        store.setup()

        # IMPORTANT: you must import these from wherever you defined them
        # from asset_processing_service.life_goals_agent import get_builder_personal, get_builder_work
        builders = {
            "personal": get_builder_personal(),
            # "work": get_builder_work(),
        }

        graphs = {
            kind: builder.compile(checkpointer=checkpointer, store=store)
            for kind, builder in builders.items()
        }

        #########################################################################
        # End of code for LangGraph agent and graph builder setup)
        #########################################################################

        # Create a queue for jobs and a set to track jobs that are pending or in progress
        job_queue = asyncio.Queue()
        # CSreate a dictionary of locks for each job to prevent multiple workers from processing the same job simultaneously
        jobs_pending_or_in_progress = set()
        job_locks = defaultdict(asyncio.Lock)

        # Start the job fetcher task to continuously fetch jobs from the API and add them to the queue
        job_fetcher_task = asyncio.create_task(
            job_fetcher_run(job_queue, jobs_pending_or_in_progress)
        )
        # Start worker tasks to process jobs from the queue (you can adjust the number of workers as needed)
        workers = [
            asyncio.create_task(
                worker_run(
                    i + 1,
                    job_queue,
                    jobs_pending_or_in_progress,
                    job_locks,
                    graphs,
                )
            )
            for i in range(setup_config.max_num_workers)
        ]

        # -------- RUN (runs until cancelled) --------
        # We can await the job_fetcher_task here because we want it to run indefinitely.
        await asyncio.gather(job_fetcher_task, *workers)
        return 0

    except Exception as e:
        logger.exception(f"async_main() failed: {e}")
        return 1

    finally:
        # -------- SHUTDOWN (runs once) --------
        if job_fetcher_task is not None:
            job_fetcher_task.cancel()
        for t in workers:
            t.cancel()

        if job_fetcher_task is not None or workers:
            await asyncio.gather(
                *(x for x in [job_fetcher_task, *workers] if x is not None),
                return_exceptions=True,
            )

        if store_cm is not None:
            store_cm.__exit__(None, None, None)

        if checkpointer_cm is not None:
            checkpointer_cm.__exit__(None, None, None)

        if setup_config.testing_flag:
            try:
                for job_id in test_job_ids:
                    await delete_test_job_by_id(job_id)
            except Exception:
                logger.exception("Cleanup failed while deleting test jobs.")

        # --- Shutdown debug (threads + tasks) ---
        await _cancel_and_await_pending_tasks(logger)
        await _shutdown_default_executor(logger)
        _log_active_threads(logger)
        logger.info("Shutdown complete.")

    ###########################################################################
    return 0  # (explicitly return exit code on normal completion)


def main():
    """
    Run async_main and exit the process with its exit code.
    """
    exit_code = 0
    try:
        parser = build_arg_parser()
        args = parser.parse_args()
        test_numbers = parse_test_numbers(args.tests)
        exit_code = asyncio.run(async_main(test_numbers=test_numbers))
    except Exception as e:
        # If anything unexpected bubbles up, treat as fatal
        logger.exception("Fatal error in main()" f" - exiting with code 1: {e}")
        exit_code = 1

    logger.info("All done - SystemExit.")
    return exit_code


if __name__ == "__main__":
    exit_code = main()
    logger.info("Done.")
    logging.shutdown()
    # raise SystemExit(exit_code)
