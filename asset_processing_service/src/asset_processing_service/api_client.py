# src/asset_processing_service/api_client.py
import socket
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp
import asyncpg
import tiktoken

from asset_processing_service.models import Asset, AssetProcessingJob
from asset_processing_service.setup_config import c_setup_config

# from asset_processing_service.config import HEADERS, config
# from asset_processing_service.logger import logger

setup_config = c_setup_config.get_instance()
logger = setup_config.get_logger()


class ApiError(Exception):
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


async def connect_postgres_with_fallback(
    db_url: str,
) -> asyncpg.Connection:
    """
    Try db_url first; if hostname resolution fails (getaddrinfo), retry DB_URL_FALLBACK.
    """

    try:
        return await asyncpg.connect(db_url)
    except (socket.gaierror, OSError) as e:
        errno = getattr(e, "errno", None)
        msg = str(e).lower()

        # DNS resolution failure: Windows commonly shows errno 11001 + "getaddrinfo failed"
        if errno == 11001 or "getaddrinfo failed" in msg:
            fallback_url = setup_config.get_db_url_fallback()
            if not fallback_url:
                raise
            logger.warning(f"retrying with DB_URL_FALLBACK.")
            return await asyncpg.connect(fallback_url)

        raise


async def ensure_postgres_tables() -> None:
    """
    Creates required Postgres tables if they don't exist.

    Requires env var DB_URL, e.g.:
      postgresql://postgres:postgres@localhost:5432/langgraph
      postgresql://postgres:postgres@lg-postgres:5432/langgraph
    """

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    conn: Optional[asyncpg.Connection] = None
    try:
        conn = await connect_postgres_with_fallback(db_url)
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS asset_processing_jobs (
              id TEXT PRIMARY KEY,
              thread_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              todo_kind TEXT NOT NULL DEFAULT 'personal',  --  Added Code
              status TEXT NOT NULL DEFAULT 'created',
              attempts INTEGER NOT NULL DEFAULT 0,
              last_heartbeat TIMESTAMPTZ,
              error_message TEXT,
              size BIGINT NOT NULL,
              message TEXT,
              last_msg_type TEXT,  --  Changed Code
              last_msg_content TEXT,  --  Changed Code
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )

        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_apj_thread_id ON asset_processing_jobs (thread_id);"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_apj_user_id ON asset_processing_jobs (user_id);"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_apj_status ON asset_processing_jobs (status);"
        )

        # Optional, but usually useful if you filter jobs by kind. #  Added Code
        await conn.execute(  #  Added Code
            "CREATE INDEX IF NOT EXISTS idx_apj_todo_kind ON asset_processing_jobs (todo_kind);"  #  Added Code
        )  #  Added Code

        logger.info("Postgres tables ensured (asset_processing_jobs).")

    except Exception as e:
        logger.error(f"Error ensuring Postgres tables: {e}")
        raise
    finally:
        if conn is not None:
            await conn.close()


