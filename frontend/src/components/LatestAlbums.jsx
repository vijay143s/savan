import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronDown, FaChevronUp, FaPlay, FaPause } from "react-icons/fa6";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { SongData } from "../context/Song";
import { UserData } from "../context/User";
import Loading from "./Loading";

const LatestAlbums = () => {
  const navigate = useNavigate();
  const {
    setSelectedSong,
    setIsPlaying,
    selectedSong,
    isPlaying,
    playQueue,
    setOnQueueEnd,
    queue,
    queueLabel,
  } = SongData();
  const { user, addToPlaylist } = UserData();
  const [albums, setAlbums] = useState([]);
  const [currentLimit, setCurrentLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedAlbums, setExpandedAlbums] = useState({});
  const [albumSongs, setAlbumSongs] = useState({});
  const [loadingSongs, setLoadingSongs] = useState({});
  const [maxYear, setMaxYear] = useState(null);
  const [currentYear, setCurrentYear] = useState(null);
  const [years, setYears] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAlbums, setFilteredAlbums] = useState([]);

  const resolveSongId = (song) => {
    if (!song) return null;
    const rawId = song._id ?? song.id ?? song.songId ?? song.song_id ?? song;
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

  const fetchLatestAlbums = useCallback(async (limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`/api/home/albums/latest-smart?limit=${limit}`);
      setAlbums(data.data || []);
      setMaxYear(data.maxYear);
      setCurrentYear(data.currentYear);
      setYears(data.years || []);
      setCurrentLimit(limit);
      return data;
    } catch (error) {
      console.error("Error fetching latest albums:", error);
      setError("Failed to load latest albums");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestAlbums();
  }, [fetchLatestAlbums]);

  // Set up callback for when queue ends to load more albums
  useEffect(() => {
    setOnQueueEnd(() => async () => {
      if (queueLabel !== "Latest Albums") return;

      const newLimit = currentLimit + 10;
      const latestData = await fetchLatestAlbums(newLimit);
      const updatedAlbums = latestData?.data || [];
      const nextAlbums = updatedAlbums.slice(currentLimit);

      if (!nextAlbums.length) {
        return;
      }

      const albumSongsPromises = nextAlbums.map(async (album) => {
        try {
          const { data } = await axios.get(`/api/home/albums/${album._id}/songs`);
          return data.data || [];
        } catch (error) {
          console.error(`Error fetching songs for album ${album._id}:`, error);
          return [];
        }
      });

      const albumsWithSongs = await Promise.all(albumSongsPromises);
      const newSongs = albumsWithSongs.flat();

      if (!newSongs.length) {
        return;
      }

      const firstNewSongId = newSongs
        .map((song) => song?._id || song?.id || song?.songId || song?.song_id)
        .find(Boolean);

      if (!firstNewSongId) return;

      const combinedQueue = queue.length ? [...queue, ...newSongs] : newSongs;
      playQueue(combinedQueue, String(firstNewSongId), "Latest Albums");
    });

    // Clean up callback when component unmounts
    return () => setOnQueueEnd(null);
  }, [currentLimit, fetchLatestAlbums, playQueue, queue, queueLabel, setOnQueueEnd]);

  // Filter albums based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredAlbums([]);
      return;
    }
    
    const filtered = albums.filter(album => 
      album.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      album.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAlbums(filtered);
  }, [searchQuery, albums]);

  const toggleAlbum = async (albumId) => {
    const isCurrentlyExpanded = expandedAlbums[albumId];
    
    setExpandedAlbums((prev) => ({
      ...prev,
      [albumId]: !prev[albumId],
    }));

    // Fetch songs if not already loaded
    if (!isCurrentlyExpanded && !albumSongs[albumId]) {
      try {
        setLoadingSongs((prev) => ({ ...prev, [albumId]: true }));
        const { data } = await axios.get(`/api/home/albums/${albumId}/songs`);
        console.log(`Fetched ${data.data?.length || 0} songs for album ${albumId}:`, data.data);
        setAlbumSongs((prev) => ({
          ...prev,
          [albumId]: data.data || [],
        }));
      } catch (error) {
        console.error(`Error fetching songs for album ${albumId}:`, error);
      } finally {
        setLoadingSongs((prev) => ({ ...prev, [albumId]: false }));
      }
    }
  };

  const handleSongClick = async (song, currentAlbumId) => {
    // Ensure we have a valid ID
    const normalizedId = resolveSongId(song);
    if (!normalizedId) {
      console.error("Invalid song ID:", song);
      return;
    }
    
    if (selectedSong === normalizedId && isPlaying) {
      setIsPlaying(false);
    } else {
      // Fetch songs for all albums if not already loaded
      const displayAlbums = searchQuery ? filteredAlbums : albums;
      const allSongsPromises = displayAlbums.map(async (album) => {
        if (albumSongs[album._id]) {
          return { albumId: album._id, songs: albumSongs[album._id], albumTitle: album.title };
        } else {
          try {
            const { data } = await axios.get(`/api/home/albums/${album._id}/songs`);
            setAlbumSongs((prev) => ({
              ...prev,
              [album._id]: data.data || [],
            }));
            return { albumId: album._id, songs: data.data || [], albumTitle: album.title };
          } catch (error) {
            console.error(`Error fetching songs for album ${album._id}:`, error);
            return { albumId: album._id, songs: [], albumTitle: album.title };
          }
        }
      });

      const albumsWithSongs = await Promise.all(allSongsPromises);
      
      // Flatten all songs from all albums into a single queue
      const allSongs = albumsWithSongs.flatMap(album => album.songs);
      
      // Use playQueue to set up the queue with all songs from all albums
      playQueue(allSongs, normalizedId, 'Latest Albums');
    }
  };

  const handleMoreClick = () => {
    // Navigate to albums page with year filter
    if (years && years.length > 0) {
      navigate(`/albums?years=${years.join(",")}`);
    } else {
      navigate("/albums");
    }
  };

  const getTitle = () => {
    if (!maxYear || !currentYear) return "Latest Albums";
    if (maxYear === currentYear) {
      return `Latest Albums (${maxYear})`;
    }
    return `Latest Albums (${years.join(", ")})`;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="mb-8 text-center py-8">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchLatestAlbums}
          className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-full transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const displayAlbums = searchQuery ? filteredAlbums : albums;

  return (
    <div className="mb-8">
      <div className="mb-4">
        <div
          className="flex items-center justify-between cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
              {getTitle()}
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
              handleMoreClick();
            }}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-full transition-colors text-sm"
          >
            More
          </button>
        </div>

        {isExpanded && (
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search in latest albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 text-white placeholder-gray-400 px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {displayAlbums && displayAlbums.length > 0 ? (
            displayAlbums.map((album) => (
              <div key={album._id} className="bg-gray-800 rounded-lg overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => toggleAlbum(album._id)}
                >
                  <img
                    src={album.thumbnail?.url || "/placeholder.jpg"}
                    alt={album.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{album.title}</h3>
                    <p className="text-gray-400 text-sm">{album.year}</p>
                  </div>
                  {expandedAlbums[album._id] ? (
                    <FaChevronUp className="text-gray-400" />
                  ) : (
                    <FaChevronDown className="text-gray-400" />
                  )}
                </div>

                {expandedAlbums[album._id] && (
                  <div className="border-t border-gray-700">
                    {loadingSongs[album._id] ? (
                      <div className="p-4 text-center text-gray-400">Loading songs...</div>
                    ) : albumSongs[album._id] && albumSongs[album._id].length > 0 ? (
                      <div className="divide-y divide-gray-700">
                        {albumSongs[album._id].map((song, idx) => {
                          const normalizedId = resolveSongId(song);
                          const isCurrentSong = normalizedId ? selectedSong === normalizedId : false;
                          const isCurrentlyPlaying = isCurrentSong && isPlaying;
                          const playlistId = normalizedId || String(song._id || song.id || song.songId || song.song_id || idx);

                          return (
                            <div
                              key={playlistId}
                              onClick={() => handleSongClick(song, album._id)}
                              className={`flex items-center gap-4 p-3 hover:bg-gray-700 cursor-pointer transition-colors ${
                                isCurrentSong ? "bg-gray-700" : ""
                              }`}
                            >
                              <div className="w-10 h-10 flex items-center justify-center">
                                {isCurrentlyPlaying ? (
                                  <FaPause className="text-green-500" />
                                ) : (
                                  <FaPlay className="text-gray-400 hover:text-green-500 transition-colors" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${isCurrentSong ? "text-green-400" : "text-white"}`}>
                                  {song.title}
                                </p>
                                <p className="text-gray-400 text-xs truncate">{song.singer}</p>
                              </div>
                              <button
                                onClick={(e) => handleAddToPlaylist(e, playlistId)}
                                className="flex-shrink-0 hover:scale-110 transition-transform"
                                title={isInPlaylist(playlistId) ? "In Playlist" : "Add to Playlist"}
                              >
                                {isInPlaylist(playlistId) ? (
                                  <AiFillHeart className="text-red-500" size={18} />
                                ) : (
                                  <AiOutlineHeart className="text-gray-400 hover:text-red-500" size={18} />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-400">No songs available</div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">No albums found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LatestAlbums;
