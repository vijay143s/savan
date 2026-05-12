import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ── Skeleton card loader ────────────────────────────────────────────────────
const SkeletonGrid = ({ count = 12 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white/5 rounded-xl p-3 animate-pulse">
        <div className="w-full aspect-square bg-white/10 rounded-lg mb-3" />
        <div className="h-3 bg-white/10 rounded mb-2" />
        <div className="h-2 bg-white/10 rounded w-2/3" />
      </div>
    ))}
  </div>
);

// ── Single music card ───────────────────────────────────────────────────────
const MusicCard = ({ item, onClick }) => (
  <div
    className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
    onClick={() => onClick(item)}
  >
    <div className="relative mb-3">
      <img
        src={item.image || ""}
        alt={item.title}
        className="w-full aspect-square object-cover rounded-lg bg-white/5"
        loading="lazy"
        onError={(e) => { e.target.src = ""; e.target.style.background = "#333"; }}
      />
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="bg-green-500 text-black rounded-full p-2.5 shadow-lg hover:scale-110 transition-transform">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
    <p className="text-white text-sm font-semibold truncate">{item.title}</p>
    <p className="text-gray-400 text-xs truncate mt-0.5">
      {item.artist || item.subtitle || (item.language === "hindi" ? "Hindi" : "")}
    </p>
    {item.year && <p className="text-gray-600 text-xs mt-0.5">{item.year}</p>}
  </div>
);

// ── Section with title + horizontal-scrollable grid ─────────────────────────
const Section = ({ title, emoji, items, onCardClick, emptyMsg }) => {
  if (!items || items.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
        {emoji && <span>{emoji}</span>}
        {title}
        <span className="text-gray-500 text-sm font-normal ml-1">({items.length})</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item, i) => (
          <MusicCard key={item.id || i} item={item} onClick={onCardClick} />
        ))}
      </div>
    </section>
  );
};

// ── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ pagination, page, setPage }) => {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-8 mb-4">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-400 transition"
      >
        ← Previous
      </button>
      <span className="text-white font-medium text-sm">
        Page {pagination.page} of {pagination.pages}
      </span>
      <button
        onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
        disabled={page >= pagination.pages}
        className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-400 transition"
      >
        Next →
      </button>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const HindiMusic = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("playlists");

  // Albums — all fetched once, paginated client-side
  const [allAlbums, setAllAlbums] = useState([]);   // full list (up to 50)
  const [albumPage, setAlbumPage] = useState(1);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumFetched, setAlbumFetched] = useState(false); // guard: fetch only once
  const [albumSearch, setAlbumSearch] = useState("");
  const ALBUM_PAGE_SIZE = 12;

  // Featured / Playlists (homepage data)
  const [featured, setFeatured] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(null);

  // ── Fetch Albums (once, or retry if empty) ────────────────────────────────
  useEffect(() => {
    if (activeTab !== "albums") return;
    // Re-fetch if not yet fetched, OR if previous fetch returned empty
    if (albumFetched && allAlbums.length > 0) return;
    const fetchAll = async () => {
      setAlbumLoading(true);
      try {
        const res = await axios.get(`/api/hindi/albums`);
        setAllAlbums(res.data.data || []);
        setAlbumFetched(true);
      } catch (e) {
        console.error("Hindi albums error:", e);
        setAllAlbums([]);
      } finally {
        setAlbumLoading(false);
      }
    };
    fetchAll();
  }, [activeTab, albumFetched]);

  // Client-side pagination derived values
  const searchedAlbums = albumSearch
    ? allAlbums.filter(
        (a) =>
          a.title?.toLowerCase().includes(albumSearch.toLowerCase()) ||
          a.artist?.toLowerCase().includes(albumSearch.toLowerCase())
      )
    : allAlbums;

  const totalAlbumPages = Math.max(1, Math.ceil(searchedAlbums.length / ALBUM_PAGE_SIZE));
  const pagedAlbums = searchedAlbums.slice(
    (albumPage - 1) * ALBUM_PAGE_SIZE,
    albumPage * ALBUM_PAGE_SIZE
  );
  const albumPagination = {
    page: albumPage,
    pages: totalAlbumPages,
    total: searchedAlbums.length,
  };

  // ── Fetch Featured / Playlists ────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "playlists" || featured) return;
    const fetch = async () => {
      setFeaturedLoading(true);
      setFeaturedError(null);
      try {
        const res = await axios.get("/api/hindi/featured");
        setFeatured(res.data);
      } catch (e) {
        console.error("Hindi featured error:", e);
        setFeaturedError("Could not load playlists. Please try again.");
      } finally {
        setFeaturedLoading(false);
      }
    };
    fetch();
  }, [activeTab, featured]);

  const handleCardClick = (item) => navigate(`/album/${item.id}`);

  // Reset to page 1 when search changes
  const handleAlbumSearch = (val) => {
    setAlbumSearch(val);
    setAlbumPage(1);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-4 md:px-6 py-4 pb-32">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
          🇮🇳 Hindi Music
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Bollywood albums, trending charts &amp; featured playlists
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-white/10">
        {[
          { key: "playlists", label: "📋 Playlists & Trending" },
          { key: "albums", label: "🎵 Albums" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.key
                ? "border-green-500 text-green-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PLAYLISTS / FEATURED TAB ── */}
      {activeTab === "playlists" && (
        <>
          {featuredLoading && <SkeletonGrid count={18} />}

          {featuredError && !featuredLoading && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-2">⚠️ {featuredError}</p>
              <p className="text-gray-500 text-xs mb-4">
                Check{" "}
                <a href="/api/hindi/debug" target="_blank" rel="noreferrer" className="text-green-400 underline">
                  /api/hindi/debug
                </a>{" "}
                to see what JioSaavn returns.
              </p>
              <button
                onClick={() => { setFeatured(null); setFeaturedError(null); setFeaturedLoading(true); }}
                className="px-5 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition"
              >
                🔄 Retry
              </button>
            </div>
          )}

          {featured && !featuredLoading && (
            <>
              {/* All sections are empty fallback */}
              {!featured.charts?.length &&
                !featured.featured_playlists?.length &&
                !featured.new_albums?.length &&
                !featured.trending?.length &&
                !featured.top_playlists?.length && (
                  <p className="text-gray-400 text-center py-20">
                    No Hindi content found. JioSaavn may have changed their API.
                  </p>
                )}

              <Section
                title="Trending Charts"
                emoji="🔥"
                items={featured.charts}
                onCardClick={handleCardClick}
              />
              <Section
                title="Featured Playlists"
                emoji="🎧"
                items={featured.featured_playlists}
                onCardClick={handleCardClick}
              />
              <Section
                title="Top Playlists"
                emoji="📊"
                items={featured.top_playlists}
                onCardClick={handleCardClick}
              />
              <Section
                title="Trending Albums"
                emoji="⚡"
                items={featured.trending}
                onCardClick={handleCardClick}
              />
              <Section
                title="New Releases"
                emoji="✨"
                items={featured.new_albums}
                onCardClick={handleCardClick}
              />
            </>
          )}
        </>
      )}

      {/* ── ALBUMS TAB ── */}
      {activeTab === "albums" && (
        <>
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
            <h2 className="text-lg font-semibold text-white">
              Hindi / Bollywood Albums
              {!albumSearch && allAlbums.length > 0 && (
                <span className="text-gray-500 text-sm font-normal ml-2">({allAlbums.length} total)</span>
              )}
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search albums..."
                value={albumSearch}
                onChange={(e) => handleAlbumSearch(e.target.value)}
                className="bg-gray-800 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none w-full sm:w-56 text-sm"
              />
              {albumSearch && (
                <button
                  onClick={() => handleAlbumSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {albumLoading ? (
            <SkeletonGrid count={12} />
          ) : pagedAlbums.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pagedAlbums.map((album, i) => (
                  <MusicCard key={album.id || i} item={album} onClick={handleCardClick} />
                ))}
              </div>
              <Pagination
                pagination={albumPagination}
                page={albumPage}
                setPage={setAlbumPage}
              />
              {albumSearch && (
                <p className="text-center text-gray-500 text-sm mt-2">
                  {searchedAlbums.length} result{searchedAlbums.length !== 1 ? "s" : ""} for &quot;{albumSearch}&quot;
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-20">
              {albumSearch
                ? `No albums found for "${albumSearch}"`
                : "No Hindi albums found."}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default HindiMusic;
