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
from fastapi.responses import FileResponse, StreamingResponse
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


@app.get("/api/search/albums")
def search_albums(q: str = Query(..., min_length=1), page: int = 1, limit: int = 24):
    """
    Search JioSaavn for albums.
    Strategy 1: Extract unique albums from song search results (most reliable).
    Strategy 2: Try search.getAlbums directly and merge.
    """
    seen_ids: set = set()
    albums: list = []

    # ── Strategy 1: song search → dedupe by albumid (always works) ──────────
    try:
        song_data = _api({
            "__call": "search.getResults",
            "q": q,
            "p": "1",
            "n": "50",   # fetch more songs to get more unique albums
        })
        for song in song_data.get("results", []):
            aid  = song.get("albumid", "")
            atitle = _clean(song.get("album", ""))
            if not aid or aid in seen_ids or not atitle:
                continue
            seen_ids.add(aid)
            albums.append({
                "id":       aid,
                "title":    atitle,
                "subtitle": _clean(song.get("primary_artists", "")),
                "image":    _image_hq(song.get("image", "")),
                "year":     song.get("year", ""),
                "language": song.get("language", ""),
                "type":     "album",
            })
    except Exception:
        pass

    # ── Strategy 2: search.getAlbums (merge in extra results) ───────────────
    try:
        album_data = _api({
            "__call": "search.getAlbums",
            "q": q,
            "p": str(page),
            "n": str(limit),
        })
        raw = album_data.get("results", album_data.get("data", []))
        for a in raw:
            if not isinstance(a, dict):
                continue
            aid = a.get("albumid", a.get("id", ""))
            if not aid or aid in seen_ids:
                continue
            seen_ids.add(aid)
            albums.append({
                "id":       aid,
                "title":    _clean(a.get("title", a.get("name", ""))),
                "subtitle": _clean(a.get("music", a.get("primary_artists", a.get("header_desc", "")))),
                "image":    _image_hq(a.get("image", "")),
                "year":     a.get("year", ""),
                "language": a.get("language", ""),
                "type":     "album",
            })
    except Exception:
        pass

    return {"total": len(albums), "results": albums[:limit]}



@app.get("/api/search/playlists")
def search_playlists(q: str = Query(..., min_length=1), page: int = 1, limit: int = 20):
    """Search JioSaavn for playlists matching the query."""
    data = _api({
        "__call": "search.getPlaylists",
        "q": q,
        "p": str(page),
        "n": str(limit),
    })
    results = data.get("results", data.get("data", []))
    playlists = []
    for p in results:
        if not isinstance(p, dict):
            continue
        playlists.append({
            "id": p.get("listid", p.get("id", "")),
            "title": _clean(p.get("listname", p.get("title", p.get("name", "")))),
            "subtitle": _clean(p.get("firstname", p.get("subtitle", p.get("header_desc", "")))),
            "image": _image_hq(p.get("image", "")),
            "language": p.get("language", ""),
            "type": "playlist",
            "song_count": p.get("song_count", p.get("count", "")),
        })
    return {"total": data.get("total", len(playlists)), "results": playlists}



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
    """Home page data — forced to Telugu language."""
    session.cookies.set("L", "telugu,english", domain="www.jiosaavn.com")
    data = _api({
        "__call": "content.getHomepageData",
        "languages": "telugu,english",
    })
    # Collect all promo sections (promo0…promo9) as extra playlists/albums
    extra_playlists, extra_albums = [], []
    seen_pl, seen_al = set(), set()
    for key, val in data.items():
        if key.lower().startswith("promo") and isinstance(val, list):
            for item in val:
                if not isinstance(item, dict) or not item.get("image"):
                    continue
                card = _format_card(item)
                itype = item.get("type", "")
                if itype == "playlist" and card["id"] not in seen_pl:
                    seen_pl.add(card["id"])
                    extra_playlists.append(card)
                elif itype == "album" and card["id"] not in seen_al:
                    seen_al.add(card["id"])
                    extra_albums.append(card)

    base_playlists = [_format_card(p) for p in data.get("featured_playlists", [])]
    base_albums    = [_format_card(a) for a in data.get("new_albums", [])]

    # Merge, dedup
    all_pl_ids = {c["id"] for c in base_playlists}
    for c in extra_playlists:
        if c["id"] not in all_pl_ids:
            base_playlists.append(c)
            all_pl_ids.add(c["id"])

    all_al_ids = {c["id"] for c in base_albums}
    for c in extra_albums:
        if c["id"] not in all_al_ids:
            base_albums.append(c)
            all_al_ids.add(c["id"])

    return {
        "new_albums": base_albums,
        "playlists": base_playlists,
        "charts": [_format_card(c) for c in data.get("charts", [])],
        "top_playlists": [_format_card(p) for p in data.get("top_playlists", [])],
        "trending": [
            _format_card(t)
            for t in (data.get("trending", {}).get("albums", []) if isinstance(data.get("trending"), dict) else [])
        ],
        "genres": [
            {"title": _clean(g.get("title", "")), "image": _image_hq(g.get("image", "")),
             "url": g.get("perma_url", ""), "id": g.get("id", "")}
            for g in data.get("genres", [])
        ],
    }


