import asyncio
import os

from asset_processing_service.api_client import (
    fetch_asset,
    fetch_asset_file,
    fetch_job,
    update_asset_content,
    update_job_details,
    update_job_heartbeat,
)
from asset_processing_service.life_goals_agent import log_trustcall_result
from asset_processing_service.media_processor import (
    extract_audio_and_split,
    split_audio_file,
    transcribe_chunks,
)
from asset_processing_service.models import AssetProcessingJob

# from asset_processing_service.config import config
from asset_processing_service.my_utils.logger_setup import setup_logger
from asset_processing_service.setup_config import c_setup_config

setup_config = c_setup_config.get_instance()
logger = setup_config.get_logger()

#################################################################
# Example Code
#################################################################
"""
Why await asyncio.gather(..., return_exceptions=True) on shutdown? It avoids “task was destroyed but it is pending” warnings and ensures cancellation cleanup runs.
"""
# async def process_job(job: AssetProcessingJob, graphs: dict) -> None:
#     logger.info(f"Processing job {job.id}...")

#     heartbeat_task = asyncio.create_task(heartbeat_updater(job.id))

#     try:
#         await update_job_details(job.id, {"status": "in_progress"})

#         graph = graphs.get("personal")
#         if graph is None:
#             raise ValueError("graphs['personal'] is missing")

#         if job.message is None or not str(job.message).strip():
#             raise ValueError("Job message is empty; nothing to run through the graph")

#         run_config = {
#             "configurable": {
#                 "thread_id": job.thread_id,
#                 "user_id": job.user_id,
#             }
#         }

#         result = graph.invoke(
#             {"messages": [{"role": "user", "content": job.message}]},
#             config=run_config,
#         )

#         reply = result["messages"][-1].content
#         logger.info("Graph reply for job %s:\n%s", job.id, reply)

#         await update_job_details(job.id, {"status": "completed"})

#     except Exception as e:
#         logger.error(f"Error processing job {job.id}: {e}")
#         await update_job_details(
#             job.id,
#             {
#                 "status": "failed",
#                 "errorMessage": str(e),
#                 "attempts": job.attempts + 1,
#             },
#         )
#         raise
#     finally:
#         heartbeat_task.cancel()
#         await asyncio.gather(heartbeat_task, return_exceptions=True)


async def process_job(job: AssetProcessingJob, graphs: dict) -> None:

    logger.info(f"Processing job {job.id}...")

    #############################################################
    # Start heartbeat
    heartbeat_task = asyncio.create_task(heartbeat_updater(job.id))

    try:

        # Update job status to "in_progress"
        await update_job_details(job.id, {"status": "in_progress"})

        graph_key = (job.todo_kind or "personal").strip()  #  Added Code
        graph = graphs.get(graph_key)
        if graph is None:
            raise ValueError(f"graphs['{graph_key}'] is missing")

        if job.message is None or not str(job.message).strip():
            raise ValueError("Job message is empty; nothing to run through the graph")

        run_config = {
            "configurable": {
                "thread_id": job.thread_id,
                "user_id": job.user_id,
                "todo_kind": graph_key,  #  "personal" or "work"
            }
        }

        # IMPORTANT: don't block the event loop
        result = await asyncio.to_thread(
            graph.invoke,
            {"messages": [{"role": "user", "content": job.message}]},
            config=run_config,
        )

        log_trustcall_result(result, logger, label="Graph Invocation Result")

        # update asset content
        # Extract last AI message safely
        ai_text = ""
        last_msg = None
        try:
            last_msg = result["messages"][-1]
            ai_text = str(getattr(last_msg, "content", ""))
        except Exception:
            ai_text = ""

        # msgs = result.get("messages", []) or []
        # logger.info("%s messages: count=%d", label, len(msgs))
        # for i, m in enumerate(msgs):
        #     try:
        #         m.pretty_print()
        #     except Exception:
        #         logger.info("%s message[%d]: %r", label, i, m)
        ############################################################
        # OUTPUT
        #################################################
        """
        INFO: Graph Invocation Result messages: count=2
        ================================ Human Message =================================

        hello from create_test_job()
        ================================== Ai Message ==================================

        Hello! 👋

        You’ve reached the assistant that helps manage your personal ToDo list.

        If you want, you can:
        - Add a task: “Add: buy groceries tomorrow”
        - List tasks: “Show my todo list”
        - Update/complete something: “Mark ‘buy groceries’ as done”

        What would you like to do?
        """

        last_msg_type = (
            getattr(last_msg, "type", None) if last_msg is not None else None
        )  # Changed Code

        # Update job status to completed
        await update_job_details(
            job.id,
            {
                "status": "completed",
                "errorMessage": None,
                "last_msg_type": last_msg_type,  # last_msg.type
                "last_msg_content": ai_text,
            },
        )

        # Cancel heartbeat updater

    except Exception as e:
        logger.error(f"Error processing job {job.id}: {e}")
        error_message = str(e)
        await update_job_details(
            job.id,
            {
                "status": "failed",
                "errorMessage": error_message,
                "last_msg_type": None,
                "last_msg_content": None,
            },
        )

    finally:
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass

    #############################################################
    # END
    #############################################################
    # try:
    #     #  Update job status to "in_progress"
    #     await update_job_details(job.id, {"status": "in_progress"})

    #     # Fetch assset associated with asset processing job
    #     asset = await fetch_asset(job.assetId)
    #     if asset is None:
    #         raise ValueError(f"Asset with ID {job.assetId} not found")

    #     file_buffer = await fetch_asset_file(asset.fileUrl)

    #     content_type = asset.fileType
    #     content = ""

    #     if content_type in ["text", "markdown"]:
    #         logger.info(f"Text file detected. Ready content of {asset.fileName}")
    #         content = file_buffer.decode("utf-8")
    #     elif content_type == "audio":
    #         logger.info("Processing audio file...")
    #         chunks = await split_audio_file(
    #             file_buffer,
    #             setup_config.max_chunk_size_bytes,
    #             os.path.basename(asset.fileName),
    #         )
    #         transcribed_chunks = await transcribe_chunks(chunks)
    #         content = "\n\n".join(transcribed_chunks)
    #     elif content_type == "video":
    #         logger.info("Processing video file...")
    #         chunks = await extract_audio_and_split(
    #             file_buffer,
    #             setup_config.max_chunk_size_bytes,
    #             os.path.basename(asset.fileName),
    #         )
    #         transcribed_chunks = await transcribe_chunks(chunks)
    #         content = "\n\n".join(transcribed_chunks)
    #     else:
    #         raise ValueError(f"Unsupported content type: {content_type}")

    #     logger.info(f"FINAL CONTENT: {content}")

    #     # update asset content
    #     await update_asset_content(asset.id, content)

    #     #  Update job status to completed
    #     await update_job_details(job.id, {"status": "completed"})

    # except Exception as e:
    #     logger.error(f"Error processing job {job.id}: {e}")
    #     error_message = str(e)
    #     await update_job_details(
    #         job.id,
    #         {
    #             "status": "failed",
    #             "errorMessage": error_message,
    #             "attempts": job.attempts + 1,
    #         },
    #     )

    # finally:
    #     heartbeat_task.cancel()
    #     try:
    #         await heartbeat_task
    #     except asyncio.CancelledError:
    #         pass


async def heartbeat_updater(job_id: str):
    while True:
        try:
            await update_job_heartbeat(job_id)
            await asyncio.sleep(setup_config.heartbeat_interval_seconds)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error updating heartbeat for job {job_id}: {e}")
