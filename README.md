# ♟ Online Chess Platform

A full-stack chess application where users can play against an AI-powered opponent using Stockfish and custom minimax algorithms.

---

## 🚀 Features

* ♟ Play chess against AI (Stockfish engine)
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

* Uses Stockfish for strong chess calculations
* Supports custom Minimax implementation
* Can be extended with ML models

---

## ⚠️ Notes

* Make sure Stockfish binary is executable:

```
chmod +x stockfish/stockfish
```

* If port 5500 is busy, change it:

```
python manage.py runserver 8000
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