# Curated Telugu playlist IDs from JioSaavn
TELUGU_PLAYLIST_IDS = [
    "159614539",  # Top 50 Telugu
    "159614540",  # Telugu Hits
    "159660638",  # Telugu Romantic
    "159614541",  # Telugu Party
    "159577657",  # 90s Telugu
    "159614542",  # Telugu Sad Songs
    "159660639",  # DSP Hits
    "159614543",  # Thaman Hits
    "159660641",  # Anirudh Ravichander Telugu
    "159614544",  # Allu Arjun Hits
    "159614545",  # Pawan Kalyan Songs
    "159671659",  # NTR Songs
    "159614546",  # Tollywood Dance
    "159671657",  # Telugu Devotional
    "159614547",  # Latest Telugu 2024
    "159660642",  # Telugu Folk
    "159671662",  # Ram Charan Songs
    "159660643",  # Mahesh Babu Songs
    "159614549",  # Telugu Love Songs
    "159671663",  # Vijay Devarakonda Hits
]

TELUGU_ALBUM_QUERIES = [
    "telugu hits 2024",
    "tollywood blockbuster",
    "allu arjun songs",
    "dsp bgm telugu",
    "thaman telugu",
    "new telugu songs",
    "telugu romantic songs",
    "anirudh telugu",
    "pawan kalyan hit songs",
    "mahesh babu songs",
]


