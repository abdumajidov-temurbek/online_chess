FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/back-end

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential make \
    && rm -rf /var/lib/apt/lists/*

COPY back-end/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY back-end /app/back-end
COPY stockfish_bots /app/stockfish_bots

RUN make -C /app/stockfish_bots/stock-17/Stockfish/src -j"$(nproc)" build ARCH=x86-64-sse41-popcnt

CMD ["gunicorn", "castle_backend.wsgi:application", "--bind", "0.0.0.0:5000"]
