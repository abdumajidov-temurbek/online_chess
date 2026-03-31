# Online Chess

Single-player chess with a three-step setup flow:

1. Enter name
2. Choose side
3. Choose difficulty

Difficulty mapping:

* `Pre-Intermediate` -> `stockfish_bots/stock-1`
* `Intermediate` -> `stockfish_bots/stock-5`
* `Advance` -> `stockfish_bots/stock-17`

## Run locally

Build `stock-17` once:

```bash
make -C stockfish_bots/stock-17/Stockfish/src -j"$(nproc)" build ARCH=x86-64-sse41-popcnt
```

Start the backend:

```bash
cd back-end
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 5500
```

Start the frontend in a second terminal:

```bash
cd front-end
npm install
npm start
```

## Notes

* Bot move delay defaults to `2800ms` via `BOT_MOVE_DELAY_MS`.
* The project uses only the engines under [`stockfish_bots/`](./stockfish_bots).
* The old bundled Stockfish integration has been removed from the app code.
