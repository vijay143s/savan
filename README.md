# Basti Boys Music — JioSaavn Streaming App

A premium music streaming web application powered by JioSaavn's API. No database or cloud storage required.

## Features
- **Instant Streaming**: Access millions of songs directly from JioSaavn CDN.
- **Telugu Defaults**: Optimized for Telugu music hits.
- **Liked Songs**: Save your favorite tracks to your browser's local library.
- **Premium UI**: Modern, responsive dark-mode interface.
- **FastAPI Backend**: Lightweight Python proxy for media decryption.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Python, FastAPI, Uvicorn
- **API**: JioSaavn (Internal Proxy)

## How to Run

### 1. Start the Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
python server.py
```

### 2. Start the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Credits
Built with ❤️ using JioSaavn's internal API.
