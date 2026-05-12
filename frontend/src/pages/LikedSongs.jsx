import React, { useEffect, useState } from "react";
import { SongData } from "../context/Song";
import { UserData } from "../context/User";
import { FaPlay, FaHeart } from "react-icons/fa";

const LikedSongs = () => {
  const { likedSongs, addToPlaylist } = UserData();
  const { fetchSongsByIds, loading, playQueue, selectedSong, isPlaying } = SongData();
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    const loadLikedSongs = async () => {
      if (likedSongs.length > 0) {
        const data = await fetchSongsByIds(likedSongs);
        setSongs(data);
      } else {
        setSongs([]);
      }
    };
    loadLikedSongs();
  }, [likedSongs]);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playQueue(songs, songs[0].id, "Liked Songs");
    }
  };

  const handlePlaySong = (songId) => {
    playQueue(songs, songId, "Liked Songs");
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 bg-gradient-to-b from-purple-900/50 to-transparent">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl bg-gradient-to-br from-purple-700 to-blue-500 flex items-center justify-center">
          <FaHeart size={80} className="text-white" />
        </div>
        <div className="text-center md:text-left">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Playlist</p>
          <h1 className="text-3xl md:text-6xl font-bold text-white mb-4">Liked Songs</h1>
          <p className="text-gray-300 text-sm">
            {UserData().user.name} · {likedSongs.length} songs
          </p>
        </div>
      </div>

      {/* Play All Button */}
      <div className="px-6 py-4 flex items-center gap-4">
        {songs.length > 0 && (
          <button
            className="bg-green-500 text-black rounded-full p-4 hover:scale-105 transition active:scale-95 shadow-lg"
            onClick={handlePlayAll}
          >
            <FaPlay size={20} />
          </button>
        )}
      </div>

      {/* Song List */}
      <div className="px-4 md:px-6">
        {loading && songs.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : songs.length > 0 ? (
          <div className="space-y-1">
            {songs.map((song, index) => {
              const isCurrentSong = selectedSong === song.id;
              return (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 transition cursor-pointer group ${isCurrentSong ? "bg-white/10" : ""}`}
                  onClick={() => handlePlaySong(song.id)}
                >
                  <span className="w-6 text-center text-sm text-gray-400 group-hover:hidden">
                    {index + 1}
                  </span>
                  <span className="w-6 text-center hidden group-hover:flex items-center justify-center">
                    <FaPlay size={10} className="text-white" />
                  </span>
                  <img
                    src={song.image}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrentSong && isPlaying ? "text-green-500" : "text-white"}`}>
                      {song.title}
                    </p>
                    <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToPlaylist(song.id);
                      }}
                      className="text-green-500 hover:scale-110 transition"
                    >
                      <FaHeart size={16} />
                    </button>
                    <span className="text-gray-500 text-xs w-10 text-right">{formatDuration(song.duration)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <FaHeart size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Your liked songs will appear here</p>
            <p className="text-gray-500 text-sm mt-2">Start liking songs while browsing!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
