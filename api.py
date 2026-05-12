#!/usr/bin/env python3
"""
JioSaavn Music Web App — Backend API Server (Optimized for cPanel)
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

HINDI_ALBUM_IDS = [
    "14803108",  # Stree 2
    "14445014",  # Animal
    "14104718",  # Jawan
    "13875748",  # Rocky Aur Rani
    "13576282",  # Pathaan
    "13169056",  # Brahmastra
    "16021948",  # Fighter
    "16152399",  # Munjya
    "16300450",  # Kalki 2898 AD (Hindi)
    "16480000",  # Singham Again
    "15612345",  # Dunki
    "15800001",  # 12th Fail
]

HINDI_PLAYLIST_IDS = [
    "159614546",   # Top 50 Bollywood
    "159660635",   # Hindi Hits
    "159671658",   # Romantic Hindi
    "159580941",   # Party Hindi
    "159577656",   # 90s Bollywood
    "159552952",   # Bollywood Sad Songs
    "159614502",   # Arijit Singh Hits
    "159671660",   # Hindi Devotional
    "159614491",   # Bollywood Retro
    "159660640",   # Hindi Rap
    "159614548",   # Latest Bollywood 2024
    "159671661",   # Bollywood Dance
]

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _api(params: dict) -> dict:
    """Call JioSaavn's internal API."""
    params.setdefault("_format", "json")
    params.setdefault("_marker", "0")
    params.setdefault("ctx", "web6dot0")
    
    # Ensure language cookie is set
    if not session.cookies.get("L", domain="www.jiosaavn.com"):
        session.cookies.set("L", "telugu,english", domain="www.jiosaavn.com")
        
    if "languages" not in params:
        params["languages"] = "telugu,english"
        
    resp = session.get(API_BASE, params=params, timeout=15)
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

@app.get("/api/health")
def health_check():
    """Verify backend is reachable."""
    return {"status": "ok", "message": "Savana Music API is healthy"}

@app.get("/api/search")
def search(q: str = Query(..., min_length=1), page: int = 1, limit: int = 20):
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
    data = _api({"__call": "song.getDetails", "pids": song_id})
    songs = data.get("songs", [])
    if not songs: raise HTTPException(404, "Song not found")
    return _format_song(songs[0])

@app.get("/api/songs")
def get_songs(ids: str = Query(..., description="Comma-separated song IDs")):
    data = _api({"__call": "song.getDetails", "pids": ids})
    songs = data.get("songs", [])
    return [_format_song(s) for s in songs]

@app.get("/api/album/{album_id}")
def get_album(album_id: str):
    data = _api({"__call": "content.getAlbumDetails", "albumid": album_id})
    return _format_album(data)

@app.get("/api/playlist/{playlist_id}")
def get_playlist(playlist_id: str):
    data = _api({"__call": "playlist.getDetails", "listid": playlist_id})
    return _format_album(data)

@app.get("/api/home")
def get_home():
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
    try:
        data = _api({"__call": "lyrics.getLyrics", "lyrics_id": song_id})
        return {"lyrics": _clean(data.get("lyrics", "")), "snippet": _clean(data.get("lyrics_snippet", ""))}
    except Exception: raise HTTPException(404, "Lyrics not found")

@app.get("/api/artist/{artist_id}")
def get_artist(artist_id: str):
    data = _api({"__call": "artist.getArtistPageDetails", "artistId": artist_id})
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
    try:
        data = _api({"__call": "reco.getreco", "pid": song_id})
        if isinstance(data, list): return [_format_song(s) for s in data[:20]]
        return []
    except Exception: return []

@app.get("/api/hindi/albums")
def get_hindi_albums(page: int = 1, limit: int = 12):
    """Fetch Hindi albums from JioSaavn via search."""
    try:
        data = _api({
            "__call": "search.getAlbumResults",
            "q": "bollywood",
            "p": str(page),
            "n": str(limit),
            "languages": "hindi",
        })
        results = data.get("results", data.get("data", []))
        albums = []
        for r in results:
            albums.append({
                "id": r.get("albumid", r.get("id", "")),
                "title": _clean(r.get("title", r.get("name", ""))),
                "subtitle": _clean(r.get("subtitle", r.get("header_desc", r.get("primary_artists", "")))),
                "image": _image_hq(r.get("image", "")),
                "artist": _clean(r.get("primary_artists", r.get("music", ""))),
                "year": r.get("year", ""),
                "language": r.get("language", "hindi"),
                "type": "album",
            })
        total = int(data.get("total", len(albums)))
        return {
            "data": albums,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": max(1, -(-total // limit)),
            }
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch Hindi albums: {e}")


@app.get("/api/hindi/featured")
def get_hindi_featured():
    """
    Fetch Hindi trending/featured content using the homepage API.
    Returns: featured_playlists, charts (trending), new_albums.
    """
    try:
        # Set hindi language cookie then call homepage
        session.cookies.set("L", "hindi,english", domain="www.jiosaavn.com")
        data = _api({
            "__call": "content.getHomepageData",
            "languages": "hindi",
        })

        def _card(raw):
            return {
                "id": raw.get("albumid", raw.get("listid", raw.get("id", ""))),
                "title": _clean(raw.get("title", raw.get("name", raw.get("listname", "")))),
                "subtitle": _clean(
                    raw.get("subtitle", raw.get("header_desc", raw.get("primary_artists", "")))
                ),
                "image": _image_hq(raw.get("image", "")),
                "type": raw.get("type", "album"),
                "language": raw.get("language", "hindi"),
                "year": raw.get("year", ""),
            }

        featured_playlists = [_card(p) for p in data.get("featured_playlists", []) if p.get("image")]
        charts = [_card(c) for c in data.get("charts", []) if c.get("image")]
        new_albums = [_card(a) for a in data.get("new_albums", []) if a.get("image")]
        trending = [_card(t) for t in data.get("trending", {}).get("albums", []) if t.get("image")]
        top_playlists = [_card(p) for p in data.get("top_playlists", []) if p.get("image")]

        # Restore default language cookie
        session.cookies.set("L", "telugu,english", domain="www.jiosaavn.com")

        return {
            "featured_playlists": featured_playlists,
            "charts": charts,
            "new_albums": new_albums,
            "trending": trending,
            "top_playlists": top_playlists,
        }
    except Exception as e:
        # Restore cookie on error too
        session.cookies.set("L", "telugu,english", domain="www.jiosaavn.com")
        raise HTTPException(500, f"Failed to fetch Hindi featured content: {e}")


# ─── Serve Frontend ──────────────────────────────────────────────────────────

static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# Mount assets first (CSS, JS, Images)
if os.path.isdir(os.path.join(static_dir, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    """Catch-all route to serve the Single Page App (SPA)."""
    # If it's a real file in static, serve it
    file_path = os.path.join(static_dir, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # Otherwise, return index.html for React routing
    return FileResponse(os.path.join(static_dir, "index.html"))

# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
