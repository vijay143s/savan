import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { SongData } from "../context/Song";
import { UserData } from "../context/User";
import { FaPlay, FaHeart, FaRegHeart } from "react-icons/fa";

const Album = () => {
  const { id } = useParams();
  const { fetchAlbumSong, albumSong, albumData, loading, playQueue, selectedSong, isPlaying } = SongData();
  const { addToPlaylist, isLiked } = UserData();

  useEffect(() => {
    if (id) fetchAlbumSong(id);
  }, [id]);

  const handlePlayAll = () => {
    if (albumSong && albumSong.length > 0) {
      playQueue(albumSong, albumSong[0].id, albumData?.title || "Album");
    }
  };

  const handlePlaySong = (songId) => {
    if (albumSong) playQueue(albumSong, songId, albumData?.title || "Album");
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading && !albumData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const songs = albumSong || [];

  return (
    <div className="pb-32">
      {/* Album Header */}
      {albumData && (
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 bg-gradient-to-b from-white/10 to-transparent">
          <img
            src={albumData.image || ""}
            alt={albumData.title || "Album"}
            className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl object-cover bg-white/5"
          />
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              {albumData.type || "Album"}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{albumData.title}</h1>
            <p className="text-gray-300 text-sm">
              {albumData.artist && <span>{albumData.artist}</span>}
              {albumData.year && <span> · {albumData.year}</span>}
              {albumData.song_count > 0 && <span> · {albumData.song_count} songs</span>}
            </p>
          </div>
        </div>
      )}

      {/* Play All Button */}
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          className="bg-green-500 text-black rounded-full p-4 hover:scale-105 transition active:scale-95 shadow-lg disabled:opacity-50"
          onClick={handlePlayAll}
          disabled={songs.length === 0}
        >
          <FaPlay size={20} />
        </button>
      </div>

      {/* Song List */}
      <div className="px-4 md:px-6">
        {songs.map((song, index) => {
          if (!song || !song.id) return null;
          const isCurrentSong = selectedSong === song.id;
          const liked = isLiked(song.id);
          return (
            <div
              key={`${song.id}-${index}`}
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
                src={song.image || ""}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0 bg-white/5"
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
                  className="text-gray-400 hover:text-green-500 transition active:scale-90"
                >
                  {liked ? <FaHeart className="text-green-500" /> : <FaRegHeart className="group-hover:block" />}
                </button>
                <span className="text-gray-500 text-xs w-10 text-right">{formatDuration(song.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {songs.length === 0 && !loading && (
        <p className="text-gray-400 text-center py-8">No songs found in this collection</p>
      )}
    </div>
  );
};

export default Album;
