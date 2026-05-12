import React, { useEffect, useState } from "react";
import { UserData } from "../context/User";
import { SongData } from "../context/Song";
import { RiPulseLine } from "react-icons/ri";

const SongItem = ({ image, name, albumTitle, id }) => {
  const [saved, setSaved] = useState(false);

  const { addToPlaylist, user } = UserData();

  const { playFromSongs, selectedSong, isPlaying } = SongData();

  const playList = Array.isArray(user?.playlist) ? user.playlist : [];

  useEffect(() => {
    setSaved(playList.includes(id));
  }, [playList, id]);

  const handlePlay = () => {
    if (selectedSong === id && isPlaying) return;
    playFromSongs(id);
  };

  const savetoPlaylistHandler = () => {
    setSaved(!saved);
    addToPlaylist(id);
  };
  
  return (
    <div
      className={`p-2 md:p-3 rounded cursor-pointer transition-colors duration-200 hover:bg-[#ffffff26] active:scale-95 ${
        selectedSong === id ? "bg-[#1db9541a] border border-green-500" : "bg-[#1a1a1a]"
      }`}
      onClick={handlePlay}
    >
      <div className="relative group">
        <img src={image} className="rounded w-full aspect-square object-cover" alt="" />
        <button
          className={`absolute bottom-2 right-2 p-2 md:p-3 rounded-full transition-all duration-300 ${
            saved
              ? "bg-green-500 opacity-100 shadow-lg"
              : "bg-black/50 opacity-0 group-hover:opacity-100 hover:opacity-100"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            savetoPlaylistHandler();
          }}
        >
          <img 
            src="/src/assets/like.png" 
            alt="like" 
            className="w-4 h-4 md:w-5 md:h-5"
          />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 mb-1">
        {selectedSong === id && (
          <RiPulseLine
            className={`text-green-400 text-lg flex-shrink-0 ${
              isPlaying ? "animate-pulse" : "opacity-50"
            }`}
          />
        )}
        <p className="font-bold text-sm md:text-base truncate">{name}</p>
      </div>
      <p className="text-slate-400 text-xs md:text-sm truncate">{albumTitle || "Single"}</p>
    </div>
  );
};

export default SongItem;
