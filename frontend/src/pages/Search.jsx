import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SongData } from "../context/Song";
import { FaPlay, FaMusic, FaCompactDisc, FaList } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import axios from "axios";

const TABS = [
  { key: "songs",     label: "Songs",     icon: FaMusic },
  { key: "albums",    label: "Albums",    icon: FaCompactDisc },
  { key: "playlists", label: "Playlists", icon: FaList },
];

const formatDuration = (seconds) => {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// ── Song row ─────────────────────────────────────────────────────────────────
const SongRow = ({ song, index, isActive, isPlaying, onPlay }) => (
  <div
    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150 group hover:bg-white/10 active:scale-[0.99] ${
      isActive ? "bg-green-500/10 border border-green-500/40" : ""
    }`}
    onClick={() => onPlay(song.id)}
  >
    {/* Index / pulse */}
    <div className="w-6 text-center flex-shrink-0">
      {isActive && isPlaying ? (
        <span className="inline-block w-3 h-3 rounded-full bg-green-400 animate-pulse" />
      ) : (
        <span className="text-xs text-gray-500 group-hover:hidden">{index + 1}</span>
      )}
      {!isActive && (
        <FaPlay size={10} className="text-white hidden group-hover:inline" />
      )}
    </div>
    {/* Art */}
    <div className="relative w-10 h-10 flex-shrink-0">
      <img src={song.image} alt="" className="w-10 h-10 rounded object-cover" loading="lazy" />
    </div>
    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold truncate ${isActive ? "text-green-400" : "text-white"}`}>
        {song.title}
      </p>
      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
    </div>
    <span className="text-gray-500 text-xs hidden sm:block truncate max-w-[100px]">{song.album}</span>
    <span className="text-gray-500 text-xs w-9 text-right flex-shrink-0">{formatDuration(song.duration)}</span>
  </div>
);

// ── Media card (album / playlist) ─────────────────────────────────────────────
const MediaCard = ({ item, onClick }) => (
  <div
    className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
    onClick={() => onClick(item)}
  >
    <div className="relative mb-3">
      <img
        src={item.image}
        alt={item.title}
        className="w-full aspect-square object-cover rounded-lg shadow-md"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity" />
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
        <button className="bg-green-500 text-black rounded-full p-2.5 shadow-xl hover:scale-105 hover:bg-green-400 transition">
          <FaPlay size={12} />
        </button>
      </div>
    </div>
    <p className="text-white text-sm font-semibold truncate">{item.title}</p>
    <p className="text-gray-400 text-xs truncate mt-0.5">
      {item.subtitle || item.year || item.language}
    </p>
  </div>
);

// ── Skeleton loader row ───────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex items-center gap-3 p-2.5 animate-pulse">
    <div className="w-6 flex-shrink-0" />
    <div className="w-10 h-10 rounded bg-white/10 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-white/10 rounded w-3/5" />
      <div className="h-2 bg-white/5 rounded w-2/5" />
    </div>
    <div className="h-2 bg-white/5 rounded w-8" />
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white/5 rounded-xl p-3 animate-pulse">
    <div className="w-full aspect-square bg-white/10 rounded-lg mb-3" />
    <div className="h-3 bg-white/10 rounded mb-2" />
    <div className="h-2 bg-white/5 rounded w-2/3" />
  </div>
);

// ── Main Search component ─────────────────────────────────────────────────────
const Search = () => {
  const { playQueue, selectedSong, isPlaying } = SongData();
  const navigate = useNavigate();

  const [query, setQuery]           = useState("");
  const [activeTab, setActiveTab]   = useState("songs");
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [results, setResults]       = useState({ songs: [], albums: [], playlists: [] });
  const inputRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setHasSearched(true);
    setLoading(true);
    try {
      // Fire all three in parallel
      const [songsRes, albumsRes, playlistsRes] = await Promise.allSettled([
        axios.get("/api/search",           { params: { q, limit: 30 } }),
        axios.get("/api/search/albums",    { params: { q, limit: 24 } }),
        axios.get("/api/search/playlists", { params: { q, limit: 24 } }),
      ]);
      setResults({
        songs:     songsRes.status     === "fulfilled" ? songsRes.value.data.results     : [],
        albums:    albumsRes.status    === "fulfilled" ? albumsRes.value.data.results    : [],
        playlists: playlistsRes.status === "fulfilled" ? playlistsRes.value.data.results : [],
      });
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSongPlay = (songId) => {
    playQueue(results.songs, songId, `Search: "${query}"`);
  };

  const handleAlbumClick = (item) => navigate(`/album/${item.id}`);

  const totalInTab = results[activeTab]?.length ?? 0;

  return (
    <div className="px-4 md:px-6 py-4 pb-32">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-5">Search</h1>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search songs, albums, playlists…"
              className="w-full bg-white/10 text-white border border-white/20 rounded-full pl-11 pr-5 py-3 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder-gray-500 transition"
            />
          </div>
          <button
            type="submit"
            className="bg-green-500 text-black px-6 py-3 rounded-full font-semibold text-sm hover:bg-green-400 transition active:scale-95 flex-shrink-0"
          >
            Search
          </button>
        </div>
      </form>

      {/* Tabs — only show after first search */}
      {hasSearched && (
        <div className="flex gap-1 mb-5 border-b border-white/10 pb-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? "text-white border-green-500"
                  : "text-gray-400 border-transparent hover:text-gray-200"
              }`}
            >
              <Icon size={14} />
              {label}
              {!loading && results[key]?.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === key ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400"
                }`}>
                  {results[key].length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {!hasSearched && (
        <div className="text-center py-20">
          <IoSearch className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-400 text-lg">Find songs, albums and playlists</p>
          <p className="text-gray-600 text-sm mt-1">Type a name and hit Search</p>
        </div>
      )}

      {hasSearched && loading && (
        <div className="space-y-1">
          {activeTab === "songs"
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )
          }
        </div>
      )}

      {hasSearched && !loading && totalInTab === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400">No {activeTab} found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {hasSearched && !loading && totalInTab > 0 && (
        <>
          {/* Songs tab */}
          {activeTab === "songs" && (
            <div className="space-y-0.5">
              {results.songs.map((song, i) => (
                <SongRow
                  key={song.id || i}
                  song={song}
                  index={i}
                  isActive={selectedSong === song.id}
                  isPlaying={isPlaying}
                  onPlay={handleSongPlay}
                />
              ))}
            </div>
          )}

          {/* Albums tab */}
          {activeTab === "albums" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {results.albums.map((album) => (
                <MediaCard key={album.id} item={album} onClick={handleAlbumClick} />
              ))}
            </div>
          )}

          {/* Playlists tab */}
          {activeTab === "playlists" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {results.playlists.map((pl) => (
                <MediaCard key={pl.id} item={pl} onClick={handleAlbumClick} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;
