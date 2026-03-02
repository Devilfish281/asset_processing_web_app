# src/agent_executor/app/setup_config.py

import logging
import os
import threading
import uuid
from asyncio.log import logger

# from logging import config
from typing import ClassVar, Optional

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, ConfigDict, Field
from tavily import AsyncTavilyClient, TavilyClient

from asset_processing_service.my_utils.env_loader import load_dotenv_once
from asset_processing_service.my_utils.llm_loader import get_llm_or_init
from asset_processing_service.my_utils.logger_setup import setup_logger
from asset_processing_service.my_utils.token_usage import TokenUsage

try:
    load_dotenv_once()
except Exception:
    pass

# from dataclasses_json import config


#  c_setup_config is a singleton class that holds configuration and runtime objects for the application.
# It uses Pydantic for data validation and management, and includes methods for masking sensitive information

###########################################################################
# Bearer
#############################################################################
# HEADERS = {"Authorization": f"Bearer {config.SERVER_API_KEY}"}

LOGGER_PROJECT_NAME = "asset_processing_service"


class c_setup_config(BaseModel):
    """
    Represents setup variables.
    """

    @staticmethod
    def get_required_env(key: str) -> str:
        value = os.getenv(key)
        if not value:
            raise ValueError(f"Missing required environment variable: {key}")
        return value.strip().strip("'\"")

    @staticmethod
    def env_bool(name: str, default: bool = False) -> bool:
        raw = os.getenv(name)
        if raw is None:
            return default
        return raw.strip().lower() in {"1", "true", "yes", "y", "on"}

    # HEADERS = {"Authorization": f"Bearer {config.SERVER_API_KEY}"}

    # Flags
    langsmith_flag: bool = Field(
        default=False, description="LangSmith Configuration enabled."
    )
    agent_testing_flag: bool = Field(
        default=False, description="Agent Testing Configuration enable."
    )
    view_graph_flag: bool = Field(
        default=False, description="Enable viewing the graph."
    )
    open_graph_flag: bool = Field(default=False, description="Open the graph as Image.")

    save_pdf: bool = Field(
        default=False, description="Enable saving the final report as PDF."
    )
    log_prompt_flag: bool = Field(
        default=False, description="Enable logging of prompts."
    )
    analysts_graph_step_flag: bool = Field(
        default=False, description="For Analysts Step Testing enable."
    )
    # Values
    langsmith_enable: bool = Field(
        default_factory=lambda: c_setup_config.env_bool("LANGSMITH_ENABLED", False),
        description="For LangSmith enable.",
    )

    program_total_tokens: int = Field(
        default=0, description="Running total of program tokens."
    )

    llm: Optional[ChatOpenAI] = Field(default=None, description="LLM Configuration.")

    logger: Optional[logging.Logger] = Field(
        default=None, description="Logger Configuration."
    )
    tavily_client: Optional[TavilyClient] = Field(
        default=None, description="Tavily Client."
    )
    tavily_async_client: Optional[AsyncTavilyClient] = Field(
        default=None, description="Tavily Async Client."
    )
    token_usage: Optional[TokenUsage] = Field(
        default=None, description="Token Usage Manager."
    )

    # API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api")
    api_base_url: str = Field(
        default=os.getenv("API_BASE_URL", "http://localhost:3000/api"),
        description="Base URL for API endpoints.",
    )

    # SERVER_API_KEY = str(os.getenv("SERVER_API_KEY", str(uuid.uuid4())))
    server_api_key: str = Field(
        default=str(os.getenv("SERVER_API_KEY", "")),
        description="API key for server authentication.",
    )
    # STUCK_JOB_THRESHOLD_SECONDS = int(os.getenv("STUCK_JOB_THRESHOLD_SECONDS", "30"))
    stuck_job_threshold_seconds: int = Field(
        default=int(os.getenv("STUCK_JOB_THRESHOLD_SECONDS", "30")),
        description="Threshold in seconds to consider a job as stuck.",
    )

    # MAX_JOB_ATTEMPTS = int(os.getenv("MAX_JOB_ATTEMPTS", "3"))
    max_job_attempts: int = Field(
        default=int(os.getenv("MAX_JOB_ATTEMPTS", "3")),
        description="Maximum number of attempts for a job before marking it as failed.",
    )

    # MAX_NUM_WORKERS = int(os.getenv("MAX_NUM_WORKERS", "2"))
    max_num_workers: int = Field(
        default=int(os.getenv("MAX_NUM_WORKERS", "2")),
        description="Maximum number of worker threads for processing jobs.",
    )

    # HEARTBEAT_INTERVAL_SECONDS = int(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "10"))
    heartbeat_interval_seconds: int = Field(
        default=int(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "10")),
        description="Interval in seconds for worker heartbeat to indicate they are alive.",
    )

    # MAX_CHUNK_SIZE_BYTES = int(os.getenv("MAX_CHUNK_SIZE_BYTES", str(24 * 1024 * 1024)))
    max_chunk_size_bytes: int = Field(
        default=int(os.getenv("MAX_CHUNK_SIZE_BYTES", str(24 * 1024 * 1024))),
        description="Maximum chunk size in bytes for processing large files.",
    )

    # OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.1")
    openai_model: str = Field(
        default=os.getenv("OPENAI_MODEL", "gpt-5.1"),
        description="Default OpenAI model to use for LLM interactions.",
    )

    # REDIS_URL
    redis_url: Optional[str] = Field(
        default=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        description="Redis URL for connecting to Redis.",
    )

    # DB_URL = os.getenv("DB_URL")
    db_url: Optional[str] = Field(
        default=os.getenv("DB_URL", ""),
        description="Database URL for connecting to the database.",
    )

    # db_url_fallback = os.getenv("DB_URL_FALLBACK")

    db_url_fallback: Optional[str] = Field(
        default=os.getenv("DB_URL_FALLBACK", ""),
        description="Fallback Database URL if the primary DB_URL is not set or fails to connect.",
    )

    testing_flag: bool = Field(
        default_factory=lambda: c_setup_config.env_bool("TESTING_FLAG", False),
        description="Flag to indicate if the application is running in testing mode.",
    )

    testing_flag2: bool = Field(
        default_factory=lambda: c_setup_config.env_bool("TESTING_FLAG2", False),
        description="Flag to indicate if the application is running in testing mode level 2.",
    )

    job_fetcher_run_number: int = Field(
        default=int(os.getenv("JOB_FETCHER_RUN_NUMBER", "3")),
        description="Counter for how many times the job fetcher has run.",
    )

    ##################################################################
    # set and get Functions
    ##################################################################
    def set_logger(self, logger: logging.Logger) -> None:
        self.logger = logger

    def get_logger(self) -> logging.Logger:
        if self.logger is None:

            # Avoid import-time failures: lazily create a logger the first time it's requested.
            self.logger = setup_logger(LOGGER_PROJECT_NAME)
            self.logger.info("logger Started!")
        return self.logger

    def get_llm(self) -> ChatOpenAI:
        """Return initialized LLM, initializing it once if needed."""

        return get_llm_or_init(
            self,
            temperature=0.0,
            streaming=True,
        )

    def set_tavily_client(self, client: TavilyClient) -> None:
        self.tavily_client = client

    def get_tavily_client(self) -> TavilyClient:
        if self.tavily_client is None:

            api_key = os.getenv("TAVILY_API_KEY", "").strip()
            if not api_key:
                raise ValueError("TAVILY_API_KEY is not set in environment variables.")
            self.tavily_client = TavilyClient(api_key=api_key)
            self.get_logger().info("tavily_client initialized.")
        return self.tavily_client

    def set_tavily_async_client(self, client: AsyncTavilyClient) -> None:
        self.tavily_async_client = client

    def get_tavily_async_client(self) -> AsyncTavilyClient:
        if self.tavily_async_client is None:

            api_key = os.getenv("TAVILY_API_KEY", "").strip()
            if not api_key:
                raise ValueError("TAVILY_API_KEY is not set in environment variables.")
            self.tavily_async_client = AsyncTavilyClient(api_key=api_key)
            self.get_logger().info("tavily_async_client initialized.")
        return self.tavily_async_client

    def set_server_api_key(self, api_key: str) -> None:
        if api_key is None or not str(api_key).strip():
            raise ValueError("server_api_key cannot be empty.")
        self.server_api_key = str(api_key).strip()

    def get_server_api_key(self) -> str:

        api_key = (self.server_api_key or "").strip()
        if not api_key:
            api_key = os.getenv("SERVER_API_KEY", "").strip()
            if api_key:
                self.server_api_key = api_key
        if not api_key:
            new_server_api_key = str(uuid.uuid4())
            print(
                "WARNING: SERVER_API_KEY is not set in environment variables. Generating a random key for this session:",
                new_server_api_key,
            )
            raise ValueError("SERVER_API_KEY is not set in environment variables.")
        return api_key

    def set_redis_url(self, redis_url: str) -> None:
        if redis_url is None or not str(redis_url).strip():
            raise ValueError("redis_url cannot be empty.")
        value = str(redis_url).strip()
        if not (value.startswith("redis://") or value.startswith("rediss://")):
            raise ValueError("redis_url must start with redis:// or rediss://")
        self.redis_url = value

    def get_redis_url(self) -> str:

        value = (self.redis_url or "").strip()
        if not value:
            value = os.getenv("REDIS_URL", "").strip()
            if value:
                self.redis_url = value
        if not value:
            raise ValueError("REDIS_URL is not set in environment variables.")
        if not (value.startswith("redis://") or value.startswith("rediss://")):
            raise ValueError("REDIS_URL must start with redis:// or rediss://")
        return value

    def set_db_url(self, db_url: str) -> None:
        if db_url is None or not str(db_url).strip():
            raise ValueError("DB_URL cannot be empty.")
        value = str(db_url).strip()
        # Accept common Postgres schemes
        if not (value.startswith("postgresql://") or value.startswith("postgres://")):
            raise ValueError("DB_URL must start with postgresql:// or postgres://")
        self.db_url = value

    def get_db_url(self) -> str:

        # 1) Use already-set field
        value = (self.db_url or "").strip()

        # 2) If missing, pull from env DB_URL
        if not value:
            value = os.getenv("DB_URL", "").strip()
            if value:
                self.db_url = value

        # 3) If still missing, try fallback (validated via getter)
        if not value:
            try:
                fallback = self.get_db_url_fallback()
            except ValueError:
                fallback = ""

            if fallback:
                value = fallback
                self.db_url = value  # promote fallback to active DB_URL

        # 4) Validate final
        if not value:
            raise ValueError(
                "DB_URL is not set in environment variables (and no DB_URL_FALLBACK provided)."
            )
        if not (value.startswith("postgresql://") or value.startswith("postgres://")):
            raise ValueError("DB_URL must start with postgresql:// or postgres://")

        return value

    def set_db_url_fallback(self, db_url_fallback: str) -> None:
        if db_url_fallback is None or not str(db_url_fallback).strip():
            raise ValueError("DB_URL_FALLBACK cannot be empty.")
        value = str(db_url_fallback).strip()
        if not (value.startswith("postgresql://") or value.startswith("postgres://")):
            raise ValueError(
                "DB_URL_FALLBACK must start with postgresql:// or postgres://"
            )
        self.db_url_fallback = value

    def get_db_url_fallback(self) -> str:

        value = (self.db_url_fallback or "").strip()

        if not value:
            value = os.getenv("DB_URL_FALLBACK", "").strip()
            if value:
                self.db_url_fallback = value

        if not value:
            raise ValueError("DB_URL_FALLBACK is not set in environment variables.")

        if not (value.startswith("postgresql://") or value.startswith("postgres://")):
            raise ValueError(
                "DB_URL_FALLBACK must start with postgresql:// or postgres://"
            )

        return value

    _instance: ClassVar[Optional["c_setup_config"]] = None
    _lock: ClassVar[threading.Lock] = threading.Lock()

    # Thread Safety for Singleton:
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    """
    setup_config = c_setup_config.get_instance()
    print(setup_config)
    ##########################################
    setup_config = c_setup_config.get_instance()
    config_repr = repr(setup_config)
    print(config_repr)
    """

    @staticmethod
    def _mask_key(value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        s = str(value)
        return f"{s[:4]}...{s[-4:]}" if len(s) > 8 else "***"

    @staticmethod
    def _mask_DB_URL(url: Optional[str]) -> Optional[str]:
        # Mask passwords in URLs like: postgresql://user:pass@host:5432/db
        if not url:
            return None
        s = str(url)

        try:
            scheme_sep = "://"
            if scheme_sep not in s:
                return s
            scheme, rest = s.split(scheme_sep, 1)
            if "@" not in rest:
                return s
            creds, after_at = rest.split("@", 1)
            if ":" not in creds:
                return s
            user, _pwd = creds.split(":", 1)
            return f"{scheme}{scheme_sep}{user}:***@{after_at}"
        except Exception:
            return "***"

    def __repr__(self):
        """
        Returns a readable string representation of the c_setup_config instance.
        """
        masked_server_api_key = self._mask_key(self.server_api_key)
        masked_db_url = self._mask_DB_URL(self.db_url)
        masked_db_url_fallback = self._mask_DB_URL(self.db_url_fallback)

        return (
            "c_setup_config("
            f"langsmith_flag={self.langsmith_flag!r}, "
            f"testing_flag={self.testing_flag!r}, "
            f"testing_flag2={self.testing_flag2!r}, "
            f"agent_testing_flag={self.agent_testing_flag!r}, "
            f"view_graph_flag={self.view_graph_flag!r}, "
            f"save_pdf={self.save_pdf!r}, "
            f"log_prompt_flag={self.log_prompt_flag!r}, "
            f"analysts_graph_step_flag={self.analysts_graph_step_flag!r}, "
            f"program_total_tokens={self.program_total_tokens!r}, "
            f"langsmith_enable={self.langsmith_enable!r}, "
            f"api_base_url={self.api_base_url!r}, "
            f"server_api_key={masked_server_api_key!r}, "
            f"stuck_job_threshold_seconds={self.stuck_job_threshold_seconds!r}, "
            f"max_job_attempts={self.max_job_attempts!r}, "
            f"max_num_workers={self.max_num_workers!r}, "
            f"heartbeat_interval_seconds={self.heartbeat_interval_seconds!r}, "
            f"max_chunk_size_bytes={self.max_chunk_size_bytes!r}, "
            f"openai_model={self.openai_model!r}, "
            f"db_url={masked_db_url!r}, "
            f"db_url_fallback={masked_db_url_fallback!r}, "
            f"llm={'Initialized' if self.llm else 'Not Initialized'}, "
            f"logger={'Initialized' if self.logger else 'Not Initialized'}, "
            f"tavily_client={'Initialized' if self.tavily_client else 'Not Initialized'}, "
            f"tavily_async_client={'Initialized' if self.tavily_async_client else 'Not Initialized'}, "
            f"token_usage={'Initialized' if self.token_usage else 'Not Initialized'}"
            ")"
        )

    # setup_config.logger.info(f"Configuration Status: {setup_config.to_dict()}")
    """
    import json

    config_json = json.dumps(setup_config.to_dict(), indent=4)
    print(config_json)
    #################################
    setup_config = c_setup_config.get_instance()
    config_dict = setup_config.to_dict()
    print(config_dict)

    """

    def to_dict(self):
        """
        Converts the c_setup_config instance to a dictionary.
        - Includes all config fields
        - Masks secrets (server_api_key, DB URL passwords)
        - Adds *_initialized booleans for runtime objects
        """
        return {
            # Flags
            "langsmith_flag": self.langsmith_flag,
            "testing_flag": self.testing_flag,
            "testing_flag2": self.testing_flag2,
            "agent_testing_flag": self.agent_testing_flag,
            "view_graph_flag": self.view_graph_flag,
            "save_pdf": self.save_pdf,
            "log_prompt_flag": self.log_prompt_flag,
            "analysts_graph_step_flag": self.analysts_graph_step_flag,
            # Values
            "program_total_tokens": self.program_total_tokens,
            "langsmith_enable": self.langsmith_enable,
            # Config values
            "api_base_url": self.api_base_url,
            "server_api_key": self._mask_key(self.server_api_key),
            "stuck_job_threshold_seconds": self.stuck_job_threshold_seconds,
            "max_job_attempts": self.max_job_attempts,
            "max_num_workers": self.max_num_workers,
            "heartbeat_interval_seconds": self.heartbeat_interval_seconds,
            "max_chunk_size_bytes": self.max_chunk_size_bytes,
            "openai_model": self.openai_model,
            "redis_url": self.redis_url,
            "DB_URL": self._mask_DB_URL(self.db_url),
            "DB_URL_fallback": self._mask_DB_URL(self.db_url_fallback),
            # Runtime object status
            "llm_initialized": self.llm is not None,
            "logger_initialized": self.logger is not None,
            "tavily_client_initialized": self.tavily_client is not None,
            "tavily_async_client_initialized": self.tavily_async_client is not None,
            "token_usage_initialized": self.token_usage is not None,
        }

    # a validate_initialization method that is called after all necessary fields are set.
    def validate_initialization(self):
        if self.logger is None:
            raise ValueError("logger must be initialized.")
        if self.llm is None:
            raise ValueError("llm must be initialized.")

        apikey = os.getenv("OPENAI_API_KEY", "").strip()
        if not apikey:
            self.logger.error("OPENAI_API_KEY environment variable not set")
            raise ValueError("OPENAI_API_KEY environment variable not set")

        if len(apikey) < 20:
            self.logger.error("OPENAI_API_KEY looks too short to be valid")
            raise ValueError("OPENAI_API_KEY looks too short to be valid")

        # server_api_key
        if self.server_api_key is None or self.server_api_key.strip() == "":
            self.logger.error("SERVER_API_KEY environment variable not set")
            raise ValueError("SERVER_API_KEY must be set in environment variables.")

        if self.db_url is None or self.db_url.strip() == "":
            self.logger.error("DB_URL environment variable not set")
            raise ValueError("DB_URL must be set in environment variables.")

        if self.redis_url is None or self.redis_url.strip() == "":
            self.logger.error("REDIS_URL environment variable not set")
            raise ValueError("REDIS_URL must be set in environment variables.")

        if self.tavily_client is None:
            self.logger.error("tavily_client is not initialized.")
            raise ValueError("tavily_client must be initialized.")

        if self.tavily_async_client is None:
            self.logger.error("tavily_async_client is not initialized.")
            raise ValueError("tavily_async_client must be initialized.")

    """
        Pydantic normally expects fields to be “pydantic-friendly” types (str/int/dict/BaseModel/etc). You have fields like:

        llm: Optional[ChatOpenAI]

        logger: Optional[logging.Logger]

        tavily_client: Optional[TavilyClient]

        Those are “arbitrary” Python objects. Setting arbitrary_types_allowed=True tells Pydantic: 
        “Don't try to validate/parse these types—just allow them as-is.” 
        This is the standard Pydantic v2 way to configure a model via model_config    
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)
