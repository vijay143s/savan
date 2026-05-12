import React, { useState } from "react";
import { SongData } from "../context/Song";
import { FaPlay } from "react-icons/fa";

const Search = () => {
  const { searchSongs, songs, loading, playQueue } = SongData();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    await searchSongs(query.trim());
  };

  const handlePlay = (songId) => {
    playQueue(songs, songId, `Search: "${query}"`);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-4 md:p-6 pb-32">
      <h1 className="text-2xl font-bold text-white mb-4">Search</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for songs, artists, albums..."
            className="flex-1 bg-white/10 text-white border border-white/20 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 placeholder-gray-400"
          />
          <button
            type="submit"
            className="bg-green-500 text-black px-6 py-3 rounded-full font-semibold text-sm hover:bg-green-400 transition active:scale-95"
          >
            Search
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}

      {!loading && hasSearched && songs.length === 0 && (
        <p className="text-gray-400 text-center py-8">No results found for "{query}"</p>
      )}

      {!loading && songs.length > 0 && (
        <div>
          <p className="text-gray-400 text-sm mb-4">{songs.length} results</p>
          <div className="space-y-1">
            {songs.map((song, index) => (
              <div
                key={song.id || index}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10 transition cursor-pointer group"
                onClick={() => handlePlay(song.id)}
              >
                <div className="relative w-10 h-10 flex-shrink-0">
                  <img
                    src={song.image}
                    alt=""
                    className="w-10 h-10 rounded object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded">
                    <FaPlay size={12} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{song.title}</p>
                  <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                </div>
                <span className="text-gray-400 text-xs hidden sm:block">{song.album}</span>
                <span className="text-gray-500 text-xs w-10 text-right">{formatDuration(song.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Search millions of songs on JioSaavn</p>
          <p className="text-gray-500 text-sm mt-2">Try searching for your favorite artist or song</p>
        </div>
      )}
    </div>
  );
};

export default Search;