@app.get("/api/telugu/home")
def get_telugu_home():
    """
    Rich Telugu homepage built by directly querying JioSaavn for Telugu content.
    Uses dedicated language=telugu API calls instead of the generic homepage
    (which always returns mixed Hindi/English content).
    """
    result = {
        "charts": [],
        "featured_playlists": [],
        "new_albums": [],
        "trending": [],
    }

    # ── 1. Telugu Charts via content.getCharts ──────────────────────────────
    try:
        chart_data = _api({
            "__call": "content.getCharts",
            "language": "telugu",
            "languages": "telugu",
        })
        items = chart_data if isinstance(chart_data, list) else chart_data.get("charts", chart_data.get("data", []))
        result["charts"] = [
            _make_card(c, "telugu") for c in items
            if isinstance(c, dict) and c.get("image")
        ]
    except Exception:
        pass

    # ── 2. Telugu Featured Playlists via search.getPlaylists ────────────────
    playlist_queries = [
        "telugu hits",
        "tollywood romantic",
        "telugu party songs",
        "telugu sad songs",
        "dsp hits telugu",
        "thaman s telugu",
        "anirudh telugu songs",
        "allu arjun songs",
        "90s telugu hits",
        "new telugu 2024",
        "telugu folk songs",
        "pawan kalyan songs",
        "mahesh babu hits",
        "ram charan songs",
        "ntr songs telugu",
    ]
    seen_pl: set = set()
    for q in playlist_queries:
        try:
            data = _api({
                "__call": "search.getPlaylists",
                "q": q,
                "p": "1",
                "n": "5",
                "language": "telugu",
                "languages": "telugu",
            })
            items = data.get("results", data.get("data", []))
            for pl in items:
                if not isinstance(pl, dict):
                    continue
                pid = pl.get("listid", pl.get("id", ""))
                if not pid or pid in seen_pl or not pl.get("image"):
                    continue
                # Filter: skip playlists explicitly tagged as non-Telugu
                lang = pl.get("language", "").lower()
                if lang and lang not in ("telugu", ""):
                    continue
                seen_pl.add(pid)
                result["featured_playlists"].append(_make_card(pl, "telugu"))
        except Exception:
            continue

    # ── 3. Telugu New Albums from song search ───────────────────────────────
    seen_al: set = set()
    for q in TELUGU_ALBUM_QUERIES:
        try:
            data = _api({
                "__call": "search.getResults",
                "q": q,
                "p": "1",
                "n": "20",
                "language": "telugu",
                "languages": "telugu",
            })
            for song in data.get("results", []):
                # Only include songs that are actually Telugu
                if song.get("language", "").lower() not in ("telugu", ""):
                    continue
                aid = song.get("albumid", "")
                if aid and aid not in seen_al and song.get("image"):
                    seen_al.add(aid)
                    result["new_albums"].append({
                        "id": aid,
                        "title": _clean(song.get("album", "")),
                        "subtitle": _clean(song.get("primary_artists", "")),
                        "image": _image_hq(song.get("image", "")),
                        "type": "album",
                        "language": "telugu",
                        "year": song.get("year", ""),
                        "artist": _clean(song.get("primary_artists", "")),
                    })
        except Exception:
            continue

    # ── 4. Trending: top Telugu songs grouped by album ──────────────────────
    try:
        tr_data = _api({
            "__call": "content.getTopSongs",
            "language": "telugu",
            "languages": "telugu",
            "p": "1",
            "n": "20",
        })
        tr_songs = tr_data if isinstance(tr_data, list) else tr_data.get("songs", tr_data.get("data", []))
        seen_tr: set = set()
        for song in tr_songs:
            if not isinstance(song, dict):
                continue
            aid = song.get("albumid", "")
            if aid and aid not in seen_tr and song.get("image"):
                seen_tr.add(aid)
                result["trending"].append({
                    "id": aid,
                    "title": _clean(song.get("album", song.get("song", ""))),
                    "subtitle": _clean(song.get("primary_artists", "")),
                    "image": _image_hq(song.get("image", "")),
                    "type": "album",
                    "language": "telugu",
                    "year": song.get("year", ""),
                    "artist": _clean(song.get("primary_artists", "")),
                })
    except Exception:
        pass

    return result

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


@app.get("/api/download/{song_id}")
def download_song(song_id: str):
    """Stream a JioSaavn song as a downloadable audio file."""
    # 1. Fetch song metadata to get the decrypted URL and filename
    data = _api({"__call": "song.getDetails", "pids": song_id})
    songs = data.get("songs", [])
    if not songs:
        raise HTTPException(404, "Song not found")

    formatted = _format_song(songs[0])
    stream_url = formatted.get("url", "")
    if not stream_url:
        raise HTTPException(404, "Audio URL not available for this song")

    # Build a safe filename
    title = re.sub(r"[^\w\s-]", "", formatted.get("title", "song")).strip()
    artist = re.sub(r"[^\w\s-]", "", formatted.get("artist", "")).strip()
    filename = f"{title} - {artist}.mp4" if artist else f"{title}.mp4"

    # 2. Proxy-stream the audio from JioSaavn CDN to the client
    try:
        upstream = session.get(stream_url, stream=True, timeout=30)
        upstream.raise_for_status()

        content_type = upstream.headers.get("Content-Type", "audio/mpeg")

        def iterfile():
            for chunk in upstream.iter_content(chunk_size=8192):
                if chunk:
                    yield chunk

        return StreamingResponse(
            iterfile(),
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": upstream.headers.get("Content-Length", ""),
            },
        )
    except requests.RequestException as exc:
        raise HTTPException(502, f"Failed to fetch audio: {exc}")

