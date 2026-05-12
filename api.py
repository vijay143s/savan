#!/usr/bin/env python3
"""
JioSaavn Music Web App — Backend API Server.

A FastAPI server that proxies JioSaavn API calls, decrypts media URLs,
and serves the frontend static files.

Run:
    python server.py
    # or
    uvicorn server:app --reload --port 3000
"""

import base64
import html as html_lib
import json
import os
import re
from typing import Optional

import requests
from Crypto.Cipher import DES
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# ─── Config ───────────────────────────────────────────────────────────────────

API_BASE = "https://www.jiosaavn.com/api.php"
DES_KEY = b"38346591"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(title="Savana Music", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Shared HTTP Session ─────────────────────────────────────────────────────

session = requests.Session()
session.headers.update({
    "User-Agent": USER_AGENT,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9,te;q=0.8,hi;q=0.7",
    "Referer": "https://www.jiosaavn.com/",
    "Origin": "https://www.jiosaavn.com",
})
session.cookies.set("L", "telugu,english", domain="www.jiosaavn.com")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _api(params: dict) -> dict:
    """Call JioSaavn's internal API."""
    params.setdefault("_format", "json")
    params.setdefault("_marker", "0")
    params.setdefault("ctx", "web6dot0")
    # Add default languages if not present
    if "languages" not in params:
        params["languages"] = "telugu,english"
    resp = session.get(API_BASE, params=params, timeout=20)
    resp.raise_for_status()
    return resp.json()


def _decrypt_url(encrypted_url: str) -> str:
    """Decrypt a JioSaavn encrypted media URL (DES-ECB)."""
    cipher = DES.new(DES_KEY, DES.MODE_ECB)
    data = base64.b64decode(encrypted_url.strip())
    decrypted = cipher.decrypt(data)
    pad = decrypted[-1]
    if isinstance(pad, int) and 0 < pad <= 8:
        decrypted = decrypted[:-pad]
    return decrypted.decode("utf-8")


def _clean(text: str) -> str:
    """Decode HTML entities and strip stray tags."""
    if not text:
        return ""
    text = html_lib.unescape(text)
    text = re.sub(r"<[^>]+>", "", text)
    return text.strip()


def _image_hq(url: str) -> str:
    """Upgrade image URL to highest quality (500x500)."""
    if not url:
        return ""
    return url.replace("150x150", "500x500").replace("50x50", "500x500")


def _format_song(raw: dict) -> dict:
    """Normalize a raw song dict into a clean, frontend-friendly format."""
    # Decrypt streaming URL
    stream_url = ""
    enc = raw.get("encrypted_media_url", "")
    if enc:
        try:
            base = _decrypt_url(enc)
            for q in ["_96.", "_160.", "_320."]:
                if q in base:
                    stream_url = base.replace(q, "_320.")
                    break
            if not stream_url:
                stream_url = base
        except Exception:
            pass

    # Fallback to preview URL
    if not stream_url:
        preview = raw.get("media_preview_url", "")
        if preview:
            stream_url = (
                preview
                .replace("preview.saavncdn.com", "aac.saavncdn.com")
                .replace("_96_p.mp4", "_320.mp4")
            )

    return {
        "id": raw.get("id", ""),
        "title": _clean(raw.get("song", "") or raw.get("title", "")),
        "album": _clean(raw.get("album", "")),
        "artist": _clean(
            raw.get("primary_artists", "") or raw.get("singers", "") or raw.get("music", "")
        ),
        "year": raw.get("year", ""),
        "duration": int(raw.get("duration", 0) or 0),
        "image": _image_hq(raw.get("image", "")),
        "language": raw.get("language", ""),
        "url": stream_url,
        "has_lyrics": raw.get("has_lyrics", "false") == "true",
        "album_id": raw.get("albumid", ""),
        "label": _clean(raw.get("label", "")),
        "play_count": raw.get("play_count", 0),
        "is_320": raw.get("320kbps", "false") == "true",
    }


def _format_album(raw: dict) -> dict:
    """Format album/playlist data."""
    songs = []
    for s in raw.get("songs", raw.get("list", [])):
        if isinstance(s, dict):
            songs.append(_format_song(s))

    return {
        "id": raw.get("albumid", raw.get("listid", raw.get("id", ""))),
        "title": _clean(raw.get("title", raw.get("name", raw.get("listname", "")))),
        "subtitle": _clean(raw.get("header_desc", raw.get("subtitle", ""))),
        "image": _image_hq(raw.get("image", "")),
        "artist": _clean(raw.get("primary_artists", "")),
        "year": raw.get("year", ""),
        "song_count": raw.get("list_count", len(songs)),
        "language": raw.get("language", ""),
        "songs": songs,
    }


def _format_card(raw: dict) -> dict:
    """Format a homepage card (album, playlist, chart)."""
    return {
        "id": raw.get("albumid", raw.get("listid", raw.get("id", ""))),
        "title": _clean(raw.get("title", raw.get("name", raw.get("listname", "")))),
        "subtitle": _clean(
            raw.get("subtitle", raw.get("header_desc", raw.get("primary_artists", "")))
        ),
        "image": _image_hq(raw.get("image", "")),
        "type": raw.get("type", "album"),
        "url": raw.get("perma_url", ""),
        "language": raw.get("language", ""),
    }


# ─── API Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/search")
def search(q: str = Query(..., min_length=1), page: int = 1, limit: int = 20):
    """Search songs by query."""
    data = _api({
        "__call": "search.getResults",
        "q": q,
        "p": str(page),
        "n": str(limit),
    })
    results = data.get("results", [])
    return {
        "total": data.get("total", 0),
        "results": [_format_song(s) for s in results],
    }


@app.get("/api/song/{song_id}")
def get_song(song_id: str):
    """Get song details with streaming URL."""
    data = _api({
        "__call": "song.getDetails",
        "pids": song_id,
    })
    songs = data.get("songs", [])
    if not songs:
        raise HTTPException(404, "Song not found")
    return _format_song(songs[0])


@app.get("/api/songs")
def get_songs(ids: str = Query(..., description="Comma-separated song IDs")):
    """Get details for multiple songs."""
    data = _api({
        "__call": "song.getDetails",
        "pids": ids,
    })
    songs = data.get("songs", [])
    return [_format_song(s) for s in songs]


@app.get("/api/album/{album_id}")
def get_album(album_id: str):
    """Get album details with all songs."""
    data = _api({
        "__call": "content.getAlbumDetails",
        "albumid": album_id,
    })
    return _format_album(data)


@app.get("/api/playlist/{playlist_id}")
def get_playlist(playlist_id: str):
    """Get playlist details with all songs."""
    data = _api({
        "__call": "playlist.getDetails",
        "listid": playlist_id,
    })
    return _format_album(data)


@app.get("/api/home")
def get_home():
    """Get homepage data (new albums, playlists, charts, genres)."""
    data = _api({"__call": "content.getHomepageData"})

    return {
        "new_albums": [_format_card(a) for a in data.get("new_albums", [])],
        "playlists": [_format_card(p) for p in data.get("featured_playlists", [])],
        "charts": [_format_card(c) for c in data.get("charts", [])],
        "genres": [
            {"title": _clean(g.get("title", "")), "image": _image_hq(g.get("image", "")),
             "url": g.get("perma_url", ""), "id": g.get("id", "")}
            for g in data.get("genres", [])
        ],
    }


@app.get("/api/lyrics/{song_id}")
def get_lyrics(song_id: str):
    """Get lyrics for a song."""
    try:
        data = _api({
            "__call": "lyrics.getLyrics",
            "lyrics_id": song_id,
        })
        return {
            "lyrics": _clean(data.get("lyrics", "")),
            "snippet": _clean(data.get("lyrics_snippet", "")),
        }
    except Exception:
        raise HTTPException(404, "Lyrics not found")


@app.get("/api/artist/{artist_id}")
def get_artist(artist_id: str):
    """Get artist details."""
    data = _api({
        "__call": "artist.getArtistPageDetails",
        "artistId": artist_id,
    })
    top_songs = [_format_song(s) for s in data.get("topSongs", [])]
    top_albums = [_format_card(a) for a in data.get("topAlbums", [])]
    return {
        "id": data.get("artistId", artist_id),
        "name": _clean(data.get("name", "")),
        "image": _image_hq(data.get("image", "")),
        "fan_count": data.get("fan_count", ""),
        "top_songs": top_songs,
        "top_albums": top_albums,
    }


@app.get("/api/suggestions/{song_id}")
def get_suggestions(song_id: str):
    """Get song suggestions / radio based on a song."""
    try:
        data = _api({
            "__call": "reco.getreco",
            "pid": song_id,
        })
        if isinstance(data, list):
            return [_format_song(s) for s in data[:20]]
        return []
    except Exception:
        return []


# ─── Serve Frontend ──────────────────────────────────────────────────────────

static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


@app.get("/")
def serve_index():
    return FileResponse(os.path.join(static_dir, "index.html"))


# Mount static files AFTER the API routes
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print()
    print("🎵 Savana Music Server starting...")
    print("   Open http://localhost:3000 in your browser")
    print()
    uvicorn.run(app, host="0.0.0.0", port=3000)
