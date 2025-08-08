# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app

# Cài Python dependencies
COPY backend/api/requirements.txt ./api/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache -r api/requirements.txt

# Copy source
COPY backend/api/ ./api/

ENV PATH="/opt/venv/bin:$PATH"
ENV PORT=8001

# Health-check endpoint nên implement ở FastAPI
EXPOSE 8001
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8001"]
