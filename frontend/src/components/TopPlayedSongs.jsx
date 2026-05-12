import React, { useState, useEffect } from "react";
import axios from "axios";
import { SongData } from "../context/Song";
import { UserData } from "../context/User";
import { FaShuffle, FaPlay, FaPause, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import Loading from "./Loading";

const TopPlayedSongs = () => {
  const {
    setSelectedSong,
    setIsPlaying,
    selectedSong,
    isPlaying,
    playQueue,
  } = SongData();
  const { user, addToPlaylist } = UserData();
  const [topSongs, setTopSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const limit = 20;

  const resolveSongId = (song) => {
    if (!song) return null;
    const rawId = song._id ?? song.id ?? song.songId ?? song.song_id ?? song.uuid;
    return rawId ? String(rawId) : null;
  };

  const isInPlaylist = (songId) => {
    if (!user || !user.playlist) return false;
    return user.playlist.includes(String(songId));
  };

  const handleAddToPlaylist = async (e, songId) => {
    e.stopPropagation();
    if (!user || !user._id) return;
    try {
      await addToPlaylist(songId);
    } catch (error) {
      console.error("Error adding to playlist:", error);
    }
  };

  const fetchTopPlayed = async (isLoadMore = false, shuffle = false) => {
    try {
      setLoading(true);
      setError(null);
      const currentOffset = isLoadMore ? offset : 0;
      const { data } = await axios.get(
        `/api/song/top-played?limit=${limit}&offset=${currentOffset}&shuffle=${shuffle}`
      );
      
      if (isLoadMore) {
        setTopSongs([...topSongs, ...data.songs]);
      } else {
        setTopSongs(data.songs);
      }
      
      setHasMore(data.hasMore);
      setOffset(data.nextOffset || 0);
    } catch (error) {
      console.error("Error fetching top played songs:", error);
      setError("Failed to load top played songs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopPlayed();
  }, []);

  const handleShuffle = () => {
    if (topSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * topSongs.length);
    const randomSong = topSongs[randomIndex];
    const normalizedId = resolveSongId(randomSong);
    if (normalizedId && topSongs.length) {
      playQueue(topSongs, normalizedId, "Top Played Songs");
    }
  };

  const handleLoadMore = () => {
    fetchTopPlayed(true, false);
  };

  const handleSongClick = async (song) => {
    const normalizedId = resolveSongId(song);
    if (!normalizedId) {
      console.error("Invalid song id", song);
      return;
    }

    // Toggle play/pause if clicking on already selected song
    if (selectedSong === normalizedId && isPlaying) {
      setIsPlaying(false);
    } else {
      if (selectedSong === normalizedId && !isPlaying) {
        setIsPlaying(true);
        return;
      }

      if (topSongs.length) {
        playQueue(topSongs, normalizedId, "Top Played Songs");
      } else {
        setSelectedSong(normalizedId);
        setIsPlaying(true);
      }
    }
  };

  if (loading && topSongs.length === 0) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="mb-8 text-center py-8">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => fetchTopPlayed()}
          className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
            Top Played Songs
          </h2>
          {isExpanded ? (
            <FaChevronUp className="text-gray-400 group-hover:text-green-400 transition-colors" />
          ) : (
            <FaChevronDown className="text-gray-400 group-hover:text-green-400 transition-colors" />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleShuffle();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-full transition-colors"
          disabled={loading}
        >
          <FaShuffle />
          Shuffle
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topSongs && topSongs.length > 0 ? (
              topSongs.map((song) => {
                const normalizedId = resolveSongId(song);
                const isCurrentSong = normalizedId ? selectedSong === normalizedId : false;
                const isCurrentlyPlaying = isCurrentSong && isPlaying;
                
                return (
                  <div
                    key={normalizedId || song.id}
                    onClick={() => handleSongClick(song)}
                    className={`bg-gray-800 hover:bg-gray-700 rounded-lg p-4 cursor-pointer transition-all group ${
                      isCurrentSong ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <div className="relative mb-3">
                      <img
                        src={song.thumbnail?.url || "/placeholder.jpg"}
                        alt={song.title}
                        className="w-full aspect-square object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center rounded-md">
                        {isCurrentlyPlaying ? (
                          <FaPause className="text-green-500 text-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <FaPlay className="text-green-500 text-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      {song.playCount > 0 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                          {song.playCount.toLocaleString()} plays
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate group-hover:text-green-400 transition-colors">
                          {song.title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1 truncate">{song.singer}</p>
                        {song.albumName && (
                          <p className="text-gray-500 text-xs mt-1 truncate">{song.albumName}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleAddToPlaylist(e, song.id)}
                        className="flex-shrink-0 hover:scale-110 transition-transform"
                        title={isInPlaylist(song.id) ? "In Playlist" : "Add to Playlist"}
                      >
                        {isInPlaylist(song.id) ? (
                          <AiFillHeart className="text-red-500" size={18} />
                        ) : (
                          <AiOutlineHeart className="text-gray-400 hover:text-red-500" size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-400 py-8">
                No top played songs yet
              </div>
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-full transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopPlayedSongs;
