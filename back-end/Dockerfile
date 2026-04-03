FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/back-end

COPY back-end/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY back-end /app/back-end
COPY stockfish_bots /app/stockfish_bots

RUN chmod +x /app/stockfish_bots/stock-17/stockfish

CMD ["gunicorn", "castle_backend.wsgi:application", "--bind", "0.0.0.0:5000"]
