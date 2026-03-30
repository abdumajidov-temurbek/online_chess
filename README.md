# ♟ Online Chess Platform

A full-stack chess application where users can play against an AI-powered opponent using Stockfish and custom minimax algorithms.

---

## 🚀 Features

* ♟ Play chess against AI (Stockfish 17 engine)
* 🧠 Custom Minimax algorithm support
* 🔁 Restart and resign game
* 📡 REST API for game management
* ⚡ Fast interaction between frontend and backend
* 📊 Game state tracking

---

## 🏗 Tech Stack

### Backend

* Django (Python web framework)
* Python
* Stockfish (Chess Engine)
* python-chess

### Frontend

* React (JavaScript library)
* HTML / CSS / JavaScript

---

## 📂 Project Structure

```
online-chess/
├── back-end/     # Django backend (API, AI logic)
├── front-end/    # React frontend (UI)
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone repository

```
git clone https://github.com/your-username/online-chess.git
cd online-chess
```

---

### 2. Run Backend

```
make -C fish17/Stockfish/src -j"$(nproc)" build ARCH=x86-64-sse41-popcnt
cd back-end
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 5500
```

Backend will run at:

```
http://127.0.0.1:5500
```

---

### 3. Run Frontend

Open a new terminal:

```
cd front-end
npm install
npm start
```

Frontend will run at:

```
http://localhost:3000
```

---

## 🔗 API Endpoints

```
GET    /api/health
POST   /api/games
GET    /api/games/<game_id>
POST   /api/games/<game_id>/move
POST   /api/games/<game_id>/restart
POST   /api/games/<game_id>/resign
```

---

## 🧠 AI Engine

* Uses Stockfish 17 for strong chess calculations
* Supports custom Minimax implementation
* Can be extended with ML models

---

## ⚠️ Notes

* The backend now expects Stockfish 17 at:

```
fish17/Stockfish/src/stockfish
```

* Default backend environment variables live in `back-end/.env`:

```
STOCKFISH_PATH=../fish17/Stockfish/src/stockfish
STOCKFISH_ELO=3000
STOCKFISH_LIMIT_STRENGTH=false
STOCKFISH_SKILL_LEVEL=20
STOCKFISH_THREADS=2
STOCKFISH_HASH_MB=64
STOCKFISH_MOVE_TIME_MS=250
BOT_MOVE_DELAY_MS=2800
```

* If port 5500 is busy, change it:

```
python manage.py runserver 8000
```

* For production, use Gunicorn from `back-end/Procfile` and build Docker from the repository root so the `fish17` directory is included:

```
docker build -f back-end/Dockerfile .
```

---

## 🎯 Purpose

This project was built to practice:

* Full-stack development
* Backend API design
* AI integration (game logic)
* DevOps basics

---

## 📌 Future Improvements

* 🔐 Authentication system
* 🌐 Multiplayer mode
* 📱 Mobile responsiveness
* ☁️ Deployment (Docker, AWS, GCP)

---

## 👤 Author

Temur — software engineer

---
