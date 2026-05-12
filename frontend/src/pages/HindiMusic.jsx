import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const HindiMusic = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("albums"); // "albums" | "playlists"

  // Albums state
  const [albums, setAlbums] = useState([]);
  const [albumPage, setAlbumPage] = useState(1);
  const [albumPagination, setAlbumPagination] = useState(null);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [albumSearch, setAlbumSearch] = useState("");

  // Playlists state
  const [playlists, setPlaylists] = useState([]);
  const [playlistPage, setPlaylistPage] = useState(1);
  const [playlistPagination, setPlaylistPagination] = useState(null);
  const [playlistLoading, setPlaylistLoading] = useState(true);
  const [playlistSearch, setPlaylistSearch] = useState("");

  // ── Fetch Albums ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAlbums = async () => {
      setAlbumLoading(true);
      try {
        const res = await axios.get(`/api/hindi/albums?page=${albumPage}&limit=12`);
        setAlbums(res.data.data || []);
        setAlbumPagination(res.data.pagination || null);
      } catch (err) {
        console.error("Failed to fetch Hindi albums:", err);
        setAlbums([]);
      } finally {
        setAlbumLoading(false);
      }
    };
    fetchAlbums();
  }, [albumPage]);

  // ── Fetch Playlists ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPlaylists = async () => {
      setPlaylistLoading(true);
      try {
        const res = await axios.get(`/api/hindi/playlists?page=${playlistPage}&limit=12`);
        setPlaylists(res.data.data || []);
        setPlaylistPagination(res.data.pagination || null);
      } catch (err) {
        console.error("Failed to fetch Hindi playlists:", err);
        setPlaylists([]);
      } finally {
        setPlaylistLoading(false);
      }
    };
    fetchPlaylists();
  }, [playlistPage]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleCardClick = (item) => {
    navigate(`/album/${item.id}`);
  };

  const filteredAlbums = albumSearch
    ? albums.filter(
        (a) =>
          a.title?.toLowerCase().includes(albumSearch.toLowerCase()) ||
          a.artist?.toLowerCase().includes(albumSearch.toLowerCase())
      )
    : albums;

  const filteredPlaylists = playlistSearch
    ? playlists.filter((p) =>
        p.title?.toLowerCase().includes(playlistSearch.toLowerCase())
      )
    : playlists;

  // ── Card ─────────────────────────────────────────────────────────────────
  const MusicCard = ({ item }) => (
    <div
      className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition cursor-pointer group"
      onClick={() => handleCardClick(item)}
    >
      <div className="relative mb-3">
        <img
          src={item.image || ""}
          alt={item.title}
          className="w-full aspect-square object-cover rounded-lg bg-white/5"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="bg-green-500 text-black rounded-full p-3 shadow-lg hover:scale-105 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-white text-sm font-semibold truncate">{item.title}</p>
      <p className="text-gray-400 text-xs truncate mt-1">
        {item.artist || item.subtitle || "Hindi"}
      </p>
      {item.year && (
        <p className="text-gray-500 text-xs mt-0.5">{item.year}</p>
      )}
    </div>
  );

  // ── Pagination ───────────────────────────────────────────────────────────
  const Pagination = ({ pagination, page, setPage }) => {
    if (!pagination || pagination.pages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-400 transition"
        >
          Previous
        </button>
        <span className="text-white font-semibold text-sm">
          Page {pagination.page} of {pagination.pages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
          disabled={page >= pagination.pages}
          className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-400 transition"
        >
          Next
        </button>
      </div>
    );
  };

  // ── Skeleton Loader ──────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-3 animate-pulse">
          <div className="w-full aspect-square bg-white/10 rounded-lg mb-3" />
          <div className="h-3 bg-white/10 rounded mb-2" />
          <div className="h-2 bg-white/10 rounded w-2/3" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full px-4 md:px-6 py-4 pb-32">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
          🇮🇳 Hindi Music
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Bollywood albums &amp; playlists from JioSaavn
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        {["albums", "playlists"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? "border-green-500 text-green-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab === "albums" ? "🎵 Albums" : "📋 Playlists"}
          </button>
        ))}
      </div>

      {/* Albums Tab */}
      {activeTab === "albums" && (
        <div>
          {/* Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
            <h2 className="text-lg font-semibold text-white">Hindi Albums</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search albums..."
                value={albumSearch}
                onChange={(e) => setAlbumSearch(e.target.value)}
                className="bg-gray-800 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none w-full sm:w-56 text-sm"
              />
              {albumSearch && (
                <button
                  onClick={() => setAlbumSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {albumLoading ? (
            <Skeleton />
          ) : filteredAlbums.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredAlbums.map((album) => (
                  <MusicCard key={album.id} item={album} />
                ))}
              </div>
              {!albumSearch && (
                <Pagination
                  pagination={albumPagination}
                  page={albumPage}
                  setPage={setAlbumPage}
                />
              )}
              {albumSearch && (
                <p className="text-center text-gray-500 text-sm mt-4">
                  {filteredAlbums.length} result{filteredAlbums.length !== 1 ? "s" : ""} for "{albumSearch}"
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-16">
              {albumSearch ? `No albums found for "${albumSearch}"` : "No Hindi albums available."}
            </p>
          )}
        </div>
      )}

      {/* Playlists Tab */}
      {activeTab === "playlists" && (
        <div>
          {/* Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
            <h2 className="text-lg font-semibold text-white">Hindi Playlists</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search playlists..."
                value={playlistSearch}
                onChange={(e) => setPlaylistSearch(e.target.value)}
                className="bg-gray-800 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none w-full sm:w-56 text-sm"
              />
              {playlistSearch && (
                <button
                  onClick={() => setPlaylistSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {playlistLoading ? (
            <Skeleton />
          ) : filteredPlaylists.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredPlaylists.map((pl) => (
                  <MusicCard key={pl.id} item={pl} />
                ))}
              </div>
              {!playlistSearch && (
                <Pagination
                  pagination={playlistPagination}
                  page={playlistPage}
                  setPage={setPlaylistPage}
                />
              )}
              {playlistSearch && (
                <p className="text-center text-gray-500 text-sm mt-4">
                  {filteredPlaylists.length} result{filteredPlaylists.length !== 1 ? "s" : ""} for "{playlistSearch}"
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-16">
              {playlistSearch ? `No playlists found for "${playlistSearch}"` : "No Hindi playlists available."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HindiMusic;