async def fetch_jobs() -> List[AssetProcessingJob]:

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    conn: Optional[asyncpg.Connection] = None
    try:
        # conn = await asyncpg.connect(db_url)
        conn = await connect_postgres_with_fallback(db_url)

        result = await conn.fetch(
            """
            SELECT
            id,
            thread_id,
            user_id,
            status,
            todo_kind,
            attempts,
            last_heartbeat,
            error_message,
            size,
            message,
            last_msg_type,  --  Changed Code
            last_msg_content,  --  Changed Code
            created_at,
            updated_at
            FROM asset_processing_jobs
            WHERE status IN ('created', 'in_progress', 'failed')
            ORDER BY created_at ASC
            """
        )

        logger.info(f"Fetched {len(result)} jobs from database.")

        availableJobs: List[AssetProcessingJob] = []
        for row in result:
            # Convert asyncpg Record to dict and then to AssetProcessingJob
            # asyncpg's Record supports dict-like access, so we can pass it directly to the AssetProcessingJob constructor.
            availableJobs.append(AssetProcessingJob(**dict(row)))
        return availableJobs

    except Exception as e:
        logger.error(f"Error fetching jobs from database: {e}")
        return []
    finally:
        if conn is not None:
            await conn.close()

    #########################################################################
    # try:
    #     url = f"{config.API_BASE_URL}/asset-processing-job"

    #     #########################################################################

    #     async with aiohttp.ClientSession() as session:
    #         async with session.get(url, headers=HEADERS) as response:
    #             if response.status == 200:
    #                 data = await response.json()

    #                 # Parse the JSON data into AssetProcessingJob instances
    #                 jobs = [AssetProcessingJob(**item) for item in data]
    #                 return jobs

    #             else:
    #                 logger.error(f"Error fetching jobs: {response.status}")
    #                 return []
    # except aiohttp.ClientError as error:
    #     logger.error(f"Error fetching jobs: {error}")
    #     return []


# async def update_job_details(job_id: str, update_data: Dict[str, Any]) -> None:

#     if job_id is None or not str(job_id).strip():
#         raise ValueError("job_id is required and cannot be empty.")

#     db_url = setup_config.get_db_url()
#     if not db_url:
#         raise ValueError("DB_URL is not set. Add DB_URL to your .env")

#     status_val = update_data.get("status")
#     attempts_val = update_data.get("attempts")

#     # Accept either camelCase or snake_case inputs for compatibility.
#     error_message_val = update_data.get(
#         "error_message", update_data.get("errorMessage")
#     )
#     message_val = update_data.get("message")

#     last_msg_type_val = update_data.get("last_msg_type", update_data.get("type"))
#     last_msg_content_val = update_data.get(
#         "last_msg_content", update_data.get("content")
#     )

#     size_val = update_data.get("size")
#     if last_msg_content_val is not None:
#         size_val = len(str(last_msg_content_val))
#     elif message_val is not None:
#         size_val = len(str(message_val))

#     conn: Optional[asyncpg.Connection] = None
#     try:
#         conn = await connect_postgres_with_fallback(db_url)

#         update_status = await conn.execute(
#             """
#             UPDATE asset_processing_jobs
#             SET
#               status = COALESCE($2, status),
#               attempts = COALESCE($3, attempts),
#               error_message = COALESCE($4, error_message),
#               message = COALESCE($5, message),
#               last_msg_type = COALESCE($6, last_msg_type),  --  Changed Code
#               last_msg_content = COALESCE($7, last_msg_content),  --  Changed Code
#               size = COALESCE($8, size),
#               last_heartbeat = NOW(),
#               updated_at = NOW()
#             WHERE id = $1
#             """,
#             job_id,
#             status_val,
#             attempts_val,
#             error_message_val,
#             message_val,
#             last_msg_type_val,
#             last_msg_content_val,
#             size_val,
#         )

#         # asyncpg returns a status string like "UPDATE 1"
#         updated_count = int(update_status.split()[-1])
#         if updated_count == 0:
#             logger.warning(f"No job updated (id not found?): {job_id}")

#     except Exception as error:
#         logger.error(f"Failed to update job details for job {job_id}: {error}")
#         raise
#     finally:
#         if conn is not None:
#             await conn.close()


