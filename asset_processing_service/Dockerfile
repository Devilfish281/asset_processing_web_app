# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Tell Poetry: don't create a venv inside the container
# Environment settings to make Python + Poetry behave nicely in containers
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

# Set the working directory in the container
WORKDIR /app

# Install Poetry
# Install Poetry (pinning is optional but recommended for stability)
RUN pip install --no-cache-dir poetry==2.3.2



# Copy pyproject.toml and poetry.lock first for dependency caching
COPY pyproject.toml poetry.lock* /app/

# Install dependencies (no project code yet)
RUN poetry install --no-ansi --no-root

# Copy the entire project into the container
COPY src/ /app/src/
COPY README.md /app/README.md

# If you NEED your package installed (entrypoint script relies on it), install it now
RUN poetry install --no-ansi

# Run the service when the container launches
CMD ["poetry", "run", "asset-processing-service"]