@app.get("/api/hindi/debug")
def debug_hindi_api():
    """Debug: show raw JioSaavn response keys for hindi homepage."""
    try:
        session.cookies.set("L", "hindi,english", domain="www.jiosaavn.com")
        data = _api({"__call": "content.getHomepageData", "languages": "hindi"})
        session.cookies.set("L", "telugu,english", domain="www.jiosaavn.com")
        summary = {}
        for k, v in data.items():
            if isinstance(v, list):
                summary[k] = f"list[{len(v)}]"
            elif isinstance(v, dict):
                summary[k] = f"dict(keys={list(v.keys())[:5]})"
            else:
                summary[k] = str(v)[:100]
        return {"keys": summary}
    except Exception as e:
        return {"error": str(e)}


def _make_card(raw: dict, default_language: str = "") -> dict:
    """Convert any JioSaavn item to a frontend card."""
    return {
        "id": raw.get("albumid", raw.get("listid", raw.get("id", ""))),
        "title": _clean(raw.get("title", raw.get("name", raw.get("listname", raw.get("album", ""))))),
        "subtitle": _clean(
            raw.get("subtitle", raw.get("header_desc", raw.get("primary_artists", raw.get("singers", ""))))
        ),
        "image": _image_hq(raw.get("image", "")),
        "type": raw.get("type", "album"),
        "language": raw.get("language", default_language),
        "year": raw.get("year", ""),
        "artist": _clean(raw.get("primary_artists", raw.get("singers", raw.get("music", "")))),
    }


@app.get("/api/hindi/albums")
def get_hindi_albums():
    """
    Fetch Hindi albums by extracting unique albums from song search results.
    Uses search.getResults (the reliably working JioSaavn API) with multiple
    Hindi queries, then deduplicates by albumid.
    """
    seen_ids: set = set()
    albums: list = []

    queries = [
        "arijit singh 2024",
        "atif aslam bollywood",
        "new hindi songs 2024",
        "bollywood hits 2023",
        "bollywood romantic",
        "hindi party songs",
    ]

    for q in queries:
        try:
            data = _api({
                "__call": "search.getResults",
                "q": q,
                "p": "1",
                "n": "20",
                "languages": "hindi",
            })
            for song in data.get("results", []):
                album_id = song.get("albumid", "")
                album_title = _clean(song.get("album", ""))
                if album_id and album_id not in seen_ids and album_title:
                    seen_ids.add(album_id)
                    albums.append({
                        "id": album_id,
                        "title": album_title,
                        "subtitle": _clean(song.get("primary_artists", "")),
                        "image": _image_hq(song.get("image", "")),
                        "artist": _clean(song.get("primary_artists", song.get("singers", ""))),
                        "year": song.get("year", ""),
                        "language": song.get("language", "hindi"),
                        "type": "album",
                    })
        except Exception:
            continue

    return {
        "data": albums,
        "pagination": {
            "page": 1,
            "limit": len(albums),
            "total": len(albums),
            "pages": 1,
        },
    }