async def update_job_details(job_id: str, update_data: Dict[str, Any]) -> None:
    if job_id is None or not str(job_id).strip():
        raise ValueError("job_id is required and cannot be empty.")

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    def _pick_present(*keys: str) -> tuple[bool, Any]:
        """Return (is_present, value). Present means the key exists even if value is None."""
        for k in keys:
            if k in update_data:
                return True, update_data.get(k)
        return False, None

    status_present, status_val = _pick_present("status")
    attempts_present, attempts_val = _pick_present("attempts")

    error_present, error_message_val = _pick_present("error_message", "errorMessage")
    message_present, message_val = _pick_present("message")

    last_type_present, last_msg_type_val = _pick_present("last_msg_type", "type")
    last_content_present, last_msg_content_val = _pick_present(
        "last_msg_content", "content"
    )

    size_present, size_val = _pick_present("size")

    # If you provided new content/message (even empty string), auto-calc size unless you explicitly provided size.
    if not size_present:
        if last_content_present and last_msg_content_val is not None:
            size_val = len(str(last_msg_content_val))
            size_present = True
        elif message_present and message_val is not None:
            size_val = len(str(message_val))
            size_present = True

    # size is BIGINT NOT NULL in your schema, so never set it to NULL.
    if size_present and size_val is None:
        size_present = False

    set_clauses: list[str] = []
    values: list[Any] = [job_id]

    def _add_set(col: str, present: bool, val: Any) -> None:
        """Append 'col = $N' and push val, but only if present is True."""
        if not present:
            return
        values.append(val)
        set_clauses.append(f"{col} = ${len(values)}")

    _add_set("status", status_present, status_val)
    _add_set("attempts", attempts_present, attempts_val)
    _add_set("error_message", error_present, error_message_val)
    _add_set("message", message_present, message_val)
    _add_set("last_msg_type", last_type_present, last_msg_type_val)
    _add_set("last_msg_content", last_content_present, last_msg_content_val)
    _add_set("size", size_present, size_val)

    # Always update heartbeat + updated_at.
    set_clauses.append("last_heartbeat = NOW()")
    set_clauses.append("updated_at = NOW()")

    sql = f"""  
        UPDATE asset_processing_jobs
        SET {", ".join(set_clauses)}
        WHERE id = $1
    """

    conn: Optional[asyncpg.Connection] = None
    try:
        conn = await connect_postgres_with_fallback(db_url)

        update_status = await conn.execute(sql, *values)  #  Changed Code

        updated_count = int(update_status.split()[-1])
        if updated_count == 0:
            logger.warning(f"No job updated (id not found?): {job_id}")

    except Exception as error:
        logger.error(f"Failed to update job details for job {job_id}: {error}")
        raise
    finally:
        if conn is not None:
            await conn.close()


async def update_job_heartbeat(job_id: str) -> None:

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    conn: Optional[asyncpg.Connection] = None
    try:
        conn = await connect_postgres_with_fallback(db_url)

        update_status = await conn.execute(
            """
            UPDATE asset_processing_jobs
            SET last_heartbeat = NOW(), updated_at = NOW()
            WHERE id = $1
            """,
            job_id,
        )

        updated_count = int(update_status.split()[-1])
        if updated_count == 0:
            logger.warning(f"No heartbeat updated (id not found?): {job_id}")

    except Exception as error:
        logger.error(f"Failed to update job heartbeat for job {job_id}: {error}")
        raise
    finally:
        if conn is not None:
            await conn.close()

    # try:
    #     url = f"{config.API_BASE_URL}/asset-processing-job?jobId={job_id}"
    #     data = {"lastHeartBeat": datetime.now().isoformat()}
    #     async with aiohttp.ClientSession() as session:
    #         async with session.patch(url, json=data, headers=HEADERS) as response:
    #             response.raise_for_status()
    # except aiohttp.ClientError as error:
    #     logger.error(f"Failed to update job heartbeat for job {job_id}: {error}")


async def fetch_asset(asset_id: str) -> Optional[Asset]:

    try:
        url = f"{setup_config.api_base_url}/asset?assetId={asset_id}"
        headers = {"Authorization": f"Bearer {setup_config.server_api_key}"}

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()

                    if data:
                        return Asset(**data)

                    return None

                else:
                    logger.error(f"Error fetching asset: {response.status}")
                    return None
    except aiohttp.ClientError as error:
        logger.error(f"Error fetching asset: {error}")
        return None


async def fetch_asset_file(file_url: str) -> bytes:

    try:

        headers = {"Authorization": f"Bearer {setup_config.server_api_key}"}
        async with aiohttp.ClientSession() as session:
            async with session.get(file_url, headers=headers) as response:
                response.raise_for_status()
                return await response.read()
    except aiohttp.ClientError as error:
        logger.error(f"Error fetching asset file: {error}")
        raise ApiError("Failed to fetch asset file", status_code=500)


async def update_asset_content(asset_id: str, content: str) -> None:
    try:

        encoding = tiktoken.encoding_for_model("gpt-4o")
        tokens = encoding.encode(content)
        token_count = len(tokens)
        headers = {"Authorization": f"Bearer {setup_config.server_api_key}"}

        update_data = {
            "content": content,
            "tokenCount": token_count,
        }

        async with aiohttp.ClientSession() as session:
            url = f"{setup_config.api_base_url}/asset?assetId={asset_id}"
            async with session.patch(
                url, json=update_data, headers=headers
            ) as response:
                response.raise_for_status()

    except aiohttp.ClientError as error:
        logger.error(f"Failed to update asset content for asset {asset_id}: {error}")
        raise ApiError("Failed to update asset content", status_code=500)


###########################################################################
# Testing Code Below - Ignore
###########################################################################
async def drop_asset_processing_jobs_table() -> None:
    """TEST ONLY: Drops the asset_processing_jobs table."""

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    conn: Optional[asyncpg.Connection] = None
    try:
        # conn = await asyncpg.connect(db_url)
        conn = await connect_postgres_with_fallback(db_url)
        await conn.execute("DROP TABLE IF EXISTS asset_processing_jobs;")
        logger.info("Dropped table asset_processing_jobs (if it existed).")
    except Exception as e:
        logger.error(f"Error dropping table asset_processing_jobs: {e}")
        raise
    finally:
        if conn is not None:
            await conn.close()


async def truncate_asset_processing_jobs_table() -> None:
    """TEST ONLY: Removes all rows from asset_processing_jobs but keeps the table."""

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    conn: Optional[asyncpg.Connection] = None
    try:
        # conn = await asyncpg.connect(db_url)
        conn = await connect_postgres_with_fallback(db_url)

        # If you want this to succeed even when the table doesn't exist yet,
        # call ensure_postgres_tables() before truncating.
        await ensure_postgres_tables()

        await conn.execute("TRUNCATE TABLE asset_processing_jobs;")
        logger.info("Truncated table asset_processing_jobs.")

    except Exception as e:
        logger.error(f"Error truncating table asset_processing_jobs: {e}")
        raise
    finally:
        if conn is not None:
            await conn.close()


# status can be "created", "in_progress", "completed", "failed", "max_attempts_exceeded"
async def create_test_job(
    thread_id: str = "test_thread_1",
    user_id: str = "test_user_1",
    message: str = "hello from create_test_job()",
    todo_kind: str = "personal",  #  Added Code
    status: str = "created",
    attempts: int = 0,
    last_heartbeat: Optional[datetime] = None,
    *,
    last_msg_type: Optional[str] = None,
    last_msg_content: Optional[str] = None,
) -> str:
    """Insert one row into asset_processing_jobs and return the job id."""

    await ensure_postgres_tables()

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    job_id = str(uuid.uuid4())
    message_safe = message or ""
    # Choose a sane size default (prefer last_msg_content, else message)
    size = (
        len(str(last_msg_content))
        if last_msg_content is not None
        else len(message_safe)
    )

    conn: Optional[asyncpg.Connection] = None
    try:
        # conn = await asyncpg.connect(db_url)
        conn = await connect_postgres_with_fallback(db_url)

        inserted_id = await conn.fetchval(
            """
            INSERT INTO asset_processing_jobs (
              id,
              thread_id,
              user_id,
              todo_kind,
              status,
              attempts,
              last_heartbeat,
              error_message,
              size,
              message,
              last_msg_type,
              last_msg_content,
              created_at,
              updated_at
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,$8,$9,$10,$11,NOW(),NOW())  --  Changed Code
            RETURNING id
            """,
            job_id,
            thread_id,
            user_id,
            todo_kind,
            status,
            attempts,
            last_heartbeat,
            size,
            message_safe,
            last_msg_type,
            last_msg_content,
        )

        logger.info(f"Inserted test job row: {inserted_id} (size={size})")
        return str(inserted_id)

    except Exception as e:
        logger.error(f"Error inserting test job row: {e}")
        raise

    finally:
        if conn is not None:
            await conn.close()