@app.get("/api/hindi/featured")
def get_hindi_featured():
    """
    Fetch Hindi trending/featured content.
    Strategy 1: content.getHomepageData with languages=hindi
    Strategy 2: content.getCharts with language=hindi
    Strategy 3: Build playlists from song search results grouped by artist
    """
    result = {
        "charts": [],
        "featured_playlists": [],
        "new_albums": [],
        "trending": [],
        "top_playlists": [],
    }

    # ── Strategy 1: Homepage data with Hindi language ─────────────────────
    try:
        session.cookies.set("L", "hindi,english", domain="www.jiosaavn.com")
        home = _api({"__call": "content.getHomepageData", "languages": "hindi"})
        session.cookies.set("L", "telugu,english", domain="www.jiosaavn.com")

        result["charts"] = [_make_card(c) for c in home.get("charts", []) if c.get("image")]
        result["featured_playlists"] = [_make_card(p) for p in home.get("featured_playlists", []) if p.get("image")]
        result["new_albums"] = [_make_card(a) for a in home.get("new_albums", []) if a.get("image")]
        result["top_playlists"] = [_make_card(p) for p in home.get("top_playlists", []) if p.get("image")]
        trending = home.get("trending", {})
        if isinstance(trending, dict):
            result["trending"] = [_make_card(t) for t in trending.get("albums", []) if t.get("image")]

        # Scan promo sections (promo0 … promo9) — JioSaavn sometimes puts playlists here
        for key, val in home.items():
            if key.lower().startswith("promo") and isinstance(val, list):
                for item in val:
                    if isinstance(item, dict) and item.get("image"):
                        card = _make_card(item)
                        itype = item.get("type", "")
                        if itype == "playlist" and card["id"] not in {c["id"] for c in result["featured_playlists"]}:
                            result["featured_playlists"].append(card)
                        elif itype == "album" and card["id"] not in {c["id"] for c in result["new_albums"]}:
                            result["new_albums"].append(card)
    except Exception:
        session.cookies.set("L", "telugu,english", domain="www.jiosaavn.com")

    # ── Strategy 2: Explicit charts call if still empty ───────────────────
    if not result["charts"]:
        try:
            chart_data = _api({"__call": "content.getCharts", "language": "hindi", "languages": "hindi"})
            items = chart_data if isinstance(chart_data, list) else chart_data.get("charts", chart_data.get("data", []))
            result["charts"] = [_make_card(c) for c in items if isinstance(c, dict) and c.get("image")]
        except Exception:
            pass

    # ── Strategy 3: Build "virtual playlists" from song searches ──────────
    # Only needed if featured_playlists + charts are still empty
    if not result["featured_playlists"] and not result["charts"]:
        virtual_queries = [
            ("🔥 Trending Hindi 2024", "trending hindi 2024"),
            ("💕 Bollywood Romance", "bollywood romantic songs"),
            ("🎉 Hindi Party Hits", "hindi party dance songs"),
            ("😢 Sad Hindi Songs", "sad hindi songs"),
            ("🏆 Arijit Singh Hits", "arijit singh best songs"),
            ("⭐ Atif Aslam Hits", "atif aslam songs"),
            ("🎵 90s Bollywood", "90s bollywood classic"),
            ("🌙 Hindi Devotional", "hindi bhajans devotional"),
        ]
        seen_album_ids: set = set()
        for playlist_name, query in virtual_queries:
            try:
                data = _api({"__call": "search.getResults", "q": query, "p": "1", "n": "10", "languages": "hindi"})
                songs = data.get("results", [])
                if not songs:
                    continue
                # Use the first song's image as the playlist cover
                cover = _image_hq(songs[0].get("image", ""))
                if not cover:
                    continue
                # Collect unique album cards for "new_albums" from this batch
                for song in songs:
                    aid = song.get("albumid", "")
                    if aid and aid not in seen_album_ids:
                        seen_album_ids.add(aid)
                        result["new_albums"].append({
                            "id": aid,
                            "title": _clean(song.get("album", "")),
                            "subtitle": _clean(song.get("primary_artists", "")),
                            "image": cover,
                            "type": "album",
                            "language": "hindi",
                            "year": song.get("year", ""),
                            "artist": _clean(song.get("primary_artists", "")),
                        })
                # Add as a virtual "playlist" card (clicking navigates to first song's album)
                first_album_id = songs[0].get("albumid", "")
                if first_album_id:
                    result["featured_playlists"].append({
                        "id": first_album_id,
                        "title": playlist_name,
                        "subtitle": f"{len(songs)} songs",
                        "image": cover,
                        "type": "album",
                        "language": "hindi",
                        "year": "",
                        "artist": "",
                    })
            except Exception:
                continue

    return result


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