# a test function to delete a job by id.
async def delete_test_job_by_id(job_id: str) -> int:
    """TEST ONLY: Delete a single row in asset_processing_jobs by job id."""

    if job_id is None or not str(job_id).strip():
        raise ValueError("job_id is required and cannot be empty.")

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    conn: Optional[asyncpg.Connection] = None
    try:
        conn = await connect_postgres_with_fallback(db_url)

        # Ensure table exists so the test helper doesn't crash on a fresh DB
        await ensure_postgres_tables()

        status = await conn.execute(
            "DELETE FROM asset_processing_jobs WHERE id = $1;",
            str(job_id).strip(),
        )

        deleted_count = int(status.split()[-1])
        if deleted_count == 0:
            logger.warning(f"No test job deleted (id not found?): {job_id}")
        else:
            logger.info(f"Deleted test job id={job_id}")

        return deleted_count

    except Exception as e:
        logger.error(f"Error deleting test job by id={job_id}: {e}")
        raise
    finally:
        if conn is not None:
            await conn.close()


# a test function to delete a job with  user_id: str = "test_user_1".
async def delete_test_jobs_by_user_id(
    user_id: str = "test_user_1",
) -> int:
    """TEST ONLY: Delete rows in asset_processing_jobs for a given user_id."""

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    conn: Optional[asyncpg.Connection] = None
    try:
        # conn = await asyncpg.connect(db_url)
        conn = await connect_postgres_with_fallback(db_url)

        # Ensure table exists so the test helper doesn't crash on a fresh DB
        await ensure_postgres_tables()

        status = await conn.execute(
            "DELETE FROM asset_processing_jobs WHERE user_id = $1;",
            user_id,
        )

        # asyncpg returns a string like "DELETE 3"
        deleted_count = int(status.split()[-1])
        logger.info(f"Deleted {deleted_count} job(s) for user_id={user_id}")
        return deleted_count

    except Exception as e:
        logger.error(f"Error deleting jobs for user_id={user_id}: {e}")
        raise
    finally:
        if conn is not None:
            await conn.close()


async def fetch_job(job_id: str) -> Optional[AssetProcessingJob]:
    if job_id is None or not str(job_id).strip():
        raise ValueError("job_id is required and cannot be empty.")

    db_url = setup_config.get_db_url()
    if not db_url:
        raise ValueError("DB_URL is not set. Add DB_URL to your .env")

    conn: Optional[asyncpg.Connection] = None
    try:
        conn = await connect_postgres_with_fallback(db_url)

        row = await conn.fetchrow(
            """
            SELECT
            id,
            thread_id,
            user_id,
            todo_kind,
            status,
            attempts,
            last_heartbeat,
            error_message,
            size,
            message,
            last_msg_type,  --  Changed Code
            last_msg_content,  --  Changed Code
            created_at,
            updated_at
            FROM asset_processing_jobs
            WHERE id = $1
            """,
            job_id,
        )

        if row is None:
            return None

        return AssetProcessingJob(**dict(row))

    except Exception as e:
        logger.error(f"Error fetching job by id={job_id}: {e}")
        raise
    finally:
        if conn is not None:
            await conn.close()
